import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { useSmartLabels } from '../../context/SmartLabelContext';
import { ModelPartInfo, QualityLevel } from '../../types/biology';
import { AnchorPoint2D } from './smartLabels/labelLayoutEngine';
import { SmartLabelLayer } from './smartLabels/SmartLabelLayer';

export type CameraPreset = 'initial' | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'fit';

export interface SceneUpdateContext {
  scene: THREE.Scene;
  rootGroup: THREE.Group;
  elapsed: number;
  delta: number;
  simTime: number;
  isPlaying: boolean;
  speed: number;
  explodeFactor: number;
}

export interface ModelViewer3DHandle {
  setCameraPreset: (preset: CameraPreset) => void;
  zoomBy: (factor: number) => void;
  focusPart: (partId: string) => void;
  exportPng: (filename?: string) => void;
}

interface ModelViewer3DProps {
  modelKey: string;
  buildModel: (rootGroup: THREE.Group, quality: QualityLevel) => {
    partsMeta?: ModelPartInfo[];
    initialCameraDir?: THREE.Vector3;
    disposeExtra?: () => void;
  };
  onAnimateFrame?: (ctx: SceneUpdateContext) => void;
  onSelectPart?: (partId: string | null) => void;
  selectedPartId?: string | null;
  hiddenPartIds?: string[];
  isolatedPartId?: string | null;
  autoRotate?: boolean;
  isPlaying?: boolean;
  speed?: number;
  simTime?: number;
  opacityLevel?: number;
  clipY?: number; // -1 to 1 normalized
  clipX?: number; // -1 to 1 normalized
  explodeFactor?: number; // 0 to 1
  showLabels?: boolean;
  parts?: ModelPartInfo[];
  quality?: QualityLevel;
  fallbackTitle?: string;
  fallbackItems?: string[];
}

// Reusable vectors at module scope to prevent GC churn in render loop
const _box = new THREE.Box3();
const _partBox = new THREE.Box3();
const _corner = new THREE.Vector3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _projVec = new THREE.Vector3();

function detectSoftwareWebGL(): { supported: boolean; isSoftwareGl: boolean } {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return { supported: false, isSoftwareGl: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: true };
  }
}

