import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ModelViewer3D, SceneUpdateContext } from '../../components/viewer3d/ModelViewer3D';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';

type CellModelId =
  | 'animal'
  | 'plant'
  | 'bacteria'
  | 'mitochondrion'
  | 'chloroplast'
  | 'membrane'
  | 'transport-sim'
  | 'plasmolysis-sim';

type TransportMode =
  | 'simple-diffusion'
  | 'facilitated'
  | 'osmosis'
  | 'active-atp'
  | 'endocytosis'
  | 'exocytosis';

type TonicityMode = 'hypertonic' | 'isotonic' | 'hypotonic';

const ANIMAL_PARTS: ModelPartInfo[] = [
  { id: 'plasma-mem', vietnameseName: 'Màng sinh chất', scientificName: 'Membrana cellularis', location: 'Lớp ngoài cùng bao bọc tế bào', structure: 'Lớp kép phospholipid và protein khảm động.', function: 'Trao đổi chất có chọn lọc và tiếp nhận thông tin.', relatedLessons: ['Cấu trúc tế bào nhân thực'], colorHex: '#38BDF8' },
  { id: 'nucleus', vietnameseName: 'Nhân & Nhân con', scientificName: 'Nucleus & Nucleolus', location: 'Trung tâm tế bào', structure: 'Màng nhân kép có lỗ nhân, chất nhiễm sắc và nhân con.', function: 'Lưu giữ thông tin di truyền DNA và điều khiển hoạt động tế bào.', relatedLessons: ['Cấu trúc tế bào nhân thực'], colorHex: '#6366F1' },
  { id: 'rough-er', vietnameseName: 'Lưới nội chất hạt', scientificName: 'Reticulum endoplasmaticum granulosum', location: 'Bao quanh màng nhân', structure: 'Hệ thống túi dẹt gắn các hạt ribosome trên bề mặt.', function: 'Tổng hợp protein tiết và protein màng.', relatedLessons: ['Cấu trúc tế bào nhân thực'], colorHex: '#0EA5E9' },
  { id: 'smooth-er', vietnameseName: 'Lưới nội chất trơn', scientificName: 'Reticulum endoplasmaticum agranulosum', location: 'Nối tiếp lưới nội chất hạt', structure: 'Hệ thống ống nhánh không gắn ribosome.', function: 'Tổng hợp lipid, chuyển hóa đường và khử độc.', relatedLessons: ['Cấu trúc tế bào nhân thực'], colorHex: '#2DD4BF' },
  { id: 'golgi', vietnameseName: 'Bộ máy Golgi', scientificName: 'Complexus golgianus', location: 'Gần lưới nội chất', structure: 'Chồng túi màng dẹt xếp song song cùng túi tiết.', function: 'Sửa đổi, phân loại, đóng gói và phân phối sản phẩm.', relatedLessons: ['Cấu trúc tế bào nhân thực'], colorHex: '#10B981' },
  { id: 'mitochondria', vietnameseName: 'Ti thể', scientificName: 'Mitochondria', location: 'Phân bố trong tế bào chất', structure: 'Màng kép, màng trong gấp nếp tạo mào (cristae) chứa enzyme hô hấp.', function: 'Hô hấp tế bào tạo phần lớn ATP cho tế bào.', relatedLessons: ['Hô hấp tế bào'], colorHex: '#F97316' },
  { id: 'lysosome', vietnameseName: 'Lysosome & Peroxisome', scientificName: 'Lysosoma & Peroxisoma', location: 'Trong tế bào chất', structure: 'Túi màng đơn chứa enzyme thủy phân (lysosome) hoặc enzyme oxi hóa.', function: 'Tiêu hóa nội bào, phân giải bào quan già và giải độc.', relatedLessons: ['Cấu trúc tế bào nhân thực'], colorHex: '#EAB308' },
  { id: 'centrosome', vietnameseName: 'Trung thể', scientificName: 'Centrosoma', location: 'Gần nhân tế bào động vật', structure: 'Hai trung tử xếp vuông góc nhau tạo từ bộ ba vi ống.', function: 'Tổ chức thoi phân bào khi tế bào phân chia.', relatedLessons: ['Nguyên phân'], colorHex: '#EC4899' },
  { id: 'ribosome', vietnameseName: 'Ribosome (80S)', scientificName: 'Ribosoma', location: 'Tự do trong tế bào chất và trên lưới nội chất hạt', structure: 'Tiểu phần lớn và tiểu phần nhỏ cấu tạo từ rRNA và protein.', function: 'Dịch mã tổng hợp chuỗi polypeptide.', relatedLessons: ['Dịch mã'], colorHex: '#A855F7' },
];

