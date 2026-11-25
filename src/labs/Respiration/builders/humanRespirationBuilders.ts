import * as THREE from 'three';
import { QualityLevel } from '../../../types/biology';

// Module-scoped scratch objects to prevent per-frame GC churn
const _dummy = new THREE.Object3D();
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorDarkRed = new THREE.Color('#7F1D1D');
const _colorBlueConvention = new THREE.Color('#2563EB');
const _colorBrightRed = new THREE.Color('#EF4444');
const _colorActiveMuscle = new THREE.Color('#EA580C');
const _colorRelaxedMuscle = new THREE.Color('#C2410C');

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
// PURE DETERMINISTIC KINEMATICS FOR SIM 02 (BREATHING MECHANICS & RECHARTS)
// ============================================================================
export interface BreathingKinematicsPoint {
  timeSec: number;
  phaseDeg: number;
  lungVolumeRel: number; // 0..100% relative tidal volume (0 = FRC baseline, 100 = peak inhale)
  alveolarPressureRel: number; // -2.0 .. +2.0 relative units (0 = atmospheric pressure)
  airflowRate: number; // +100 inhale .. -100 exhale (0 at end-inhale & end-exhale)
  diaphragmDrop: number; // 0 (relaxed high dome) .. 1 (contracted flattened low)
  ribLift: number; // 0 (lowered) .. 1 (elevated & expanded)
  phaseLabel: string;
  isInhaling: boolean;
  isExhaling: boolean;
  isZeroFlow: boolean;
}

/**
 * Deterministic sinusoidal respiratory kinematics for 1 full cycle [0, 2*PI).
 * - Phase 0 -> PI: Inspiration (active diaphragm & external intercostals contraction)
 *   - Volume rises 0 -> 100% via (1 - cos(theta)) / 2
 *   - Flow = +sin(theta) > 0 (air enters lungs)
 *   - Alveolar pressure ΔP = -sin(theta) * scale < 0 (below atmospheric)
 * - Phase PI -> 2*PI: Normal passive expiration (muscles relax, lung elastic recoil)
 *   - Volume falls 100 -> 0%
 *   - Flow = sin(theta) < 0 (air exits lungs)
 *   - Alveolar pressure ΔP = -sin(theta) * scale > 0 (above atmospheric)
 * - At theta = 0, PI, 2*PI: Flow = 0 and ΔP = 0 (equilibrium with atmosphere).
 */
