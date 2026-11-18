import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { ModelViewer3D, SceneUpdateContext } from '../../components/viewer3d/ModelViewer3D';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';

type AnimalSysMode = 'circulation' | 'nephron' | 'synapse' | 'alveolus' | 'immune';

const PARTS_BY_MODE: Record<AnimalSysMode, ModelPartInfo[]> = {
  circulation: [
    {
      id: 'heart-pump',
      vietnameseName: 'Tim (4 ngăn)',
      scientificName: 'Four-chambered Heart',
      location: 'Trung tâm hệ tuần hoàn kép',
      structure: 'Hai tâm nhĩ và hai tâm thất tách biệt hoàn toàn giữa nửa phải (máu nghèo O₂) và nửa trái (máu giàu O₂).',
      function: 'Co bóp tạo áp lực đẩy máu qua vòng tuần hoàn phổi và vòng tuần hoàn cơ thể.',
      relatedLessons: ['Tuần hoàn ở động vật'],
      colorHex: '#EF4444',
    },
    {
      id: 'pulmonary-loop',
      vietnameseName: 'Vòng tuần hoàn phổi (máu nghèo → giàu O₂)',
      scientificName: 'Pulmonary Circulation',
      location: 'Từ tâm thất phải → phổi → tâm nhĩ trái',
      structure: 'Động mạch phổi mang máu nghèo O₂ đến mao mạch phế nang để trao đổi khí, theo tĩnh mạch phổi về tim.',
      function: 'Thải CO₂ và nạp O₂ cho hemoglobin trong hồng cầu.',
      relatedLessons: ['Hệ tuần hoàn kép'],
      colorHex: '#3B82F6',
    },
    {
      id: 'systemic-loop',
      vietnameseName: 'Vòng tuần hoàn hệ thống (máu giàu → mô)',
      scientificName: 'Systemic Circulation',
      location: 'Từ tâm thất trái → các cơ quan → tâm nhĩ phải',
      structure: 'Động mạch chủ mang máu đỏ tươi giàu O₂ phân nhánh tới mao mạch cơ quan rồi theo tĩnh mạch chủ về tim.',
      function: 'Cung cấp O₂, chất dinh dưỡng cho tế bào và thu nhận CO₂, chất thải.',
      relatedLessons: ['Tuần hoàn kép ở thú'],
      colorHex: '#DC2626',
    },
  ],
  nephron: [
    {
      id: 'glomerulus',
      vietnameseName: 'Cầu thận & Nang Bowman',
      scientificName: 'Glomerulus & Bowman’s Capsule',
      location: 'Phần đầu đơn vị thận (nephron)',
      structure: 'Búi mao mạch áp suất cao nằm gọn trong nang hình chén.',
      function: 'Lọc máu tạo nước tiểu đầu (chứa nước, ion, glucose, urea; giữ lại tế bào máu và protein lớn).',
      relatedLessons: ['Bài tiết và cân bằng nội môi'],
      colorHex: '#EF4444',
    },
    {
      id: 'tubule',
      vietnameseName: 'Ống lượn gần – Quai Henle – Ống lượn xa',
      scientificName: 'Renal Tubule & Loop of Henle',
      location: 'Phần ống uốn khúc nối tiếp nang Bowman',
      structure: 'Hệ thống ống dài có mạng mao mạch quanh ống bao bọc.',
      function: 'Tái hấp thụ nước, glucose, Na⁺, HCO₃⁻ trở lại máu và tiết thêm H⁺, K⁺, chất độc.',
      relatedLessons: ['Cơ chế lọc và tái hấp thụ ở thận'],
      colorHex: '#F59E0B',
    },
    {
      id: 'collecting-duct',
      vietnameseName: 'Ống góp',
      scientificName: 'Collecting Duct',
      location: 'Phần cuối đổ vào bể thận',
      structure: 'Ống thẳng tiếp nhận dịch lọc từ nhiều nephron.',
      function: 'Điều chỉnh tái hấp thụ nước cuối cùng (dưới tác động hormone ADH) tạo nước tiểu chính thức.',
      relatedLessons: ['Cân bằng áp suất thẩm thấu'],
      colorHex: '#0D9488',
    },
  ],
  synapse: [
    {
      id: 'presynaptic',
      vietnameseName: 'Chùy synapse (Màng trước)',
      scientificName: 'Presynaptic Terminal',
      location: 'Đầu tận cùng sợi trục neuron trước',
      structure: 'Chứa nhiều ti thể, kênh Ca²⁺ điện thế và bóng synapse chứa chất trung gian hóa học.',
      function: 'Khi xung thần kinh đến, Ca²⁺ đi vào kích thích bóng synapse hòa màng giải phóng chất truyền tin.',
      relatedLessons: ['Truyền tin qua synapse hóa học'],
      colorHex: '#0D9488',
    },
    {
      id: 'cleft',
      vietnameseName: 'Khe synapse & Chất truyền tin',
      scientificName: 'Synaptic Cleft & Neurotransmitters',
      location: 'Khoảng hẹp giữa hai màng (~20–30 nm)',
      structure: 'Chứa dịch ngoại bào và enzyme phân giải chất truyền tin (như acetylcholinesterase).',
      function: 'Khuếch tán chất trung gian hóa học (acetylcholine, glutamate...) sang màng sau.',
      relatedLessons: ['Synapse hóa học'],
      colorHex: '#F59E0B',
    },
    {
      id: 'postsynaptic',
      vietnameseName: 'Màng sau synapse & Thụ thể',
      scientificName: 'Postsynaptic Membrane & Receptors',
      location: 'Sợi nhánh hoặc thân neuron kế tiếp / cơ',
      structure: 'Mang các protein thụ thể đặc hiệu gắn kênh ion Na⁺/Cl⁻.',
      function: 'Tiếp nhận chất trung gian hóa học → mở kênh ion → khử cực xuất hiện điện thế hoạt động mới.',
      relatedLessons: ['Cảm ứng ở động vật'],
      colorHex: '#2563EB',
    },
  ],
  alveolus: [
    {
      id: 'alveolar-sac',
      vietnameseName: 'Túi phế nang',
      scientificName: 'Alveolar Sac',
      location: 'Đầu tận cùng tiểu phế quản hô hấp',
      structure: 'Thành rất mỏng chỉ gồm một lớp tế bào biểu mô dẹt và lớp dịch ẩm.',
      function: 'Nơi trao đổi khí trực tiếp giữa không khí hít vào (giàu O₂) và máu.',
      relatedLessons: ['Hô hấp ở động vật'],
      colorHex: '#FB7185',
    },
    {
      id: 'capillary-net',
      vietnameseName: 'Mao mạch bao quanh phế nang',
      scientificName: 'Pulmonary Capillary Network',
      location: 'Ôm sát bề mặt ngoài phế nang',
      structure: 'Thành mỏng gồm 1 lớp tế bào nội mô, dòng hồng cầu di chuyển nối tiếp.',
      function: 'Nhận O₂ khuếch tán từ phế nang (theo chênh lệch phân áp) và thải CO₂ ra ngoài.',
      relatedLessons: ['Trao đổi khí qua màng phế nang'],
      colorHex: '#EF4444',
    },
  ],
  immune: [
    {
      id: 'antigen-pathogen',
      vietnameseName: 'Tác nhân gây bệnh mang Kháng nguyên',
      scientificName: 'Pathogen & Surface Antigens',
      location: 'Xâm nhập vào dịch ngoại bào',
      structure: 'Vi khuẩn/virus có các epitope kháng nguyên đặc trưng trên bề mặt.',
      function: 'Kích hoạt hệ miễn dịch nhận diện vật lạ.',
      relatedLessons: ['Miễn dịch ở người và động vật'],
      colorHex: '#EF4444',
    },
    {
      id: 'b-cell-antibody',
      vietnameseName: 'Tế bào B, Tương bào & Kháng thể (IgG)',
      scientificName: 'B Lymphocyte & Antibodies',
      location: 'Hệ bạch huyết và huyết tương',
      structure: 'Kháng thể hình chữ Y có vùng biến đổi gắn đặc hiệu vào kháng nguyên.',
      function: 'Trung hòa, ngưng kết mầm bệnh và đánh dấu cho đại thực bào tiêu diệt (miễn dịch thể dịch).',
      relatedLessons: ['Miễn dịch đặc hiệu'],
      colorHex: '#2563EB',
    },
    {
      id: 't-cell',
      vietnameseName: 'Tế bào T hỗ trợ & T gây độc',
      scientificName: 'Helper & Cytotoxic T Cells',
      location: 'Hạch bạch huyết và mô bị nhiễm',
      structure: 'Mang thụ thể TCR đặc hiệu nhận diện phức hệ kháng nguyên – MHC.',
      function: 'T hỗ trợ tiết cytokine hoạt hóa B/T; T độc tiêu diệt tế bào nhiễm virus (miễn dịch tế bào).',
      relatedLessons: ['Miễn dịch tế bào'],
      colorHex: '#10B981',
    },
  ],
};

