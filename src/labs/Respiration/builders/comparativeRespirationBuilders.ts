import * as THREE from 'three';
import { QualityLevel } from '../../../types/biology';

const _dummy = new THREE.Object3D();
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _colorTmp = new THREE.Color();
const _darkRed = new THREE.Color('#7F1D1D');
const _brightRed = new THREE.Color('#EF4444');

function tagPart(obj: THREE.Object3D, partId: string, explodeDir: [number, number, number]) {
  obj.userData.partId = partId;
  obj.userData.explodeDir = new THREE.Vector3(explodeDir[0], explodeDir[1], explodeDir[2]);
  obj.traverse((child) => {
    child.userData.partId = partId;
  });
}

function getSegments(quality: QualityLevel, base: number): number {
  if (quality === 'high') return Math.round(base * 1.4);
  if (quality === 'low') return Math.max(8, Math.round(base * 0.65));
  return base;
}

// ============================================================================
// SIM 04: BODY SURFACE EXCHANGE (A: EARTHWORM WITH CAPILLARIES, B: HYDRA NO CIRCULATION)
// ============================================================================
export interface BodySurfaceAnimHandles {
  species: 'earthworm' | 'hydra';
  mucusMat?: THREE.MeshPhysicalMaterial;
  o2Particles: THREE.InstancedMesh;
  co2Particles: THREE.InstancedMesh;
  tentacles?: THREE.Mesh[];
}

export function buildBodySurfaceExchange(
  rootGroup: THREE.Group,
  quality: QualityLevel,
  species: 'earthworm' | 'hydra',
): { handles: BodySurfaceAnimHandles; initialCameraDir: THREE.Vector3 } {
  const segs = getSegments(quality, 22);

  if (species === 'earthworm') {
    // 1. Bề mặt da giun đất (skin-surface) — segmented cylindrical cross-section with cutaway
    const skinGroup = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({
      color: '#B45309',
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 9; i++) {
      const x = -2.4 + i * 0.6;
      // Leave front cutaway open on middle segments so capillaries & internal tissues are visible
      const isCutaway = i >= 2 && i <= 6;
      const segGeo = new THREE.CylinderGeometry(
        0.78,
        0.78,
        0.54,
        segs,
        1,
        false,
        isCutaway ? Math.PI * 0.35 : 0,
        isCutaway ? Math.PI * 1.3 : Math.PI * 2,
      );
      segGeo.rotateZ(Math.PI / 2);
      const segMesh = new THREE.Mesh(segGeo, skinMat);
      segMesh.position.set(x, 0, 0);
      skinGroup.add(segMesh);
    }
    tagPart(skinGroup, 'skin-surface', [0, 0.55, 0]);
    rootGroup.add(skinGroup);

    // 2. Lớp chất nhầy ẩm (mucus-moisture) — glistening translucent sheen reacting to moisture slider
    const mucusGroup = new THREE.Group();
    const mucusMat = new THREE.MeshPhysicalMaterial({
      color: '#38BDF8',
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const mucusTube = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 5.2, segs, 1, true), mucusMat);
    mucusTube.rotation.z = Math.PI / 2;
    mucusGroup.add(mucusTube);
    tagPart(mucusGroup, 'mucus-moisture', [0, 0.9, 0.3]);
    rootGroup.add(mucusGroup);

    // 3. Mạng mao mạch dưới da (subcutaneous-capillaries) — dorsal, ventral & ring capillaries
    const capGroup = new THREE.Group();
    const capMat = new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.35 });
    const dorsal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.9, 12), capMat);
    dorsal.rotation.z = Math.PI / 2;
    dorsal.position.set(0, 0.68, 0.12);
    const ventral = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.9, 12), capMat);
    ventral.rotation.z = Math.PI / 2;
    ventral.position.set(0, -0.68, 0.12);
    capGroup.add(dorsal, ventral);
    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.036, 8, 22), capMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-2.1 + i * 0.6, 0, 0);
      capGroup.add(ring);
    }
    tagPart(capGroup, 'subcutaneous-capillaries', [0, -0.25, 0.85]);
    rootGroup.add(capGroup);

    // 4. Các mô bên trong (body-tissues)
    const tissueGroup = new THREE.Group();
    const tissueMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, 4.7, segs),
      new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.62 }),
    );
    tissueMesh.rotation.z = Math.PI / 2;
    tissueGroup.add(tissueMesh);
    tagPart(tissueGroup, 'body-tissues', [0, -0.85, 0]);
    rootGroup.add(tissueGroup);

    const pCount = quality === 'low' ? 24 : 40;
    const o2Particles = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.065, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#14B8A6', emissive: '#0D9488', emissiveIntensity: 0.5 }),
      pCount,
    );
    o2Particles.frustumCulled = false;
    const co2Particles = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.065, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#F97316', emissive: '#C2410C', emissiveIntensity: 0.5 }),
      pCount,
    );
    co2Particles.frustumCulled = false;
    rootGroup.add(o2Particles, co2Particles);

    return {
      handles: { species: 'earthworm', mucusMat, o2Particles, co2Particles },
      initialCameraDir: new THREE.Vector3(0.22, 0.28, 1.0),
    };
  }

  // HYDRA (Thủy tức) — STRICTLY 2-cell-layer body wall & gastrovascular cavity, ZERO circulatory system!
  const wallGroup = new THREE.Group();
  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.42, 2.7, segs, 1, true, Math.PI * 0.25, Math.PI * 1.5),
    new THREE.MeshStandardMaterial({ color: '#14B8A6', roughness: 0.46, side: THREE.DoubleSide }),
  );
  outerWall.position.set(0, -0.1, 0);
  const footDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.62, 0.18, segs),
    new THREE.MeshStandardMaterial({ color: '#0F766E', roughness: 0.55 }),
  );
  footDisc.position.set(0, -1.5, 0);
  wallGroup.add(outerWall, footDisc);
  tagPart(wallGroup, 'body-wall', [-0.7, 0, 0.35]);
  rootGroup.add(wallGroup);

  // Khoang tiêu hóa (gastrovascular-cavity) — water-filled central lumen
  const cavGroup = new THREE.Group();
  const cavMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.24, 2.55, segs),
    new THREE.MeshPhysicalMaterial({
      color: '#38BDF8',
      roughness: 0.15,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  cavMesh.position.set(0, -0.05, 0);
  cavGroup.add(cavMesh);
  tagPart(cavGroup, 'gastrovascular-cavity', [0, 0, 0.75]);
  rootGroup.add(cavGroup);

  // Các lớp tế bào thân & tua miệng (cell-layers) — inner endoderm + waving tentacles (NO blood vessels!)
  const cellGroup = new THREE.Group();
  const innerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.32, 2.6, segs, 1, true, Math.PI * 0.25, Math.PI * 1.5),
    new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.5, side: THREE.DoubleSide }),
  );
  innerWall.position.set(0, -0.1, 0);
  cellGroup.add(innerWall);

  const tentacles: THREE.Mesh[] = [];
  const tentMat = new THREE.MeshStandardMaterial({ color: '#2DD4BF', roughness: 0.44 });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const tCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(angle) * 0.46, 1.22, Math.sin(angle) * 0.46),
      new THREE.Vector3(Math.cos(angle) * 0.95, 1.78, Math.sin(angle) * 0.95),
      new THREE.Vector3(Math.cos(angle) * 1.48, 1.55, Math.sin(angle) * 1.48),
    ]);
    const tent = new THREE.Mesh(new THREE.TubeGeometry(tCurve, 14, 0.072, 8, false), tentMat);
    cellGroup.add(tent);
    tentacles.push(tent);
  }
  tagPart(cellGroup, 'cell-layers', [0.75, 0.45, 0]);
  rootGroup.add(cellGroup);

  const pCount = quality === 'low' ? 22 : 36;
  const o2Particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.06, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#14B8A6', emissive: '#0D9488', emissiveIntensity: 0.55 }),
    pCount,
  );
  o2Particles.frustumCulled = false;
  const co2Particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.06, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#F97316', emissive: '#C2410C', emissiveIntensity: 0.5 }),
    pCount,
  );
  co2Particles.frustumCulled = false;
  rootGroup.add(o2Particles, co2Particles);

  return {
    handles: { species: 'hydra', o2Particles, co2Particles, tentacles },
    initialCameraDir: new THREE.Vector3(0.25, 0.16, 1.0),
  };
}