export function computeBreathingKinematics(
  phaseRad: number,
  bpm: number = 16,
): BreathingKinematicsPoint {
  const safeBpm = Math.max(8, Math.min(40, bpm));
  const cycleSec = 60 / safeBpm;
  const norm = ((phaseRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const sinVal = Math.sin(norm);
  const cosVal = Math.cos(norm);

  // Volume smoothly rises 0 -> 1 on [0, PI] and returns 1 -> 0 on [PI, 2PI]
  const volFrac = (1 - cosVal) * 0.5;
  const lungVolumeRel = Math.round(volFrac * 1000) / 10;

  // Airflow proportional to dV/dt = +sin(norm); higher bpm amplifies peak flow slightly
  const rateScale = Math.min(1.6, Math.max(0.75, safeBpm / 16));
  const airflowRate = Math.round(sinVal * 100 * rateScale * 10) / 10;

  // Alveolar pressure ΔP = P_alv - P_atm is strictly opposite to airflow:
  // negative during inhale (sucks air in), positive during exhale (pushes air out), 0 at turning points
  const alveolarPressureRel = Math.round(-sinVal * 1.5 * rateScale * 100) / 100;

  const isZeroFlow = Math.abs(sinVal) < 0.08;
  const isInhaling = !isZeroFlow && sinVal > 0;
  const isExhaling = !isZeroFlow && sinVal < 0;

  let phaseLabel = 'Cuối thở ra (Cân bằng áp suất, ΔP = 0)';
  if (isInhaling) {
    phaseLabel = 'Hít vào (Chủ động: Cơ hoành & cơ liên sườn ngoài co)';
  } else if (isExhaling) {
    phaseLabel = 'Thở ra bình thường (Thụ động: Cơ dãn, phổi đàn hồi)';
  } else if (volFrac > 0.5) {
    phaseLabel = 'Đỉnh hít vào (Cân bằng áp suất, ΔP = 0)';
  }

  return {
    timeSec: Math.round((norm / (Math.PI * 2)) * cycleSec * 100) / 100,
    phaseDeg: Math.round((norm * 180) / Math.PI),
    lungVolumeRel,
    alveolarPressureRel,
    airflowRate,
    diaphragmDrop: volFrac,
    ribLift: volFrac,
    phaseLabel,
    isInhaling,
    isExhaling,
    isZeroFlow,
  };
}

export function buildBreathingCycleSeries(bpm: number, samples = 48): BreathingKinematicsPoint[] {
  const pts: BreathingKinematicsPoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const phase = (i / samples) * Math.PI * 2;
    pts.push(computeBreathingKinematics(phase, bpm));
  }
  return pts;
}

// ============================================================================
// SIM 01: HUMAN RESPIRATORY ANATOMY (13 PARTS + ANIMATED AIRFLOW)
// ============================================================================
export interface HumanAnatomyAnimHandles {
  airParticles: THREE.InstancedMesh;
  airPaths: THREE.CatmullRomCurve3[];
  particleMeta: { pathIdx: number; offset: number; speed: number }[];
  lungGroupRight: THREE.Group;
  lungGroupLeft: THREE.Group;
  diaphragmGroup: THREE.Group;
}

function createSculptedLungLobe(
  radiusX: number,
  radiusY: number,
  radiusZ: number,
  color: string,
  segs: number,
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1, segs, segs);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    // Subtle organic tapering toward apex and flattening toward medial face
    const taper = 1 - Math.max(0, y) * 0.22;
    x *= radiusX * taper;
    y *= radiusY;
    z *= radiusZ * (0.94 + 0.06 * Math.cos(y * 2));
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.52,
    metalness: 0.04,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildHumanRespiratoryAnatomy(
  rootGroup: THREE.Group,
  quality: QualityLevel,
): {
  handles: HumanAnatomyAnimHandles;
  initialCameraDir: THREE.Vector3;
} {
  const segs = getSegments(quality, 24);

  // 1. Khoang mũi (nasal-cavity)
  const nasalGroup = new THREE.Group();
  const nasalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.65, 0.92),
    new THREE.Vector3(0, 3.75, 0.45),
    new THREE.Vector3(0, 3.62, 0.08),
  ]);
  const nasalTube = new THREE.Mesh(
    new THREE.TubeGeometry(nasalCurve, segs, 0.24, 14, false),
    new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.42, metalness: 0.05 }),
  );
  // Subtle nose bridge silhouette
  const nasalChamber = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, segs, segs),
    new THREE.MeshStandardMaterial({ color: '#7DD3FC', roughness: 0.48, transparent: true, opacity: 0.78 }),
  );
  nasalChamber.scale.set(0.85, 0.8, 1.35);
  nasalChamber.position.set(0, 3.72, 0.55);
  nasalGroup.add(nasalTube, nasalChamber);
  tagPart(nasalGroup, 'nasal-cavity', [0, 0.75, 0.6]);
  rootGroup.add(nasalGroup);

  // 2. Hầu (pharynx)
  const pharynxGroup = new THREE.Group();
  const pharynxCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.62, 0.08),
    new THREE.Vector3(0, 3.22, -0.02),
    new THREE.Vector3(0, 2.75, 0.02),
  ]);
  const pharynxMesh = new THREE.Mesh(
    new THREE.TubeGeometry(pharynxCurve, segs, 0.22, 14, false),
    new THREE.MeshStandardMaterial({ color: '#60A5FA', roughness: 0.48 }),
  );
  pharynxGroup.add(pharynxMesh);
  tagPart(pharynxGroup, 'pharynx', [0, 0.65, -0.35]);
  rootGroup.add(pharynxGroup);

  // 3. Thanh quản (larynx)
  const larynxGroup = new THREE.Group();
  const larynxBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.21, 0.46, segs),
    new THREE.MeshStandardMaterial({ color: '#818CF8', roughness: 0.4 }),
  );
  larynxBody.position.set(0, 2.48, 0.04);
  const thyroidShield = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, segs, segs),
    new THREE.MeshStandardMaterial({ color: '#6366F1', roughness: 0.36 }),
  );
  thyroidShield.scale.set(1.05, 0.85, 0.75);
  thyroidShield.position.set(0, 2.52, 0.14);
  larynxGroup.add(larynxBody, thyroidShield);
  tagPart(larynxGroup, 'larynx', [0, 0.45, 0.4]);
  rootGroup.add(larynxGroup);

  // 4. Khí quản (trachea) with C-shaped cartilage rings
  const tracheaGroup = new THREE.Group();
  const tracheaTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 1.55, segs),
    new THREE.MeshStandardMaterial({ color: '#93C5FD', roughness: 0.45 }),
  );
  tracheaTube.position.set(0, 1.5, 0.04);
  tracheaGroup.add(tracheaTube);

  const ringMat = new THREE.MeshStandardMaterial({ color: '#E0F2FE', roughness: 0.32, metalness: 0.08 });
  const ringGeo = new THREE.TorusGeometry(0.21, 0.032, 10, 20, Math.PI * 1.55);
  for (let i = 0; i < 11; i++) {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 2.15 - i * 0.13, 0.04);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = -Math.PI * 0.275;
    tracheaGroup.add(ring);
  }
  tagPart(tracheaGroup, 'trachea', [0, 0.25, 0.35]);
  rootGroup.add(tracheaGroup);

  // 5. Phế quản (bronchi) — right (anatomical right = viewer left, x < 0) & left (x > 0)
  const bronchiGroup = new THREE.Group();
  const bronchiMat = new THREE.MeshStandardMaterial({ color: '#3B82F6', roughness: 0.42 });
  const rightMainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.74, 0.04),
    new THREE.Vector3(-0.48, 0.48, 0.02),
    new THREE.Vector3(-0.98, 0.22, 0.0),
  ]);
  const leftMainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.74, 0.04),
    new THREE.Vector3(0.55, 0.45, 0.02),
    new THREE.Vector3(1.06, 0.18, 0.0),
  ]);
  bronchiGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(rightMainCurve, 18, 0.135, 12, false), bronchiMat),
    new THREE.Mesh(new THREE.TubeGeometry(leftMainCurve, 18, 0.125, 12, false), bronchiMat),
  );
  // Lobar bronchi branches (3 on right, 2 on left)
  const lobarBranches: [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(-0.68, 0.38, 0.01), new THREE.Vector3(-1.12, 0.72, 0.04)],
    [new THREE.Vector3(-0.88, 0.27, 0.0), new THREE.Vector3(-1.26, 0.12, 0.12)],
    [new THREE.Vector3(-0.95, 0.22, 0.0), new THREE.Vector3(-1.18, -0.46, -0.05)],
    [new THREE.Vector3(0.75, 0.35, 0.01), new THREE.Vector3(1.16, 0.68, 0.04)],
    [new THREE.Vector3(1.02, 0.2, 0.0), new THREE.Vector3(1.24, -0.44, -0.04)],
  ];
  for (const [a, b] of lobarBranches) {
    const c = new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.04, 0)), b]);
    bronchiGroup.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.08, 10, false), bronchiMat));
  }
  tagPart(bronchiGroup, 'bronchi', [0, 0.1, 0.45]);
  rootGroup.add(bronchiGroup);

  // 6. Tiểu phế quản (bronchioles) — fine teal tree inside lungs
  const bronchiolesGroup = new THREE.Group();
  const bronchioleMat = new THREE.MeshStandardMaterial({ color: '#2DD4BF', roughness: 0.4 });
  const bronchioleTips: [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(-1.12, 0.72, 0.04), new THREE.Vector3(-1.42, 0.95, 0.14)],
    [new THREE.Vector3(-1.12, 0.72, 0.04), new THREE.Vector3(-1.34, 0.62, -0.14)],
    [new THREE.Vector3(-1.26, 0.12, 0.12), new THREE.Vector3(-1.58, 0.02, 0.22)],
    [new THREE.Vector3(-1.18, -0.46, -0.05), new THREE.Vector3(-1.46, -0.78, 0.14)],
    [new THREE.Vector3(-1.18, -0.46, -0.05), new THREE.Vector3(-0.96, -0.82, 0.16)],
    [new THREE.Vector3(1.16, 0.68, 0.04), new THREE.Vector3(1.44, 0.92, 0.15)],
    [new THREE.Vector3(1.16, 0.68, 0.04), new THREE.Vector3(1.48, 0.36, 0.16)],
    [new THREE.Vector3(1.24, -0.44, -0.04), new THREE.Vector3(1.52, -0.74, 0.16)],
    [new THREE.Vector3(1.24, -0.44, -0.04), new THREE.Vector3(1.06, -0.84, 0.18)],
  ];
  for (const [s, e] of bronchioleTips) {
    const mid = s.clone().lerp(e, 0.5).add(new THREE.Vector3(0, 0.05, 0.06));
    const curve = new THREE.CatmullRomCurve3([s, mid, e]);
    bronchiolesGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.04, 8, false), bronchioleMat));
  }
  tagPart(bronchiolesGroup, 'bronchioles', [0, 0, 0.55]);
  rootGroup.add(bronchiolesGroup);

  // 7. Phổi phải (right-lung) — STRICTLY 3 DISTINCT LOBES (anatomical right = viewer left, x < 0)
  const rightLungGroup = new THREE.Group();
  const rSup = createSculptedLungLobe(0.68, 0.68, 0.64, '#FB7185', segs);
  rSup.position.set(-1.15, 0.72, -0.04);
  const rMid = createSculptedLungLobe(0.74, 0.45, 0.68, '#F472B6', segs);
  rMid.position.set(-1.26, 0.02, 0.06);
  const rInf = createSculptedLungLobe(0.78, 0.62, 0.7, '#E11D48', segs);
  rInf.position.set(-1.18, -0.68, -0.06);

  // Subtle translucent lobe materials so inner bronchioles/alveoli stay partially visible
  [rSup, rMid, rInf].forEach((m) => {
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.transparent = true;
    mat.opacity = 0.72;
  });
  rightLungGroup.add(rSup, rMid, rInf);
  tagPart(rightLungGroup, 'right-lung', [-0.95, 0.05, 0]);
  rootGroup.add(rightLungGroup);

  // 8. Phổi trái (left-lung) — STRICTLY 2 DISTINCT LOBES + cardiac notch (anatomical left = viewer right, x > 0)
  const leftLungGroup = new THREE.Group();
  const lSup = createSculptedLungLobe(0.66, 0.82, 0.64, '#F43F5E', segs);
  lSup.position.set(1.22, 0.56, -0.02);
  const lInf = createSculptedLungLobe(0.72, 0.72, 0.68, '#BE123C', segs);
  lInf.position.set(1.26, -0.58, -0.05);
  [lSup, lInf].forEach((m) => {
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.transparent = true;
    mat.opacity = 0.72;
  });
  leftLungGroup.add(lSup, lInf);
  tagPart(leftLungGroup, 'left-lung', [0.95, 0.05, 0]);
  rootGroup.add(leftLungGroup);

  // 9. Phế nang (alveoli) — magnified pedagogical grape-clusters visible at bronchiole tips
  const alveoliGroup = new THREE.Group();
  const alvMat = new THREE.MeshStandardMaterial({
    color: '#FDBA74',
    roughness: 0.42,
    emissive: '#9A3412',
    emissiveIntensity: 0.12,
  });
  const alvGeo = new THREE.SphereGeometry(0.085, 12, 12);
  const clusterCenters = [
    new THREE.Vector3(-1.46, -0.78, 0.2),
    new THREE.Vector3(-1.58, 0.02, 0.25),
    new THREE.Vector3(1.52, -0.74, 0.22),
    new THREE.Vector3(1.48, 0.36, 0.22),
  ];
  const clusterOffsets: [number, number, number][] = [
    [0, 0, 0],
    [0.08, 0.05, 0.04],
    [-0.08, 0.06, 0.03],
    [0.05, -0.07, 0.05],
    [-0.06, -0.06, -0.04],
    [0.0, 0.09, -0.04],
  ];
  for (const center of clusterCenters) {
    for (const [ox, oy, oz] of clusterOffsets) {
      const sac = new THREE.Mesh(alvGeo, alvMat);
      sac.position.set(center.x + ox, center.y + oy, center.z + oz);
      alveoliGroup.add(sac);
    }
  }
  tagPart(alveoliGroup, 'alveoli', [0.4, -0.4, 0.75]);
  rootGroup.add(alveoliGroup);

  // 10. Màng phổi (pleura) — translucent violet double-membrane shell hugging lungs
  const pleuraGroup = new THREE.Group();
  const pleuraMat = new THREE.MeshPhysicalMaterial({
    color: '#A78BFA',
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pleuraR = new THREE.Mesh(new THREE.SphereGeometry(1, segs, segs), pleuraMat);
  pleuraR.scale.set(0.95, 1.56, 0.88);
  pleuraR.position.set(-1.18, 0.04, -0.02);
  const pleuraL = new THREE.Mesh(new THREE.SphereGeometry(1, segs, segs), pleuraMat);
  pleuraL.scale.set(0.9, 1.52, 0.86);
  pleuraL.position.set(1.22, 0.02, -0.02);
  pleuraGroup.add(pleuraR, pleuraL);
  tagPart(pleuraGroup, 'pleura', [0, 0.35, -0.8]);
  rootGroup.add(pleuraGroup);

  // 11. Cơ hoành (diaphragm) — sculpted dome sheet beneath lungs
  const diaphragmGroup = new THREE.Group();
  const diaphGeo = new THREE.SphereGeometry(2.15, segs, 18, 0, Math.PI * 2, 0, Math.PI * 0.42);
  const diaphMat = new THREE.MeshStandardMaterial({
    color: '#D97706',
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const diaphMesh = new THREE.Mesh(diaphGeo, diaphMat);
  diaphMesh.scale.set(1.06, 0.38, 0.62);
  diaphMesh.position.set(0, -1.78, -0.02);
  diaphragmGroup.add(diaphMesh);
  tagPart(diaphragmGroup, 'diaphragm', [0, -0.95, 0]);
  rootGroup.add(diaphragmGroup);

  // 12. Lồng ngực (ribcage) — sternum + 7 representative anatomical rib pairs
  const ribcageGroup = new THREE.Group();
  const boneMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.42,
    metalness: 0.06,
    transparent: true,
    opacity: 0.68,
  });
  const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.35, 0.14), boneMat);
  sternum.position.set(0, 0.18, 1.12);
  ribcageGroup.add(sternum);

  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 3.1, 14), boneMat);
  spine.position.set(0, 0.15, -1.16);
  ribcageGroup.add(spine);

  for (let i = 0; i < 7; i++) {
    const y = 1.15 - i * 0.38;
    const widthX = 1.68 + Math.sin((i / 6) * Math.PI) * 0.62;
    const depthZ = 0.96 + Math.sin((i / 6) * Math.PI) * 0.26;
    for (const side of [-1, 1]) {
      const ribCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.16, y + 0.1, -1.12),
        new THREE.Vector3(side * widthX * 0.85, y + 0.04, -depthZ * 0.45),
        new THREE.Vector3(side * widthX, y - 0.06, 0.1),
        new THREE.Vector3(side * widthX * 0.68, y - 0.12, depthZ * 0.88),
        new THREE.Vector3(side * (i < 5 ? 0.16 : 0.65), y - 0.08, i < 5 ? 1.1 : 0.94),
      ]);
      const ribMesh = new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 20, 0.055, 8, false), boneMat);
      ribcageGroup.add(ribMesh);
    }
  }
  tagPart(ribcageGroup, 'ribcage', [0, 0, 1.05]);
  rootGroup.add(ribcageGroup);

  // 13. Cơ liên sườn (intercostals) — striated muscle bands between ribs on right & left flanks
  const intercostalGroup = new THREE.Group();
  const muscleMat = new THREE.MeshStandardMaterial({
    color: '#F97316',
    roughness: 0.55,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 5; i++) {
    const y = 0.92 - i * 0.38;
    const widthX = 1.66 + Math.sin(((i + 0.5) / 6) * Math.PI) * 0.6;
    for (const side of [-1, 1]) {
      const bandCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * widthX * 0.94, y, -0.35),
        new THREE.Vector3(side * widthX * 0.99, y - 0.04, 0.18),
        new THREE.Vector3(side * widthX * 0.76, y - 0.09, 0.72),
      ]);
      const bandMesh = new THREE.Mesh(new THREE.TubeGeometry(bandCurve, 12, 0.072, 6, false), muscleMat);
      intercostalGroup.add(bandMesh);
    }
  }
  tagPart(intercostalGroup, 'intercostals', [1.1, -0.2, 0.75]);
  rootGroup.add(intercostalGroup);

  // Animated Airflow Particles along exact anatomical pathway:
  // Khoang mũi -> Hầu -> Thanh quản -> Khí quản -> Phế quản -> Tiểu phế quản -> Phế nang
  const airPaths = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.65, 0.95),
      new THREE.Vector3(0, 3.68, 0.35),
      new THREE.Vector3(0, 3.25, 0.0),
      new THREE.Vector3(0, 2.48, 0.04),
      new THREE.Vector3(0, 1.5, 0.04),
      new THREE.Vector3(0, 0.74, 0.04),
      new THREE.Vector3(-0.72, 0.36, 0.02),
      new THREE.Vector3(-1.18, -0.46, 0.02),
      new THREE.Vector3(-1.46, -0.78, 0.18),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.65, 0.95),
      new THREE.Vector3(0, 3.68, 0.35),
      new THREE.Vector3(0, 3.25, 0.0),
      new THREE.Vector3(0, 2.48, 0.04),
      new THREE.Vector3(0, 1.5, 0.04),
      new THREE.Vector3(0, 0.74, 0.04),
      new THREE.Vector3(-0.88, 0.27, 0.0),
      new THREE.Vector3(-1.26, 0.12, 0.12),
      new THREE.Vector3(-1.58, 0.02, 0.22),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.65, 0.95),
      new THREE.Vector3(0, 3.68, 0.35),
      new THREE.Vector3(0, 3.25, 0.0),
      new THREE.Vector3(0, 2.48, 0.04),
      new THREE.Vector3(0, 1.5, 0.04),
      new THREE.Vector3(0, 0.74, 0.04),
      new THREE.Vector3(0.78, 0.34, 0.02),
      new THREE.Vector3(1.24, -0.44, 0.0),
      new THREE.Vector3(1.52, -0.74, 0.2),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.65, 0.95),
      new THREE.Vector3(0, 3.68, 0.35),
      new THREE.Vector3(0, 3.25, 0.0),
      new THREE.Vector3(0, 2.48, 0.04),
      new THREE.Vector3(0, 1.5, 0.04),
      new THREE.Vector3(0, 0.74, 0.04),
      new THREE.Vector3(0.75, 0.35, 0.01),
      new THREE.Vector3(1.16, 0.68, 0.04),
      new THREE.Vector3(1.48, 0.36, 0.2),
    ]),
  ];

  const particleCount = quality === 'low' ? 28 : 48;
  const pGeo = new THREE.SphereGeometry(0.068, 10, 10);
  const pMat = new THREE.MeshStandardMaterial({
    color: '#14B8A6',
    emissive: '#0D9488',
    emissiveIntensity: 0.45,
    roughness: 0.25,
  });
  const airParticles = new THREE.InstancedMesh(pGeo, pMat, particleCount);
  airParticles.frustumCulled = false;
  const particleMeta = Array.from({ length: particleCount }, (_, i) => ({
    pathIdx: i % airPaths.length,
    offset: (i / particleCount) % 1,
    speed: 0.22 + (i % 4) * 0.025,
  }));
  rootGroup.add(airParticles);

  return {
    handles: {
      airParticles,
      airPaths,
      particleMeta,
      lungGroupRight: rightLungGroup,
      lungGroupLeft: leftLungGroup,
      diaphragmGroup,
    },
    initialCameraDir: new THREE.Vector3(0.18, 0.08, 1.0),
  };
}

