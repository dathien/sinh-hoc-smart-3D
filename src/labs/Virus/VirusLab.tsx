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
import { ModelViewer3D, SceneUpdateContext } from '../../components/viewer3d/ModelViewer3D';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';

type VirusId = 't4' | 'sars-cov-2' | 'influenza-a' | 'hiv-1' | 'adenovirus' | 'tmv' | 't4-lytic';

interface VirusSpec {
  title: string;
  classification: string;
  genome: string;
  size: string;
  host: string;
  parts: ModelPartInfo[];
}

const VIRUS_SPECS: Record<VirusId, VirusSpec> = {
  t4: {
    title: 'Thể thực khuẩn T4 (Bacteriophage T4)',
    classification: 'Virus không có vỏ ngoài · Cấu trúc phức tạp · Virus DNA',
    genome: 'dsDNA mạch kép thẳng',
    size: 'Khoảng 200 × 90 nm',
    host: 'Vi khuẩn Escherichia coli',
    parts: [
      { id: 'capsid', vietnameseName: 'Đầu Capsid (khối 20 mặt kéo dài)', scientificName: 'Prolate Icosahedral Head', location: 'Phần trên cùng của phage', structure: 'Vỏ protein hình khối đa diện chứa lõi DNA.', function: 'Bảo vệ phân tử dsDNA cho đến khi xâm nhập vật chủ.', relatedLessons: ['Cấu trúc virus'], colorHex: '#0D9488' },
      { id: 'genome', vietnameseName: 'Lõi dsDNA', scientificName: 'Double-stranded DNA', location: 'Bên trong đầu capsid', structure: 'Phân tử DNA mạch kép cuộn chặt.', function: 'Mang thông tin di truyền tổng hợp phage mới.', relatedLessons: ['Chu trình nhân lên'], colorHex: '#6366F1' },
      { id: 'sheath', vietnameseName: 'Bao đuôi xoắn lò xo', scientificName: 'Contractile Tail Sheath', location: 'Nối giữa cổ và đĩa gốc', structure: 'Ống protein có khả năng co rút.', function: 'Co lại đẩy ống lõi xuyên qua thành tế bào vi khuẩn.', relatedLessons: ['Chu trình tan'], colorHex: '#38BDF8' },
      { id: 'fibers', vietnameseName: 'Đĩa gốc & 6 Sợi đuôi', scientificName: 'Baseplate & Tail Fibers', location: 'Phần chân dưới cùng', structure: 'Đĩa lục giác có gai bám và 6 chân khớp.', function: 'Nhận diện đặc hiệu thụ thể bề mặt vi khuẩn E. coli.', relatedLessons: ['Hấp phụ virus'], colorHex: '#F59E0B' },
    ],
  },
  'sars-cov-2': {
    title: 'SARS-CoV-2 (Coronavirus)',
    classification: 'Virus có vỏ ngoài (Envelope) · Cấu trúc xoắn bên trong · Virus RNA',
    genome: 'ssRNA (+) không phân đoạn',
    size: 'Đường kính ~100–120 nm',
    host: 'Tế bào biểu mô hô hấp người (thụ thể ACE2)',
    parts: [
      { id: 'spike', vietnameseName: 'Gai Glycoprotein S (Spike)', scientificName: 'Spike Trimeric Glycoprotein', location: 'Nhô ra trên vỏ ngoài tạo hình vương miện', structure: 'Protein S dạng tam phân (trimer).', function: 'Gắn đặc hiệu vào thụ thể ACE2 của tế bào chủ.', relatedLessons: ['Cấu trúc virus'], colorHex: '#EF4444' },
      { id: 'envelope', vietnameseName: 'Vỏ ngoài Lipid & Protein M, E', scientificName: 'Lipid Bilayer Envelope', location: 'Lớp màng bao bên ngoài', structure: 'Lớp kép phospholipid lấy từ màng tế bào chủ.', function: 'Bảo vệ lõi và hỗ trợ hòa màng; nhạy cảm với xà phòng/cồn.', relatedLessons: ['Phòng chống bệnh virus'], colorHex: '#0D9488' },
      { id: 'genome', vietnameseName: 'Phức hệ Nucleocapsid & ssRNA', scientificName: 'Helical Nucleocapsid (N) + ssRNA', location: 'Trung tâm hạt virus', structure: 'Sợi RNA (+) gắn protein N cuộn xoắn.', function: 'Vật chất di truyền mã hóa protein virus.', relatedLessons: ['Virus RNA'], colorHex: '#FACC15' },
    ],
  },
  'influenza-a': {
    title: 'Virus Cúm A (Influenza A)',
    classification: 'Virus có vỏ ngoài · Lõi xoắn 8 đoạn · Virus RNA',
    genome: '8 phân đoạn ssRNA (−)',
    size: 'Đường kính ~80–120 nm',
    host: 'Người, gia cầm, lợn',
    parts: [
      { id: 'ha-na', vietnameseName: 'Gai HA & NA', scientificName: 'Hemagglutinin & Neuraminidase', location: 'Bề mặt vỏ ngoài', structure: 'Hai loại glycoprotein đặc trưng (ví dụ H1N1, H5N1).', function: 'HA giúp bám xâm nhập; NA giúp giải phóng hạt virus mới.', relatedLessons: ['Virus cúm'], colorHex: '#3B82F6' },
      { id: 'envelope', vietnameseName: 'Vỏ ngoài & Đệm M1', scientificName: 'Lipid Envelope & Matrix M1', location: 'Bao quanh lõi', structure: 'Lớp màng lipid có lớp protein M1 bên trong.', function: 'Duy trì hình cầu và bảo vệ 8 đoạn RNA.', relatedLessons: ['Cấu trúc virus'], colorHex: '#14B8A6' },
      { id: 'genome', vietnameseName: '8 đoạn Ribonucleoprotein RNA', scientificName: '8 Segmented ssRNA (−)', location: 'Bên trong lõi', structure: '8 phân đoạn RNA riêng biệt.', function: 'Cho phép tái tổ hợp tạo biến chủng cúm mới.', relatedLessons: ['Biến dị virus'], colorHex: '#F97316' },
    ],
  },
  'hiv-1': {
    title: 'Virus HIV-1 (Retrovirus)',
    classification: 'Virus có vỏ ngoài · Capsid hình nón · Virus RNA phiên mã ngược',
    genome: '2 bản sao ssRNA (+)',
    size: 'Đường kính ~120 nm',
    host: 'Tế bào miễn dịch T-CD4 ở người',
    parts: [
      { id: 'gp120', vietnameseName: 'Gai gp120 / gp41', scientificName: 'Envelope Glycoprotein', location: 'Trên bề mặt vỏ ngoài', structure: 'Phức hợp protein gắn kết màng.', function: 'Nhận diện thụ thể CD4 và đồng thụ thể trên tế bào T.', relatedLessons: ['HIV & Miễn dịch'], colorHex: '#EC4899' },
      { id: 'envelope', vietnameseName: 'Vỏ ngoài Lipid & Ma trận p17', scientificName: 'Lipid Envelope & p17 Matrix', location: 'Bao bọc ngoài capsid', structure: 'Màng lipid kép lót lớp protein p17.', function: 'Hòa màng xâm nhập tế bào T-CD4.', relatedLessons: ['Cấu trúc HIV'], colorHex: '#0EA5E9' },
      { id: 'capsid', vietnameseName: 'Capsid hình nón (p24)', scientificName: 'Conical Capsid p24', location: 'Trung tâm hạt virus', structure: 'Vỏ protein hình nón cụt đặc trưng của HIV.', function: 'Chứa lõi RNA và enzyme phiên mã ngược.', relatedLessons: ['Cấu trúc HIV'], colorHex: '#22C55E' },
      { id: 'genome', vietnameseName: '2 sợi ssRNA & Enzyme phiên mã ngược', scientificName: 'ssRNA + Reverse Transcriptase', location: 'Bên trong capsid hình nón', structure: '2 phân tử RNA đơn và enzyme RT, Integrase.', function: 'Phiên mã ngược RNA → DNA cài vào hệ gene tế bào chủ.', relatedLessons: ['Cơ chế nhân lên HIV'], colorHex: '#FACC15' },
    ],
  },
  adenovirus: {
    title: 'Adenovirus',
    classification: 'Virus KHÔNG có vỏ ngoài (virus trần) · Cấu trúc khối 20 mặt · Virus DNA',
    genome: 'dsDNA mạch kép thẳng',
    size: 'Đường kính ~90 nm',
    host: 'Tế bào đường hô hấp, kết mạc mắt người',
    parts: [
      { id: 'capsid', vietnameseName: 'Capsid khối 20 mặt (252 capsomere)', scientificName: 'Naked Icosahedral Capsid', location: 'Lớp ngoài cùng (không có vỏ lipid)', structure: '240 hexon và 12 penton tạo khối 20 mặt đều.', function: 'Bền vững cao ngoài môi trường, bảo vệ dsDNA.', relatedLessons: ['Phân loại virus'], colorHex: '#2563EB' },
      { id: 'fibers', vietnameseName: '12 Gai sợi tại đỉnh khối', scientificName: 'Penton Base & Fiber Knobs', location: '12 đỉnh khối đa diện', structure: 'Sợi protein nhô thẳng có đầu tròn bám thụ thể.', function: 'Gắn vào tế bào chủ để xâm nhập.', relatedLessons: ['Cấu trúc virus'], colorHex: '#F97316' },
      { id: 'genome', vietnameseName: 'Lõi dsDNA', scientificName: 'Linear dsDNA', location: 'Trung tâm capsid', structure: 'DNA mạch kép gắn protein lõi.', function: 'Sao chép trong nhân tế bào chủ.', relatedLessons: ['Virus DNA'], colorHex: '#A855F7' },
    ],
  },
  tmv: {
    title: 'Virus Khảm Thuốc Lá (TMV)',
    classification: 'Virus KHÔNG có vỏ ngoài · Cấu trúc xoắn hình que · Virus RNA',
    genome: 'ssRNA (+)',
    size: 'Dài ~300 nm, đường kính ~18 nm',
    host: 'Tế bào thực vật (cây thuốc lá, cà chua...)',
    parts: [
      { id: 'capsid', vietnameseName: 'Capsid xoắn ốc (2130 capsomere)', scientificName: 'Helical Capsid Subunits', location: 'Xếp xoắn ốc tạo ống trụ rỗng', structure: 'Các tiểu đơn vị protein giống nhau xếp theo đường xoắn.', function: 'Bao bọc bảo vệ chặt chẽ sợi RNA bên trong.', relatedLessons: ['Cấu trúc xoắn của virus'], colorHex: '#10B981' },
      { id: 'genome', vietnameseName: 'Sợi ssRNA xoắn ở lõi', scientificName: 'Helical ssRNA (+)', location: 'Nằm trong rãnh xoắn bên trong ống capsid', structure: 'Phân tử RNA mạch đơn xoắn đồng trục với capsid.', function: 'Mang thông tin di truyền gây bệnh khảm lá.', relatedLessons: ['Virus thực vật'], colorHex: '#EF4444' },
    ],
  },
  't4-lytic': {
    title: 'Chu trình tan của Thể thực khuẩn T4 (5 giai đoạn)',
    classification: 'Hoạt cảnh mô phỏng quá trình nhân lên làm tan tế bào vi khuẩn',
    genome: 'dsDNA T4 → Tế bào E. coli',
    size: 'Tỉ lệ minh họa sư phạm',
    host: 'Vi khuẩn E. coli',
    parts: [
      { id: 'host', vietnameseName: 'Tế bào vi khuẩn chủ', scientificName: 'Host Bacterium (E. coli)', location: 'Phía dưới trường quan sát', structure: 'Thành tế bào, màng sinh chất và DNA chủ.', function: 'Bị T4 chiếm bộ máy sinh tổng hợp để tạo virus mới.', relatedLessons: ['Chu trình tan'], colorHex: '#0D9488' },
      { id: 'phage', vietnameseName: 'Thể thực khuẩn T4 & Phage mới', scientificName: 'T4 Phage Particles', location: 'Bám trên bề mặt & lắp ráp bên trong', structure: 'Capsid, đuôi và sợi đuôi.', function: 'Hấp phụ, bơm DNA, nhân lên và phá vỡ tế bào.', relatedLessons: ['Chu trình tan'], colorHex: '#F59E0B' },
    ],
  },
};