export function animateBodySurface(
  handles: BodySurfaceAnimHandles,
  simTime: number,
  moisturePercent: number,
) {
  if (handles.species === 'earthworm') {
    const moistureFrac = Math.max(0.1, Math.min(1, moisturePercent / 100));
    if (handles.mucusMat) {
      handles.mucusMat.opacity = 0.05 + moistureFrac * 0.36;
      handles.mucusMat.roughness = 0.72 - moistureFrac * 0.64;
    }
    const activeCount = Math.max(3, Math.round(handles.o2Particles.count * moistureFrac));
    const speed = 0.12 + moistureFrac * 0.36;

    for (let i = 0; i < handles.o2Particles.count; i++) {
      if (i >= activeCount) {
        _dummy.scale.setScalar(0.001);
        _dummy.position.set(0, 0, 0);
        _dummy.updateMatrix();
        handles.o2Particles.setMatrixAt(i, _dummy.matrix);
        handles.co2Particles.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      const t = ((i / handles.o2Particles.count + simTime * speed) % 1 + 1) % 1;
      const x = -1.9 + ((i * 0.37) % 3.8);
      const angle = (i * 1.1) % (Math.PI * 1.1) - 0.55;

      // O2 moves inward: air (r=1.65) -> moist skin -> subcutaneous capillaries (r=0.58)
      const rO2 = 1.65 - t * 1.07;
      _dummy.position.set(x, Math.sin(angle) * rO2, Math.cos(angle) * rO2);
      _dummy.scale.setScalar(0.75 + 0.3 * Math.sin(t * Math.PI));
      _dummy.updateMatrix();
      handles.o2Particles.setMatrixAt(i, _dummy.matrix);

      // CO2 moves outward: capillaries (r=0.58) -> moist skin -> environment (r=1.65)
      const rCO2 = 0.58 + t * 1.07;
      _dummy.position.set(x + 0.12, Math.sin(angle + 0.3) * rCO2, Math.cos(angle + 0.3) * rCO2);
      _dummy.scale.setScalar(0.72 + 0.3 * Math.sin(t * Math.PI));
      _dummy.updateMatrix();
      handles.co2Particles.setMatrixAt(i, _dummy.matrix);
    }
  } else {
    // Hydra: direct diffusion from water (outside & gastrovascular cavity) directly into 2-layer cells
    if (handles.tentacles) {
      handles.tentacles.forEach((tent, idx) => {
        tent.rotation.z = Math.sin(simTime * 1.6 + idx) * 0.08;
      });
    }
    for (let i = 0; i < handles.o2Particles.count; i++) {
      const t = ((i / handles.o2Particles.count + simTime * 0.34) % 1 + 1) % 1;
      const y = -1.1 + ((i * 0.27) % 2.1);
      const ang = (i * 1.45) % (Math.PI * 2);
      const fromInside = i % 3 === 0;
      const rStart = fromInside ? 0.15 : 1.38;
      const rEnd = 0.48;
      const rO2 = rStart + (rEnd - rStart) * t;
      _dummy.position.set(Math.cos(ang) * rO2, y, Math.sin(ang) * rO2);
      _dummy.scale.setScalar(0.75 + 0.28 * Math.sin(t * Math.PI));
      _dummy.updateMatrix();
      handles.o2Particles.setMatrixAt(i, _dummy.matrix);

      const rCO2 = rEnd + (rStart - rEnd) * t;
      _dummy.position.set(Math.cos(ang + 0.4) * rCO2, y + 0.08, Math.sin(ang + 0.4) * rCO2);
      _dummy.scale.setScalar(0.72 + 0.28 * Math.sin(t * Math.PI));
      _dummy.updateMatrix();
      handles.co2Particles.setMatrixAt(i, _dummy.matrix);
    }
  }
  handles.o2Particles.instanceMatrix.needsUpdate = true;
  handles.co2Particles.instanceMatrix.needsUpdate = true;
}

// ============================================================================
// SIM 05: GRASSHOPPER TRACHEAL SYSTEM (SPIRACLES -> TRACHEAE -> TRACHEOLES -> CELLS)
// ============================================================================
export interface TrachealAnimHandles {
  zoomed: boolean;
  abdomenGroup: THREE.Group;
  spiracleValves: THREE.Mesh[];
  o2Particles: THREE.InstancedMesh;
  co2Particles: THREE.InstancedMesh;
  tracheaPaths: THREE.CatmullRomCurve3[];
}

export function buildTrachealSystem(
  rootGroup: THREE.Group,
  quality: QualityLevel,
  zoomed: boolean,
): { handles: TrachealAnimHandles; initialCameraDir: THREE.Vector3 } {
  const segs = getSegments(quality, 20);
  const abdomenGroup = new THREE.Group();
  const spiracleValves: THREE.Mesh[] = [];
  const tracheaPaths: THREE.CatmullRomCurve3[] = [];

  if (!zoomed) {
    // Whole grasshopper translucent body shell (head, thorax, segmented abdomen)
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: '#65A30D',
      roughness: 0.35,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, segs, segs), shellMat);
    head.position.set(-2.35, 0.22, 0);
    const thorax = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 0.9, 10, segs), shellMat);
    thorax.rotation.z = Math.PI / 2;
    thorax.position.set(-1.15, 0.15, 0);
    rootGroup.add(head, thorax);

    const abdBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.56, 2.4, 10, segs), shellMat);
    abdBody.rotation.z = Math.PI / 2;
    abdBody.position.set(1.1, 0.04, 0);
    abdomenGroup.add(abdBody);
    rootGroup.add(abdomenGroup);

    // 1. Lỗ thở (spiracles) — lateral pairs along thorax & abdomen with openable valves
    const spiracleGroup = new THREE.Group();
    const rimMat = new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.32 });
    const valveMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.5 });
    const xPositions = [-1.1, -0.35, 0.35, 1.05, 1.75];
    for (const x of xPositions) {
      for (const side of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 8, 16), rimMat);
        rim.position.set(x, -0.08, side * 0.58);
        const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 14), valveMat);
        valve.rotation.x = Math.PI / 2;
        valve.position.set(x, -0.08, side * 0.59);
        spiracleGroup.add(rim, valve);
        spiracleValves.push(valve);
      }
    }
    tagPart(spiracleGroup, 'spiracles', [0, -0.55, 0.9]);
    abdomenGroup.add(spiracleGroup);

    // 2. Hệ thống ống khí (tracheae) — longitudinal silvery trunks + transverse branches
    const tracheaGroup = new THREE.Group();
    const trMat = new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.26, metalness: 0.15 });
    for (const side of [-1, 1]) {
      const trunk = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.1, 0.18, side * 0.25),
        new THREE.Vector3(-0.6, 0.24, side * 0.34),
        new THREE.Vector3(1.0, 0.18, side * 0.32),
        new THREE.Vector3(2.2, 0.04, side * 0.2),
      ]);
      tracheaGroup.add(new THREE.Mesh(new THREE.TubeGeometry(trunk, 24, 0.085, 10, false), trMat));
    }
    for (const x of xPositions) {
      for (const side of [-1, 1]) {
        const branch = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, -0.08, side * 0.58),
          new THREE.Vector3(x, 0.06, side * 0.38),
          new THREE.Vector3(x - 0.12, 0.2, side * 0.26),
        ]);
        tracheaGroup.add(new THREE.Mesh(new THREE.TubeGeometry(branch, 10, 0.055, 8, false), trMat));
        tracheaPaths.push(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(x, -0.08, side * 0.95),
            new THREE.Vector3(x, -0.08, side * 0.58),
            new THREE.Vector3(x, 0.08, side * 0.34),
            new THREE.Vector3(x - 0.08, 0.22, side * 0.14),
            new THREE.Vector3(x - 0.14, 0.02, 0),
          ]),
        );
      }
    }
    tagPart(tracheaGroup, 'tracheae', [0, 0.65, 0]);
    abdomenGroup.add(tracheaGroup);

    // 3. Ống khí nhỏ (tracheoles) — fine teal network touching muscle cells directly
    const tracheoleGroup = new THREE.Group();
    const toleMat = new THREE.MeshStandardMaterial({ color: '#2DD4BF', roughness: 0.35 });
    for (const x of [-1.2, -0.4, 0.4, 1.2]) {
      for (const side of [-1, 1]) {
        const c = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 0.2, side * 0.28),
          new THREE.Vector3(x - 0.08, 0.08, side * 0.14),
          new THREE.Vector3(x - 0.12, -0.02, side * 0.04),
        ]);
        tracheoleGroup.add(new THREE.Mesh(new THREE.TubeGeometry(c, 10, 0.028, 6, false), toleMat));
      }
    }
    tagPart(tracheoleGroup, 'tracheoles', [0, 0.3, 0.6]);
    abdomenGroup.add(tracheoleGroup);

    // 4. Mô và tế bào cơ thể (muscle-tissues) — directly contacted by tracheoles (NO blood O2 transport!)
    const muscleGroup = new THREE.Group();
    const muscleMat = new THREE.MeshStandardMaterial({ color: '#F97316', roughness: 0.55 });
    for (const x of [-1.25, -0.45, 0.35, 1.15]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.28), muscleMat);
      m.position.set(x, -0.02, 0);
      muscleGroup.add(m);
    }
    tagPart(muscleGroup, 'muscle-tissues', [0, -0.65, 0]);
    abdomenGroup.add(muscleGroup);
  } else {
    // MAGNIFIED TRACHEOLE -> CELL INTERFACE VIEW
    const spiracleGroup = new THREE.Group();
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.1, 12, 24),
      new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.32 }),
    );
    rim.rotation.y = Math.PI / 2;
    rim.position.set(-2.3, 0.2, 0);
    const valve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.08, 20),
      new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.5 }),
    );
    valve.rotation.z = Math.PI / 2;
    valve.position.set(-2.28, 0.2, 0);
    spiracleGroup.add(rim, valve);
    spiracleValves.push(valve);
    tagPart(spiracleGroup, 'spiracles', [-0.9, 0.2, 0]);
    rootGroup.add(spiracleGroup);

    // Main ringed trachea trunk
    const tracheaGroup = new THREE.Group();
    const trCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.3, 0.2, 0),
      new THREE.Vector3(-1.1, 0.22, 0),
      new THREE.Vector3(-0.2, 0.15, 0),
    ]);
    tracheaGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(trCurve, 20, 0.28, 16, false),
        new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.32 }),
      ),
    );
    // Chitin taenidia rings
    const ringMat = new THREE.MeshStandardMaterial({ color: '#E0F2FE', roughness: 0.28 });
    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.032, 8, 20), ringMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-2.05 + i * 0.24, 0.2, 0);
      tracheaGroup.add(ring);
    }
    tagPart(tracheaGroup, 'tracheae', [-0.3, 0.6, 0]);
    rootGroup.add(tracheaGroup);

    // Fine branching tracheoles penetrating directly onto muscle cells
    const tracheoleGroup = new THREE.Group();
    const toleMat = new THREE.MeshStandardMaterial({ color: '#2DD4BF', roughness: 0.32 });
    const branchTargets = [
      new THREE.Vector3(1.55, 0.95, 0.25),
      new THREE.Vector3(1.75, 0.25, -0.2),
      new THREE.Vector3(1.6, -0.45, 0.35),
      new THREE.Vector3(1.5, -0.95, -0.25),
    ];
    for (const target of branchTargets) {
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.2, 0.15, 0),
        new THREE.Vector3(0.65, target.y * 0.55, target.z * 0.5),
        target,
      ]);
      tracheoleGroup.add(new THREE.Mesh(new THREE.TubeGeometry(c, 18, 0.075, 10, false), toleMat));
      tracheaPaths.push(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.75, 0.2, 0),
          new THREE.Vector3(-1.3, 0.2, 0),
          new THREE.Vector3(-0.2, 0.15, 0),
          new THREE.Vector3(0.65, target.y * 0.55, target.z * 0.5),
          target,
        ]),
      );
    }
    tagPart(tracheoleGroup, 'tracheoles', [0.2, 0.4, 0.4]);
    rootGroup.add(tracheoleGroup);

    // Muscle cells receiving O2 directly
    const muscleGroup = new THREE.Group();
    const cellMat = new THREE.MeshStandardMaterial({ color: '#F97316', roughness: 0.46 });
    for (const t of branchTargets) {
      const cell = new THREE.Mesh(new THREE.SphereGeometry(0.46, segs, segs), cellMat);
      cell.scale.set(1.25, 0.72, 0.85);
      cell.position.set(t.x + 0.35, t.y, t.z);
      muscleGroup.add(cell);
    }
    tagPart(muscleGroup, 'muscle-tissues', [0.95, 0, 0]);
    rootGroup.add(muscleGroup);
    rootGroup.add(abdomenGroup);
  }

  const pCount = quality === 'low' ? 24 : 42;
  const o2Particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(zoomed ? 0.08 : 0.055, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#14B8A6', emissive: '#0D9488', emissiveIntensity: 0.55 }),
    pCount,
  );
  o2Particles.frustumCulled = false;
  const co2Particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(zoomed ? 0.08 : 0.055, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#F97316', emissive: '#C2410C', emissiveIntensity: 0.5 }),
    pCount,
  );
  co2Particles.frustumCulled = false;
  rootGroup.add(o2Particles, co2Particles);

  return {
    handles: { zoomed, abdomenGroup, spiracleValves, o2Particles, co2Particles, tracheaPaths },
    initialCameraDir: new THREE.Vector3(0.18, 0.26, 1.0),
  };
}