const PLANT_PARTS: ModelPartInfo[] = [
  { id: 'cell-wall', vietnameseName: 'Thành tế bào & Cầu sinh chất', scientificName: 'Paries cellularis & Plasmodesmata', location: 'Ngoài cùng bao quanh màng sinh chất', structure: 'Các sợi cellulose bền chắc có các kênh cầu sinh chất xuyên qua.', function: 'Quy định hình dạng, bảo vệ cơ học và trao đổi chất giữa các tế bào liền kề.', relatedLessons: ['Cấu trúc tế bào thực vật'], colorHex: '#15803D' },
  { id: 'plasma-mem', vietnameseName: 'Màng sinh chất', scientificName: 'Membrana cellularis', location: 'Nằm sát bên trong thành tế bào', structure: 'Lớp kép phospholipid và protein màng.', function: 'Kiểm soát vận chuyển các chất ra vào khối nguyên sinh.', relatedLessons: ['Co nguyên sinh'], colorHex: '#38BDF8' },
  { id: 'vacuole', vietnameseName: 'Không bào trung tâm', scientificName: 'Vacuola centralis', location: 'Chiếm thể tích lớn ở trung tâm tế bào', structure: 'Túi màng đơn chứa dịch bào (nước, muối khoáng, sắc tố).', function: 'Điều chỉnh áp suất thẩm thấu, dự trữ nước và chất dinh dưỡng.', relatedLessons: ['Thẩm thấu & Co nguyên sinh'], colorHex: '#7DD3FC' },
  { id: 'chloroplast', vietnameseName: 'Lục lạp', scientificName: 'Chloroplastus', location: 'Trong tế bào chất thực vật', structure: 'Màng kép, bên trong có hệ thylakoid xếp chồng (grana) và chất nền stroma.', function: 'Thực hiện quang hợp chuyển hóa quang năng thành hóa năng.', relatedLessons: ['Quang hợp'], colorHex: '#22C55E' },
  { id: 'nucleus', vietnameseName: 'Nhân tế bào', scientificName: 'Nucleus', location: 'Thường bị đẩy lệch về một phía bởi không bào lớn', structure: 'Màng nhân kép, chất nhiễm sắc và nhân con.', function: 'Điều khiển mọi hoạt động sống của tế bào thực vật.', relatedLessons: ['Cấu trúc tế bào nhân thực'], colorHex: '#6366F1' },
  { id: 'mitochondria', vietnameseName: 'Ti thể', scientificName: 'Mitochondria', location: 'Trong tế bào chất', structure: 'Màng kép, màng trong gấp nếp tạo mào.', function: 'Hô hấp hiếu khí cung cấp ATP cho tế bào thực vật.', relatedLessons: ['Hô hấp ở thực vật'], colorHex: '#F97316' },
  { id: 'golgi', vietnameseName: 'Bộ máy Golgi & Lưới nội chất', scientificName: 'Complexus golgianus', location: 'Gần nhân tế bào', structure: 'Túi dẹt xếp chồng và mạng lưới màng nội bào.', function: 'Tổng hợp và đóng gói polysaccharide thành tế bào, protein.', relatedLessons: ['Cấu trúc tế bào nhân thực'], colorHex: '#10B981' },
];

const BACTERIA_PARTS: ModelPartInfo[] = [
  { id: 'capsule', vietnameseName: 'Vỏ nhầy (tùy loài)', scientificName: 'Capsula', location: 'Ngoài cùng (chỉ có ở một số loài vi khuẩn)', structure: 'Lớp polysaccharide nhầy bao bên ngoài thành tế bào.', function: 'Giúp vi khuẩn bám dính và tránh bị thực bào.', relatedLessons: ['Tế bào nhân sơ'], colorHex: '#FCD34D' },
  { id: 'cell-wall', vietnameseName: 'Thành tế bào', scientificName: 'Paries cellularis (Peptidoglycan)', location: 'Bao bên ngoài màng sinh chất', structure: 'Cấu tạo chủ yếu từ peptidoglycan.', function: 'Bảo vệ và duy trì hình dạng tế bào vi khuẩn.', relatedLessons: ['Tế bào nhân sơ'], colorHex: '#0D9488' },
  { id: 'plasma-mem', vietnameseName: 'Màng sinh chất', scientificName: 'Membrana cellularis', location: 'Sát bên trong thành tế bào', structure: 'Lớp kép phospholipid và protein.', function: 'Trao đổi chất và tham gia hô hấp tế bào ở vi khuẩn.', relatedLessons: ['Tế bào nhân sơ'], colorHex: '#38BDF8' },
  { id: 'nucleoid', vietnameseName: 'Vùng nhân (DNA vòng)', scientificName: 'Nucleoid', location: 'Vùng trung tâm tế bào chất', structure: 'Phân tử DNA dạng vòng kép trần, không có màng nhân bao bọc.', function: 'Lưu giữ và truyền đạt thông tin di truyền.', relatedLessons: ['Tế bào nhân sơ'], colorHex: '#6366F1' },
  { id: 'plasmid', vietnameseName: 'Plasmid', scientificName: 'Plasmidum', location: 'Trong tế bào chất (tùy loài)', structure: 'Phân tử DNA vòng nhỏ độc lập với DNA vùng nhân.', function: 'Thường mang gene kháng kháng sinh; dùng làm vector trong công nghệ gene.', relatedLessons: ['Công nghệ gene'], colorHex: '#EC4899' },
  { id: 'ribosome', vietnameseName: 'Ribosome 70S', scientificName: 'Ribosoma 70S', location: 'Tự do khắp tế bào chất', structure: 'Kích thước 70S nhỏ hơn ribosome 80S ở sinh vật nhân thực.', function: 'Tổng hợp protein cho tế bào vi khuẩn.', relatedLessons: ['Tế bào nhân sơ'], colorHex: '#A855F7' },
  { id: 'flagellum', vietnameseName: 'Roi (tùy loài)', scientificName: 'Flagellum', location: 'Gắn vào màng và thành tế bào', structure: 'Sợi protein flagellin xoắn dài.', function: 'Giúp một số loài vi khuẩn di chuyển trong môi trường lỏng.', relatedLessons: ['Tế bào nhân sơ'], colorHex: '#F97316' },
  { id: 'pili', vietnameseName: 'Lông bám (tùy loài)', scientificName: 'Pili / Fimbriae', location: 'Phủ xung quanh bề mặt', structure: 'Các sợi protein ngắn mảnh.', function: 'Giúp bám vào bề mặt vật chủ hoặc tiếp hợp di truyền.', relatedLessons: ['Tế bào nhân sơ'], colorHex: '#94A3B8' },
];