export const ModelViewer3D = React.forwardRef<ModelViewer3DHandle, ModelViewer3DProps>(
  (
    {
      modelKey,
      buildModel,
      onAnimateFrame,
      onSelectPart,
      selectedPartId = null,
      hiddenPartIds = [],
      isolatedPartId = null,
      autoRotate = false,
      isPlaying = true,
      speed = 1,
      simTime = 0,
      opacityLevel = 1,
      clipY = 1,
      clipX = 1,
      explodeFactor = 0,
      showLabels = true,
      parts = [],
      quality = 'standard',
      fallbackTitle = 'Sơ đồ học tập 2D thay thế',
      fallbackItems = [],
    },
    ref,
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [webglSupported, setWebglSupported] = useState(true);
    const [projectedAnchors, setProjectedAnchors] = useState<AnchorPoint2D[]>([]);
    const lastAnchorsRef = useRef<AnchorPoint2D[]>([]);
    const { settings: smartLabelSettings } = useSmartLabels();

    // Mutable refs read inside animation loop without recreating WebGLRenderer
    const stateRef = useRef({
      selectedPartId,
      hiddenPartIds,
      isolatedPartId,
      autoRotate,
      isPlaying,
      speed,
      simTime,
      opacityLevel,
      clipY,
      clipX,
      explodeFactor,
      showLabels,
      annotationMode: smartLabelSettings.mode,
      parts,
      onAnimateFrame,
      onSelectPart,
    });
    stateRef.current = {
      selectedPartId,
      hiddenPartIds,
      isolatedPartId,
      autoRotate,
      isPlaying,
      speed,
      simTime,
      opacityLevel,
      clipY,
      clipX,
      explodeFactor,
      showLabels,
      annotationMode: smartLabelSettings.mode,
      parts,
      onAnimateFrame,
      onSelectPart,
    };

    const threeRef = useRef<{
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      controls: OrbitControls;
      rootGroup: THREE.Group;
      clipPlaneY: THREE.Plane;
      clipPlaneX: THREE.Plane;
      bounds: { center: THREE.Vector3; radius: number };
      transitionActive: boolean;
      goalPos: THREE.Vector3;
      goalTarget: THREE.Vector3;
      isSoftwareGl: boolean;
      initialDir: THREE.Vector3;
    } | null>(null);

    const fitCameraToBounds = (dir: THREE.Vector3) => {
      const ctx = threeRef.current;
      if (!ctx) return;
      _box.setFromObject(ctx.rootGroup);
      if (_box.isEmpty()) return;
      _box.getCenter(_center);
      _box.getSize(_size);
      const maxDim = Math.max(_size.x, _size.y, _size.z, 1);
      const fovRad = THREE.MathUtils.degToRad(ctx.camera.fov);
      const aspectFactor = ctx.camera.aspect < 1 ? 1 / Math.max(ctx.camera.aspect, 0.55) : 1;
      const dist = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.48 * aspectFactor;

      ctx.bounds.center.copy(_center);
      ctx.bounds.radius = maxDim * 0.6;

      _targetCamPos.copy(dir).normalize().multiplyScalar(dist).add(_center);
      _targetLook.copy(_center);

      ctx.goalPos.copy(_targetCamPos);
      ctx.goalTarget.copy(_targetLook);
      ctx.transitionActive = true;
    };

    useImperativeHandle(ref, () => ({
      setCameraPreset: (preset: CameraPreset) => {
        const ctx = threeRef.current;
        if (!ctx) return;
        const dirMap: Record<CameraPreset, THREE.Vector3> = {
          initial: ctx.initialDir.clone(),
          front: new THREE.Vector3(0, 0.12, 1),
          back: new THREE.Vector3(0, 0.12, -1),
          left: new THREE.Vector3(-1, 0.12, 0),
          right: new THREE.Vector3(1, 0.12, 0),
          top: new THREE.Vector3(0, 1, 0.05),
          bottom: new THREE.Vector3(0, -1, 0.05),
          fit: ctx.camera.position.clone().sub(ctx.controls.target).normalize(),
        };
        fitCameraToBounds(dirMap[preset]);
      },
      zoomBy: (factor: number) => {
        const ctx = threeRef.current;
        if (!ctx) return;
        const offset = ctx.camera.position.clone().sub(ctx.controls.target);
        offset.multiplyScalar(factor);
        const minD = ctx.controls.minDistance;
        const maxD = ctx.controls.maxDistance;
        const len = THREE.MathUtils.clamp(offset.length(), minD, maxD);
        offset.setLength(len);
        ctx.goalPos.copy(ctx.controls.target).add(offset);
        ctx.goalTarget.copy(ctx.controls.target);
        ctx.transitionActive = true;
      },
      focusPart: (partId: string) => {
        const ctx = threeRef.current;
        if (!ctx) return;
        let found: THREE.Object3D | null = null;
        ctx.rootGroup.traverse((obj) => {
          if (!found && obj.userData?.partId === partId) {
            found = obj;
          }
        });
        if (!found) return;
        _box.setFromObject(found);
        if (_box.isEmpty()) return;
        _box.getCenter(_center);
        _box.getSize(_size);
        const maxDim = Math.max(_size.x, _size.y, _size.z, 0.5);
        const dist = Math.max(maxDim * 2.6, 2.2);
        const dir = ctx.camera.position.clone().sub(ctx.controls.target).normalize();
        ctx.goalTarget.copy(_center);
        ctx.goalPos.copy(_center).add(dir.multiplyScalar(dist));
        ctx.transitionActive = true;
      },
      exportPng: (filename = 'mo-hinh-sinh-hoc-3d.png') => {
        const ctx = threeRef.current;
        if (!ctx) return;
        ctx.renderer.render(ctx.scene, ctx.camera);
        const dataUrl = ctx.renderer.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
    }));

    // Initialize WebGL Scene once per mount / quality change
    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const probe = detectSoftwareWebGL();
      if (!probe.supported) {
        setWebglSupported(false);
        return;
      }
      setWebglSupported(true);

      const isSoftwareGl = probe.isSoftwareGl;
      const pixelRatioCap =
        quality === 'low' ? 1 : quality === 'high' ? 2 : 1.5;

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl && quality !== 'low',
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, pixelRatioCap));
      renderer.shadowMap.enabled = !isSoftwareGl && quality !== 'low';
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.localClippingEnabled = true;
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x081414);
      scene.fog = new THREE.FogExp2(0x081414, 0.022);

      // Studio environment reflections
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;
      pmremGenerator.dispose();

      const width = Math.max(container.clientWidth, 300);
      const height = Math.max(container.clientHeight, 260);
      const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 200);
      camera.position.set(4.5, 3.2, 6.2);
      renderer.setSize(width, height, false);

      // Three-point scientific lighting
      const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.72);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
      keyLight.position.set(6, 9, 7);
      if (renderer.shadowMap.enabled) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(quality === 'high' ? 1024 : 512, quality === 'high' ? 1024 : 512);
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
      rimLight.position.set(-7, 4, -6);
      scene.add(rimLight);

      // Subtle laboratory stage grid floor
      const gridHelper = new THREE.GridHelper(14, 18, 0x134e4a, 0x0f2929);
      gridHelper.position.y = -3.4;
      scene.add(gridHelper);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.06;
      controls.minDistance = 1.2;
      controls.maxDistance = 35;
      controls.enablePan = true;

      const rootGroup = new THREE.Group();
      scene.add(rootGroup);

      const clipPlaneY = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);
      const clipPlaneX = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10);

      // Build current model
      const buildResult = buildModel(rootGroup, quality);

      // Attach clipping planes & save base transform/opacity on every mesh
      rootGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.userData.baseLocalPos = mesh.position.clone();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (!m) return;
            m.clippingPlanes = [clipPlaneY, clipPlaneX];
            m.clipShadows = true;
            m.userData.baseOpacity = m.opacity;
            m.userData.baseTransparent = m.transparent;
            if ('emissive' in m && m.emissive instanceof THREE.Color) {
              m.userData.baseEmissive = m.emissive.clone();
            }
          });
        }
      });

      // Compute bounding box & frame camera cleanly
      _box.setFromObject(rootGroup);
      const boundsCenter = new THREE.Vector3();
      const boundsSize = new THREE.Vector3(2, 2, 2);
      if (!_box.isEmpty()) {
        _box.getCenter(boundsCenter);
        _box.getSize(boundsSize);
      }
      const maxDim = Math.max(boundsSize.x, boundsSize.y, boundsSize.z, 1);
      const initDir = buildResult.initialCameraDir?.clone() ?? new THREE.Vector3(0.45, 0.32, 0.85);
      initDir.normalize();
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      const fitDist = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.48;
      camera.position.copy(initDir).multiplyScalar(fitDist).add(boundsCenter);
      controls.target.copy(boundsCenter);
      controls.update();

      gridHelper.position.y = boundsCenter.y - boundsSize.y * 0.62 - 0.35;

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      threeRef.current = {
        renderer,
        scene,
        camera,
        controls,
        rootGroup,
        clipPlaneY,
        clipPlaneX,
        bounds: { center: boundsCenter.clone(), radius: maxDim * 0.6 },
        transitionActive: false,
        goalPos: camera.position.clone(),
        goalTarget: controls.target.clone(),
        isSoftwareGl,
        initialDir: initDir,
      };

      const onControlsStart = () => {
        if (threeRef.current) {
          threeRef.current.transitionActive = false;
        }
      };
      controls.addEventListener('start', onControlsStart);

      // Raycasting for click selection
      const raycaster = new THREE.Raycaster();
      const pointerDownPos = new THREE.Vector2();
      const pointerVec = new THREE.Vector2();

      const handlePointerDown = (e: PointerEvent) => {
        pointerDownPos.set(e.clientX, e.clientY);
      };

      const handlePointerUp = (e: PointerEvent) => {
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (dist > 6) return; // Ignore drag orbits
        const rect = renderer.domElement.getBoundingClientRect();
        pointerVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerVec, camera);
        const hits = raycaster.intersectObjects(rootGroup.children, true);
        const visibleHit = hits.find((h) => {
          let cur: THREE.Object3D | null = h.object;
          while (cur) {
            if (!cur.visible) return false;
            cur = cur.parent;
          }
          return true;
        });
        if (visibleHit) {
          let cur: THREE.Object3D | null = visibleHit.object;
          let foundPartId: string | null = null;
          while (cur && cur !== rootGroup) {
            if (cur.userData?.partId) {
              foundPartId = String(cur.userData.partId);
              break;
            }
            cur = cur.parent;
          }
          stateRef.current.onSelectPart?.(foundPartId);
        } else {
          stateRef.current.onSelectPart?.(null);
        }
      };

      renderer.domElement.addEventListener('pointerdown', handlePointerDown);
      renderer.domElement.addEventListener('pointerup', handlePointerUp);

      // WebGL context loss safety
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setWebglSupported(false);
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

      // ResizeObserver for container responsiveness
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.max(entry.contentRect.width, 200);
          const h = Math.max(entry.contentRect.height, 200);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        }
      });
      resizeObserver.observe(container);

      // Animation loop with software WebGL pacing
      let frameId = 0;
      let disposed = false;
      const clock = new THREE.Clock();
      let lastLabelSync = 0;
      let currentExplode = 0;

      const afterDraw = (cb: () => void) => {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || !gl.fenceSync) {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      };

      const tick = () => {
        if (disposed) return;
        const delta = Math.min(clock.getDelta(), 0.08);
        const elapsed = clock.getElapsedTime();
        const st = stateRef.current;

        // Smooth camera preset transition
        const ctx = threeRef.current;
        if (ctx && ctx.transitionActive) {
          const lambda = 7.5;
          camera.position.x = THREE.MathUtils.damp(camera.position.x, ctx.goalPos.x, lambda, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, ctx.goalPos.y, lambda, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, ctx.goalPos.z, lambda, delta);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, ctx.goalTarget.x, lambda, delta);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, ctx.goalTarget.y, lambda, delta);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, ctx.goalTarget.z, lambda, delta);
          if (camera.position.distanceTo(ctx.goalPos) < 0.02) {
            ctx.transitionActive = false;
          }
        }

        controls.autoRotate = st.autoRotate && !isSoftwareGl;
        controls.autoRotateSpeed = 1.6 * st.speed;
        controls.update();

        // Update clipping planes relative to bounding box
        const r = Math.max(maxDim * 0.65, 1);
        clipPlaneY.constant = boundsCenter.y + st.clipY * r;
        clipPlaneX.constant = boundsCenter.x + st.clipX * r;

        // Smooth exploded-view separation
        currentExplode = THREE.MathUtils.damp(currentExplode, st.explodeFactor, 8, delta);

        // Apply part visibility, isolation, selection highlight, opacity & explode
        rootGroup.traverse((obj) => {
          const pid = obj.userData?.partId as string | undefined;
          if (pid) {
            const isHidden = st.hiddenPartIds.includes(pid);
            const isIsolatedOut = st.isolatedPartId !== null && st.isolatedPartId !== pid;
            obj.visible = !isHidden && !isIsolatedOut;
          }

          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            const basePos = mesh.userData.baseLocalPos as THREE.Vector3 | undefined;
            const explodeDir = mesh.userData.explodeDir as THREE.Vector3 | undefined;
            if (basePos && explodeDir) {
              mesh.position.copy(basePos).addScaledVector(explodeDir, currentExplode * 1.4);
            }

            // Find owning partId
            let ownPartId: string | undefined = mesh.userData?.partId;
            let p: THREE.Object3D | null = mesh.parent;
            while (!ownPartId && p && p !== rootGroup) {
              ownPartId = p.userData?.partId;
              p = p.parent;
            }
            const isSelected = Boolean(ownPartId && st.selectedPartId === ownPartId);
            const dimUnselected =
              st.annotationMode === 'selected-only' &&
              st.selectedPartId !== null &&
              !isSelected;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if (!m) return;
              const baseOp = (m.userData.baseOpacity as number | undefined) ?? 1;
              const targetOpacity = baseOp * st.opacityLevel * (dimUnselected ? 0.32 : 1);
              const needsTransparent = targetOpacity < 0.99 || Boolean(m.userData.baseTransparent);
              if (m.transparent !== needsTransparent) {
                m.transparent = needsTransparent;
                m.needsUpdate = true;
              }
              m.opacity = targetOpacity;
              if ('emissive' in m && m.emissive instanceof THREE.Color) {
                const baseEm = (m.userData.baseEmissive as THREE.Color | undefined) ?? new THREE.Color(0x000000);
                if (isSelected) {
                  m.emissive.setHex(0x0d9488);
                  if ('emissiveIntensity' in m) {
                    (m as THREE.MeshStandardMaterial).emissiveIntensity = 0.55;
                  }
                } else {
                  m.emissive.copy(baseEm);
                }
              }
            });
          }
        });

        // Delegate lab-specific frame animation
        st.onAnimateFrame?.({
          scene,
          rootGroup,
          elapsed,
          delta,
          simTime: st.simTime,
          isPlaying: st.isPlaying,
          speed: st.speed,
          explodeFactor: currentExplode,
        });

        renderer.render(scene, camera);

        // Project 3D part anchors synchronized with transforms, visibility & clipping planes
        const shouldProject =
          st.showLabels && st.annotationMode !== 'hidden' && st.parts.length > 0;
        if (shouldProject && elapsed - lastLabelSync > 0.045) {
          lastLabelSync = elapsed;
          const cw = renderer.domElement.clientWidth;
          const ch = renderer.domElement.clientHeight;
          if (cw > 20 && ch > 20) {
            // Collect all visible Object3Ds per partId for accurate world bounding box
            const partObjects = new Map<string, THREE.Object3D[]>();
            rootGroup.traverse((o) => {
              const pid = o.userData?.partId as string | undefined;
              if (pid && o.visible) {
                const arr = partObjects.get(pid);
                if (arr) arr.push(o);
                else partObjects.set(pid, [o]);
              }
            });

            const nextAnchors: AnchorPoint2D[] = [];
            for (let idx = 0; idx < st.parts.length; idx++) {
              const part = st.parts[idx];
              const objs = partObjects.get(part.id);
              if (!objs || objs.length === 0) continue;

              _box.makeEmpty();
              for (const o of objs) {
                _partBox.setFromObject(o);
                if (!_partBox.isEmpty()) {
                  _box.union(_partBox);
                }
              }
              if (_box.isEmpty()) continue;

              // Clipping-plane visibility test across all 8 bounding-box corners
              const min = _box.min;
              const max = _box.max;
              let visibleCornerCount = 0;
              for (let cx = 0; cx < 2; cx++) {
                for (let cy = 0; cy < 2; cy++) {
                  for (let cz = 0; cz < 2; cz++) {
                    _corner.set(cx ? max.x : min.x, cy ? max.y : min.y, cz ? max.z : min.z);
                    if (
                      clipPlaneY.distanceToPoint(_corner) >= -0.001 &&
                      clipPlaneX.distanceToPoint(_corner) >= -0.001
                    ) {
                      visibleCornerCount++;
                    }
                  }
                }
              }
              if (visibleCornerCount === 0) continue;

              _box.getCenter(_projVec);
              // Clamp anchor onto visible side when partially clipped
              if (clipPlaneY.distanceToPoint(_projVec) < 0) {
                _projVec.y = Math.min(_projVec.y, clipPlaneY.constant - 0.04);
              }
              if (clipPlaneX.distanceToPoint(_projVec) < 0) {
                _projVec.x = Math.min(_projVec.x, clipPlaneX.constant - 0.04);
              }

              _projVec.project(camera);
              const inFront = _projVec.z >= -1 && _projVec.z <= 1;
              const rawX = ((_projVec.x + 1) / 2) * cw;
              const rawY = ((-_projVec.y + 1) / 2) * ch;
              if (inFront && rawX >= -24 && rawX <= cw + 24 && rawY >= -24 && rawY <= ch + 24) {
                nextAnchors.push({
                  id: part.id,
                  numberIndex: idx + 1,
                  name: part.vietnameseName,
                  scientificName: part.scientificName,
                  colorHex: part.colorHex,
                  canvasX: Math.max(8, Math.min(cw - 8, rawX)),
                  canvasY: Math.max(8, Math.min(ch - 8, rawY)),
                  depth: _projVec.z,
                  priority: st.selectedPartId === part.id ? 100 : 10,
                  isSelected: st.selectedPartId === part.id,
                });
              }
            }

            // Avoid React state churn when anchor coordinates have not moved meaningfully
            const prev = lastAnchorsRef.current;
            let changed = prev.length !== nextAnchors.length;
            if (!changed) {
              for (let i = 0; i < nextAnchors.length; i++) {
                const a = prev[i];
                const b = nextAnchors[i];
                if (
                  a.id !== b.id ||
                  a.isSelected !== b.isSelected ||
                  Math.abs(a.canvasX - b.canvasX) >= 0.75 ||
                  Math.abs(a.canvasY - b.canvasY) >= 0.75
                ) {
                  changed = true;
                  break;
                }
              }
            }
            if (changed) {
              lastAnchorsRef.current = nextAnchors;
              setProjectedAnchors(nextAnchors);
            }
          }
        } else if (!shouldProject && lastAnchorsRef.current.length > 0) {
          lastAnchorsRef.current = [];
          setProjectedAnchors([]);
        }

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      };

      frameId = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        controls.removeEventListener('start', onControlsStart);
        controls.dispose();
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        renderer.domElement.removeEventListener('pointerup', handlePointerUp);
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        buildResult.disposeExtra?.();

        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry.dispose();
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach((mat) => {
              if (!mat) return;
              const std = mat as THREE.MeshStandardMaterial;
              std.map?.dispose();
              std.normalMap?.dispose();
              std.roughnessMap?.dispose();
              mat.dispose();
            });
          }
        });
        envTexture.dispose();
        renderer.dispose();
        threeRef.current = null;
      };
    }, [modelKey, quality]);

    if (!webglSupported) {
      return (
        <div className="w-full h-full min-h-[360px] bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-4">
          <div className="px-4 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 font-semibold text-ui-min">
            Chế độ sơ đồ học tập 2D thay thế (Thiết bị không hỗ trợ WebGL 3D)
          </div>
          <h3 className="font-bold text-ui-lab">{fallbackTitle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full text-left">
            {fallbackItems.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-ui-min">
                {item}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full min-h-[380px] bg-[#081414] rounded-xl overflow-hidden select-none">
        <SmartLabelLayer
          enabled={showLabels && parts.length > 0}
          anchors={projectedAnchors}
          parts={parts}
          selectedPartId={selectedPartId}
          onSelectPart={onSelectPart}
        >
          <div ref={mountRef} className="w-full h-full" />
          {/* Subtle bottom-left interaction instruction inside center 3D canvas */}
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto z-10 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-700/75 text-slate-200 text-ui-min leading-snug">
            Kéo xoay · Cuộn phóng to/thu nhỏ · Nhấp bộ phận để xem
          </div>
        </SmartLabelLayer>
      </div>
    );
  },
);

ModelViewer3D.displayName = 'ModelViewer3D';