export function animateHumanAnatomy(
  handles: HumanAnatomyAnimHandles,
  simTime: number,
  directionMode: 'inhale' | 'exhale' | 'auto',
) {
  let dir = 1;
  if (directionMode === 'exhale') {
    dir = -1;
  } else if (directionMode === 'auto') {
    dir = Math.sin(simTime * 1.1) >= 0 ? 1 : -1;
  }

  // Update particle color: teal for inhale (O₂-rich air in), amber-orange for exhale (CO₂-rich air out)
  const mat = handles.airParticles.material as THREE.MeshStandardMaterial;
  mat.color.set(dir > 0 ? '#14B8A6' : '#F97316');
  mat.emissive.set(dir > 0 ? '#0F766E' : '#C2410C');

  for (let i = 0; i < handles.particleMeta.length; i++) {
    const meta = handles.particleMeta[i];
    const rawT = meta.offset + simTime * meta.speed * dir;
    const t = ((rawT % 1) + 1) % 1;
    handles.airPaths[meta.pathIdx].getPointAt(t, _vecA);
    const pulse = 0.85 + 0.25 * Math.sin(simTime * 4 + i);
    _dummy.position.copy(_vecA);
    _dummy.scale.setScalar(pulse);
    _dummy.updateMatrix();
    handles.airParticles.setMatrixAt(i, _dummy.matrix);
  }
  handles.airParticles.instanceMatrix.needsUpdate = true;

  // Subtle physiological breathing idle motion
  const breath = directionMode === 'auto' ? (1 - Math.cos(simTime * 1.1)) * 0.5 : dir > 0 ? 0.65 : 0.15;
  const lungScaleX = 1 + breath * 0.055;
  const lungScaleY = 1 + breath * 0.045;
  handles.lungGroupRight.scale.set(lungScaleX, lungScaleY, lungScaleX);
  handles.lungGroupLeft.scale.set(lungScaleX, lungScaleY, lungScaleX);
  handles.diaphragmGroup.position.y = -breath * 0.2;
}