export function animateTrachealSystem(
  handles: TrachealAnimHandles,
  simTime: number,
  spiraclesOpen: boolean,
) {
  // Subtle abdominal ventilation pumping (only active when whole view & spiracles open)
  if (!handles.zoomed) {
    const pump = spiraclesOpen ? Math.sin(simTime * 2.4) * 0.045 : 0;
    handles.abdomenGroup.scale.set(1, 1 + pump, 1 + pump * 0.8);
  }

  // Open/close spiracle valves visually
  for (const v of handles.spiracleValves) {
    const s = spiraclesOpen ? 0.15 : 1.05;
    v.scale.set(s, 1, s);
  }

  const speed = spiraclesOpen ? 0.32 : 0.0;
  const pScale = spiraclesOpen ? 0.95 : 0.3;

  for (let i = 0; i < handles.o2Particles.count; i++) {
    const curve = handles.tracheaPaths[i % handles.tracheaPaths.length];
    const tO2 = ((i / handles.o2Particles.count + simTime * speed) % 1 + 1) % 1;
    curve.getPointAt(tO2, _vecA);
    _dummy.position.copy(_vecA);
    _dummy.scale.setScalar(pScale);
    _dummy.updateMatrix();
    handles.o2Particles.setMatrixAt(i, _dummy.matrix);

    const tCO2 = ((1 - i / handles.co2Particles.count - simTime * speed * 0.85) % 1 + 1) % 1;
    curve.getPointAt(tCO2, _vecB);
    _dummy.position.set(_vecB.x, _vecB.y + 0.05, _vecB.z);
    _dummy.scale.setScalar(pScale * 0.92);
    _dummy.updateMatrix();
    handles.co2Particles.setMatrixAt(i, _dummy.matrix);
  }
  handles.o2Particles.instanceMatrix.needsUpdate = true;
  handles.co2Particles.instanceMatrix.needsUpdate = true;
}

