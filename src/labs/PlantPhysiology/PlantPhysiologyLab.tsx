import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { ModelViewer3D, SceneUpdateContext } from '../../components/viewer3d/ModelViewer3D';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';

type PlantMode = 'transport' | 'stomata' | 'photosynthesis-c3-c4-cam';
type PhotoPathway = 'C3' | 'C4' | 'CAM';

const PARTS_BY_MODE: Record<PlantMode, ModelPartInfo[]> = {
  transport: [
    {
      id: 'root-hair',
      vietnameseName: 'Lông hút & Vỏ rễ',
      scientificName: 'Root Hairs & Cortex',
      location: 'Phần rễ dưới đất',
      structure: 'Tế bào biểu bì kéo dài thành lông hút với không bào lớn và thành mỏng.',
      function: 'Hấp thụ nước theo cơ chế thẩm thấu và ion khoáng (thụ động hoặc chủ động tốn ATP).',
      relatedLessons: ['Trao đổi nước và khoáng ở thực vật'],
      colorHex: '#D97706',
    },
    {
      id: 'xylem',
      vietnameseName: 'Mạch gỗ (Xylem)',
      scientificName: 'Xylem Vessels (Quản bào & Mạch ống)',
      location: 'Trục dẫn bên trong rễ – thân – lá',
      structure: 'Gồm các tế bào chết hóa gỗ nối tiếp nhau tạo ống rỗng liên tục.',
      function: 'Vận chuyển một chiều nước và ion khoáng từ rễ lên lá nhờ lực đẩy rễ, lực liên kết và lực kéo thoát hơi nước.',
      relatedLessons: ['Dòng mạch gỗ'],
      colorHex: '#0EA5E9',
    },
    {
      id: 'phloem',
      vietnameseName: 'Mạch rây (Phloem)',
      scientificName: 'Sieve Tubes & Companion Cells',
      location: 'Nằm phía ngoài mạch gỗ trong bó mạch',
      structure: 'Tế bào sống gồm ống rây (mất nhân, có bản rây) và tế bào kèm.',
      function: 'Vận chuyển chất hữu cơ (chủ yếu sucrose), hormone từ cơ quan nguồn (lá) đến cơ quan chứa.',
      relatedLessons: ['Dòng mạch rây'],
      colorHex: '#22C55E',
    },
    {
      id: 'leaf-canopy',
      vietnameseName: 'Lá & Thoát hơi nước',
      scientificName: 'Leaf Mesophyll & Transpiration',
      location: 'Đỉnh chồi cây',
      structure: 'Phiến lá chứa lục lạp, hệ gân lá nối mạch gỗ và khí khổng.',
      function: 'Quang hợp tạo chất hữu cơ và thoát hơi nước tạo động lực đầu trên kéo dòng mạch gỗ.',
      relatedLessons: ['Thoát hơi nước ở lá'],
      colorHex: '#15803D',
    },
  ],
  stomata: [
    {
      id: 'guard-cells',
      vietnameseName: 'Hai tế bào khí khổng (tế bào bảo vệ)',
      scientificName: 'Guard Cells',
      location: 'Biểu bì lá (chủ yếu mặt dưới)',
      structure: 'Hình hạt đậu, thành trong dày, thành ngoài mỏng, có chứa lục lạp.',
      function: 'Trương nước làm cong mở khe khí khổng; mất nước làm xẹp đóng khe khí khổng.',
      relatedLessons: ['Điều tiết đóng mở khí khổng'],
      colorHex: '#16A34A',
    },
    {
      id: 'aperture',
      vietnameseName: 'Lỗ khí (Khe khí khổng)',
      scientificName: 'Stomatal Pore',
      location: 'Khoảng trống giữa hai tế bào bảo vệ',
      structure: 'Khe mở thông với khoang dưới khí khổng trong mô giậu/mô xốp.',
      function: 'Cho CO₂ khuếch tán vào lá cho quang hợp và hơi nước, O₂ thoát ra ngoài.',
      relatedLessons: ['Trao đổi khí ở thực vật'],
      colorHex: '#38BDF8',
    },
    {
      id: 'epidermis',
      vietnameseName: 'Tế bào biểu bì xung quanh',
      scientificName: 'Subsidiary & Epidermal Cells',
      location: 'Bao quanh khí khổng',
      structure: 'Xếp khít nhau, bề mặt phủ lớp cutin chống thấm.',
      function: 'Bảo vệ mô lá và trao đổi ion K⁺, nước với tế bào khí khổng.',
      relatedLessons: ['Cấu tạo lá'],
      colorHex: '#65A30D',
    },
  ],
  'photosynthesis-c3-c4-cam': [
    {
      id: 'mesophyll',
      vietnameseName: 'Tế bào mô giậu (Mesophyll)',
      scientificName: 'Mesophyll Cell',
      location: 'Lớp ngoài phía dưới biểu bì lá',
      structure: 'Chứa nhiều lục lạp và enzyme RuBisCO (C3) hoặc PEP carboxylase (C4/CAM).',
      function: 'Cố định CO₂ ban đầu thành hợp chất 3C (C3) hoặc 4C oxaloacetate/malate (C4, CAM).',
      relatedLessons: ['Quang hợp ở thực vật C3, C4, CAM'],
      colorHex: '#22C55E',
    },
    {
      id: 'bundle-sheath',
      vietnameseName: 'Tế bào bao bó mạch',
      scientificName: 'Bundle Sheath Cell',
      location: 'Bao quanh bó mạch dẫn (rõ ở thực vật C4 – giải phẫu Kranz)',
      structure: 'Thành dày, ít thấm khí, lục lạp có chu trình Calvin.',
      function: 'Ở thực vật C4: tiếp nhận malate từ mô giậu, giải phóng CO₂ nồng độ cao cho chu trình Calvin hạn chế hô hấp sáng.',
      relatedLessons: ['Quang hợp C4'],
      colorHex: '#0D9488',
    },
    {
      id: 'calvin-cycle',
      vietnameseName: 'Chu trình Calvin & Lục lạp',
      scientificName: 'Calvin Cycle (Stroma)',
      location: 'Chất nền lục lạp (trong mô giậu ở C3/CAM hoặc bao bó mạch ở C4)',
      structure: 'Hệ enzyme cố định CO₂ nhờ ATP và NADPH từ pha sáng.',
      function: 'Khử CO₂ thành đường C₆H₁₂O₆ phục vụ sinh trưởng.',
      relatedLessons: ['Pha tối quang hợp'],
      colorHex: '#F59E0B',
    },
  ],
};