export const AnimalPhysiologyLab: React.FC = () => {
  const [mode, setMode] = useState<AnimalSysMode>('circulation');
  const [heartRate, setHeartRate] = useState(72); // bpm
  const [adhLevel, setAdhLevel] = useState(50); // % water reabsorption in collecting duct
  const [synapseStimulus, setSynapseStimulus] = useState(1); // 0 = nghỉ, 1 = xung truyền
  const [presentation, setPresentation] = useState(false);

  const viewer = useLabViewerState(true);
  const animRefs = useRef<{
    rbcs: { mesh: THREE.Mesh; phase: number; loop: 'pulm' | 'syst' | 'cap' }[];
    vesicles: THREE.Mesh[];
    neurotransmitters: THREE.Mesh[];
    antibodies: THREE.Mesh[];
    heartNode?: THREE.Object3D;
  }>({ rbcs: [], vesicles: [], neurotransmitters: [], antibodies: [] });

  const simRef = useRef({ mode, heartRate, adhLevel, synapseStimulus });
  simRef.current = { mode, heartRate, adhLevel, synapseStimulus };

  const buildModel = (rootGroup: THREE.Group, quality: QualityLevel) => {
    const segs = quality === 'low' ? 14 : quality === 'high' ? 28 : 20;
    animRefs.current = { rbcs: [], vesicles: [], neurotransmitters: [], antibodies: [] };

    if (mode === 'circulation') {
      const heartG = new THREE.Group();
      heartG.userData.partId = 'heart-pump';
      const rightSide = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, segs, segs),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35 }),
      );
      rightSide.position.set(-0.35, 0, 0);
      rightSide.scale.set(0.9, 1.25, 0.85);
      const leftSide = new THREE.Mesh(
        new THREE.SphereGeometry(0.68, segs, segs),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }),
      );
      leftSide.position.set(0.35, 0, 0);
      leftSide.scale.set(0.95, 1.3, 0.88);
      heartG.add(rightSide, leftSide);
      animRefs.current.heartNode = heartG;
      rootGroup.add(heartG);

      // Pulmonary loop (upper ring)
      const pulmG = new THREE.Group();
      pulmG.userData.partId = 'pulmonary-loop';
      const pulmCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.35, 0.7, 0),
        new THREE.Vector3(-1.3, 2.0, 0),
        new THREE.Vector3(0, 2.55, 0),
        new THREE.Vector3(1.3, 2.0, 0),
        new THREE.Vector3(0.35, 0.7, 0),
      ]);
      const pulmTube = new THREE.Mesh(
        new THREE.TubeGeometry(pulmCurve, 32, 0.12, 12, false),
        new THREE.MeshPhysicalMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.45 }),
      );
      const lungNode = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, segs, segs),
        new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.5 }),
      );
      lungNode.position.set(0, 2.55, 0);
      lungNode.scale.set(1.8, 0.75, 0.9);
      pulmG.add(pulmTube, lungNode);
      rootGroup.add(pulmG);

      // Systemic loop (lower ring)
      const systG = new THREE.Group();
      systG.userData.partId = 'systemic-loop';
      const systCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.35, -0.65, 0),
        new THREE.Vector3(1.75, -1.9, 0),
        new THREE.Vector3(0, -2.65, 0),
        new THREE.Vector3(-1.75, -1.9, 0),
        new THREE.Vector3(-0.35, -0.65, 0),
      ]);
      const systTube = new THREE.Mesh(
        new THREE.TubeGeometry(systCurve, 36, 0.13, 12, false),
        new THREE.MeshPhysicalMaterial({ color: 0xf87171, transparent: true, opacity: 0.45 }),
      );
      const organCap = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.5, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.55 }),
      );
      organCap.position.set(0, -2.65, 0);
      systG.add(systTube, organCap);
      rootGroup.add(systG);

      // RBCs traveling on pulmonary & systemic curves
      for (let i = 0; i < 12; i++) {
        const isPulm = i < 5;
        const m = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.05, 12),
          new THREE.MeshStandardMaterial({ color: isPulm ? 0x3b82f6 : 0xef4444 }),
        );
        m.userData.curve = isPulm ? pulmCurve : systCurve;
        rootGroup.add(m);
        animRefs.current.rbcs.push({ mesh: m, phase: (i % 6) / 6, loop: isPulm ? 'pulm' : 'syst' });
      }
    } else if (mode === 'nephron') {
      const glomG = new THREE.Group();
      glomG.userData.partId = 'glomerulus';
      const bowman = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, segs, segs, 0, Math.PI * 1.4),
        new THREE.MeshPhysicalMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.48, side: THREE.DoubleSide }),
      );
      bowman.position.set(-2.0, 0.9, 0);
      const glomKnot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.32, 0.09, 40, 10),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
      );
      glomKnot.position.set(-2.0, 0.9, 0);
      glomG.add(bowman, glomKnot);
      rootGroup.add(glomG);

      const tubG = new THREE.Group();
      tubG.userData.partId = 'tubule';
      const nephronCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.4, 0.9, 0),
        new THREE.Vector3(-0.7, 1.3, 0.3),
        new THREE.Vector3(-0.3, -1.6, 0),
        new THREE.Vector3(0.4, -1.6, 0),
        new THREE.Vector3(0.7, 1.1, -0.2),
        new THREE.Vector3(1.5, 0.9, 0),
      ]);
      const tubMesh = new THREE.Mesh(
        new THREE.TubeGeometry(nephronCurve, 56, 0.16, 12, false),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 }),
      );
      tubG.add(tubMesh);
      rootGroup.add(tubG);

      const collG = new THREE.Group();
      collG.userData.partId = 'collecting-duct';
      const duct = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.28, 3.2, segs),
        new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.4 }),
      );
      duct.position.set(1.85, -0.2, 0);
      collG.add(duct);
      rootGroup.add(collG);

      for (let i = 0; i < 8; i++) {
        const drop = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xca8a04, emissiveIntensity: 0.4 }),
        );
        drop.userData.curve = nephronCurve;
        rootGroup.add(drop);
        animRefs.current.rbcs.push({ mesh: drop, phase: i / 8, loop: 'cap' });
      }
    } else if (mode === 'synapse') {
      const preG = new THREE.Group();
      preG.userData.partId = 'presynaptic';
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, segs, segs),
        new THREE.MeshPhysicalMaterial({ color: 0x0d9488, transparent: true, opacity: 0.45, roughness: 0.3 }),
      );
      bulb.position.set(-1.35, 0, 0);
      bulb.scale.set(1.2, 0.95, 0.95);
      preG.add(bulb);
      for (let i = 0; i < 4; i++) {
        const ves = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 14, 14),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.3 }),
        );
        ves.position.set(-1.1 - i * 0.25, (i - 1.5) * 0.35, 0);
        preG.add(ves);
        animRefs.current.vesicles.push(ves);
      }
      rootGroup.add(preG);

      const cleftG = new THREE.Group();
      cleftG.userData.partId = 'cleft';
      for (let i = 0; i < 10; i++) {
        const nt = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.6 }),
        );
        nt.position.set(-0.2 + (i % 3) * 0.25, (i - 4.5) * 0.22, ((i % 2) - 0.5) * 0.4);
        nt.userData.phase = i / 10;
        cleftG.add(nt);
        animRefs.current.neurotransmitters.push(nt);
      }
      rootGroup.add(cleftG);

      const postG = new THREE.Group();
      postG.userData.partId = 'postsynaptic';
      const postWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 2.4, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }),
      );
      postWall.position.set(1.25, 0, 0);
      postG.add(postWall);
      for (let i = -2; i <= 2; i++) {
        const rec = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.35, 10),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8 }),
        );
        rec.rotation.z = Math.PI / 2;
        rec.position.set(0.82, i * 0.42, 0);
        postG.add(rec);
      }
      rootGroup.add(postG);
    } else if (mode === 'alveolus') {
      const alvG = new THREE.Group();
      alvG.userData.partId = 'alveolar-sac';
      const sac = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, segs, segs),
        new THREE.MeshPhysicalMaterial({ color: 0xfb7185, transparent: true, opacity: 0.45, roughness: 0.3 }),
      );
      alvG.add(sac);
      rootGroup.add(alvG);

      const capG = new THREE.Group();
      capG.userData.partId = 'capillary-net';
      const capCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.3, -0.8, 0),
        new THREE.Vector3(-1.3, 0.9, 1.15),
        new THREE.Vector3(0.4, 1.35, -0.7),
        new THREE.Vector3(1.5, -0.6, 0.9),
        new THREE.Vector3(2.4, -0.8, 0),
      ]);
      const capTube = new THREE.Mesh(
        new THREE.TubeGeometry(capCurve, 48, 0.16, 12, false),
        new THREE.MeshPhysicalMaterial({ color: 0xef4444, transparent: true, opacity: 0.55 }),
      );
      capG.add(capTube);
      rootGroup.add(capG);
      for (let i = 0; i < 8; i++) {
        const rbc = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6 }),
        );
        rbc.userData.curve = capCurve;
        rootGroup.add(rbc);
        animRefs.current.rbcs.push({ mesh: rbc, phase: i / 8, loop: 'cap' });
      }
    } else {
      const pathG = new THREE.Group();
      pathG.userData.partId = 'antigen-pathogen';
      const germ = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.85, 0),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 }),
      );
      pathG.add(germ);
      rootGroup.add(pathG);

      const bG = new THREE.Group();
      bG.userData.partId = 'b-cell-antibody';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const ab = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.55, 6),
          new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.25 }),
        );
        ab.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.1, Math.sin(a * 2) * 0.5);
        ab.lookAt(0, 0, 0);
        ab.userData.baseAngle = a;
        bG.add(ab);
        animRefs.current.antibodies.push(ab);
      }
      rootGroup.add(bG);

      const tG = new THREE.Group();
      tG.userData.partId = 't-cell';
      const tCell = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, segs, segs),
        new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35 }),
      );
      tCell.position.set(-2.1, -0.7, 0.4);
      tG.add(tCell);
      rootGroup.add(tG);
    }

    return {
      partsMeta: PARTS_BY_MODE[mode],
      initialCameraDir: new THREE.Vector3(0.3, 0.3, 0.9),
    };
  };

  const handleAnimateFrame = (ctx: SceneUpdateContext) => {
    const s = simRef.current;
    const t = ctx.elapsed * ctx.speed;
    if (!ctx.isPlaying) return;

    if (s.mode === 'circulation' && animRefs.current.heartNode) {
      const beatFreq = (s.heartRate / 60) * Math.PI * 2;
      const pulse = 1 + Math.max(0, Math.sin(t * beatFreq)) * 0.12;
      animRefs.current.heartNode.scale.setScalar(pulse);
    }

    animRefs.current.rbcs.forEach((item) => {
      const curve = item.mesh.userData.curve as THREE.CatmullRomCurve3 | undefined;
      if (!curve) return;
      const rate = s.mode === 'circulation' ? (s.heartRate / 72) * 0.22 : 0.2;
      const p = (item.phase + t * rate) % 1;
      curve.getPointAt(p, item.mesh.position);
      const mat = item.mesh.material as THREE.MeshStandardMaterial;
      if (item.loop === 'pulm') {
        mat.color.setHex(p > 0.5 ? 0xef4444 : 0x3b82f6);
      } else if (item.loop === 'syst') {
        mat.color.setHex(p > 0.5 ? 0x3b82f6 : 0xef4444);
      } else if (s.mode === 'alveolus') {
        mat.color.setHex(p > 0.45 ? 0xef4444 : 0x3b82f6);
      }
    });

    if (s.mode === 'synapse') {
      const active = s.synapseStimulus > 0;
      animRefs.current.neurotransmitters.forEach((nt) => {
        nt.visible = active;
        if (active) {
          const p = (nt.userData.phase + t * 0.55) % 1;
          nt.position.x = -0.35 + p * 1.15;
        }
      });
    }

    if (s.mode === 'immune') {
      animRefs.current.antibodies.forEach((ab) => {
        const a = ab.userData.baseAngle + t * 0.5;
        const r = 1.2 + Math.sin(t * 1.4 + a) * 0.3;
        ab.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.75, Math.sin(a * 2) * 0.45);
        ab.lookAt(0, 0, 0);
      });
    }
  };

  const parts = PARTS_BY_MODE[mode];
  const sourceMeta: ScientificSourceMeta = {
    name: 'Mô phỏng Sinh lí Động vật 3D',
    source: 'Chuẩn kiến thức Sinh học 11 (Chương trình GDPT 2018)',
    identifier: `ANIMAL-${mode.toUpperCase()}`,
    version: '1.0',
    license: 'Học liệu số giáo dục THPT',
    dataType: 'Mô hình giản lược sư phạm',
    verifiedStatus: 'Màu đỏ biểu thị máu giàu O₂ (Oxyhemoglobin), màu xanh biểu thị máu nghèo O₂',
  };

  return (
    <div className={presentation ? 'presentation-active' : ''}>
      <div className="mb-4 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-3">
        {[
          { id: 'circulation' as AnimalSysMode, label: 'Tuần hoàn kép' },
          { id: 'nephron' as AnimalSysMode, label: 'Đơn vị thận (Nephron)' },
          { id: 'synapse' as AnimalSysMode, label: 'Truyền tin qua Synapse' },
          { id: 'alveolus' as AnimalSysMode, label: 'Trao đổi khí phế nang' },
          { id: 'immune' as AnimalSysMode, label: 'Đáp ứng miễn dịch' },
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
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <LabWorkspaceLayout
        title="Phòng Lab 08 · Sinh lí Động vật 3D"
        subtitle="Tuần hoàn máu, lọc máu ở thận, xung thần kinh qua synapse, hô hấp phế nang và miễn dịch"
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
          setHeartRate(72);
          setAdhLevel(50);
          setSynapseStimulus(1);
          viewer.resetViewAndParts();
        }}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        isPresentation={presentation}
        onTogglePresentation={() => setPresentation((v) => !v)}
        teacherGuideNote="Nhấn mạnh sự đổi màu hồng cầu (xanh → đỏ tại phổi; đỏ → xanh tại mô cơ quan) để học sinh hiểu đúng vai trò hai vòng tuần hoàn."
        sourceMeta={sourceMeta}
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`animal-${mode}`}
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
            fallbackTitle="Sơ đồ Sinh lí Động vật 2D"
            fallbackItems={parts.map((p) => `${p.vietnameseName}: ${p.function}`)}
          />
        }
        simulationControlsExtra={
          <div className="space-y-4">
            {mode === 'circulation' && (
              <div className="space-y-2">
                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-ui-min">
                    <span>Nhịp tim</span>
                    <span className="font-mono-tabular">{heartRate} lần/phút</span>
                  </div>
                  <input
                    type="range"
                    min={45}
                    max={150}
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full accent-rose-600 h-2"
                  />
                </label>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-ui-min">
                  Lưu lượng tim ước tính (với Vs = 70 mL):{' '}
                  <strong className="font-mono-tabular text-rose-700">
                    {((heartRate * 70) / 1000).toFixed(2)} L/phút
                  </strong>
                </div>
              </div>
            )}

            {mode === 'nephron' && (
              <div className="space-y-2">
                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-ui-min">
                    <span>Nồng độ hormone ADH (tái hấp thụ nước)</span>
                    <span className="font-mono-tabular">{adhLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={adhLevel}
                    onChange={(e) => setAdhLevel(Number(e.target.value))}
                    className="w-full accent-teal-700 h-2"
                  />
                </label>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-ui-min">
                  Trạng thái nước tiểu:{' '}
                  <strong>
                    {adhLevel > 70 ? 'Cô đặc, thể tích ít (giữ nước)' : adhLevel < 35 ? 'Loãng, bài xuất nhiều' : 'Cân bằng bình thường'}
                  </strong>
                </div>
              </div>
            )}

            {mode === 'synapse' && (
              <div className="space-y-2">
                <span className="font-semibold text-slate-900 text-ui-min">Trạng thái xung thần kinh:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSynapseStimulus(1)}
                    className={`min-h-[44px] rounded-lg font-semibold text-ui-min ${
                      synapseStimulus === 1 ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    Kích thích truyền tin
                  </button>
                  <button
                    type="button"
                    onClick={() => setSynapseStimulus(0)}
                    className={`min-h-[44px] rounded-lg font-semibold text-ui-min ${
                      synapseStimulus === 0 ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    Trạng thái nghỉ
                  </button>
                </div>
              </div>
            )}
          </div>
        }
        knowledgeContent={
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <h4 className="font-bold text-blue-900">Điểm trọng tâm hệ cơ quan</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-800 mt-1">
                <li><strong>Tuần hoàn kép:</strong> Có ở lưỡng cư, bò sát, chim, thú; tim 4 ngăn ở chim và thú tách biệt hoàn toàn máu giàu O₂ và nghèo O₂.</li>
                <li><strong>Thận & Nội môi:</strong> Lọc khoảng 170–180 L dịch/ngày nhưng tái hấp thụ ~99% để giữ áp suất thẩm thấu và thể tích máu ổn định.</li>
                <li><strong>Synapse hóa học:</strong> Truyền xung một chiều từ màng trước sang màng sau nhờ thụ thể đặc hiệu chỉ có ở màng sau.</li>
              </ul>
            </div>
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900">Câu hỏi phân tích</div>
              <p className="text-slate-700">
                Vì sao khi lao động nặng, nhịp tim tăng từ 72 lên 140 lần/phút nhưng thời gian một chu kì tim rút ngắn? Điều này giúp ích gì cho cơ đang hoạt động?
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
};