// ============================================================================
// SIM 02: SYNCHRONIZED BREATHING MECHANICS (DIAPHRAGM, RIBS, INTERCOSTALS, LUNGS)
// ============================================================================
export interface BreathingMechHandles {
  diaphragmMesh: THREE.Mesh;
  diaphragmGroup: THREE.Group;
  ribPairs: { group: THREE.Group; baseY: number; side: number }[];
  intercostalBands: THREE.Mesh[];
  intercostalMat: THREE.MeshStandardMaterial;
  rightLung: THREE.Group;
  leftLung: THREE.Group;
  airParticles: THREE.InstancedMesh;
  airCurves: THREE.CatmullRomCurve3[];
}

export function buildBreathingMechanics(
  rootGroup: THREE.Group,
  quality: QualityLevel,
): { handles: BreathingMechHandles; initialCameraDir: THREE.Vector3 } {
  const segs = getSegments(quality, 24);

  // Trachea & main bronchi
  const tracheaGroup = new THREE.Group();
  const trMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 1.75, segs),
    new THREE.MeshStandardMaterial({ color: '#93C5FD', roughness: 0.42 }),
  );
  trMesh.position.set(0, 1.95, 0);
  tracheaGroup.add(trMesh);
  const ringMat = new THREE.MeshStandardMaterial({ color: '#E0F2FE', roughness: 0.32 });
  for (let i = 0; i < 9; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.032, 8, 18), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 2.65 - i * 0.17, 0);
    tracheaGroup.add(ring);
  }
  const brMat = new THREE.MeshStandardMaterial({ color: '#3B82F6', roughness: 0.42 });
  const rBr = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(-0.9, 0.6, 0)]);
  const lBr = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0.9, 0.6, 0)]);
  tracheaGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(rBr, 12, 0.14, 10, false), brMat),
    new THREE.Mesh(new THREE.TubeGeometry(lBr, 12, 0.13, 10, false), brMat),
  );
  tagPart(tracheaGroup, 'trachea', [0, 0.7, 0]);
  rootGroup.add(tracheaGroup);

  // Right lung (3 lobes) & Left lung (2 lobes)
  const rightLung = new THREE.Group();
  const r1 = createSculptedLungLobe(0.68, 0.66, 0.62, '#FB7185', segs);
  r1.position.set(-1.12, 0.92, 0);
  const r2 = createSculptedLungLobe(0.74, 0.45, 0.66, '#F472B6', segs);
  r2.position.set(-1.22, 0.24, 0.05);
  const r3 = createSculptedLungLobe(0.76, 0.58, 0.68, '#E11D48', segs);
  r3.position.set(-1.14, -0.42, -0.04);
  rightLung.add(r1, r2, r3);
  tagPart(rightLung, 'right-lung', [-0.85, 0.1, 0]);
  rootGroup.add(rightLung);

  const leftLung = new THREE.Group();
  const l1 = createSculptedLungLobe(0.66, 0.8, 0.62, '#F43F5E', segs);
  l1.position.set(1.18, 0.76, 0);
  const l2 = createSculptedLungLobe(0.72, 0.68, 0.66, '#BE123C', segs);
  l2.position.set(1.22, -0.34, -0.04);
  leftLung.add(l1, l2);
  tagPart(leftLung, 'left-lung', [0.85, 0.1, 0]);
  rootGroup.add(leftLung);

  // Diaphragm dome (contracts & flattens downward during inhalation, domes up during passive exhalation)
  const diaphragmGroup = new THREE.Group();
  const diaphGeo = new THREE.SphereGeometry(2.2, segs, 20, 0, Math.PI * 2, 0, Math.PI * 0.44);
  const diaphMat = new THREE.MeshStandardMaterial({
    color: '#D97706',
    roughness: 0.46,
    side: THREE.DoubleSide,
  });
  const diaphragmMesh = new THREE.Mesh(diaphGeo, diaphMat);
  diaphragmMesh.scale.set(1.05, 0.46, 0.62);
  diaphragmMesh.position.set(0, -1.55, 0);
  diaphragmGroup.add(diaphragmMesh);
  tagPart(diaphragmGroup, 'diaphragm', [0, -0.95, 0]);
  rootGroup.add(diaphragmGroup);

  // Ribcage (pivoting rib pairs + spine + sternum)
  const ribcageGroup = new THREE.Group();
  const boneMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.4,
    transparent: true,
    opacity: 0.76,
  });
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 3.2, 12), boneMat);
  spine.position.set(0, 0.35, -1.16);
  ribcageGroup.add(spine);

  const ribPairs: { group: THREE.Group; baseY: number; side: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const baseY = 1.35 - i * 0.42;
    const widthX = 1.72 + Math.sin((i / 5) * Math.PI) * 0.56;
    const depthZ = 0.98 + Math.sin((i / 5) * Math.PI) * 0.24;
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0, baseY, -1.1);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.14, 0, 0),
        new THREE.Vector3(side * widthX * 0.88, -0.06, depthZ * 0.55),
        new THREE.Vector3(side * widthX, -0.18, depthZ * 1.15),
        new THREE.Vector3(side * widthX * 0.65, -0.28, depthZ * 1.92),
        new THREE.Vector3(side * 0.16, -0.26, depthZ * 2.18),
      ]);
      const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.06, 8, false), boneMat);
      pivot.add(rib);
      ribcageGroup.add(pivot);
      ribPairs.push({ group: pivot, baseY, side });
    }
  }
  tagPart(ribcageGroup, 'ribcage', [0, 0, 0.95]);
  rootGroup.add(ribcageGroup);

  // External intercostal muscles (visibly glow warm orange when actively contracting during inhale)
  const intercostalGroup = new THREE.Group();
  const intercostalMat = new THREE.MeshStandardMaterial({
    color: '#EA580C',
    emissive: '#9A3412',
    emissiveIntensity: 0.15,
    roughness: 0.5,
    transparent: true,
    opacity: 0.78,
  });
  const intercostalBands: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const baseY = 1.12 - i * 0.42;
    const widthX = 1.7 + Math.sin(((i + 0.5) / 5) * Math.PI) * 0.54;
    for (const side of [-1, 1]) {
      const bandCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * widthX * 0.92, baseY, -0.35),
        new THREE.Vector3(side * widthX * 0.98, baseY - 0.08, 0.25),
        new THREE.Vector3(side * widthX * 0.72, baseY - 0.15, 0.8),
      ]);
      const band = new THREE.Mesh(new THREE.TubeGeometry(bandCurve, 12, 0.075, 6, false), intercostalMat);
      band.userData.baseY = baseY;
      intercostalGroup.add(band);
      intercostalBands.push(band);
    }
  }
  tagPart(intercostalGroup, 'intercostals', [1.15, 0, 0.7]);
  rootGroup.add(intercostalGroup);

  // Directional Airflow particles
  const airCurves = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.25, 0),
      new THREE.Vector3(0, 2.0, 0),
      new THREE.Vector3(0, 1.1, 0),
      new THREE.Vector3(-0.75, 0.65, 0),
      new THREE.Vector3(-1.18, -0.15, 0.1),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.25, 0),
      new THREE.Vector3(0, 2.0, 0),
      new THREE.Vector3(0, 1.1, 0),
      new THREE.Vector3(0.75, 0.65, 0),
      new THREE.Vector3(1.2, -0.15, 0.1),
    ]),
  ];
  const pCount = quality === 'low' ? 24 : 40;
  const airParticles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.075, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#14B8A6', emissive: '#0D9488', emissiveIntensity: 0.45 }),
    pCount,
  );
  airParticles.frustumCulled = false;
  rootGroup.add(airParticles);

  return {
    handles: {
      diaphragmMesh,
      diaphragmGroup,
      ribPairs,
      intercostalBands,
      intercostalMat,
      rightLung,
      leftLung,
      airParticles,
      airCurves,
    },
    initialCameraDir: new THREE.Vector3(0.32, 0.12, 1.0),
  };
}