// ============================================================================
// SIM 06: FISH GILLS (MOUTH-OPERCULUM PUMPING & COUNTERCURRENT VS CONCURRENT)
// ============================================================================
export interface GillProfilePoint {
  positionPct: number; // 0..100% along lamella length
  waterO2: number; // relative O2 saturation / partial pressure in water
  bloodO2: number; // relative O2 saturation / partial pressure in blood
  gradient: number; // waterO2 - bloodO2
}

export interface GillExchangeSummary {
  profile: GillProfilePoint[];
  extractionEfficiencyPct: number;
  exitBloodO2: number;
  explanationNote: string;
}

/**
 * Deterministic countercurrent (real fish) vs concurrent (principle-comparison model)
 * partial-pressure profile along gill lamella.
 */
export function computeGillProfile(
  flowType: 'countercurrent' | 'concurrent',
  waterSpeed: number,
  bloodSpeed: number,
  dissolvedO2Pct: number, // 40..100
): GillExchangeSummary {
  const wIn = Math.max(35, Math.min(100, dissolvedO2Pct));
  const bIn = 15; // venous blood arriving at gills
  const ratio = Math.max(0.45, Math.min(1.6, waterSpeed / Math.max(0.3, bloodSpeed)));
  const profile: GillProfilePoint[] = [];

  for (let i = 0; i <= 10; i++) {
    const x = i / 10; // 0 = water entry, 1 = water exit
    if (flowType === 'countercurrent') {
      // Water flows 0 -> 1 (high -> lower), Blood flows 1 -> 0 (low -> high, exiting at x=0 near wIn)
      const transferEff = Math.min(0.86, 0.72 + 0.1 * Math.min(1.2, ratio));
      const bOut = bIn + (wIn - bIn) * transferEff;
      const wOut = wIn - (bOut - bIn) * 0.82;
      const waterO2 = Math.round((wIn - (wIn - wOut) * x) * 10) / 10;
      const bloodO2 = Math.round((bOut - (bOut - bIn) * x) * 10) / 10;
      profile.push({
        positionPct: i * 10,
        waterO2,
        bloodO2,
        gradient: Math.round((waterO2 - bloodO2) * 10) / 10,
      });
    } else {
      // Concurrent (educational comparison only): both flow 0 -> 1 and exponentially equilibrate near midpoint (~50%)
      const eq = (wIn * ratio + bIn) / (ratio + 1);
      const decay = Math.exp(-3.4 * x);
      const waterO2 = Math.round((eq + (wIn - eq) * decay) * 10) / 10;
      const bloodO2 = Math.round((eq - (eq - bIn) * decay) * 10) / 10;
      profile.push({
        positionPct: i * 10,
        waterO2,
        bloodO2,
        gradient: Math.round((waterO2 - bloodO2) * 10) / 10,
      });
    }
  }

  const exitBloodO2 =
    flowType === 'countercurrent' ? profile[0].bloodO2 : profile[profile.length - 1].bloodO2;
  const extractionEfficiencyPct = Math.round(((exitBloodO2 - bIn) / Math.max(1, wIn - bIn)) * 100);

  const explanationNote =
    flowType === 'countercurrent'
      ? 'Cơ chế thực ở cá xương: dòng nước và dòng máu chảy ngược chiều giữ chênh lệch phân áp O₂ dương suốt chiều dài phiến mang.'
      : 'Mô hình so sánh nguyên lí (KHÔNG phải cơ chế thực ở cá): dòng chảy cùng chiều nhanh chóng cân bằng ở ~50% rồi ngừng khuếch tán.';

  return { profile, extractionEfficiencyPct, exitBloodO2, explanationNote };
}

export interface FishGillAnimHandles {
  viewMode: 'whole' | 'lamella';
  mouthJaw?: THREE.Group;
  operculumPlate?: THREE.Group;
  waterParticles: THREE.InstancedMesh;
  bloodParticles?: THREE.InstancedMesh;
  o2Particles?: THREE.InstancedMesh;
  waterPaths: THREE.CatmullRomCurve3[];
  bloodPath?: THREE.CatmullRomCurve3;
}