export const CellLab: React.FC<{
  isPresentation?: boolean;
  onTogglePresentation?: () => void;
}> = ({ isPresentation, onTogglePresentation }) => {
  const viewer = useLabViewerState(true);
  const [modelId, setModelId] = useState<CellModelId>('animal');
  const [showCapsule, setShowCapsule] = useState(true);
  const [showFlagella, setShowFlagella] = useState(true);
  const [transportMode, setTransportMode] = useState<TransportMode>('simple-diffusion');
  const [concentrationDiff, setConcentrationDiff] = useState(75);
  const [tonicity, setTonicity] = useState<TonicityMode>('hypertonic');

  const animRefs = useRef<{
    particlesInst?: THREE.InstancedMesh;
    vesicle?: THREE.Mesh;
    protoplast?: THREE.Group;
    vacuole?: THREE.Mesh;
    flagellum?: THREE.Mesh;
  }>({});

  const partsList = useMemo<ModelPartInfo[]>(() => {
    if (modelId === 'animal') return ANIMAL_PARTS;
    if (modelId === 'plant' || modelId === 'plasmolysis-sim') return PLANT_PARTS;
    if (modelId === 'bacteria') return BACTERIA_PARTS;
    if (modelId === 'mitochondrion') {
      return [
        { id: 'mito-outer', vietnameseName: 'Màng ngoài ti thể', scientificName: 'Membrana externa', location: 'Bao bọc bên ngoài', structure: 'Màng kép nhẵn chứa kênh porin.', function: 'Bảo vệ và cho phân tử nhỏ đi qua.', relatedLessons: ['Hô hấp tế bào'], colorHex: '#EA580C' },
        { id: 'mito-cristae', vietnameseName: 'Màng trong gấp nếp (Mào)', scientificName: 'Cristae mitochondriales', location: 'Gấp khúc vào chất nền', structure: 'Tăng diện tích bề mặt, gắn phức hệ ATP synthase và chuỗi chuyền electron.', function: 'Tổng hợp phần lớn ATP qua phosphoryl hóa oxi hóa.', relatedLessons: ['Hô hấp tế bào'], colorHex: '#FDBA74' },
        { id: 'mito-matrix', vietnameseName: 'Chất nền & DNA vòng ti thể', scientificName: 'Matrix mitochondrialis', location: 'Khoang trong cùng', structure: 'Chứa enzyme chu trình Krebs, DNA vòng và ribosome 70S.', function: 'Thực hiện chu trình Krebs và tự nhân đôi một phần.', relatedLessons: ['Di truyền ngoài nhân'], colorHex: '#6366F1' },
      ];
    }
    if (modelId === 'chloroplast') {
      return [
        { id: 'chloro-env', vietnameseName: 'Màng kép lục lạp', scientificName: 'Involucrum chloroplasti', location: 'Bao bọc ngoài lục lạp', structure: 'Gồm màng ngoài và màng trong trơn nhẵn.', function: 'Kiểm soát trao đổi chất với tế bào chất.', relatedLessons: ['Quang hợp'], colorHex: '#15803D' },
        { id: 'chloro-grana', vietnameseName: 'Hạt Grana (Các túi Thylakoid)', scientificName: 'Grana & Thylakoid', location: 'Xếp chồng trong lục lạp', structure: 'Các túi dẹt chứa diệp lục và hệ quang hóa I, II.', function: 'Diễn ra pha sáng quang hợp tạo ATP, NADPH và giải phóng O₂.', relatedLessons: ['Quang hợp'], colorHex: '#22C55E' },
        { id: 'chloro-stroma', vietnameseName: 'Chất nền Stroma', scientificName: 'Stroma', location: 'Bao quanh các hạt grana', structure: 'Chứa enzyme cố định CO₂ (Rubisco), DNA vòng và ribosome.', function: 'Diễn ra pha tối (Chu trình Calvin) tổng hợp carbohydrate.', relatedLessons: ['Quang hợp'], colorHex: '#86EFAC' },
      ];
    }
    return [
      { id: 'bilayer', vietnameseName: 'Lớp kép Phospholipid', scientificName: 'Phospholipid bilayer', location: 'Khung cấu trúc màng', structure: 'Đầu ưa nước quay ra ngoài, đuôi kị nước quay vào trong.', function: 'Tạo màng bán thấm ngăn cách tế bào với môi trường.', relatedLessons: ['Trao đổi chất qua màng'], colorHex: '#FACC15' },
      { id: 'channel', vietnameseName: 'Kênh Protein & Bơm ion', scientificName: 'Transmembrane channel protein', location: 'Xuyên qua lớp kép lipid', structure: 'Protein xuyên màng tạo lỗ chọn lọc hoặc gắn vị trí thủy phân ATP.', function: 'Vận chuyển ion, nước (aquaporin) và chất phân cực.', relatedLessons: ['Vận chuyển qua màng'], colorHex: '#2563EB' },
    ];
  }, [modelId]);

  const sourceMeta: ScientificSourceMeta = {
    name: 'Mô hình Tế bào & Bào quan 3D',
    source: 'Thư viện sư phạm SINH HỌC SMART 3D',
    identifier: `CELL-${modelId.toUpperCase()}`,
    version: '1.0',
    license: 'Tài nguyên giáo dục nội bộ',
    dataType: 'Mô hình giản lược sư phạm',
    verifiedStatus: 'Đã kiểm chứng bào quan đúng loại tế bào (nhân sơ / động vật / thực vật)',
    scaleNote: 'Kích thước các bào quan được cân đối sư phạm nhằm giúp học sinh quan sát rõ cấu trúc bên trong.',
  };

  const buildModel = useMemo(() => {
    return (rootGroup: THREE.Group, quality: QualityLevel) => {
      animRefs.current = {};
      const segs = quality === 'low' ? 16 : quality === 'high' ? 32 : 24;

      if (modelId === 'animal') {
        // Cutaway Plasma Membrane hemisphere
        const memGroup = new THREE.Group();
        memGroup.userData.partId = 'plasma-mem';
        const outerBowl = new THREE.Mesh(
          new THREE.SphereGeometry(2.65, segs, segs, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.68),
          new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.35, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
        );
        outerBowl.userData.explodeDir = new THREE.Vector3(0, -0.8, 0);
        memGroup.add(outerBowl);
        rootGroup.add(memGroup);

        // Nucleus + Nucleolus
        const nucGroup = new THREE.Group();
        nucGroup.userData.partId = 'nucleus';
        const nucShell = new THREE.Mesh(
          new THREE.SphereGeometry(0.88, segs, segs, 0, Math.PI * 1.55),
          new THREE.MeshPhysicalMaterial({ color: 0x6366f1, roughness: 0.4, side: THREE.DoubleSide }),
        );
        nucShell.position.set(0, 0.25, 0);
        nucShell.userData.explodeDir = new THREE.Vector3(0, 0.9, 0);
        const nucleolus = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 18, 18),
          new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3, emissive: 0x4c1d95, emissiveIntensity: 0.35 }),
        );
        nucleolus.position.set(0, 0.25, 0);
        nucleolus.userData.explodeDir = new THREE.Vector3(0, 1.1, 0);
        nucGroup.add(nucShell, nucleolus);
        rootGroup.add(nucGroup);

        // Rough ER folds
        const rerGroup = new THREE.Group();
        rerGroup.userData.partId = 'rough-er';
        const erMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.45 });
        for (let i = 0; i < 4; i++) {
          const arc = new THREE.Mesh(new THREE.TorusGeometry(1.12 + i * 0.14, 0.055, 10, 28, Math.PI * 0.9), erMat);
          arc.rotation.x = Math.PI / 2;
          arc.rotation.z = -0.3 + i * 0.2;
          arc.position.set(-0.2, 0.15 + (i - 1.5) * 0.14, 0);
          arc.userData.explodeDir = new THREE.Vector3(-0.7, 0.2, 0.4);
          rerGroup.add(arc);
        }
        rootGroup.add(rerGroup);

        // Smooth ER tubules
        const serGroup = new THREE.Group();
        serGroup.userData.partId = 'smooth-er';
        const serMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, roughness: 0.4 });
        for (let i = 0; i < 5; i++) {
          const tub = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 6, 12), serMat);
          tub.position.set(-1.35 + (i % 2) * 0.2, -0.1 + i * 0.12, 0.65);
          tub.rotation.z = 0.5 * (i % 2 === 0 ? 1 : -1);
          tub.userData.explodeDir = new THREE.Vector3(-0.9, 0, 0.7);
          serGroup.add(tub);
        }
        rootGroup.add(serGroup);

        // Golgi Apparatus stacks
        const golgiGroup = new THREE.Group();
        golgiGroup.userData.partId = 'golgi';
        const golgiMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.38 });
        for (let i = 0; i < 5; i++) {
          const c = new THREE.CatmullRomCurve3([
            new THREE.Vector3(1.1, -0.35 + i * 0.14, 0.45),
            new THREE.Vector3(1.45, -0.3 + i * 0.14, 0.68),
            new THREE.Vector3(1.75, -0.35 + i * 0.14, 0.35),
          ]);
          const sac = new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.055, 10, false), golgiMat);
          sac.userData.explodeDir = new THREE.Vector3(0.9, 0.2, 0.5);
          golgiGroup.add(sac);
        }
        rootGroup.add(golgiGroup);

        // Mitochondria (2 sculpted capsule organelles with inner cristae)
        const mitoGroup = new THREE.Group();
        mitoGroup.userData.partId = 'mitochondria';
        [
          [1.35, -0.25, -0.95, 0.4],
          [-1.25, -0.45, -0.9, -0.5],
        ].forEach(([mx, my, mz, rot]) => {
          const outer = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.24, 0.55, 8, 16),
            new THREE.MeshPhysicalMaterial({ color: 0xf97316, roughness: 0.35, transparent: true, opacity: 0.78 }),
          );
          outer.position.set(mx, my, mz);
          outer.rotation.set(0.3, rot, Math.PI / 2.2);
          outer.userData.explodeDir = new THREE.Vector3(mx * 0.6, 0.4, mz * 0.6);
          const inner = new THREE.Mesh(
            new THREE.TorusKnotGeometry(0.14, 0.035, 36, 8, 2, 3),
            new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.5 }),
          );
          inner.position.copy(outer.position);
          inner.userData.explodeDir = outer.userData.explodeDir;
          mitoGroup.add(outer, inner);
        });
        rootGroup.add(mitoGroup);

        // Lysosome & Peroxisome
        const lysoGroup = new THREE.Group();
        lysoGroup.userData.partId = 'lysosome';
        [
          [0.45, -0.55, 1.35, 0xeab308],
          [-0.65, -0.7, 1.25, 0xf59e0b],
        ].forEach(([lx, ly, lz, col]) => {
          const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 16, 16),
            new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 }),
          );
          m.position.set(lx, ly, lz);
          m.userData.explodeDir = new THREE.Vector3(lx * 0.5, 0.3, lz * 0.5);
          lysoGroup.add(m);
        });
        rootGroup.add(lysoGroup);

        // Centrosome (pair of perpendicular centrioles)
        const centroGroup = new THREE.Group();
        centroGroup.userData.partId = 'centrosome';
        const cMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.35 });
        const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 9), cMat);
        c1.position.set(0.75, 0.65, 0.85);
        c1.userData.explodeDir = new THREE.Vector3(0.6, 0.9, 0.6);
        const c2 = c1.clone();
        c2.rotation.z = Math.PI / 2;
        c2.position.set(0.9, 0.65, 0.85);
        centroGroup.add(c1, c2);
        rootGroup.add(centroGroup);

        // Ribosomes (InstancedMesh)
        const riboGeo = new THREE.SphereGeometry(0.055, 8, 8);
        const riboMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4 });
        const riboInst = new THREE.InstancedMesh(riboGeo, riboMat, 36);
        riboInst.userData.partId = 'ribosome';
        const d = new THREE.Object3D();
        for (let i = 0; i < 36; i++) {
          const ang = i * 1.4;
          const rad = 1.05 + (i % 5) * 0.26;
          d.position.set(Math.cos(ang) * rad, -0.6 + (i % 4) * 0.25, Math.sin(ang) * rad);
          d.updateMatrix();
          riboInst.setMatrixAt(i, d.matrix);
        }
        riboInst.computeBoundingSphere();
        rootGroup.add(riboInst);
        return { initialCameraDir: new THREE.Vector3(0.4, 0.7, 0.9) };
      }

      if (modelId === 'plant' || modelId === 'plasmolysis-sim') {
        // Rigid hexagonal Cell Wall
        const wallGroup = new THREE.Group();
        wallGroup.userData.partId = 'cell-wall';
        const wallMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(2.7, 2.7, 1.85, 6, 1, true),
          new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65, side: THREE.DoubleSide }),
        );
        wallMesh.userData.explodeDir = new THREE.Vector3(0, -0.7, 0);
        const wallFloor = new THREE.Mesh(
          new THREE.CylinderGeometry(2.7, 2.7, 0.14, 6),
          new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 }),
        );
        wallFloor.position.y = -0.9;
        wallFloor.userData.explodeDir = new THREE.Vector3(0, -0.9, 0);
        wallGroup.add(wallMesh, wallFloor);
        rootGroup.add(wallGroup);

        // Protoplast group (shrinks during plasmolysis!)
        const protoplast = new THREE.Group();
        rootGroup.add(protoplast);

        const memMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(2.45, 2.45, 1.65, 6),
          new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.3, transparent: true, opacity: 0.3 }),
        );
        memMesh.userData.partId = 'plasma-mem';
        protoplast.add(memMesh);

        // Large Central Vacuole
        const vacMesh = new THREE.Mesh(
          new THREE.SphereGeometry(1.15, segs, segs),
          new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, roughness: 0.2, transparent: true, opacity: 0.75, clearcoat: 0.5 }),
        );
        vacMesh.scale.set(1.2, 0.72, 0.95);
        vacMesh.position.set(-0.25, 0.05, 0);
        vacMesh.userData.partId = 'vacuole';
        vacMesh.userData.explodeDir = new THREE.Vector3(-0.4, 0.8, 0);
        protoplast.add(vacMesh);

        // Nucleus pushed to side
        const nuc = new THREE.Mesh(
          new THREE.SphereGeometry(0.55, segs, segs),
          new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.4 }),
        );
        nuc.position.set(1.45, 0.2, 0.35);
        nuc.userData.partId = 'nucleus';
        nuc.userData.explodeDir = new THREE.Vector3(0.8, 0.7, 0.4);
        protoplast.add(nuc);

        // Chloroplasts with internal grana
        const chGroup = new THREE.Group();
        chGroup.userData.partId = 'chloroplast';
        const chMat = new THREE.MeshPhysicalMaterial({ color: 0x22c55e, roughness: 0.35, clearcoat: 0.25 });
        [
          [1.2, 0.3, -1.1],
          [-1.55, 0.25, 0.85],
          [-1.35, 0.3, -1.05],
          [0.7, 0.35, 1.45],
        ].forEach(([cx, cy, cz]) => {
          const ch = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 16), chMat);
          ch.scale.set(1.35, 0.55, 0.85);
          ch.position.set(cx, cy, cz);
          ch.userData.explodeDir = new THREE.Vector3(cx * 0.4, 0.8, cz * 0.4);
          chGroup.add(ch);
        });
        protoplast.add(chGroup);

        // Plant Mitochondria
        const mito = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.18, 0.4, 8, 14),
          new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 }),
        );
        mito.position.set(1.35, -0.25, -0.55);
        mito.rotation.z = Math.PI / 2;
        mito.userData.partId = 'mitochondria';
        protoplast.add(mito);

        // Plant Golgi
        const golgi = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.22, 16),
          new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 }),
        );
        golgi.position.set(0.2, 0.2, 1.55);
        golgi.userData.partId = 'golgi';
        protoplast.add(golgi);

        animRefs.current = { protoplast, vacuole: vacMesh };
        return { initialCameraDir: new THREE.Vector3(0.35, 0.78, 0.85) };
      }

      if (modelId === 'bacteria') {
        // Cell wall & membrane capsule
        const wall = new THREE.Mesh(
          new THREE.CapsuleGeometry(1.15, 2.4, 12, segs),
          new THREE.MeshPhysicalMaterial({ color: 0x0d9488, roughness: 0.45, transparent: true, opacity: 0.65 }),
        );
        wall.rotation.z = Math.PI / 2;
        wall.userData.partId = 'cell-wall';
        wall.userData.explodeDir = new THREE.Vector3(0, 0.7, 0);
        rootGroup.add(wall);

        const mem = new THREE.Mesh(
          new THREE.CapsuleGeometry(1.0, 2.25, 12, segs),
          new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.35, transparent: true, opacity: 0.45 }),
        );
        mem.rotation.z = Math.PI / 2;
        mem.userData.partId = 'plasma-mem';
        rootGroup.add(mem);

        if (showCapsule) {
          const cap = new THREE.Mesh(
            new THREE.CapsuleGeometry(1.3, 2.55, 12, segs),
            new THREE.MeshPhysicalMaterial({ color: 0xfcd34d, roughness: 0.25, transparent: true, opacity: 0.28 }),
          );
          cap.rotation.z = Math.PI / 2;
          cap.userData.partId = 'capsule';
          cap.userData.explodeDir = new THREE.Vector3(0, 1.0, 0);
          rootGroup.add(cap);
        }

        // Nucleoid (tangled circular DNA, NO nuclear membrane!)
        const nucleoid = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.55, 0.06, 80, 10, 3, 5),
          new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.35 }),
        );
        nucleoid.scale.set(1.4, 0.7, 0.7);
        nucleoid.userData.partId = 'nucleoid';
        rootGroup.add(nucleoid);

        // Plasmids (small circular DNA rings)
        const plasmidGroup = new THREE.Group();
        plasmidGroup.userData.partId = 'plasmid';
        const pMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
        [
          [-1.1, 0.35, 0.3],
          [1.05, -0.3, -0.25],
        ].forEach(([px, py, pz]) => {
          const pRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 24), pMat);
          pRing.position.set(px, py, pz);
          pRing.rotation.x = 0.7;
          plasmidGroup.add(pRing);
        });
        rootGroup.add(plasmidGroup);

        // 70S Ribosomes
        const riboInst = new THREE.InstancedMesh(
          new THREE.SphereGeometry(0.055, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4 }),
          28,
        );
        riboInst.userData.partId = 'ribosome';
        const d = new THREE.Object3D();
        for (let i = 0; i < 28; i++) {
          d.position.set(((i * 0.37) % 2.6) - 1.3, Math.sin(i * 1.9) * 0.55, Math.cos(i * 2.3) * 0.55);
          d.updateMatrix();
          riboInst.setMatrixAt(i, d.matrix);
        }
        riboInst.computeBoundingSphere();
        rootGroup.add(riboInst);

        if (showFlagella) {
          const fPts: THREE.Vector3[] = [];
          for (let i = 0; i <= 28; i++) {
            const x = 2.1 + i * 0.12;
            const y = Math.sin(i * 0.65) * 0.38;
            const z = Math.cos(i * 0.65) * 0.38;
            fPts.push(new THREE.Vector3(x, y, z));
          }
          const flagellum = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fPts), 40, 0.05, 8, false),
            new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 }),
          );
          flagellum.userData.partId = 'flagellum';
          rootGroup.add(flagellum);
          animRefs.current.flagellum = flagellum;

          // Pili
          const piliGroup = new THREE.Group();
          piliGroup.userData.partId = 'pili';
          const piliMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
          for (let i = 0; i < 16; i++) {
            const ang = (i / 16) * Math.PI * 2;
            const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.42, 6), piliMat);
            pMesh.position.set(((i % 5) - 2) * 0.55, Math.sin(ang) * 1.32, Math.cos(ang) * 1.32);
            pMesh.rotation.x = Math.PI / 2 - ang;
            piliGroup.add(pMesh);
          }
          rootGroup.add(piliGroup);
        }
        return { initialCameraDir: new THREE.Vector3(0.35, 0.45, 0.9) };
      }

      if (modelId === 'mitochondrion') {
        const outer = new THREE.Mesh(
          new THREE.CapsuleGeometry(1.0, 2.2, 16, segs),
          new THREE.MeshPhysicalMaterial({ color: 0xea580c, roughness: 0.4, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
        );
        outer.rotation.z = Math.PI / 2;
        outer.userData.partId = 'mito-outer';
        rootGroup.add(outer);

        const cristae = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.65, 0.11, 90, 14, 3, 5),
          new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.4 }),
        );
        cristae.scale.set(1.75, 0.72, 0.72);
        cristae.userData.partId = 'mito-cristae';
        rootGroup.add(cristae);

        const mtDNA = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.04, 10, 28),
          new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.35 }),
        );
        mtDNA.position.set(-0.4, 0, 0);
        mtDNA.userData.partId = 'mito-matrix';
        rootGroup.add(mtDNA);
        return { initialCameraDir: new THREE.Vector3(0.3, 0.4, 1) };
      }

      if (modelId === 'chloroplast') {
        const env = new THREE.Mesh(
          new THREE.SphereGeometry(1.75, segs, segs),
          new THREE.MeshPhysicalMaterial({ color: 0x15803d, roughness: 0.35, transparent: true, opacity: 0.38, side: THREE.DoubleSide }),
        );
        env.scale.set(1.35, 0.65, 0.9);
        env.userData.partId = 'chloro-env';
        rootGroup.add(env);

        const granaGroup = new THREE.Group();
        granaGroup.userData.partId = 'chloro-grana';
        const discMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.35 });
        [
          [-0.85, 0, 0.25],
          [0.0, 0, -0.3],
          [0.85, 0, 0.2],
          [-0.25, 0, 0.45],
        ].forEach(([gx, gy, gz]) => {
          for (let s = 0; s < 5; s++) {
            const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 18), discMat);
            disc.position.set(gx, gy - 0.22 + s * 0.11, gz);
            granaGroup.add(disc);
          }
        });
        rootGroup.add(granaGroup);

        const stroma = new THREE.Mesh(
          new THREE.TorusGeometry(0.26, 0.04, 8, 24),
          new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.4 }),
        );
        stroma.position.set(0.45, -0.1, -0.35);
        stroma.rotation.x = Math.PI / 2;
        stroma.userData.partId = 'chloro-stroma';
        rootGroup.add(stroma);
        return { initialCameraDir: new THREE.Vector3(0.3, 0.5, 1) };
      }

      // membrane or transport-sim: Phospholipid bilayer + Channel protein + Animated particles!
      const bilayerGroup = new THREE.Group();
      bilayerGroup.userData.partId = 'bilayer';
      const headGeo = new THREE.SphereGeometry(0.11, 10, 10);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
      const tailGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6);
      const tailMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });

      const countPerLayer = 64;
      const heads = new THREE.InstancedMesh(headGeo, headMat, countPerLayer * 2);
      const tails = new THREE.InstancedMesh(tailGeo, tailMat, countPerLayer * 2);
      const d = new THREE.Object3D();
      let idx = 0;
      for (let gx = -4; gx < 4; gx++) {
        for (let gz = -4; gz < 4; gz++) {
          const px = gx * 0.36 + 0.18;
          const pz = gz * 0.36 + 0.18;
          if (Math.hypot(px, pz) < 0.48) continue; // space for protein channel
          d.position.set(px, 0.42, pz);
          d.updateMatrix();
          heads.setMatrixAt(idx, d.matrix);
          d.position.set(px, 0.2, pz);
          d.updateMatrix();
          tails.setMatrixAt(idx, d.matrix);
          idx++;

          d.position.set(px, -0.42, pz);
          d.updateMatrix();
          heads.setMatrixAt(idx, d.matrix);
          d.position.set(px, -0.2, pz);
          d.updateMatrix();
          tails.setMatrixAt(idx, d.matrix);
          idx++;
        }
      }
      heads.count = idx;
      tails.count = idx;
      heads.computeBoundingSphere();
      tails.computeBoundingSphere();
      bilayerGroup.add(heads, tails);
      rootGroup.add(bilayerGroup);

      // Channel protein
      const chan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.46, 1.15, 20, 1, true),
        new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: 0.3, side: THREE.DoubleSide }),
      );
      chan.userData.partId = 'channel';
      rootGroup.add(chan);

      // Moving Solute/Water Particles
      const pCount = 22;
      const pInst = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        new THREE.MeshStandardMaterial({
          color: transportMode === 'osmosis' ? 0x38bdf8 : transportMode === 'active-atp' ? 0xf97316 : 0x22c55e,
          emissive: 0x0f766e,
          emissiveIntensity: 0.4,
        }),
        pCount,
      );
      pInst.frustumCulled = false;
      rootGroup.add(pInst);

      const vesicle = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 18, 18),
        new THREE.MeshPhysicalMaterial({ color: 0xf472b6, roughness: 0.3, transparent: true, opacity: 0.75 }),
      );
      vesicle.visible = transportMode === 'endocytosis' || transportMode === 'exocytosis';
      rootGroup.add(vesicle);

      animRefs.current = { particlesInst: pInst, vesicle };
      return { initialCameraDir: new THREE.Vector3(0.45, 0.45, 1) };
    };
  }, [modelId, showCapsule, showFlagella, transportMode]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const handleAnimateFrame = (ctx: SceneUpdateContext) => {
    const refs = animRefs.current;
    const t = ctx.isPlaying ? ctx.elapsed * ctx.speed : ctx.simTime;

    if (modelId === 'bacteria' && refs.flagellum) {
      refs.flagellum.rotation.x = Math.sin(t * 6) * 0.18;
      refs.flagellum.rotation.y = Math.cos(t * 6) * 0.18;
    }

    if (modelId === 'plasmolysis-sim' && refs.protoplast && refs.vacuole) {
      const targetScale = tonicity === 'hypertonic' ? 0.68 : tonicity === 'isotonic' ? 0.96 : 1.03;
      const vacScale = tonicity === 'hypertonic' ? 0.48 : tonicity === 'isotonic' ? 0.95 : 1.12;
      refs.protoplast.scale.x = THREE.MathUtils.damp(refs.protoplast.scale.x, targetScale, 4, ctx.delta);
      refs.protoplast.scale.z = THREE.MathUtils.damp(refs.protoplast.scale.z, targetScale, 4, ctx.delta);
      refs.vacuole.scale.x = THREE.MathUtils.damp(refs.vacuole.scale.x, vacScale * 1.2, 4, ctx.delta);
      refs.vacuole.scale.z = THREE.MathUtils.damp(refs.vacuole.scale.z, vacScale * 0.95, 4, ctx.delta);
    }

    if ((modelId === 'membrane' || modelId === 'transport-sim') && refs.particlesInst) {
      const rate = 0.25 + (concentrationDiff / 100) * 0.7;
      for (let i = 0; i < refs.particlesInst.count; i++) {
        const prog = ((t * rate + i / refs.particlesInst.count) % 1 + 1) % 1;
        if (transportMode === 'simple-diffusion') {
          const px = ((i * 0.73) % 2.4) - 1.2;
          const pz = ((i * 1.13) % 2.4) - 1.2;
          const py = 1.6 - prog * 3.2;
          dummy.position.set(px, py, pz);
        } else if (transportMode === 'facilitated' || transportMode === 'osmosis') {
          const py = 1.7 - prog * 3.4;
          const rad = Math.abs(py) < 0.7 ? 0.14 : 0.45;
          dummy.position.set(Math.cos(i * 2.1) * rad, py, Math.sin(i * 2.1) * rad);
        } else if (transportMode === 'active-atp') {
          // Moves UPWARDS against gradient through channel!
          const py = -1.7 + prog * 3.4;
          const rad = Math.abs(py) < 0.7 ? 0.14 : 0.42;
          dummy.position.set(Math.cos(i * 2.1) * rad, py, Math.sin(i * 2.1) * rad);
        } else {
          dummy.position.set(Math.cos(i) * 0.8, 1.4, Math.sin(i) * 0.8);
        }
        dummy.updateMatrix();
        refs.particlesInst.setMatrixAt(i, dummy.matrix);
      }
      refs.particlesInst.instanceMatrix.needsUpdate = true;

      if (refs.vesicle && (transportMode === 'endocytosis' || transportMode === 'exocytosis')) {
        const prog = ((t * 0.35) % 1 + 1) % 1;
        refs.vesicle.position.set(
          0,
          transportMode === 'endocytosis' ? 1.5 - prog * 3.0 : -1.5 + prog * 3.0,
          1.2,
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        {(
          [
            ['animal', 'Tế bào động vật'],
            ['plant', 'Tế bào thực vật'],
            ['bacteria', 'Tế bào vi khuẩn'],
            ['mitochondrion', 'Ti thể'],
            ['chloroplast', 'Lục lạp'],
            ['membrane', 'Màng sinh chất'],
            ['transport-sim', 'Vận chuyển qua màng'],
            ['plasmolysis-sim', 'Co nguyên sinh (Thực vật)'],
          ] as [CellModelId, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setModelId(id);
              viewer.setSelectedPartId(null);
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min transition-colors ${
              modelId === id
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <LabWorkspaceLayout
        title="Phòng Lab 02 – Thế giới Tế bào 3D"
        subtitle="Quan sát cấu trúc bào quan đặc trưng theo từng loại tế bào và mô phỏng trao đổi chất qua màng"
        viewerRef={viewer.viewerRef}
        parts={partsList}
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
          viewer.setIsPlaying(false);
          viewer.setSimStepOffset((s) => s + 0.25);
        }}
        onResetSim={viewer.resetViewAndParts}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        sourceMeta={sourceMeta}
        isPresentation={isPresentation}
        onTogglePresentation={onTogglePresentation}
        teacherGuideNote="Mỗi loại tế bào chỉ hiển thị đúng các bào quan có ở nhóm sinh vật đó (ví dụ: không có lục lạp trong tế bào động vật, không có ti thể trong vi khuẩn)."
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`cell-${modelId}-${showCapsule}-${showFlagella}-${transportMode}`}
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
            parts={partsList}
            quality={viewer.quality}
            fallbackTitle={`Sơ đồ 2D: ${modelId}`}
            fallbackItems={partsList.map((p) => `${p.vietnameseName}: ${p.function}`)}
          />
        }
        simulationControlsExtra={
          <div className="space-y-3">
            {modelId === 'bacteria' && (
              <div className="space-y-2">
                <p className="text-slate-700 text-ui-min">
                  Lưu ý: Vỏ nhầy, roi và lông bám chỉ có ở một số loài vi khuẩn nhất định.
                </p>
                <label className="flex items-center gap-2 text-slate-800 text-ui-min min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={showCapsule}
                    onChange={(e) => setShowCapsule(e.target.checked)}
                    className="w-5 h-5 accent-teal-700"
                  />
                  <span>Hiển thị vỏ nhầy (tùy loài)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-800 text-ui-min min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={showFlagella}
                    onChange={(e) => setShowFlagella(e.target.checked)}
                    className="w-5 h-5 accent-teal-700"
                  />
                  <span>Hiển thị roi & lông bám (tùy loài)</span>
                </label>
              </div>
            )}

            {(modelId === 'transport-sim' || modelId === 'membrane') && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="font-medium text-slate-800 text-ui-min">Cơ chế vận chuyển qua màng:</span>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-min"
                  >
                    <option value="simple-diffusion">1. Khuếch tán đơn giản (qua lớp lipid)</option>
                    <option value="facilitated">2. Khuếch tán được hỗ trợ (qua kênh protein)</option>
                    <option value="osmosis">3. Thẩm thấu (nước qua kênh aquaporin)</option>
                    <option value="active-atp">4. Vận chuyển chủ động (ngược gradient + ATP)</option>
                    <option value="endocytosis">5. Nhập bào (biến dạng màng)</option>
                    <option value="exocytosis">6. Xuất bào (túi tiết hòa màng)</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-slate-800 text-ui-min">
                    <span>Chênh lệch nồng độ:</span>
                    <span className="font-mono-tabular">{concentrationDiff}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={concentrationDiff}
                    onChange={(e) => setConcentrationDiff(Number(e.target.value))}
                    className="w-full accent-teal-700 h-2"
                  />
                </label>
              </div>
            )}

            {modelId === 'plasmolysis-sim' && (
              <div className="space-y-2">
                <span className="font-medium text-slate-800 text-ui-min block">
                  Chọn môi trường ngâm tế bào thực vật:
                </span>
                {(
                  [
                    ['hypertonic', 'Môi trường ưu trương → Co nguyên sinh'],
                    ['isotonic', 'Môi trường đẳng trương → Cân bằng'],
                    ['hypotonic', 'Môi trường nhược trương → Trương nước / Phản co'],
                  ] as [TonicityMode, string][]
                ).map(([tId, tLabel]) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setTonicity(tId)}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-lg text-left font-medium text-ui-min border ${
                      tonicity === tId
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tLabel}
                  </button>
                ))}
                <p className="text-slate-600 text-ui-min">
                  Lưu ý: Co nguyên sinh là hiện tượng quan sát rõ ở tế bào thực vật có thành tế bào cứng.
                </p>
              </div>
            )}
          </div>
        }
        knowledgeContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">So sánh nhanh 3 loại tế bào</h4>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>Vi khuẩn (Nhân sơ):</strong> Chưa có màng nhân, không có bào quan có màng, ribosome 70S.</li>
              <li><strong>Động vật (Nhân thực):</strong> Có trung thể, lysosome, không có thành cellulose và lục lạp.</li>
              <li><strong>Thực vật (Nhân thực):</strong> Có thành cellulose, lục lạp, không bào trung tâm lớn và cầu sinh chất.</li>
            </ul>
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">Bài tập thực hành</h4>
            <p className="text-slate-700">
              1. Kéo thanh Tách lớp cấu trúc ở tab Quan sát để tách rời các bào quan của tế bào động vật.
            </p>
            <p className="text-slate-700">
              2. Chuyển sang Co nguyên sinh (Thực vật), đặt môi trường ưu trương rồi chuyển sang nhược trương và quan sát khối nguyên sinh bên trong thành tế bào.
            </p>
          </div>
        }
      />
    </div>
  );
};