export function animateBreathingMechanics(
  handles: BreathingMechHandles,
  phaseRad: number,
  bpm: number,
) {
  const k = computeBreathingKinematics(phaseRad, bpm);
  const v = k.diaphragmDrop; // 0 (relaxed exhale) -> 1 (peak inhale)

  // 1. Diaphragm descends & flattens on inhalation (co và hạ xuống); domes up on passive exhalation
  handles.diaphragmMesh.position.y = -1.48 - v * 0.46;
  handles.diaphragmMesh.scale.set(1.05 + v * 0.08, 0.54 - v * 0.34, 0.62 + v * 0.08);
  const diaphMat = handles.diaphragmMesh.material as THREE.MeshStandardMaterial;
  diaphMat.emissive.set(k.isInhaling ? '#B45309' : '#451A03');
  diaphMat.emissiveIntensity = k.isInhaling ? 0.42 : 0.08;

  // 2. Ribcage elevates upward & outward ("bucket-handle" & "pump-handle" lift)
  for (const rp of handles.ribPairs) {
    rp.group.rotation.x = -v * 0.22; // tilts front of ribs upward
    rp.group.rotation.z = rp.side * v * 0.09; // flares ribcage laterally
    rp.group.position.y = rp.baseY + v * 0.14;
  }

  // 3. External intercostals actively contract & highlight on inhalation, relax on passive exhalation
  handles.intercostalMat.color.copy(k.isInhaling ? _colorActiveMuscle : _colorRelaxedMuscle);
  handles.intercostalMat.emissiveIntensity = k.isInhaling ? 0.52 : 0.08;
  for (const band of handles.intercostalBands) {
    band.position.y = v * 0.24;
    band.scale.set(1 + v * 0.09, 1, 1 + v * 0.1);
  }

  // 4. Lungs expand non-uniformly (following thoracic cavity & downward diaphragm)
  const sx = 1 + v * 0.14;
  const sy = 1 + v * 0.17;
  const sz = 1 + v * 0.13;
  handles.rightLung.scale.set(sx, sy, sz);
  handles.leftLung.scale.set(sx, sy, sz);
  handles.rightLung.position.y = -v * 0.08;
  handles.leftLung.position.y = -v * 0.08;

  // 5. Airflow particles move strictly in proportion to airflowRate (halt at ΔP = 0!)
  const pMat = handles.airParticles.material as THREE.MeshStandardMaterial;
  if (k.isZeroFlow) {
    pMat.color.set('#94A3B8');
    pMat.emissive.set('#475569');
  } else if (k.isInhaling) {
    pMat.color.set('#14B8A6');
    pMat.emissive.set('#0F766E');
  } else {
    pMat.color.set('#F97316');
    pMat.emissive.set('#C2410C');
  }

  const count = handles.airParticles.count;
  // Integrate smooth flow travel along curve using phaseRad directly
  // Inhale (0..PI): advance forward; Exhale (PI..2PI): reverse backward
  const flowTravel = k.isInhaling ? (phaseRad / Math.PI) * 1.4 : -(phaseRad / Math.PI) * 1.4;
  const particleScale = k.isZeroFlow ? 0.55 : 0.7 + Math.min(0.5, Math.abs(k.airflowRate) / 180);

  for (let i = 0; i < count; i++) {
    const curve = handles.airCurves[i % handles.airCurves.length];
    const baseOffset = i / count;
    const t = (((baseOffset + flowTravel) % 1) + 1) % 1;
    curve.getPointAt(t, _vecA);
    _dummy.position.copy(_vecA);
    _dummy.scale.setScalar(particleScale);
    _dummy.updateMatrix();
    handles.airParticles.setMatrixAt(i, _dummy.matrix);
  }
  handles.airParticles.instanceMatrix.needsUpdate = true;
}