export function buildFishGills(
  rootGroup: THREE.Group,
  quality: QualityLevel,
  viewMode: 'whole' | 'lamella',
): { handles: FishGillAnimHandles; initialCameraDir: THREE.Vector3 } {
  const segs = getSegments(quality, 22);

  if (viewMode === 'whole') {
    // Fish head cutaway silhouette (translucent slate-teal body shell)
    const headShell = new THREE.Mesh(
      new THREE.SphereGeometry(1.75, segs, segs, 0, Math.PI * 1.45),
      new THREE.MeshPhysicalMaterial({
        color: '#64748B',
        roughness: 0.38,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    headShell.scale.set(1.55, 0.92, 0.72);
    headShell.rotation.y = Math.PI * 0.25;
    rootGroup.add(headShell);

    // 1. Miệng cá (mouth) — animated lower jaw hinge
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(-2.35, -0.15, 0);
    const upperLip = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.08, 10, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.35 }),
    );
    upperLip.rotation.y = Math.PI / 2;
    const jawPivot = new THREE.Group();
    const lowerLip = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.08, 10, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: '#0284C7', roughness: 0.35 }),
    );
    lowerLip.rotation.y = Math.PI / 2;
    lowerLip.rotation.x = Math.PI;
    jawPivot.add(lowerLip);
    mouthGroup.add(upperLip, jawPivot);
    tagPart(mouthGroup, 'mouth', [-0.9, 0, 0.3]);
    rootGroup.add(mouthGroup);

    // 2. Nắp mang (operculum) — hinged bony cover swinging out of phase with mouth
    const opercGroup = new THREE.Group();
    opercGroup.position.set(0.35, 0, 0.88);
    const plate = new THREE.Mesh(
      new THREE.SphereGeometry(1.12, segs, segs, -Math.PI * 0.25, Math.PI * 0.55, Math.PI * 0.2, Math.PI * 0.6),
      new THREE.MeshPhysicalMaterial({
        color: '#94A3B8',
        roughness: 0.35,
        transparent: true,
        opacity: 0.52,
        side: THREE.DoubleSide,
      }),
    );
    plate.position.set(0.3, 0, -0.45);
    opercGroup.add(plate);
    tagPart(opercGroup, 'operculum', [0.65, 0, 0.95]);
    rootGroup.add(opercGroup);

    // 3. Cung mang (gill-arch) — 4 curved bony gill arches
    const archGroup = new THREE.Group();
    const archMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.38 });
    const filGroup = new THREE.Group();
    const filMat = new THREE.MeshStandardMaterial({ color: '#F43F5E', roughness: 0.42 });
    const lamGroup = new THREE.Group();
    const lamMat = new THREE.MeshStandardMaterial({ color: '#FB7185', roughness: 0.44 });
    const capGroup = new THREE.Group();
    const capMat = new THREE.MeshStandardMaterial({ color: '#DC2626', roughness: 0.35 });

    for (let a = 0; a < 4; a++) {
      const xOff = -0.75 + a * 0.36;
      const archCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff, 0.92, 0.12),
        new THREE.Vector3(xOff - 0.18, 0.0, 0.22),
        new THREE.Vector3(xOff + 0.08, -0.92, 0.12),
      ]);
      archGroup.add(new THREE.Mesh(new THREE.TubeGeometry(archCurve, 16, 0.068, 8, false), archMat));

      // 4. Sợi mang (gill-filaments) & 5. Phiến mang (gill-lamellae) radiating posteriorly
      for (let f = 0; f < 9; f++) {
        const t = 0.1 + (f / 8) * 0.8;
        archCurve.getPointAt(t, _vecA);
        const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.56, 6), filMat);
        fil.rotation.z = Math.PI / 2;
        fil.position.set(_vecA.x + 0.28, _vecA.y, _vecA.z + (f % 2 === 0 ? 0.05 : -0.05));
        filGroup.add(fil);

        if (f % 2 === 0 && a === 3) {
          const lam = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.045, 0.14), lamMat);
          lam.position.set(_vecA.x + 0.32, _vecA.y, _vecA.z + 0.04);
          lamGroup.add(lam);
        }
      }

      // 6. Mao mạch mang (gill-capillaries) running along arch
      const capCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff + 0.16, 0.85, 0.18),
        new THREE.Vector3(xOff + 0.02, 0.0, 0.28),
        new THREE.Vector3(xOff + 0.22, -0.85, 0.18),
      ]);
      capGroup.add(new THREE.Mesh(new THREE.TubeGeometry(capCurve, 14, 0.032, 6, false), capMat));
    }

    tagPart(archGroup, 'gill-arch', [-0.2, 0.5, 0]);
    tagPart(filGroup, 'gill-filaments', [0.35, 0.2, 0.35]);
    tagPart(lamGroup, 'gill-lamellae', [0.85, -0.25, 0.45]);
    tagPart(capGroup, 'gill-capillaries', [0.1, -0.65, 0.55]);
    rootGroup.add(archGroup, filGroup, lamGroup, capGroup);

    // One-way water flow paths from mouth through gills out under operculum
    const waterPaths = [-0.45, 0, 0.45].map(
      (y) =>
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.85, y * 0.4, 0),
          new THREE.Vector3(-1.45, y * 0.8, 0.15),
          new THREE.Vector3(0.0, y, 0.3),
          new THREE.Vector3(1.55, y * 0.9, 0.65),
          new THREE.Vector3(2.45, y * 0.7, 0.85),
        ]),
    );
    const wCount = quality === 'low' ? 28 : 48;
    const waterParticles = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.068, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#0EA5E9', emissive: '#0284C7', emissiveIntensity: 0.45 }),
      wCount,
    );
    waterParticles.frustumCulled = false;
    rootGroup.add(waterParticles);

    return {
      handles: { viewMode: 'whole', mouthJaw: jawPivot, operculumPlate: opercGroup, waterParticles, waterPaths },
      initialCameraDir: new THREE.Vector3(0.24, 0.18, 1.0),
    };
  }

  // ZOOMED GILL LAMELLA COUNTERCURRENT vs CONCURRENT VIEW
  const lamellaGroup = new THREE.Group();
  const lamellaBase = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 1.15, 0.34),
    new THREE.MeshStandardMaterial({ color: '#FB7185', roughness: 0.45, transparent: true, opacity: 0.72 }),
  );
  lamellaGroup.add(lamellaBase);
  tagPart(lamellaGroup, 'gill-lamellae', [0, 0.5, -0.4]);
  rootGroup.add(lamellaGroup);

  // Water channel enveloping top & front of lamella
  const filGroup = new THREE.Group();
  const waterChannel = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.62, 0.95),
    new THREE.MeshPhysicalMaterial({
      color: '#38BDF8',
      roughness: 0.12,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
  );
  waterChannel.position.set(0, 0.92, 0);
  filGroup.add(waterChannel);
  tagPart(filGroup, 'gill-filaments', [0, 0.9, 0]);
  rootGroup.add(filGroup);

  // Blood capillary inside lamella
  const capGroup = new THREE.Group();
  const bloodPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.2, -0.12, 0.12),
    new THREE.Vector3(0, -0.12, 0.16),
    new THREE.Vector3(2.2, -0.12, 0.12),
  ]);
  const capTube = new THREE.Mesh(
    new THREE.TubeGeometry(bloodPath, 24, 0.22, 14, false),
    new THREE.MeshPhysicalMaterial({ color: '#DC2626', roughness: 0.25, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  capGroup.add(capTube);
  tagPart(capGroup, 'gill-capillaries', [0, -0.7, 0.4]);
  rootGroup.add(capGroup);

  const waterPaths = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.45, 0.88, 0.18),
      new THREE.Vector3(0, 0.88, 0.22),
      new THREE.Vector3(2.45, 0.88, 0.18),
    ]),
  ];

  const pCount = quality === 'low' ? 22 : 34;
  const waterParticles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#0EA5E9', emissive: '#0369A1', emissiveIntensity: 0.4 }),
    pCount,
  );
  waterParticles.frustumCulled = false;

  const bloodParticles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.11, 12, 12),
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.32 }),
    pCount,
  );
  bloodParticles.frustumCulled = false;

  const o2Particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.068, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#14B8A6', emissive: '#0D9488', emissiveIntensity: 0.6 }),
    26,
  );
  o2Particles.frustumCulled = false;

  rootGroup.add(waterParticles, bloodParticles, o2Particles);

  return {
    handles: {
      viewMode: 'lamella',
      waterParticles,
      bloodParticles,
      o2Particles,
      waterPaths,
      bloodPath,
    },
    initialCameraDir: new THREE.Vector3(0.06, 0.18, 1.0),
  };
}