const LYTIC_STAGES = [
  '1. Hấp phụ: Sợi đuôi T4 bám đặc hiệu vào thụ thể trên thành tế bào vi khuẩn.',
  '2. Xâm nhập: Bao đuôi co rút, bơm lõi DNA T4 vào tế bào chất vi khuẩn (vỏ capsid ở ngoài).',
  '3. Sinh tổng hợp: DNA phage chỉ huy tổng hợp vỏ protein và sao chép nhiều bản DNA phage.',
  '4. Lắp ráp: Các bộ phận đầu, đuôi, sợi đuôi và DNA lắp ráp thành hạt phage hoàn chỉnh.',
  '5. Giải phóng: Enzyme lysozyme phá vỡ thành tế bào chủ, giải phóng các phage mới.',
];

export const VirusLab: React.FC<{
  isPresentation?: boolean;
  onTogglePresentation?: () => void;
}> = ({ isPresentation, onTogglePresentation }) => {
  const viewer = useLabViewerState(true);
  const [virusId, setVirusId] = useState<VirusId>('t4');
  const [hideEnvelope, setHideEnvelope] = useState(false);
  const [lyticStage, setLyticStage] = useState(0); // 0..4 for manual step or auto
  const [autoCycle, setAutoCycle] = useState(true);

  // Bacterial Growth Simulator controls
  const [nutrientLevel, setNutrientLevel] = useState(80);
  const [tempC, setTempC] = useState(37);

  const lyticRefs = useRef<{
    phageGroup?: THREE.Group;
    dnaStrand?: THREE.Mesh;
    progenyGroup?: THREE.Group;
    hostShell?: THREE.Mesh;
  }>({});

  const spec = VIRUS_SPECS[virusId];

  const growthData = useMemo(() => {
    const tempFactor = Math.max(0.2, 1 - Math.abs(tempC - 37) / 28);
    const maxLog = 4 + (nutrientLevel / 100) * 5.2 * tempFactor;
    const pts = [];
    for (let h = 0; h <= 24; h += 2) {
      let logN = 4.0;
      let phase = 'Tiềm phát';
      if (h <= 4) {
        logN = 4.0 + (h / 4) * 0.25;
        phase = 'Pha tiềm phát (Lag)';
      } else if (h <= 12) {
        logN = 4.25 + ((h - 4) / 8) * (maxLog - 4.25);
        phase = 'Pha lũy thừa (Log)';
      } else if (h <= 18) {
        logN = maxLog - Math.sin(((h - 12) / 6) * Math.PI) * 0.05;
        phase = 'Pha cân bằng';
      } else {
        logN = Math.max(3.5, maxLog - ((h - 18) / 6) * 1.9);
        phase = 'Pha suy vong';
      }
      pts.push({ hour: `${h}h`, logN: Number(logN.toFixed(2)), phase });
    }
    return pts;
  }, [nutrientLevel, tempC]);

  const sourceMeta: ScientificSourceMeta = {
    name: spec.title,
    source: 'Mô hình hình thái học Virus SINH HỌC SMART 3D (đối chiếu cấu trúc capsid & lõi di truyền chuẩn)',
    identifier: `VIRUS-${virusId.toUpperCase()}`,
    version: '1.0',
    license: 'Tài nguyên giáo dục nội bộ',
    dataType: 'Mô hình giản lược sư phạm',
    verifiedStatus: 'Phân biệt đúng virus có vỏ ngoài/trần, DNA/RNA và kiểu đối xứng',
    scaleNote: 'Số lượng capsomere (như 252 ở Adenovirus hay 2130 ở TMV) được giản lược hình học để đảm bảo tốc độ hiển thị 3D mượt mà.',
  };

  const buildModel = useMemo(() => {
    return (rootGroup: THREE.Group, quality: QualityLevel) => {
      lyticRefs.current = {};
      const segs = quality === 'low' ? 14 : 24;

      if (virusId === 't4') {
        const head = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.95, 0),
          new THREE.MeshPhysicalMaterial({ color: 0x0d9488, roughness: 0.35, transparent: true, opacity: 0.72, flatShading: true }),
        );
        head.scale.set(0.88, 1.25, 0.88);
        head.position.set(0, 1.55, 0);
        head.userData.partId = 'capsid';
        head.userData.explodeDir = new THREE.Vector3(0, 1.0, 0);
        rootGroup.add(head);

        const dna = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.36, 0.055, 64, 8, 3, 5),
          new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.35 }),
        );
        dna.position.set(0, 1.55, 0);
        dna.userData.partId = 'genome';
        rootGroup.add(dna);

        const sheathGroup = new THREE.Group();
        sheathGroup.userData.partId = 'sheath';
        const coreTube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 1.55, 14),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 }),
        );
        coreTube.position.set(0, -0.15, 0);
        sheathGroup.add(coreTube);
        for (let r = 0; r < 10; r++) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.22, 0.055, 8, 18),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 }),
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(0, 0.45 - r * 0.13, 0);
          sheathGroup.add(ring);
        }
        rootGroup.add(sheathGroup);

        const baseGroup = new THREE.Group();
        baseGroup.userData.partId = 'fibers';
        const baseplate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.52, 0.16, 6),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }),
        );
        baseplate.position.set(0, -0.95, 0);
        baseGroup.add(baseplate);
        const legMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 });
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const pts = [
            new THREE.Vector3(Math.cos(ang) * 0.42, -0.95, Math.sin(ang) * 0.42),
            new THREE.Vector3(Math.cos(ang) * 1.15, -0.45, Math.sin(ang) * 1.15),
            new THREE.Vector3(Math.cos(ang) * 1.55, -1.65, Math.sin(ang) * 1.55),
          ];
          const leg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.04, 8, false), legMat);
          baseGroup.add(leg);
        }
        rootGroup.add(baseGroup);
        return { initialCameraDir: new THREE.Vector3(0.45, 0.25, 1) };
      }

      if (virusId === 'sars-cov-2' || virusId === 'influenza-a' || virusId === 'hiv-1') {
        const envRadius = 1.45;
        if (!hideEnvelope) {
          const env = new THREE.Mesh(
            new THREE.SphereGeometry(envRadius, segs, segs, 0, Math.PI * 1.55),
            new THREE.MeshPhysicalMaterial({
              color: virusId === 'sars-cov-2' ? 0x0d9488 : virusId === 'hiv-1' ? 0x0ea5e9 : 0x14b8a6,
              roughness: 0.38,
              transparent: true,
              opacity: 0.78,
              side: THREE.DoubleSide,
            }),
          );
          env.userData.partId = 'envelope';
          env.userData.explodeDir = new THREE.Vector3(0, 0.6, 0);
          rootGroup.add(env);

          // Surface Spike Glycoproteins
          const spikeGroup = new THREE.Group();
          spikeGroup.userData.partId = virusId === 'sars-cov-2' ? 'spike' : virusId === 'hiv-1' ? 'gp120' : 'ha-na';
          const spikeMat = new THREE.MeshStandardMaterial({
            color: virusId === 'sars-cov-2' ? 0xef4444 : virusId === 'hiv-1' ? 0xec4899 : 0x3b82f6,
            roughness: 0.35,
          });
          const golden = Math.PI * (3 - Math.sqrt(5));
          for (let i = 0; i < 36; i++) {
            const y = 1 - (i / 35) * 2;
            const r = Math.sqrt(1 - y * y);
            const theta = golden * i;
            const dir = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize();
            // leave cutaway front open
            if (dir.z > 0.45 && dir.x > -0.3) continue;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.42, 8), spikeMat);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), spikeMat);
            const g = new THREE.Group();
            stem.position.y = 0.21;
            head.position.y = 0.42;
            g.add(stem, head);
            g.position.copy(dir).multiplyScalar(envRadius);
            g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            spikeGroup.add(g);
          }
          rootGroup.add(spikeGroup);
        }

        if (virusId === 'hiv-1') {
          const cone = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.62, 1.35, 16),
            new THREE.MeshPhysicalMaterial({ color: 0x22c55e, roughness: 0.4, transparent: true, opacity: 0.65 }),
          );
          cone.userData.partId = 'capsid';
          rootGroup.add(cone);

          const rnaGroup = new THREE.Group();
          rnaGroup.userData.partId = 'genome';
          [-0.12, 0.12].forEach((dx) => {
            const strand = new THREE.Mesh(
              new THREE.TorusKnotGeometry(0.16, 0.03, 40, 6, 2, 3),
              new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }),
            );
            strand.position.set(dx, 0, 0);
            rnaGroup.add(strand);
          });
          rootGroup.add(rnaGroup);
        } else if (virusId === 'influenza-a') {
          const segGroup = new THREE.Group();
          segGroup.userData.partId = 'genome';
          const rnpMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 });
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const rod = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.55 + (i % 3) * 0.15, 6, 10), rnpMat);
            rod.position.set(Math.cos(ang) * 0.42, 0, Math.sin(ang) * 0.42);
            segGroup.add(rod);
          }
          rootGroup.add(segGroup);
        } else {
          const rna = new THREE.Mesh(
            new THREE.TorusKnotGeometry(0.65, 0.08, 90, 10, 3, 7),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 }),
          );
          rna.userData.partId = 'genome';
          rootGroup.add(rna);
        }
        return { initialCameraDir: new THREE.Vector3(0.55, 0.25, 0.85) };
      }

      if (virusId === 'adenovirus') {
        const icosa = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.45, 0),
          new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: 0.35, flatShading: true, transparent: true, opacity: 0.82 }),
        );
        icosa.userData.partId = 'capsid';
        rootGroup.add(icosa);

        // 12 Vertex Fiber Spikes
        const fiberGroup = new THREE.Group();
        fiberGroup.userData.partId = 'fibers';
        const posAttr = new THREE.IcosahedronGeometry(1.45, 0).attributes.position;
        const uniqueVerts: THREE.Vector3[] = [];
        for (let i = 0; i < posAttr.count; i++) {
          const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
          if (!uniqueVerts.some((u) => u.distanceTo(v) < 0.1)) uniqueVerts.push(v);
        }
        const fMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 });
        uniqueVerts.forEach((v) => {
          const dir = v.clone().normalize();
          const g = new THREE.Group();
          const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), fMat);
          stalk.position.y = 0.325;
          const knob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), fMat);
          knob.position.y = 0.68;
          g.add(stalk, knob);
          g.position.copy(v);
          g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          fiberGroup.add(g);
        });
        rootGroup.add(fiberGroup);

        const dna = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.58, 0.08, 70, 8, 2, 5),
          new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.35 }),
        );
        dna.userData.partId = 'genome';
        rootGroup.add(dna);
        return { initialCameraDir: new THREE.Vector3(0.45, 0.35, 1) };
      }

      if (virusId === 'tmv') {
        // Helical stacked capsomeres (InstancedMesh)
        const capCount = 96;
        const capGeo = new THREE.CapsuleGeometry(0.11, 0.25, 6, 10);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
        const capInst = new THREE.InstancedMesh(capGeo, capMat, capCount);
        capInst.userData.partId = 'capsid';
        const d = new THREE.Object3D();
        for (let i = 0; i < capCount; i++) {
          const ang = i * 0.52;
          const y = -1.9 + (i / capCount) * 3.8;
          // Leave upper front open slightly to see ssRNA spiral inside
          if (y > 0.2 && Math.sin(ang) > 0.35) {
            d.scale.setScalar(0);
          } else {
            d.scale.setScalar(1);
          }
          d.position.set(Math.cos(ang) * 0.55, y, Math.sin(ang) * 0.55);
          d.rotation.set(0, -ang, Math.PI / 2);
          d.updateMatrix();
          capInst.setMatrixAt(i, d.matrix);
        }
        capInst.computeBoundingSphere();
        rootGroup.add(capInst);

        // Helical ssRNA core
        const rnaPts: THREE.Vector3[] = [];
        for (let i = 0; i <= 80; i++) {
          const ang = i * 0.5;
          const y = -1.9 + (i / 80) * 3.8;
          rnaPts.push(new THREE.Vector3(Math.cos(ang) * 0.26, y, Math.sin(ang) * 0.26));
        }
        const rnaMesh = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rnaPts), 100, 0.055, 8, false),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }),
        );
        rnaMesh.userData.partId = 'genome';
        rootGroup.add(rnaMesh);
        return { initialCameraDir: new THREE.Vector3(0.45, 0.2, 1) };
      }

      // MODE: T4 LYTIC CYCLE 5-STAGE ANIMATION
      const hostShell = new THREE.Mesh(
        new THREE.CapsuleGeometry(1.45, 2.5, 12, segs),
        new THREE.MeshPhysicalMaterial({ color: 0x0d9488, roughness: 0.45, transparent: true, opacity: 0.45 }),
      );
      hostShell.rotation.z = Math.PI / 2;
      hostShell.position.set(0, -1.25, 0);
      hostShell.userData.partId = 'host';
      rootGroup.add(hostShell);

      // Attaching Phage
      const phageGroup = new THREE.Group();
      phageGroup.userData.partId = 'phage';
      const pHead = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.45, 0),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 }),
      );
      pHead.position.y = 0.85;
      const pTail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.75, 10),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 }),
      );
      pTail.position.y = 0.25;
      phageGroup.add(pHead, pTail);
      phageGroup.position.set(0, 0.8, 0);
      rootGroup.add(phageGroup);

      // Injected DNA
      const dnaStrand = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.28, 0.04, 48, 8, 2, 3),
        new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x4f46e5, emissiveIntensity: 0.5 }),
      );
      dnaStrand.position.set(0, -0.9, 0);
      rootGroup.add(dnaStrand);

      // Newly assembled progeny phages inside host
      const progenyGroup = new THREE.Group();
      progenyGroup.userData.partId = 'phage';
      for (let i = 0; i < 6; i++) {
        const mini = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.22, 0),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3 }),
        );
        mini.position.set(-1.0 + i * 0.4, -1.25 + (i % 2) * 0.35, (i % 3 - 1) * 0.35);
        progenyGroup.add(mini);
      }
      rootGroup.add(progenyGroup);

      lyticRefs.current = { phageGroup, dnaStrand, progenyGroup, hostShell };
      return { initialCameraDir: new THREE.Vector3(0.25, 0.35, 1) };
    };
  }, [virusId, hideEnvelope]);

  const handleAnimateFrame = (ctx: SceneUpdateContext) => {
    if (virusId !== 't4-lytic') return;
    const refs = lyticRefs.current;
    const t = ctx.isPlaying ? ctx.elapsed * ctx.speed : ctx.simTime;
    const activeStage = autoCycle ? Math.floor((t * 0.45) % 5) : lyticStage;

    if (refs.phageGroup) {
      refs.phageGroup.position.y = activeStage === 0 ? 0.55 : 0.25;
      refs.phageGroup.scale.y = activeStage >= 1 ? 0.85 : 1;
    }
    if (refs.dnaStrand) {
      refs.dnaStrand.visible = activeStage >= 1 && activeStage <= 3;
      refs.dnaStrand.rotation.y = t * 1.5;
    }
    if (refs.progenyGroup) {
      refs.progenyGroup.visible = activeStage >= 2;
      refs.progenyGroup.children.forEach((child, idx) => {
        if (activeStage === 4) {
          child.position.y = -0.3 + Math.sin(t * 2 + idx) * 0.5 + 0.6;
        } else {
          child.position.y = -1.25 + (idx % 2) * 0.35;
        }
      });
    }
    if (refs.hostShell) {
      const mat = refs.hostShell.material as THREE.MeshPhysicalMaterial;
      mat.opacity = activeStage === 4 ? 0.16 : 0.45;
      refs.hostShell.scale.setScalar(activeStage === 4 ? 1.12 : 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        {(
          [
            ['t4', 'Thể thực khuẩn T4'],
            ['sars-cov-2', 'SARS-CoV-2'],
            ['influenza-a', 'Virus Cúm A'],
            ['hiv-1', 'HIV-1'],
            ['adenovirus', 'Adenovirus'],
            ['tmv', 'TMV (Khảm thuốc lá)'],
            ['t4-lytic', 'Chu trình tan T4 (5 bước)'],
          ] as [VirusId, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setVirusId(id);
              viewer.setSelectedPartId(null);
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
              virusId === id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <LabWorkspaceLayout
        title={`Phòng Lab 03 – ${spec.title}`}
        subtitle={`${spec.classification} · Hệ gene: ${spec.genome} · Kích thước: ${spec.size}`}
        viewerRef={viewer.viewerRef}
        parts={spec.parts}
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
        onStepForward={() => {
          setAutoCycle(false);
          setLyticStage((s) => (s + 1) % 5);
        }}
        onResetSim={() => {
          setAutoCycle(true);
          setLyticStage(0);
          setHideEnvelope(false);
          viewer.resetViewAndParts();
        }}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        sourceMeta={sourceMeta}
        isPresentation={isPresentation}
        onTogglePresentation={onTogglePresentation}
        teacherGuideNote={`Vật chủ chính: ${spec.host}. Có thể ẩn vỏ ngoài (với virus có vỏ ngoài) để quan sát cấu trúc lõi bên trong.`}
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`virus-${virusId}-${hideEnvelope}`}
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
            parts={spec.parts}
            quality={viewer.quality}
            fallbackTitle={spec.title}
            fallbackItems={spec.parts.map((p) => `${p.vietnameseName}: ${p.structure}`)}
          />
        }
        simulationControlsExtra={
          <div className="space-y-4">
            {(virusId === 'sars-cov-2' || virusId === 'influenza-a' || virusId === 'hiv-1') && (
              <label className="flex items-center gap-2 text-slate-800 text-ui-min cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={hideEnvelope}
                  onChange={(e) => setHideEnvelope(e.target.checked)}
                  className="w-5 h-5 accent-teal-700"
                />
                <span>Ẩn lớp vỏ ngoài lipid để quan sát lõi bên trong</span>
              </label>
            )}

            {virusId === 't4-lytic' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-ui-min">5 giai đoạn Chu trình tan:</span>
                  <button
                    type="button"
                    onClick={() => setAutoCycle((v) => !v)}
                    className="min-h-[44px] px-3 py-1 rounded-lg bg-blue-50 text-blue-800 font-medium text-ui-min"
                  >
                    {autoCycle ? 'Đang chạy tự động' : 'Chọn thủ công'}
                  </button>
                </div>
                {LYTIC_STAGES.map((st, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAutoCycle(false);
                      setLyticStage(idx);
                    }}
                    className={`w-full min-h-[44px] text-left px-3 py-2 rounded-lg border text-ui-min ${
                      !autoCycle && lyticStage === idx
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}

            {/* Microbial Growth Curve Simulator */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-ui-label">
                Mô phỏng 4 pha sinh trưởng vi khuẩn (Dữ liệu giả lập minh họa)
              </h4>
              <label className="block space-y-1">
                <div className="flex justify-between text-slate-800 text-ui-min">
                  <span>Hàm lượng dinh dưỡng:</span>
                  <span className="font-mono-tabular">{nutrientLevel}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={nutrientLevel}
                  onChange={(e) => setNutrientLevel(Number(e.target.value))}
                  className="w-full accent-teal-700 h-2"
                />
              </label>
              <label className="block space-y-1">
                <div className="flex justify-between text-slate-800 text-ui-min">
                  <span>Nhiệt độ nuôi cấy:</span>
                  <span className="font-mono-tabular">{tempC} °C</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={55}
                  value={tempC}
                  onChange={(e) => setTempC(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2"
                />
              </label>
              <div className="h-[220px] w-full bg-slate-50 rounded-lg p-2 border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                    <XAxis dataKey="hour" tick={{ fontSize: 15, fill: '#334155' }} />
                    <YAxis domain={[3, 10]} tick={{ fontSize: 15, fill: '#334155' }} />
                    <Tooltip
                      contentStyle={{ fontSize: '15px', borderRadius: '8px' }}
                      formatter={(val) => [`${val ?? 0} log(CFU/mL)`, 'Mật độ vi khuẩn']}
                    />
                    <Line type="monotone" dataKey="logN" stroke="#0D9488" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        }
        knowledgeContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">Đặc điểm phân loại Virus</h4>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>Virus trần</strong> (Adenovirus, TMV, T4): chỉ gồm lõi nucleic acid và vỏ capsid.</li>
              <li><strong>Virus có vỏ ngoài</strong> (SARS-CoV-2, Cúm A, HIV-1): thêm lớp màng lipid kép và gai glycoprotein.</li>
              <li><strong>Cấu trúc:</strong> Xoắn (TMV), Khối (Adenovirus), Phức tạp (T4).</li>
            </ul>
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">Hoạt động thực hành</h4>
            <p className="text-slate-700">
              1. So sánh cấu trúc vỏ ngoài của SARS-CoV-2 với capsid trần của Adenovirus để giải thích tác dụng của xà phòng rửa tay.
            </p>
            <p className="text-slate-700">
              2. Chạy Chu trình tan T4 từng bước và mô tả số phận vỏ capsid bên ngoài tế bào vi khuẩn.
            </p>
          </div>
        }
      />
    </div>
  );
};