// ============================================================================
// SIM 03: ALVEOLAR GAS EXCHANGE (O2/CO2 DIFFUSION & RBC OXYGENATION)
// ============================================================================
export interface AlveolarExchangeParams {
  ventilationSpeed: number; // 0.3 .. 2.0 (default 1.0)
  bloodFlowSpeed: number; // 0.3 .. 2.0 (default 1.0)
  surfaceAreaRel: number; // 0.4 .. 1.5 (default 1.0)
  barrierThicknessRel: number; // 0.6 .. 2.5 (default 1.0)
  deltaPO2Rel: number; // 0.3 .. 1.6 (default 1.0)
  deltaPCO2Rel: number; // 0.3 .. 1.6 (default 1.0)
  useBlueVenousConvention: boolean; // default false (real dark-red O2-poor blood!)
}

export interface AlveolarMetrics {
  o2DiffusionIndex: number; // 0..100 relative pedagogical index
  co2DiffusionIndex: number; // 0..100 relative pedagogical index
  rbcOxygenationExit: number; // 35..99 relative pedagogical %
  statusLabel: string;
}

/**
 * Fick's law pedagogical model: Flux ~ (Area * ΔP * ventilationFactor) / Thickness
 */
export function computeAlveolarMetrics(params: AlveolarExchangeParams): AlveolarMetrics {
  const ventFactor = 0.45 + 0.55 * Math.min(1.5, params.ventilationSpeed);
  const rawO2 = (params.surfaceAreaRel * params.deltaPO2Rel * ventFactor) / params.barrierThicknessRel;
  const rawCO2 = (params.surfaceAreaRel * params.deltaPCO2Rel * ventFactor) / params.barrierThicknessRel;

  const o2DiffusionIndex = Math.max(5, Math.min(100, Math.round(rawO2 * 72)));
  const co2DiffusionIndex = Math.max(5, Math.min(100, Math.round(rawCO2 * 74)));

  // Fast blood flow reduces transit time slightly if barrier is thick
  const transitPenalty = params.bloodFlowSpeed > 1.3 && params.barrierThicknessRel > 1.3 ? 0.88 : 1.0;
  const oxyGain = Math.min(62, (o2DiffusionIndex / 100) * 65 * transitPenalty);
  const rbcOxygenationExit = Math.max(38, Math.min(99, Math.round(35 + oxyGain)));

  let statusLabel = 'Trao đổi khí hiệu quả cao';
  if (o2DiffusionIndex < 35) {
    statusLabel = 'Hiệu quả khuếch tán thấp (hàng rào dày hoặc diện tích/ΔP giảm)';
  } else if (o2DiffusionIndex < 62) {
    statusLabel = 'Hiệu quả khuếch tán trung bình';
  }

  return { o2DiffusionIndex, co2DiffusionIndex, rbcOxygenationExit, statusLabel };
}