export function animateFishGills(
  handles: FishGillAnimHandles,
  simTime: number,
  params: {
    flowType: 'countercurrent' | 'concurrent';
    waterSpeed: number;
    bloodSpeed: number;
    dissolvedO2Pct: number;
  },
) {
  if (handles.viewMode === 'whole') {
    const cycle = Math.sin(simTime * 2.6 * params.waterSpeed);
    if (handles.mouthJaw) {
      handles.mouthJaw.rotation.z = -Math.max(0, cycle) * 0.35;
    }
    if (handles.operculumPlate) {
      // Operculum flares outward out-of-phase with mouth opening
      handles.operculumPlate.rotation.y = -Math.max(0, -cycle) * 0.28;
    }
    for (let i = 0; i < handles.waterParticles.count; i++) {
      const curve = handles.waterPaths[i % handles.waterPaths.length];
      const t = ((i / handles.waterParticles.count + simTime * 0.26 * params.waterSpeed) % 1 + 1) % 1;
      curve.getPointAt(t, _vecA);
      _dummy.position.copy(_vecA);
      _dummy.scale.setScalar(0.75 + 0.3 * Math.sin(t * Math.PI));
      _dummy.updateMatrix();
      handles.waterParticles.setMatrixAt(i, _dummy.matrix);
    }
    handles.waterParticles.instanceMatrix.needsUpdate = true;
    return;
  }

  // Zoomed Lamella: water always flows left -> right (x: -2.45 -> +2.45)
  const wCurve = handles.waterPaths[0];
  for (let i = 0; i < handles.waterParticles.count; i++) {
    const t = ((i / handles.waterParticles.count + simTime * 0.24 * params.waterSpeed) % 1 + 1) % 1;
    wCurve.getPointAt(t, _vecA);
    _dummy.position.copy(_vecA);
    _dummy.scale.setScalar(0.95);
    _dummy.updateMatrix();
    handles.waterParticles.setMatrixAt(i, _dummy.matrix);
  }
  handles.waterParticles.instanceMatrix.needsUpdate = true;

  // Blood flows RIGHT -> LEFT in Countercurrent (real fish), LEFT -> RIGHT in Concurrent (comparison)
  if (handles.bloodParticles && handles.bloodPath) {
    const isCounter = params.flowType === 'countercurrent';
    const maxOxy = isCounter ? 0.92 : 0.48;
    const o2Factor = params.dissolvedO2Pct / 100;

    for (let i = 0; i < handles.bloodParticles.count; i++) {
      const raw = (i / handles.bloodParticles.count + simTime * 0.22 * params.bloodSpeed) % 1;
      const t = isCounter ? 1 - raw : raw;
      handles.bloodPath.getPointAt(t, _vecA);
      _dummy.position.copy(_vecA);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      handles.bloodParticles.setMatrixAt(i, _dummy.matrix);

      // Oxygenation rises along blood's travel progress (`raw`: 0 -> 1)
      const oxyT = Math.min(1, raw * maxOxy * o2Factor * 1.15);
      _colorTmp.copy(_darkRed).lerp(_brightRed, oxyT);
      handles.bloodParticles.setColorAt(i, _colorTmp);
    }
    handles.bloodParticles.instanceMatrix.needsUpdate = true;
    if (handles.bloodParticles.instanceColor) handles.bloodParticles.instanceColor.needsUpdate = true;
  }

  // O2 diffusing downward from water channel into blood capillary:
  // Countercurrent: diffusion occurs across ENTIRE lamella (x: -2.0 .. +2.0)
  // Concurrent: diffusion slows & halts past midpoint (x > 0.2) once equilibrium (~50%) is reached!
  if (handles.o2Particles) {
    const isCounter = params.flowType === 'countercurrent';
    for (let i = 0; i < handles.o2Particles.count; i++) {
      const fracX = i / handles.o2Particles.count;
      const active = isCounter ? true : fracX < 0.54;
      if (!active) {
        _dummy.scale.setScalar(0.001);
        _dummy.position.set(0, 0, 0);
        _dummy.updateMatrix();
        handles.o2Particles.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      const x = -2.0 + fracX * 4.0;
      const t = ((i * 0.17 + simTime * 0.42 * (params.dissolvedO2Pct / 100)) % 1 + 1) % 1;
      _dummy.position.set(x, 0.85 - t * 0.98, 0.22);
      _dummy.scale.setScalar(0.75 + 0.35 * Math.sin(t * Math.PI));
      _dummy.updateMatrix();
      handles.o2Particles.setMatrixAt(i, _dummy.matrix);
    }
    handles.o2Particles.instanceMatrix.needsUpdate = true;
  }
}

// ============================================================================
// SIM 07: AVIAN RESPIRATION (RIGID LUNGS + ANTERIOR/POSTERIOR AIR SACS, 2 CYCLES / 4 STAGES)
// ============================================================================
export interface AvianAnimHandles {
  anteriorSacGroup: THREE.Group;
  posteriorSacGroup: THREE.Group;
  rigidLungGroup: THREE.Group; // Explicitly kept constant volume!
  taggedBolus: THREE.Mesh;
  bgAirParticles: THREE.InstancedMesh;
  stageCurves: THREE.CatmullRomCurve3[]; // 4 curves for Stages 1..4
}

export function buildAvianRespiration(
  rootGroup: THREE.Group,
  quality: QualityLevel,
): { handles: AvianAnimHandles; initialCameraDir: THREE.Vector3 } {
  const segs = getSegments(quality, 22);

  // Subtle translucent bird body silhouette for anatomical context
  const birdBody = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, segs, segs),
    new THREE.MeshPhysicalMaterial({
      color: '#CBD5E1',
      roughness: 0.4,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  birdBody.scale.set(1.65, 0.95, 0.72);
  birdBody.position.set(0.15, -0.1, 0);
  rootGroup.add(birdBody);

  // 1. Khí quản chim (avian-trachea)
  const tracheaGroup = new THREE.Group();
  const trCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.65, 1.35, 0),
    new THREE.Vector3(-1.85, 0.88, 0),
    new THREE.Vector3(-1.05, 0.35, 0),
  ]);
  tracheaGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(trCurve, 20, 0.15, 12, false),
      new THREE.MeshStandardMaterial({ color: '#93C5FD', roughness: 0.4 }),
    ),
  );
  tagPart(tracheaGroup, 'avian-trachea', [-0.95, 0.55, 0]);
  rootGroup.add(tracheaGroup);

  // 2. Phế quản chính & Nhánh nối túi khí (avian-bronchi)
  const bronchiGroup = new THREE.Group();
  const brMat = new THREE.MeshStandardMaterial({ color: '#60A5FA', roughness: 0.42 });
  const toPostCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.05, 0.35, 0),
    new THREE.Vector3(0.0, 0.05, 0.08),
    new THREE.Vector3(1.55, -0.25, 0),
  ]);
  const postToLung = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.55, -0.25, 0),
    new THREE.Vector3(1.05, 0.52, 0),
    new THREE.Vector3(0.55, 0.65, 0),
  ]);
  const lungToAnt = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, 0.65, 0),
    new THREE.Vector3(-0.85, 0.2, 0),
    new THREE.Vector3(-1.15, -0.45, 0),
  ]);
  const antToTrachea = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.15, -0.45, 0),
    new THREE.Vector3(-1.2, 0.05, 0.08),
    new THREE.Vector3(-1.05, 0.35, 0),
  ]);
  [toPostCurve, postToLung, lungToAnt, antToTrachea].forEach((c) => {
    bronchiGroup.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.085, 10, false), brMat));
  });
  tagPart(bronchiGroup, 'avian-bronchi', [0, -0.35, 0.65]);
  rootGroup.add(bronchiGroup);

  // 3. Phổi chim (avian-lungs) — RIGID parallel parabronchi tubes (DOES NOT INFLATE/DEFLATE!)
  const rigidLungGroup = new THREE.Group();
  const lungFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 0.68, 0.72),
    new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.48, transparent: true, opacity: 0.72 }),
  );
  lungFrame.position.set(0.1, 0.65, 0);
  rigidLungGroup.add(lungFrame);
  // Parallel parabronchi tubules inside rigid lung
  const paraMat = new THREE.MeshStandardMaterial({ color: '#FECACA', roughness: 0.35 });
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.12, 8), paraMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0.1, 0.65 + row * 0.17, col * 0.18);
      rigidLungGroup.add(tube);
    }
  }
  tagPart(rigidLungGroup, 'avian-lungs', [0, 0.95, 0]);
  rootGroup.add(rigidLungGroup);

  // 4. Hệ thống túi khí trước (anterior-air-sacs)
  const anteriorSacGroup = new THREE.Group();
  anteriorSacGroup.position.set(-1.15, -0.52, 0);
  const antMat = new THREE.MeshPhysicalMaterial({
    color: '#38BDF8',
    roughness: 0.25,
    transparent: true,
    opacity: 0.65,
  });
  const antMain = new THREE.Mesh(new THREE.SphereGeometry(0.54, segs, segs), antMat);
  antMain.scale.set(1.15, 0.85, 0.9);
  const antSec = new THREE.Mesh(new THREE.SphereGeometry(0.36, segs, segs), antMat);
  antSec.position.set(0.42, -0.25, 0.22);
  anteriorSacGroup.add(antMain, antSec);
  tagPart(anteriorSacGroup, 'anterior-air-sacs', [-0.85, -0.75, 0.3]);
  rootGroup.add(anteriorSacGroup);

  // 5. Hệ thống túi khí sau (posterior-air-sacs)
  const posteriorSacGroup = new THREE.Group();
  posteriorSacGroup.position.set(1.55, -0.25, 0);
  const postMat = new THREE.MeshPhysicalMaterial({
    color: '#2DD4BF',
    roughness: 0.25,
    transparent: true,
    opacity: 0.68,
  });
  const postMain = new THREE.Mesh(new THREE.SphereGeometry(0.72, segs, segs), postMat);
  postMain.scale.set(1.25, 0.88, 0.92);
  const postSec = new THREE.Mesh(new THREE.SphereGeometry(0.44, segs, segs), postMat);
  postSec.position.set(-0.55, -0.35, -0.2);
  posteriorSacGroup.add(postMain, postSec);
  tagPart(posteriorSacGroup, 'posterior-air-sacs', [0.95, -0.65, 0.3]);
  rootGroup.add(posteriorSacGroup);

  // Exact 4-stage unidirectional path for the tagged air bolus:
  // Stage 1 (Hít vào 1): Trachea -> Bronchi -> Posterior air sacs
  // Stage 2 (Thở ra 1): Posterior air sacs -> Rigid Lungs (parabronchi gas exchange!)
  // Stage 3 (Hít vào 2): Rigid Lungs -> Anterior air sacs
  // Stage 4 (Thở ra 2): Anterior air sacs -> Trachea -> Outside
  const stageCurves = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.65, 1.35, 0),
      new THREE.Vector3(-1.85, 0.88, 0),
      new THREE.Vector3(-1.05, 0.35, 0),
      new THREE.Vector3(0.15, 0.02, 0.08),
      new THREE.Vector3(1.55, -0.25, 0),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.55, -0.25, 0),
      new THREE.Vector3(1.12, 0.5, 0),
      new THREE.Vector3(0.55, 0.65, 0.08),
      new THREE.Vector3(0.05, 0.65, 0.08),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.65, 0.08),
      new THREE.Vector3(-0.45, 0.65, 0.08),
      new THREE.Vector3(-0.92, 0.12, 0.05),
      new THREE.Vector3(-1.15, -0.48, 0),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.15, -0.48, 0),
      new THREE.Vector3(-1.18, 0.12, 0.08),
      new THREE.Vector3(-1.05, 0.35, 0),
      new THREE.Vector3(-1.85, 0.88, 0),
      new THREE.Vector3(-2.75, 1.42, 0),
    ]),
  ];

  // Bright highlighted tagged air bolus sphere
  const taggedBolus = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 18),
    new THREE.MeshStandardMaterial({
      color: '#FACC15',
      emissive: '#EAB308',
      emissiveIntensity: 0.75,
      roughness: 0.2,
    }),
  );
  rootGroup.add(taggedBolus);

  const bgAirParticles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.068, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#14B8A6', emissive: '#0D9488', emissiveIntensity: 0.45 }),
    28,
  );
  bgAirParticles.frustumCulled = false;
  rootGroup.add(bgAirParticles);

  return {
    handles: {
      anteriorSacGroup,
      posteriorSacGroup,
      rigidLungGroup,
      taggedBolus,
      bgAirParticles,
      stageCurves,
    },
    initialCameraDir: new THREE.Vector3(0.05, 0.12, 1.0),
  };
}