export const PlantPhysiologyLab: React.FC = () => {
  const [mode, setMode] = useState<PlantMode>('transport');
  const [pathway, setPathway] = useState<PhotoPathway>('C3');
  const [lightIntensity, setLightIntensity] = useState(70); // %
  const [co2Level, setCo2Level] = useState(400); // ppm
  const [temperature, setTemperature] = useState(28); // °C
  const [humidity, setHumidity] = useState(65); // %
  const [camTime, setCamTime] = useState<'day' | 'night'>('night');

  const viewer = useLabViewerState(true);
  const animRefs = useRef<{
    xylemBeads: THREE.Mesh[];
    phloemBeads: THREE.Mesh[];
    guardLeft?: THREE.Mesh;
    guardRight?: THREE.Mesh;
    gasParticles: THREE.Mesh[];
    cycleRing?: THREE.Mesh;
  }>({ xylemBeads: [], phloemBeads: [], gasParticles: [] });

  const simRef = useRef({
    mode,
    pathway,
    lightIntensity,
    co2Level,
    temperature,
    humidity,
    camTime,
  });
  simRef.current = { mode, pathway, lightIntensity, co2Level, temperature, humidity, camTime };

  // Compute pedagogical mathematical photosynthesis rate (arbitrary unit 0–100)
  const computePhotoRate = (p: PhotoPathway, light: number, co2: number, temp: number, hum: number) => {
    const lightFactor = light / (light + 22);
    const co2Factor = p === 'C4' ? co2 / (co2 + 120) : co2 / (co2 + 280);
    const optTemp = p === 'C3' ? 25 : p === 'C4' ? 35 : 32;
    const tempSpread = p === 'C3' ? 11 : 13;
    const tempFactor = Math.exp(-Math.pow(temp - optTemp, 2) / (2 * tempSpread * tempSpread));
    const droughtPenalty = hum < 30 ? 0.55 + (hum / 30) * 0.45 : 1;
    const baseMax = p === 'C4' ? 105 : p === 'C3' ? 88 : 68;
    return Math.max(0, Math.min(100, Math.round(baseMax * lightFactor * co2Factor * tempFactor * droughtPenalty)));
  };

  const currentPhotoRate = computePhotoRate(pathway, lightIntensity, co2Level, temperature, humidity);
  const stomatalOpening = useMemo(() => {
    if (pathway === 'CAM') {
      return camTime === 'night' ? Math.max(40, Math.min(95, humidity + 15)) : 8;
    }
    const lightBoost = lightIntensity * 0.65;
    const humFactor = humidity < 35 ? 0.45 : 1;
    return Math.round(Math.min(100, Math.max(10, (25 + lightBoost) * humFactor)));
  }, [pathway, camTime, lightIntensity, humidity]);

  const lightResponseCurve = useMemo(() => {
    return [0, 15, 30, 45, 60, 75, 90, 100].map((l) => ({
      light: `${l}%`,
      C3: computePhotoRate('C3', l, co2Level, temperature, humidity),
      C4: computePhotoRate('C4', l, co2Level, temperature, humidity),
      CAM: computePhotoRate('CAM', l, co2Level, temperature, humidity),
    }));
  }, [co2Level, temperature, humidity]);

  const buildModel = (rootGroup: THREE.Group, quality: QualityLevel) => {
    const segs = quality === 'low' ? 14 : quality === 'high' ? 28 : 20;
    animRefs.current = { xylemBeads: [], phloemBeads: [], gasParticles: [] };

    if (mode === 'transport') {
      // Root system
      const rootGroupNode = new THREE.Group();
      rootGroupNode.userData.partId = 'root-hair';
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 0.25, segs),
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9, transparent: true, opacity: 0.7 }),
      );
      soil.position.y = -1.7;
      rootGroupNode.add(soil);

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const root = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.04, 1.4, 10),
          new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 }),
        );
        root.position.set(Math.cos(angle) * 0.55, -2.05, Math.sin(angle) * 0.55);
        root.rotation.z = Math.cos(angle) * 0.65;
        root.rotation.x = Math.sin(angle) * 0.65;
        root.userData.explodeDir = new THREE.Vector3(0, -1, 0);
        rootGroupNode.add(root);
      }
      rootGroup.add(rootGroupNode);

      // Xylem column (blue)
      const xylemGroup = new THREE.Group();
      xylemGroup.userData.partId = 'xylem';
      const xylemTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.26, 3.8, segs),
        new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.42, roughness: 0.25 }),
      );
      xylemTube.position.set(-0.26, 0.1, 0);
      xylemTube.userData.explodeDir = new THREE.Vector3(-1, 0, 0);
      xylemGroup.add(xylemTube);

      for (let i = 0; i < 8; i++) {
        const drop = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 }),
        );
        drop.position.set(-0.26, -1.6 + i * 0.45, 0);
        drop.userData.phase = i / 8;
        xylemGroup.add(drop);
        animRefs.current.xylemBeads.push(drop);
      }
      rootGroup.add(xylemGroup);

      // Phloem column (green)
      const phloemGroup = new THREE.Group();
      phloemGroup.userData.partId = 'phloem';
      const phloemTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 3.8, segs),
        new THREE.MeshPhysicalMaterial({ color: 0x22c55e, transparent: true, opacity: 0.42, roughness: 0.3 }),
      );
      phloemTube.position.set(0.32, 0.1, 0);
      phloemTube.userData.explodeDir = new THREE.Vector3(1, 0, 0);
      phloemGroup.add(phloemTube);

      for (let i = 0; i < 7; i++) {
        const sugar = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.1, 0),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.4 }),
        );
        sugar.position.set(0.32, 1.8 - i * 0.5, 0);
        sugar.userData.phase = i / 7;
        phloemGroup.add(sugar);
        animRefs.current.phloemBeads.push(sugar);
      }
      rootGroup.add(phloemGroup);

      // Leaf canopy
      const leafGroup = new THREE.Group();
      leafGroup.userData.partId = 'leaf-canopy';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.95, segs, segs),
          new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 }),
        );
        leaf.scale.set(1.3, 0.14, 0.65);
        leaf.position.set(Math.cos(a) * 1.15, 2.05 + (i % 2) * 0.25, Math.sin(a) * 1.15);
        leaf.rotation.y = -a;
        leaf.rotation.z = -0.2;
        leaf.userData.explodeDir = new THREE.Vector3(Math.cos(a), 0.7, Math.sin(a));
        leafGroup.add(leaf);
      }
      rootGroup.add(leafGroup);
    } else if (mode === 'stomata') {
      // Epidermis surround
      const epiGroup = new THREE.Group();
      epiGroup.userData.partId = 'epidermis';
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.15, 0.35, 16, segs),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1.25, 0.95, 0.55);
      epiGroup.add(ring);
      rootGroup.add(epiGroup);

      // Guard cells (bean shaped using curved tubes)
      const guardGroup = new THREE.Group();
      guardGroup.userData.partId = 'guard-cells';
      const leftCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -1.45),
        new THREE.Vector3(-0.75, 0.12, -0.75),
        new THREE.Vector3(-0.95, 0.15, 0),
        new THREE.Vector3(-0.75, 0.12, 0.75),
        new THREE.Vector3(0, 0, 1.45),
      ]);
      const rightCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -1.45),
        new THREE.Vector3(0.75, 0.12, -0.75),
        new THREE.Vector3(0.95, 0.15, 0),
        new THREE.Vector3(0.75, 0.12, 0.75),
        new THREE.Vector3(0, 0, 1.45),
      ]);
      const guardMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });
      const leftGuard = new THREE.Mesh(new THREE.TubeGeometry(leftCurve, segs, 0.42, 14, false), guardMat);
      const rightGuard = new THREE.Mesh(new THREE.TubeGeometry(rightCurve, segs, 0.42, 14, false), guardMat.clone());
      guardGroup.add(leftGuard, rightGuard);
      animRefs.current.guardLeft = leftGuard;
      animRefs.current.guardRight = rightGuard;
      rootGroup.add(guardGroup);

      // Aperture & Gas molecules (CO2 / H2O)
      const poreGroup = new THREE.Group();
      poreGroup.userData.partId = 'aperture';
      for (let i = 0; i < 10; i++) {
        const isCo2 = i % 2 === 0;
        const p = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 10, 10),
          new THREE.MeshStandardMaterial({
            color: isCo2 ? 0xf59e0b : 0x38bdf8,
            emissive: isCo2 ? 0xb45309 : 0x0284c7,
            emissiveIntensity: 0.4,
          }),
        );
        p.position.set((Math.random() - 0.5) * 0.4, (i - 5) * 0.35, (Math.random() - 0.5) * 0.6);
        p.userData.isCo2 = isCo2;
        p.userData.phase = i / 10;
        poreGroup.add(p);
        animRefs.current.gasParticles.push(p);
      }
      rootGroup.add(poreGroup);
    } else {
      // C3 / C4 / CAM compartment model
      const mesoGroup = new THREE.Group();
      mesoGroup.userData.partId = 'mesophyll';
      const mesoBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 2.2, 1.8),
        new THREE.MeshPhysicalMaterial({ color: 0x22c55e, transparent: true, opacity: 0.35, roughness: 0.3 }),
      );
      mesoBox.position.set(-1.35, 0, 0);
      mesoBox.userData.explodeDir = new THREE.Vector3(-1, 0, 0);
      mesoGroup.add(mesoBox);
      rootGroup.add(mesoGroup);

      const bsGroup = new THREE.Group();
      bsGroup.userData.partId = 'bundle-sheath';
      const bsCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 2.2, segs),
        new THREE.MeshPhysicalMaterial({ color: 0x0d9488, transparent: true, opacity: 0.38, roughness: 0.3 }),
      );
      bsCyl.position.set(1.35, 0, 0);
      bsCyl.userData.explodeDir = new THREE.Vector3(1, 0, 0);
      bsGroup.add(bsCyl);
      rootGroup.add(bsGroup);

      const calvinGroup = new THREE.Group();
      calvinGroup.userData.partId = 'calvin-cycle';
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.14, 14, segs),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.35 }),
      );
      torus.position.set(pathway === 'C4' ? 1.35 : -1.35, 0, 0);
      calvinGroup.add(torus);
      animRefs.current.cycleRing = torus;

      for (let i = 0; i < 6; i++) {
        const mol = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.4 }),
        );
        mol.position.set(-1.35 + (i / 5) * 2.7, 0.25, 0);
        mol.userData.phase = i / 6;
        calvinGroup.add(mol);
        animRefs.current.gasParticles.push(mol);
      }
      rootGroup.add(calvinGroup);
    }

    return {
      partsMeta: PARTS_BY_MODE[mode],
      initialCameraDir: new THREE.Vector3(0.35, 0.42, 0.85),
    };
  };

  const handleAnimateFrame = (ctx: SceneUpdateContext) => {
    const s = simRef.current;
    const t = ctx.elapsed * ctx.speed;

    if (s.mode === 'transport') {
      const pullRate = 0.25 + (s.lightIntensity / 100) * 0.55 + (100 - s.humidity) * 0.004;
      animRefs.current.xylemBeads.forEach((b) => {
        if (!ctx.isPlaying) return;
        const p = (b.userData.phase + t * pullRate * 0.45) % 1;
        b.position.y = -1.7 + p * 3.6;
      });
      animRefs.current.phloemBeads.forEach((b) => {
        if (!ctx.isPlaying) return;
        const p = (b.userData.phase + t * 0.28) % 1;
        b.position.y = 1.9 - p * 3.6;
      });
    } else if (s.mode === 'stomata') {
      const openRatio = stomatalOpening / 100;
      if (animRefs.current.guardLeft && animRefs.current.guardRight) {
        animRefs.current.guardLeft.position.x = -0.35 * openRatio;
        animRefs.current.guardRight.position.x = 0.35 * openRatio;
      }
      animRefs.current.gasParticles.forEach((g) => {
        if (!ctx.isPlaying) return;
        const flux = Math.max(0.1, openRatio);
        const p = (g.userData.phase + t * 0.4 * flux) % 1;
        g.position.y = g.userData.isCo2 ? 1.8 - p * 3.6 : -1.8 + p * 3.6;
        g.visible = openRatio > 0.12;
      });
    } else {
      if (animRefs.current.cycleRing && ctx.isPlaying) {
        animRefs.current.cycleRing.rotation.z = t * (0.5 + currentPhotoRate / 60);
      }
      animRefs.current.gasParticles.forEach((mol) => {
        if (!ctx.isPlaying) return;
        const p = (mol.userData.phase + t * 0.35) % 1;
        if (s.pathway === 'C4') {
          // Spatial shuttle from mesophyll (-1.35) to bundle sheath (+1.35)
          mol.position.x = -1.35 + p * 2.7;
          mol.position.y = Math.sin(p * Math.PI) * 0.45;
        } else {
          // Local cycle in mesophyll
          mol.position.x = -1.35 + Math.cos(p * Math.PI * 2) * 0.55;
          mol.position.y = Math.sin(p * Math.PI * 2) * 0.55;
        }
      });
    }
  };

  const parts = PARTS_BY_MODE[mode];
  const sourceMeta: ScientificSourceMeta = {
    name: 'Mô hình Sinh lí Thực vật 3D',
    source: 'Chuẩn kiến thức Sinh học 11 (Chương trình GDPT 2018)',
    identifier: `PLANT-${mode.toUpperCase()}`,
    version: '1.0',
    license: 'Học liệu số giáo dục THPT',
    dataType: mode === 'photosynthesis-c3-c4-cam' ? 'Mô phỏng định lượng' : 'Mô hình giản lược sư phạm',
    verifiedStatus: 'Đã đối chiếu cơ chế C3, C4 (tách không gian), CAM (tách thời gian)',
    scaleNote: 'Đồ thị cường độ quang hợp là mô phỏng toán học sư phạm nhằm minh họa xu hướng tác động của nhân tố ngoại cảnh.',
  };

  return (
    <div>
      {/* Mode selector */}
      <div className="mb-4 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-3">
        {[
          { id: 'transport' as PlantMode, label: 'Rễ – Mạch gỗ – Mạch rây – Lá' },
          { id: 'stomata' as PlantMode, label: 'Đóng mở khí khổng & Trao đổi khí' },
          { id: 'photosynthesis-c3-c4-cam' as PlantMode, label: 'Quang hợp C3 – C4 – CAM' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setMode(item.id);
              viewer.resetViewAndParts();
            }}
            className={`min-h-[44px] px-4 py-2 rounded-lg font-semibold text-ui-min transition-colors ${
              mode === item.id
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <LabWorkspaceLayout
        title="Phòng Lab 07 · Sinh lí Thực vật 3D"
        subtitle="Vận chuyển nước – chất hữu cơ, cơ chế đóng mở khí khổng và quang hợp C3, C4, CAM"
        viewerRef={viewer.viewerRef}
        parts={parts}
        selectedPartId={viewer.selectedPartId}
        onSelectPart={viewer.setSelectedPartId}
        hiddenPartIds={viewer.hiddenPartIds}
        onToggleHidePart={viewer.toggleHidePart}
        isolatedPartId={viewer.isolatedPartId}
        onToggleIsolatePart={viewer.setIsolatedPartId}
        autoRotate={viewer.autoRotate}
        onToggleAutoRotate={() => viewer.setAutoRotate((v) => !v)}
        showLabels={viewer.showLabels}
        onToggleLabels={() => viewer.setShowLabels((v) => !v)}
        opacityLevel={viewer.opacityLevel}
        onChangeOpacity={viewer.setOpacityLevel}
        clipY={viewer.clipY}
        onChangeClipY={viewer.setClipY}
        clipX={viewer.clipX}
        onChangeClipX={viewer.setClipX}
        explodeFactor={viewer.explodeFactor}
        onChangeExplode={viewer.setExplodeFactor}
        isPlaying={viewer.isPlaying}
        onTogglePlay={() => viewer.setIsPlaying((v) => !v)}
        onStepForward={() => viewer.setSimStepOffset((v) => v + 1)}
        onResetSim={() => {
          setLightIntensity(70);
          setCo2Level(400);
          setTemperature(28);
          setHumidity(65);
          viewer.resetViewAndParts();
        }}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        teacherGuideNote="Cho học sinh giảm độ ẩm không khí xuống dưới 30% hoặc chuyển giữa C4 (tách không gian: mô giậu – bao bó mạch) và CAM (tách thời gian: ban đêm – ban ngày) để so sánh độ mở khí khổng và tốc độ quang hợp."
        sourceMeta={sourceMeta}
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`plant-${mode}-${pathway}`}
            buildModel={buildModel}
            onAnimateFrame={handleAnimateFrame}
            onSelectPart={viewer.setSelectedPartId}
            selectedPartId={viewer.selectedPartId}
            hiddenPartIds={viewer.hiddenPartIds}
            isolatedPartId={viewer.isolatedPartId}
            autoRotate={viewer.autoRotate}
            isPlaying={viewer.isPlaying}
            speed={viewer.speed}
            simTime={viewer.simStepOffset}
            opacityLevel={viewer.opacityLevel}
            clipY={viewer.clipY}
            clipX={viewer.clipX}
            explodeFactor={viewer.explodeFactor}
            showLabels={viewer.showLabels}
            parts={parts}
            quality={viewer.quality}
            fallbackTitle="Sơ đồ Sinh lí Thực vật 2D"
            fallbackItems={parts.map((p) => `${p.vietnameseName}: ${p.function}`)}
          />
        }
        simulationControlsExtra={
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-ui-min">Nhóm thực vật quang hợp:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['C3', 'C4', 'CAM'] as PhotoPathway[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPathway(p)}
                    className={`min-h-[44px] rounded-lg font-bold text-ui-min ${
                      pathway === p
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {pathway === 'CAM' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCamTime('night')}
                  className={`min-h-[44px] rounded-lg font-semibold text-ui-min ${
                    camTime === 'night' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Ban đêm (mở khí khổng)
                </button>
                <button
                  type="button"
                  onClick={() => setCamTime('day')}
                  className={`min-h-[44px] rounded-lg font-semibold text-ui-min ${
                    camTime === 'day' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Ban ngày (đóng khí khổng)
                </button>
              </div>
            )}

            <label className="block space-y-1">
              <div className="flex justify-between text-ui-min font-medium">
                <span>Cường độ ánh sáng</span>
                <span className="font-mono-tabular">{lightIntensity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={lightIntensity}
                onChange={(e) => setLightIntensity(Number(e.target.value))}
                className="w-full accent-amber-600 h-2"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-ui-min font-medium">
                <span>Nồng độ CO₂</span>
                <span className="font-mono-tabular">{co2Level} ppm</span>
              </div>
              <input
                type="range"
                min={100}
                max={1000}
                step={25}
                value={co2Level}
                onChange={(e) => setCo2Level(Number(e.target.value))}
                className="w-full accent-teal-700 h-2"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-ui-min font-medium">
                <span>Nhiệt độ môi trường</span>
                <span className="font-mono-tabular">{temperature}°C</span>
              </div>
              <input
                type="range"
                min={10}
                max={48}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-rose-600 h-2"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-ui-min font-medium">
                <span>Độ ẩm không khí</span>
                <span className="font-mono-tabular">{humidity}%</span>
              </div>
              <input
                type="range"
                min={15}
                max={95}
                value={humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="w-full accent-blue-600 h-2"
              />
            </label>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 grid grid-cols-2 gap-2 text-ui-min">
              <div>
                <div className="text-slate-600">Độ mở khí khổng</div>
                <div className="font-bold text-slate-900 font-mono-tabular">{stomatalOpening}%</div>
              </div>
              <div>
                <div className="text-slate-600">Cường độ quang hợp (ước tính)</div>
                <div className="font-bold text-emerald-700 font-mono-tabular">{currentPhotoRate} đv</div>
              </div>
            </div>
          </div>
        }
        knowledgeContent={
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <h4 className="font-bold text-emerald-900">Phân biệt C3 – C4 – CAM</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-800 mt-1">
                <li>
                  <strong>C3 (lúa, đậu):</strong> Cố định CO₂ trực tiếp qua enzyme RuBisCO tại lục lạp mô giậu; có hô hấp sáng khi nóng gắt.
                </li>
                <li>
                  <strong>C4 (ngô, mía):</strong> <em>Tách biệt không gian</em> — cố định CO₂ lần 1 ở mô giậu (PEP carboxylase), chu trình Calvin ở tế bào bao bó mạch → giảm hô hấp sáng.
                </li>
                <li>
                  <strong>CAM (xương rồng, dứa):</strong> <em>Tách biệt thời gian</em> — mở khí khổng ban đêm lấy CO₂ tích trữ thành malate; ban ngày đóng khí khổng để chạy chu trình Calvin, tiết kiệm nước.
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">
                Đồ thị phản ứng quang hợp theo ánh sáng (Mô phỏng toán học)
              </h4>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lightResponseCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="light" tick={{ fontSize: 15, fill: '#334155' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 15, fill: '#334155' }} />
                    <Tooltip contentStyle={{ fontSize: '15px', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="C3" stroke="#2563EB" strokeWidth={2.5} name="Thực vật C3" />
                    <Line type="monotone" dataKey="C4" stroke="#16A34A" strokeWidth={2.5} name="Thực vật C4" />
                    <Line type="monotone" dataKey="CAM" stroke="#D97706" strokeWidth={2.5} name="Thực vật CAM" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Nhiệm vụ thực hành 1</div>
              <p className="text-slate-700">
                Ở mô hình <strong>Rễ – Mạch gỗ – Mạch rây</strong>, kéo thanh <em>Tách lớp cấu trúc</em> để phân biệt chiều vận chuyển của hạt màu xanh dương (nước, ion khoáng) và hạt màu vàng (sucrose).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Nhiệm vụ thực hành 2</div>
              <p className="text-slate-700">
                Tăng nhiệt độ lên 38°C và ánh sáng 90%: quan sát trên đồ thị xem nhóm thực vật nào (C3 hay C4) giữ cường độ quang hợp cao hơn và giải thích vai trò của tế bào bao bó mạch.
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
};