export interface AlveolarAnimHandles {
  capillaryCurves: THREE.CatmullRomCurve3[];
  rbcMesh: THREE.InstancedMesh;
  o2Particles: THREE.InstancedMesh;
  co2Particles: THREE.InstancedMesh;
  wallMesh: THREE.Mesh;
  sacGroup: THREE.Group;
  o2Offsets: number[];
  co2Offsets: number[];
}

export function buildAlveolarExchange(
  rootGroup: THREE.Group,
  quality: QualityLevel,
): { handles: AlveolarAnimHandles; initialCameraDir: THREE.Vector3 } {
  const segs = getSegments(quality, 24);

  // 1. Tiểu phế quản hô hấp (resp-bronchiole)
  const brGroup = new THREE.Group();
  const brCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.7, 0),
    new THREE.Vector3(0, 1.8, 0.05),
    new THREE.Vector3(0, 1.05, 0),
  ]);
  brGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(brCurve, 18, 0.34, segs, false),
      new THREE.MeshStandardMaterial({ color: '#60A5FA', roughness: 0.44 }),
    ),
  );
  tagPart(brGroup, 'resp-bronchiole', [0, 0.9, 0]);
  rootGroup.add(brGroup);

  // 2. Túi phế nang (alveolar-sac) — surrounding grape-like cluster
  const sacGroup = new THREE.Group();
  const sacMat = new THREE.MeshStandardMaterial({
    color: '#FB7185',
    roughness: 0.46,
    transparent: true,
    opacity: 0.85,
  });
  const sacPositions: [number, number, number, number][] = [
    [-1.18, 0.35, -0.35, 0.62],
    [1.15, 0.42, -0.32, 0.6],
    [-0.95, -0.78, -0.45, 0.66],
    [0.98, -0.72, -0.42, 0.64],
    [0.0, 0.25, -0.95, 0.72],
    [0.0, -0.98, -0.58, 0.62],
  ];
  for (const [x, y, z, r] of sacPositions) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), sacMat);
    s.position.set(x, y, z);
    sacGroup.add(s);
  }
  tagPart(sacGroup, 'alveolar-sac', [0, 0.15, -0.85]);
  rootGroup.add(sacGroup);

  // 3. Phế nang trung tâm cắt mở (alveolus) so students clearly see inside
  const alvGroup = new THREE.Group();
  const alvShell = new THREE.Mesh(
    new THREE.SphereGeometry(1.12, segs, segs, Math.PI * 0.22, Math.PI * 1.56, 0, Math.PI),
    new THREE.MeshStandardMaterial({
      color: '#FDA4AF',
      roughness: 0.48,
      side: THREE.DoubleSide,
    }),
  );
  alvShell.position.set(0, -0.15, 0.22);
  alvShell.rotation.y = Math.PI * 0.5;
  alvGroup.add(alvShell);
  tagPart(alvGroup, 'alveolus', [0, 0, 0.5]);
  rootGroup.add(alvGroup);

  // 4. Thành phế nang / Hàng rào trao đổi khí (alveolar-wall) — scales dynamically with barrierThicknessRel!
  const wallGroup = new THREE.Group();
  const wallMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.085, 14, 36, Math.PI * 1.3),
    new THREE.MeshStandardMaterial({
      color: '#FDBA74',
      roughness: 0.4,
      transparent: true,
      opacity: 0.92,
    }),
  );
  wallMesh.position.set(0, -0.15, 0.26);
  wallMesh.rotation.z = -Math.PI * 0.85;
  wallGroup.add(wallMesh);
  tagPart(wallGroup, 'alveolar-wall', [0, -0.55, 0.7]);
  rootGroup.add(wallGroup);

  // 5. Mạng mao mạch phổi (capillary-network) wrapping tightly around the cutaway alveolus
  const capGroup = new THREE.Group();
  const capCurveFront = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.35, -0.65, 0.55),
    new THREE.Vector3(-1.32, -0.95, 0.82),
    new THREE.Vector3(-0.4, -1.32, 0.72),
    new THREE.Vector3(0.45, -1.28, 0.72),
    new THREE.Vector3(1.36, -0.82, 0.82),
    new THREE.Vector3(2.35, -0.35, 0.55),
  ]);
  const capCurveUpper = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.3, 0.1, 0.45),
    new THREE.Vector3(-1.35, 0.68, 0.72),
    new THREE.Vector3(-0.3, 0.95, 0.74),
    new THREE.Vector3(0.6, 0.86, 0.72),
    new THREE.Vector3(1.42, 0.42, 0.75),
    new THREE.Vector3(2.35, 0.08, 0.5),
  ]);
  const capMat = new THREE.MeshPhysicalMaterial({
    color: '#DC2626',
    roughness: 0.24,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  capGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(capCurveFront, 36, 0.24, 14, false), capMat),
    new THREE.Mesh(new THREE.TubeGeometry(capCurveUpper, 36, 0.2, 14, false), capMat),
  );
  tagPart(capGroup, 'capillary-network', [0, -0.85, 0.8]);
  rootGroup.add(capGroup);

  // 6. Hồng cầu (red-blood-cells) — biconcave disc InstancedMesh flowing inside capillaries
  const rbcGroup = new THREE.Group();
  const rbcGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.055, 16);
  // Indent top & bottom center slightly for biconcave profile
  const rPos = rbcGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const x = rPos.getX(i);
    const y = rPos.getY(i);
    const z = rPos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.08) {
      rPos.setY(i, y * 0.45);
    }
  }
  rbcGeo.computeVertexNormals();
  const rbcMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.35, metalness: 0.06 });
  const rbcCount = quality === 'low' ? 22 : 34;
  const rbcMesh = new THREE.InstancedMesh(rbcGeo, rbcMat, rbcCount);
  rbcMesh.frustumCulled = false;
  rbcGroup.add(rbcMesh);
  tagPart(rbcGroup, 'red-blood-cells', [0.8, -0.75, 0.9]);
  rootGroup.add(rbcGroup);

  // Diffusing O2 (teal) & CO2 (orange) particles across the alveolar-capillary barrier
  const gasCount = quality === 'low' ? 24 : 42;
  const o2Particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.068, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#14B8A6', emissive: '#0F766E', emissiveIntensity: 0.55 }),
    gasCount,
  );
  o2Particles.frustumCulled = false;
  const co2Particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.072, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#F97316', emissive: '#C2410C', emissiveIntensity: 0.5 }),
    gasCount,
  );
  co2Particles.frustumCulled = false;
  rootGroup.add(o2Particles, co2Particles);

  const o2Offsets = Array.from({ length: gasCount }, (_, i) => i / gasCount);
  const co2Offsets = Array.from({ length: gasCount }, (_, i) => (i + 0.5) / gasCount);

  return {
    handles: {
      capillaryCurves: [capCurveFront, capCurveUpper],
      rbcMesh,
      o2Particles,
      co2Particles,
      wallMesh,
      sacGroup,
      o2Offsets,
      co2Offsets,
    },
    initialCameraDir: new THREE.Vector3(0.08, 0.14, 1.0),
  };
}