export function animateAvianRespiration(
  handles: AvianAnimHandles,
  stageIndex0to3: number, // 0=Hít 1, 1=Thở 1, 2=Hít 2, 3=Thở 2
  stageProgress0to1: number,
  simTime: number,
) {
  const sIdx = Math.max(0, Math.min(3, Math.floor(stageIndex0to3)));
  const t = Math.max(0, Math.min(1, stageProgress0to1));

  // Stages 0 & 2 are INHALATION (both air sac sets EXPAND); Stages 1 & 3 are EXHALATION (both air sac sets COMPRESS)
  const isInhale = sIdx === 0 || sIdx === 2;
  const sacExpansion = isInhale ? 0.86 + t * 0.3 : 1.16 - t * 0.3;
  handles.anteriorSacGroup.scale.setScalar(sacExpansion);
  handles.posteriorSacGroup.scale.setScalar(sacExpansion);

  // CRITICAL BIOLOGICAL INVARIANT: Avian lungs do NOT inflate/deflate!
  handles.rigidLungGroup.scale.set(1, 1, 1);

  // Move tagged air bolus cleanly along current stage curve
  handles.stageCurves[sIdx].getPointAt(t, _vecA);
  handles.taggedBolus.position.copy(_vecA);
  const bolusMat = handles.taggedBolus.material as THREE.MeshStandardMaterial;
  // Color shifts from bright fresh-O2 yellow/teal (stages 0-1) to O2-depleted warm orange (stages 2-3)
  bolusMat.color.set(sIdx < 2 ? '#FACC15' : '#FB923C');
  bolusMat.emissive.set(sIdx < 2 ? '#CA8A04' : '#EA580C');

  // Background continuous unidirectional air stream showing fresh air through lungs on BOTH inhale & exhale
  for (let i = 0; i < handles.bgAirParticles.count; i++) {
    const cIdx = i % 4;
    const pt = ((i / handles.bgAirParticles.count + simTime * 0.32) % 1 + 1) % 1;
    handles.stageCurves[cIdx].getPointAt(pt, _vecB);
    _dummy.position.copy(_vecB);
    _dummy.scale.setScalar(0.75);
    _dummy.updateMatrix();
    handles.bgAirParticles.setMatrixAt(i, _dummy.matrix);
  }
  handles.bgAirParticles.instanceMatrix.needsUpdate = true;
}

// ============================================================================
// SIM 08: RESPIRATORY HEALTH (4 PEDAGOGICAL SCENARIOS: CILIA, MUCUS, AIRWAY)
// ============================================================================
export type HealthScenarioId = 'healthy' | 'smoke' | 'pollution' | 'exercise';

export interface RespiratoryHealthAnimHandles {
  ciliaMesh: THREE.InstancedMesh;
  ciliaPositions: { x: number; y: number; z: number; angle: number }[];
  mucusMesh: THREE.Mesh;
  pollutantMesh: THREE.InstancedMesh;
  airflowMesh: THREE.InstancedMesh;
}

export function buildRespiratoryHealth(
  rootGroup: THREE.Group,
  quality: QualityLevel,
): { handles: RespiratoryHealthAnimHandles; initialCameraDir: THREE.Vector3 } {
  const segs = getSegments(quality, 24);

  // 1. Biểu mô đường dẫn khí (airway-epithelium) — half-pipe cutaway bronchus
  const epiGroup = new THREE.Group();
  const epiWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.42, 1.42, 4.8, segs, 1, true, Math.PI * 0.55, Math.PI * 1.15),
    new THREE.MeshStandardMaterial({ color: '#FB7185', roughness: 0.5, side: THREE.DoubleSide }),
  );
  epiWall.rotation.z = Math.PI / 2;
  epiGroup.add(epiWall);

  // Outer cartilage support wall
  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.56, 1.56, 4.8, segs, 1, true, Math.PI * 0.55, Math.PI * 1.15),
    new THREE.MeshStandardMaterial({ color: '#FDA4AF', roughness: 0.55, side: THREE.DoubleSide }),
  );
  outerWall.rotation.z = Math.PI / 2;
  epiGroup.add(outerWall);
  tagPart(epiGroup, 'airway-epithelium', [0, -0.7, 0]);
  rootGroup.add(epiGroup);

  // 2. Hệ thống lông chuyển (cilia-layer) — InstancedMesh beating in metachronal wave
  const ciliaGroup = new THREE.Group();
  const ciliaPositions: { x: number; y: number; z: number; angle: number }[] = [];
  const xRows = quality === 'low' ? 12 : 18;
  const arcCols = quality === 'low' ? 7 : 10;
  for (let ix = 0; ix < xRows; ix++) {
    const x = -2.1 + (ix / (xRows - 1)) * 4.2;
    for (let ia = 0; ia < arcCols; ia++) {
      const ang = Math.PI * 0.65 + (ia / (arcCols - 1)) * Math.PI * 0.95;
      const r = 1.36;
      ciliaPositions.push({
        x,
        y: Math.cos(ang) * r,
        z: Math.sin(ang) * r,
        angle: ang,
      });
    }
  }
  const ciliaGeo = new THREE.CylinderGeometry(0.018, 0.026, 0.34, 6);
  ciliaGeo.translate(0, 0.17, 0);
  const ciliaMesh = new THREE.InstancedMesh(
    ciliaGeo,
    new THREE.MeshStandardMaterial({ color: '#2DD4BF', roughness: 0.38 }),
    ciliaPositions.length,
  );
  ciliaMesh.frustumCulled = false;
  ciliaGroup.add(ciliaMesh);
  tagPart(ciliaGroup, 'cilia-layer', [0, -0.25, 0.5]);
  rootGroup.add(ciliaGroup);

  // 3. Lớp chất nhầy (mucus-layer) — dynamic thickness & tint based on scenario
  const mucusGroup = new THREE.Group();
  const mucusMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.12, 4.75, segs, 1, true, Math.PI * 0.6, Math.PI * 1.05),
    new THREE.MeshPhysicalMaterial({
      color: '#FDE047',
      roughness: 0.25,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  mucusMesh.rotation.z = Math.PI / 2;
  mucusGroup.add(mucusMesh);
  tagPart(mucusGroup, 'mucus-layer', [0, 0.2, 0.6]);
  rootGroup.add(mucusGroup);

  // 4. Lòng đường dẫn khí (airway-lumen) + clean airflow stream
  const lumenGroup = new THREE.Group();
  const lumenGuide = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.68, 4.7, 16, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: '#38BDF8',
      roughness: 0.12,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    }),
  );
  lumenGuide.rotation.z = Math.PI / 2;
  lumenGuide.position.set(0, 0.25, 0);
  const airflowMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.075, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#14B8A6', emissive: '#0D9488', emissiveIntensity: 0.45 }),
    30,
  );
  airflowMesh.frustumCulled = false;
  lumenGroup.add(lumenGuide, airflowMesh);
  tagPart(lumenGroup, 'airway-lumen', [0, 0.85, 0]);
  rootGroup.add(lumenGroup);

  // 5. Hạt bụi mịn / Tác nhân ô nhiễm (pollutant-particles)
  const pollGroup = new THREE.Group();
  const pollutantMesh = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.082, 0),
    new THREE.MeshStandardMaterial({ color: '#64748B', roughness: 0.78 }),
    42,
  );
  pollutantMesh.frustumCulled = false;
  pollGroup.add(pollutantMesh);
  tagPart(pollGroup, 'pollutant-particles', [0, 0.55, 0.75]);
  rootGroup.add(pollGroup);

  return {
    handles: { ciliaMesh, ciliaPositions, mucusMesh, pollutantMesh, airflowMesh },
    initialCameraDir: new THREE.Vector3(0.28, 0.34, 1.0),
  };
}