export function animateAlveolarExchange(
  handles: AlveolarAnimHandles,
  simTime: number,
  params: AlveolarExchangeParams,
) {
  const metrics = computeAlveolarMetrics(params);

  // Visually reflect barrier thickness & surface area on 3D geometry
  const thicknessScale = 0.75 + params.barrierThicknessRel * 0.55;
  handles.wallMesh.scale.set(1, 1, thicknessScale);
  const areaScale = 0.78 + params.surfaceAreaRel * 0.24;
  handles.sacGroup.scale.setScalar(areaScale);

  // 1. RBC movement along capillaries & color transition (dark-red O2-poor -> bright-red O2-rich)
  const rbcCount = handles.rbcMesh.count;
  const startColor = params.useBlueVenousConvention ? _colorBlueConvention : _colorDarkRed;
  const oxyStrength = Math.min(1, (metrics.rbcOxygenationExit - 35) / 62);

  for (let i = 0; i < rbcCount; i++) {
    const curve = handles.capillaryCurves[i % handles.capillaryCurves.length];
    const t = ((i / rbcCount + simTime * 0.14 * params.bloodFlowSpeed) % 1 + 1) % 1;
    curve.getPointAt(t, _vecA);
    curve.getTangentAt(t, _vecB);

    _dummy.position.copy(_vecA);
    _dummy.lookAt(_vecA.x + _vecB.x, _vecA.y + _vecB.y, _vecA.z + _vecB.z);
    _dummy.rotateX(Math.PI / 2);
    _dummy.scale.setScalar(1);
    _dummy.updateMatrix();
    handles.rbcMesh.setMatrixAt(i, _dummy.matrix);

    // Smoothly shift color from O2-poor (left inlet) to O2-rich (right outlet)
    const oxyT = Math.min(1, Math.max(0, (t - 0.18) / 0.62)) * oxyStrength;
    _colorA.copy(startColor).lerp(_colorBrightRed, oxyT);
    handles.rbcMesh.setColorAt(i, _colorA);
  }
  handles.rbcMesh.instanceMatrix.needsUpdate = true;
  if (handles.rbcMesh.instanceColor) handles.rbcMesh.instanceColor.needsUpdate = true;

  // 2. O2 diffusion: inside alveolus (0, -0.15, 0.22) -> outward into capillary bed
  const o2Rate = (metrics.o2DiffusionIndex / 100) * 0.42;
  const activeO2Count = Math.max(4, Math.round((metrics.o2DiffusionIndex / 100) * handles.o2Particles.count));
  for (let i = 0; i < handles.o2Particles.count; i++) {
    if (i >= activeO2Count) {
      _dummy.scale.setScalar(0.001);
      _dummy.position.set(0, -0.15, 0.22);
      _dummy.updateMatrix();
      handles.o2Particles.setMatrixAt(i, _dummy.matrix);
      continue;
    }
    const t = ((handles.o2Offsets[i] + simTime * Math.max(0.08, o2Rate)) % 1 + 1) % 1;
    const curve = handles.capillaryCurves[i % handles.capillaryCurves.length];
    const targetPos = curve.getPointAt(0.2 + ((i * 0.19) % 0.65), _vecB);
    _vecA.set(
      Math.sin(i * 1.7) * 0.45,
      -0.15 + Math.cos(i * 2.1) * 0.42,
      0.22,
    );
    _dummy.position.lerpVectors(_vecA, targetPos, t);
    _dummy.scale.setScalar(0.75 + 0.35 * Math.sin(t * Math.PI));
    _dummy.updateMatrix();
    handles.o2Particles.setMatrixAt(i, _dummy.matrix);
  }
  handles.o2Particles.instanceMatrix.needsUpdate = true;

  // 3. CO2 diffusion: from capillary bed -> inward into alveolus lumen -> upward toward bronchiole
  const co2Rate = (metrics.co2DiffusionIndex / 100) * 0.38;
  const activeCO2Count = Math.max(4, Math.round((metrics.co2DiffusionIndex / 100) * handles.co2Particles.count));
  for (let i = 0; i < handles.co2Particles.count; i++) {
    if (i >= activeCO2Count) {
      _dummy.scale.setScalar(0.001);
      _dummy.position.set(0, -0.15, 0.22);
      _dummy.updateMatrix();
      handles.co2Particles.setMatrixAt(i, _dummy.matrix);
      continue;
    }
    const t = ((handles.co2Offsets[i] + simTime * Math.max(0.08, co2Rate)) % 1 + 1) % 1;
    const curve = handles.capillaryCurves[i % handles.capillaryCurves.length];
    const srcPos = curve.getPointAt(0.18 + ((i * 0.23) % 0.62), _vecA);
    _vecB.set(Math.cos(i * 1.9) * 0.28, 0.65 + (i % 3) * 0.25, 0.24);
    _dummy.position.lerpVectors(srcPos, _vecB, t);
    _dummy.scale.setScalar(0.72 + 0.35 * Math.sin(t * Math.PI));
    _dummy.updateMatrix();
    handles.co2Particles.setMatrixAt(i, _dummy.matrix);
  }
  handles.co2Particles.instanceMatrix.needsUpdate = true;
}