export function animateRespiratoryHealth(
  handles: RespiratoryHealthAnimHandles,
  simTime: number,
  scenario: HealthScenarioId,
) {
  // Scenario pedagogical parameters (non-graphic, scientifically accurate)
  const cfg = {
    healthy: {
      ciliaFreq: 4.5,
      ciliaAmp: 0.48,
      ciliaColor: '#2DD4BF',
      mucusOpacity: 0.26,
      mucusColor: '#FDE047',
      mucusScale: 1.0,
      pollutantCount: 7,
      pollutantSpeed: 0.55, // swept cleanly upward/outward
      pollutantColor: '#94A3B8',
      airflowSpeed: 0.55,
      airflowColor: '#14B8A6',
    },
    smoke: {
      ciliaFreq: 0.9, // inhibited cilia beating
      ciliaAmp: 0.14,
      ciliaColor: '#94A3B8',
      mucusOpacity: 0.62, // thickened mucus
      mucusColor: '#CA8A04',
      mucusScale: 0.86, // narrows lumen slightly
      pollutantCount: 38,
      pollutantSpeed: 0.08, // sluggish clearance
      pollutantColor: '#475569',
      airflowSpeed: 0.24,
      airflowColor: '#F59E0B',
    },
    pollution: {
      ciliaFreq: 2.3,
      ciliaAmp: 0.28,
      ciliaColor: '#5EEAD4',
      mucusOpacity: 0.5,
      mucusColor: '#EAB308',
      mucusScale: 0.91,
      pollutantCount: 42,
      pollutantSpeed: 0.18, // overloaded clearance
      pollutantColor: '#64748B',
      airflowSpeed: 0.32,
      airflowColor: '#38BDF8',
    },
    exercise: {
      ciliaFreq: 5.4,
      ciliaAmp: 0.54,
      ciliaColor: '#10B981',
      mucusOpacity: 0.22,
      mucusColor: '#FEF08A',
      mucusScale: 1.04, // wide open airway
      pollutantCount: 5,
      pollutantSpeed: 0.72,
      pollutantColor: '#94A3B8',
      airflowSpeed: 0.95, // brisk deep ventilation
      airflowColor: '#10B981',
    },
  }[scenario];

  // 1. Cilia metachronal waving
  (handles.ciliaMesh.material as THREE.MeshStandardMaterial).color.set(cfg.ciliaColor);
  for (let i = 0; i < handles.ciliaPositions.length; i++) {
    const p = handles.ciliaPositions[i];
    const wave = Math.sin(simTime * cfg.ciliaFreq + p.x * 1.8) * cfg.ciliaAmp;
    _dummy.position.set(p.x, p.y, p.z);
    // Point inward toward lumen center and sway along x-axis (mucociliary escalator)
    _dummy.rotation.set(p.angle - Math.PI, 0, wave);
    _dummy.scale.set(1, scenario === 'smoke' ? 0.72 : 1.0, 1);
    _dummy.updateMatrix();
    handles.ciliaMesh.setMatrixAt(i, _dummy.matrix);
  }
  handles.ciliaMesh.instanceMatrix.needsUpdate = true;

  // 2. Mucus blanket thickness & clarity
  const mMat = handles.mucusMesh.material as THREE.MeshPhysicalMaterial;
  mMat.opacity = cfg.mucusOpacity;
  mMat.color.set(cfg.mucusColor);
  handles.mucusMesh.scale.set(cfg.mucusScale, 1, cfg.mucusScale);

  // 3. Airflow particles through central lumen
  const afMat = handles.airflowMesh.material as THREE.MeshStandardMaterial;
  afMat.color.set(cfg.airflowColor);
  afMat.emissive.set(cfg.airflowColor);
  for (let i = 0; i < handles.airflowMesh.count; i++) {
    const t = ((i / handles.airflowMesh.count + simTime * cfg.airflowSpeed) % 1 + 1) % 1;
    const x = -2.25 + t * 4.5;
    const y = 0.25 + Math.sin(i * 1.9) * 0.35;
    const z = Math.cos(i * 2.3) * 0.35;
    _dummy.position.set(x, y, z);
    _dummy.scale.setScalar(0.85 + 0.25 * Math.sin(t * Math.PI));
    _dummy.updateMatrix();
    handles.airflowMesh.setMatrixAt(i, _dummy.matrix);
  }
  handles.airflowMesh.instanceMatrix.needsUpdate = true;

  // 4. Pollutant particles caught on mucus & swept toward pharynx (-x direction)
  (handles.pollutantMesh.material as THREE.MeshStandardMaterial).color.set(cfg.pollutantColor);
  for (let i = 0; i < handles.pollutantMesh.count; i++) {
    if (i >= cfg.pollutantCount) {
      _dummy.scale.setScalar(0.001);
      _dummy.position.set(0, 0, 0);
      _dummy.updateMatrix();
      handles.pollutantMesh.setMatrixAt(i, _dummy.matrix);
      continue;
    }
    const t = ((i / cfg.pollutantCount + simTime * cfg.pollutantSpeed) % 1 + 1) % 1;
    const x = 2.2 - t * 4.4; // swept out toward pharynx
    const ang = Math.PI * 0.72 + ((i * 0.43) % (Math.PI * 0.76));
    const r = i % 3 === 0 ? 0.55 : 1.02; // some suspended in lumen, most trapped on mucus
    _dummy.position.set(x, Math.cos(ang) * r, Math.sin(ang) * r);
    _dummy.rotation.set(simTime + i, simTime * 0.7, 0);
    _dummy.scale.setScalar(0.85);
    _dummy.updateMatrix();
    handles.pollutantMesh.setMatrixAt(i, _dummy.matrix);
  }
  handles.pollutantMesh.instanceMatrix.needsUpdate = true;
}
