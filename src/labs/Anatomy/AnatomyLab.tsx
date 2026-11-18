import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Upload, RefreshCw, AlertTriangle } from 'lucide-react';
import { ModelViewer3D, SceneUpdateContext } from '../../components/viewer3d/ModelViewer3D';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';

type AnatomyMode = 'heart' | 'lung' | 'custom-glb';

const HEART_PARTS: ModelPartInfo[] = [
  {
    id: 'ra',
    vietnameseName: 'Tâm nhĩ phải',
    scientificName: 'Atrium dextrum',
    location: 'Phần trên bên phải của tim',
    structure: 'Thành cơ mỏng hơn tâm thất, nhận máu từ tĩnh mạch chủ trên và dưới.',
    function: 'Tiếp nhận máu nghèo O₂ từ cơ thể và đẩy xuống tâm thất phải qua van ba lá.',
    relatedLessons: ['Tuần hoàn máu (Sinh học 11)'],
    colorHex: '#3B82F6',
  },
  {
    id: 'rv',
    vietnameseName: 'Tâm thất phải',
    scientificName: 'Ventriculus dexter',
    location: 'Phần dưới bên phải của tim',
    structure: 'Thành cơ dày vừa phải, nối với động mạch phổi qua van bán nguyệt.',
    function: 'Co bóp đẩy máu nghèo O₂ lên phổi để trao đổi khí.',
    relatedLessons: ['Tuần hoàn máu (Sinh học 11)'],
    colorHex: '#2563EB',
  },
  {
    id: 'la',
    vietnameseName: 'Tâm nhĩ trái',
    scientificName: 'Atrium sinistrum',
    location: 'Phần trên bên trái của tim',
    structure: 'Nhận 4 tĩnh mạch phổi đổ về, thông với tâm thất trái qua van hai lá.',
    function: 'Tiếp nhận máu giàu O₂ từ phổi trở về và đẩy xuống tâm thất trái.',
    relatedLessons: ['Tuần hoàn máu (Sinh học 11)'],
    colorHex: '#EF4444',
  },
  {
    id: 'lv',
    vietnameseName: 'Tâm thất trái',
    scientificName: 'Ventriculus sinister',
    location: 'Phần dưới bên trái tạo mỏm tim',
    structure: 'Thành cơ tim dày nhất (gấp ~3 lần tâm thất phải) để tạo áp lực lớn.',
    function: 'Co bóp đẩy máu giàu O₂ vào động mạch chủ đi nuôi toàn bộ cơ thể.',
    relatedLessons: ['Tuần hoàn máu (Sinh học 11)'],
    colorHex: '#DC2626',
  },
  {
    id: 'aorta',
    vietnameseName: 'Động mạch chủ',
    scientificName: 'Aorta',
    location: 'Xuất phát từ tâm thất trái, uốn thành quai',
    structure: 'Thành mạch dày nhiều sợi đàn hồi và cơ trơn chịu áp suất cao.',
    function: 'Dẫn máu giàu O₂ từ tim phân phối đến các cơ quan trong vòng tuần hoàn lớn.',
    relatedLessons: ['Tuần hoàn máu (Sinh học 11)'],
    colorHex: '#B91C1C',
  },
  {
    id: 'pulm-art',
    vietnameseName: 'Động mạch phổi',
    scientificName: 'Truncus pulmonalis',
    location: 'Xuất phát từ tâm thất phải, chia hai nhánh tới hai phổi',
    structure: 'Động mạch lớn dẫn máu nghèo O₂ lên phổi.',
    function: 'Đưa máu nghèo O₂ đến mao mạch phế nang để nhận O₂ và thải CO₂.',
    relatedLessons: ['Tuần hoàn máu (Sinh học 11)'],
    colorHex: '#1D4ED8',
  },
  {
    id: 'vena-cava',
    vietnameseName: 'Tĩnh mạch chủ',
    scientificName: 'Vena cava superior & inferior',
    location: 'Đổ vào mặt sau tâm nhĩ phải',
    structure: 'Tĩnh mạch lớn có van, thành mỏng hơn động mạch.',
    function: 'Thu hồi máu nghèo O₂ từ phần trên và phần dưới cơ thể về tim.',
    relatedLessons: ['Tuần hoàn máu (Sinh học 11)'],
    colorHex: '#1E40AF',
  },
  {
    id: 'pulm-vein',
    vietnameseName: 'Tĩnh mạch phổi',
    scientificName: 'Venae pulmonales',
    location: 'Từ hai phổi đổ vào tâm nhĩ trái',
    structure: 'Gồm các nhánh tĩnh mạch dẫn máu giàu O₂.',
    function: 'Vận chuyển máu đã được oxy hóa từ phổi về tâm nhĩ trái.',
    relatedLessons: ['Tuần hoàn máu (Sinh học 11)'],
    colorHex: '#F87171',
  },
  {
    id: 'valves',
    vietnameseName: 'Hệ thống van tim',
    scientificName: 'Valva atrioventricularis & semilunaris',
    location: 'Giữa tâm nhĩ–tâm thất và gốc động mạch',
    structure: 'Các lá van mô liên kết mỏng bền chắc đóng mở theo chênh lệch áp suất.',
    function: 'Đảm bảo máu chảy theo một chiều nhất định, ngăn trào ngược.',
    relatedLessons: ['Chu kì tim (Sinh học 11)'],
    colorHex: '#FDE047',
  },
];

const LUNG_PARTS: ModelPartInfo[] = [
  {
    id: 'trachea',
    vietnameseName: 'Khí quản',
    scientificName: 'Trachea',
    location: 'Từ thanh quản đi xuống trung thất ngực',
    structure: 'Ống dẫn khí gồm các vòng sụn chữ C giữ đường thở luôn mở.',
    function: 'Dẫn không khí từ đường hô hấp trên xuống hai phế quản.',
    relatedLessons: ['Hô hấp ở động vật (Sinh học 11)'],
    colorHex: '#93C5FD',
  },
  {
    id: 'bronchi',
    vietnameseName: 'Phế quản & Cây phế quản',
    scientificName: 'Bronchi',
    location: 'Phân nhánh vào hai lá phổi',
    structure: 'Chia thành phế quản gốc trái/phải và phân nhánh nhỏ dần thành tiểu phế quản.',
    function: 'Phân phối luồng khí hít vào tới các chùm phế nang.',
    relatedLessons: ['Hô hấp ở động vật (Sinh học 11)'],
    colorHex: '#60A5FA',
  },
  {
    id: 'lungs',
    vietnameseName: 'Hai lá phổi & Phế nang',
    scientificName: 'Pulmones & Alveoli',
    location: 'Nằm trong khoang ngực hai bên tim',
    structure: 'Phổi phải 3 thùy, phổi trái 2 thùy; bên trong có hàng trăm triệu phế nang bao quanh bởi lưới mao mạch.',
    function: 'Thực hiện trao đổi khí O₂ và CO₂ qua màng phế nang – mao mạch.',
    relatedLessons: ['Hô hấp ở động vật (Sinh học 11)'],
    colorHex: '#FB7185',
  },
  {
    id: 'diaphragm',
    vietnameseName: 'Cơ hoành',
    scientificName: 'Diaphragma',
    location: 'Ngăn cách khoang ngực và khoang bụng',
    structure: 'Tấm cơ vân hình vòm co giãn nhịp nhàng.',
    function: 'Co và hạ thấp khi hít vào làm tăng thể tích lồng ngực; giãn và nâng lên khi thở ra.',
    relatedLessons: ['Hô hấp ở động vật (Sinh học 11)'],
    colorHex: '#D97706',
  },
  {
    id: 'ribcage',
    vietnameseName: 'Khung xương sườn (Lồng ngực)',
    scientificName: 'Cavea thoracis',
    location: 'Bao bọc bảo vệ tim và phổi',
    structure: 'Các cung xương sườn và cơ liên sườn.',
    function: 'Bảo vệ phổi–tim và nâng lên hạ xuống phối hợp cơ hoành khi thông khí.',
    relatedLessons: ['Hô hấp ở động vật (Sinh học 11)'],
    colorHex: '#E2E8F0',
  },
];

export const AnatomyLab: React.FC<{
  isPresentation?: boolean;
  onTogglePresentation?: () => void;
}> = ({ isPresentation, onTogglePresentation }) => {
  const viewer = useLabViewerState(true);
  const [mode, setMode] = useState<AnatomyMode>('heart');
  const [heartRate, setHeartRate] = useState(72); // 40 - 150 bpm
  const [breathRate, setBreathRate] = useState(16); // 10 - 30 breaths/min
  const [showO2Flow, setShowO2Flow] = useState(true);

  // External GLB / BodyParts3D state
  const [glbFileBuffer, setGlbFileBuffer] = useState<ArrayBuffer | null>(null);
  const [glbError, setGlbError] = useState<string | null>(null);
  const [glbParts, setGlbParts] = useState<ModelPartInfo[]>([]);
  const [glbUrlInput, setGlbUrlInput] = useState('');
  const [glbLoading, setGlbLoading] = useState(false);

  const animRefs = useRef<{
    atriaGroup?: THREE.Group;
    ventriclesGroup?: THREE.Group;
    valvesGroup?: THREE.Group;
    bloodPoorInst?: THREE.InstancedMesh;
    bloodRichInst?: THREE.InstancedMesh;
    poorCurve?: THREE.CatmullRomCurve3;
    richCurve?: THREE.CatmullRomCurve3;
    leftLung?: THREE.Group;
    rightLung?: THREE.Group;
    diaphragm?: THREE.Mesh;
    ribcage?: THREE.Group;
    gasO2Inst?: THREE.InstancedMesh;
    gasCO2Inst?: THREE.InstancedMesh;
  }>({});

  const activeParts = mode === 'heart' ? HEART_PARTS : mode === 'lung' ? LUNG_PARTS : glbParts;

  const sourceMeta: ScientificSourceMeta = useMemo(() => {
    if (mode === 'custom-glb') {
      return {
        name: 'Mô hình Giải phẫu GLB/glTF nhập từ người dùng hoặc BodyParts3D',
        source: 'BodyParts3D (lifesciencedb.jp/bp3d) hoặc tệp GLB cục bộ',
        identifier: glbUrlInput || 'Tệp GLB cục bộ',
        version: '4.0',
        license: 'CC BY-SA 2.1 JP (khi dùng dữ liệu BodyParts3D)',
        dataType: 'Mô hình dữ liệu khoa học thực',
        verifiedStatus: glbFileBuffer ? 'Đã nạp dữ liệu GLB thật' : 'Chưa nạp tệp GLB',
      };
    }
    return {
      name: mode === 'heart' ? 'Mô hình Tim & Chu kì tim 3D' : 'Mô hình Phổi, Cơ hoành & Trao đổi khí 3D',
      source: 'Mô hình giải phẫu sư phạm SINH HỌC SMART 3D (tham chiếu cấu trúc giải phẫu người chuẩn)',
      identifier: mode === 'heart' ? 'ANAT-HEART-3D' : 'ANAT-LUNG-3D',
      version: '1.0',
      license: 'Tài nguyên giáo dục nội bộ SINH HỌC SMART 3D',
      dataType: 'Mô hình giản lược sư phạm',
      verifiedStatus: 'Đã đối chiếu cấu trúc 4 ngăn tim / cây phế quản THPT',
      scaleNote:
        mode === 'heart'
          ? 'Lưu ý: Nhịp tim (40–150 lần/phút) và kích thước hạt máu chỉ là thông số mô phỏng trực quan, không phải công cụ chẩn đoán sức khỏe.'
          : 'Lưu ý: Kích thước phế nang và phân tử khí được phóng đại sư phạm để học sinh dễ quan sát.',
    };
  }, [mode, glbFileBuffer, glbUrlInput]);

  const buildModel = useMemo(() => {
    return (rootGroup: THREE.Group, quality: QualityLevel) => {
      animRefs.current = {};
      const segs = quality === 'low' ? 16 : quality === 'high' ? 36 : 24;

      if (mode === 'custom-glb') {
        if (glbFileBuffer) {
          const loader = new GLTFLoader();
          loader.parse(
            glbFileBuffer.slice(0),
            '',
            (gltf) => {
              const sceneObj = gltf.scene;
              const box = new THREE.Box3().setFromObject(sceneObj);
              const size = new THREE.Vector3();
              const center = new THREE.Vector3();
              box.getSize(size);
              box.getCenter(center);
              const maxD = Math.max(size.x, size.y, size.z, 0.001);
              const scale = 4.5 / maxD;
              sceneObj.scale.setScalar(scale);
              sceneObj.position.sub(center.multiplyScalar(scale));

              const extracted: ModelPartInfo[] = [];
              let idx = 0;
              sceneObj.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  idx += 1;
                  const pid = child.name || `bp-part-${idx}`;
                  child.userData.partId = pid;
                  extracted.push({
                    id: pid,
                    vietnameseName: child.name || `Bộ phận giải phẫu #${idx}`,
                    scientificName: child.name || `Anatomical Part #${idx}`,
                    location: 'Theo hệ tọa độ mô hình GLB',
                    structure: 'Dữ liệu lưới 3D trích xuất từ tệp GLB/BodyParts3D',
                    function: 'Cấu trúc giải phẫu trong hệ cơ quan đang hiển thị.',
                    relatedLessons: ['Giải phẫu người (Sinh học 11)'],
                    colorHex: '#0D9488',
                  });
                }
              });
              setGlbParts(extracted.slice(0, 40));
              rootGroup.add(sceneObj);
            },
            () => {
              setGlbError('Không thể phân tích tệp GLB/glTF. Vui lòng kiểm tra định dạng tệp.');
            },
          );
        }
        return { initialCameraDir: new THREE.Vector3(0.3, 0.2, 1) };
      }

      if (mode === 'heart') {
        const atriaGroup = new THREE.Group();
        const ventriclesGroup = new THREE.Group();
        const valvesGroup = new THREE.Group();
        rootGroup.add(atriaGroup, ventriclesGroup, valvesGroup);

        // Right Atrium (O2-poor blue-purple)
        const raGroup = new THREE.Group();
        raGroup.userData.partId = 'ra';
        const raMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.75, segs, segs),
          new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: 0.42, clearcoat: 0.25 }),
        );
        raMesh.scale.set(0.95, 0.9, 0.85);
        raMesh.position.set(-0.82, 0.68, 0.1);
        raMesh.userData.explodeDir = new THREE.Vector3(-0.9, 0.5, 0.2);
        raGroup.add(raMesh);
        atriaGroup.add(raGroup);

        // Left Atrium (O2-rich crimson)
        const laGroup = new THREE.Group();
        laGroup.userData.partId = 'la';
        const laMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.72, segs, segs),
          new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.4, clearcoat: 0.25 }),
        );
        laMesh.scale.set(0.95, 0.88, 0.85);
        laMesh.position.set(0.82, 0.72, -0.05);
        laMesh.userData.explodeDir = new THREE.Vector3(0.9, 0.5, -0.1);
        laGroup.add(laMesh);
        atriaGroup.add(laGroup);

        // Right Ventricle (Lathe tapered muscular chamber)
        const rvGroup = new THREE.Group();
        rvGroup.userData.partId = 'rv';
        const rvPts = [
          new THREE.Vector2(0.01, -1.55),
          new THREE.Vector2(0.45, -1.2),
          new THREE.Vector2(0.78, -0.4),
          new THREE.Vector2(0.72, 0.2),
          new THREE.Vector2(0.01, 0.25),
        ];
        const rvMesh = new THREE.Mesh(
          new THREE.LatheGeometry(rvPts, segs),
          new THREE.MeshPhysicalMaterial({ color: 0x3b82f6, roughness: 0.45, clearcoat: 0.3 }),
        );
        rvMesh.position.set(-0.56, -0.22, 0.16);
        rvMesh.rotation.z = -0.14;
        rvMesh.userData.explodeDir = new THREE.Vector3(-0.8, -0.6, 0.3);
        rvGroup.add(rvMesh);
        ventriclesGroup.add(rvGroup);

        // Left Ventricle (thicker muscular apex)
        const lvGroup = new THREE.Group();
        lvGroup.userData.partId = 'lv';
        const lvPts = [
          new THREE.Vector2(0.01, -1.85),
          new THREE.Vector2(0.48, -1.45),
          new THREE.Vector2(0.88, -0.5),
          new THREE.Vector2(0.82, 0.25),
          new THREE.Vector2(0.01, 0.3),
        ];
        const lvMesh = new THREE.Mesh(
          new THREE.LatheGeometry(lvPts, segs),
          new THREE.MeshPhysicalMaterial({ color: 0xb91c1c, roughness: 0.38, clearcoat: 0.35 }),
        );
        lvMesh.position.set(0.55, -0.2, 0);
        lvMesh.rotation.z = 0.18;
        lvMesh.userData.explodeDir = new THREE.Vector3(0.8, -0.6, 0.1);
        lvGroup.add(lvMesh);
        ventriclesGroup.add(lvGroup);

        // Valves (4 rings)
        valvesGroup.userData.partId = 'valves';
        const valveMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.3, metalness: 0.1 });
        [
          [-0.68, 0.22, 0.12],
          [0.68, 0.24, 0.0],
          [-0.25, 0.38, 0.32],
          [0.25, 0.42, 0.1],
        ].forEach(([vx, vy, vz]) => {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 12, segs), valveMat);
          ring.position.set(vx, vy, vz);
          ring.rotation.x = Math.PI / 2;
          ring.userData.explodeDir = new THREE.Vector3(0, 0.2, 0.7);
          valvesGroup.add(ring);
        });

        // Aorta Arch
        const aortaGroup = new THREE.Group();
        aortaGroup.userData.partId = 'aorta';
        const aortaCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.35, 0.3, 0.05),
          new THREE.Vector3(0.25, 1.55, 0.1),
          new THREE.Vector3(-0.15, 2.05, -0.15),
          new THREE.Vector3(-0.55, 1.55, -0.55),
          new THREE.Vector3(-0.52, -0.6, -0.65),
        ]);
        const aortaMesh = new THREE.Mesh(
          new THREE.TubeGeometry(aortaCurve, 44, 0.28, 16, false),
          new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.35, clearcoat: 0.3 }),
        );
        aortaMesh.userData.explodeDir = new THREE.Vector3(0, 1.1, -0.3);
        aortaGroup.add(aortaMesh);
        // 3 superior aortic branches
        [-0.15, 0.05, 0.25].forEach((bx) => {
          const br = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.65, 12),
            aortaMesh.material,
          );
          br.position.set(bx, 2.25, -0.05);
          br.userData.explodeDir = new THREE.Vector3(0, 1.2, 0);
          aortaGroup.add(br);
        });
        rootGroup.add(aortaGroup);

        // Pulmonary Artery (Blue - O2-poor!)
        const pulmArtGroup = new THREE.Group();
        pulmArtGroup.userData.partId = 'pulm-art';
        const paTrunk = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.35, 0.25, 0.35),
          new THREE.Vector3(-0.1, 1.15, 0.42),
          new THREE.Vector3(0.4, 1.45, 0.18),
          new THREE.Vector3(1.35, 1.4, -0.1),
        ]);
        const paMat = new THREE.MeshPhysicalMaterial({ color: 0x1d4ed8, roughness: 0.4, clearcoat: 0.2 });
        const paMesh1 = new THREE.Mesh(new THREE.TubeGeometry(paTrunk, 32, 0.22, 14, false), paMat);
        paMesh1.userData.explodeDir = new THREE.Vector3(0.3, 0.8, 0.8);
        const paLeft = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.1, 1.15, 0.42),
          new THREE.Vector3(-0.75, 1.38, 0.15),
          new THREE.Vector3(-1.45, 1.32, -0.1),
        ]);
        const paMesh2 = new THREE.Mesh(new THREE.TubeGeometry(paLeft, 24, 0.19, 14, false), paMat);
        paMesh2.userData.explodeDir = new THREE.Vector3(-0.5, 0.8, 0.6);
        pulmArtGroup.add(paMesh1, paMesh2);
        rootGroup.add(pulmArtGroup);

        // Vena Cava (Superior & Inferior)
        const vcGroup = new THREE.Group();
        vcGroup.userData.partId = 'vena-cava';
        const vcMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.5 });
        const svc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 1.4, 16), vcMat);
        svc.position.set(-1.1, 1.55, -0.05);
        svc.userData.explodeDir = new THREE.Vector3(-1.0, 0.8, 0);
        const ivc = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.24, 1.35, 16), vcMat);
        ivc.position.set(-1.08, -0.45, -0.25);
        ivc.userData.explodeDir = new THREE.Vector3(-1.0, -0.6, -0.2);
        vcGroup.add(svc, ivc);
        rootGroup.add(vcGroup);

        // Pulmonary Veins (O2-rich red-pink entering Left Atrium)
        const pvGroup = new THREE.Group();
        pvGroup.userData.partId = 'pulm-vein';
        const pvMat = new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.4 });
        [-0.15, 0.2].forEach((dy) => {
          const pv = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 1.0, 12), pvMat);
          pv.rotation.z = Math.PI / 2;
          pv.position.set(1.45, 0.72 + dy, -0.15);
          pv.userData.explodeDir = new THREE.Vector3(1.1, 0.3, 0);
          pvGroup.add(pv);
        });
        rootGroup.add(pvGroup);

        // Animated Blood Flow Particles (InstancedMesh)
        const poorCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.1, 2.1, -0.05),
          new THREE.Vector3(-0.85, 0.72, 0.12),
          new THREE.Vector3(-0.58, -0.5, 0.2),
          new THREE.Vector3(-0.25, 0.55, 0.38),
          new THREE.Vector3(-0.05, 1.28, 0.35),
          new THREE.Vector3(1.3, 1.4, -0.1),
        ]);
        const richCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.8, 0.85, -0.15),
          new THREE.Vector3(0.82, 0.72, 0.0),
          new THREE.Vector3(0.55, -0.6, 0.05),
          new THREE.Vector3(0.32, 0.65, 0.08),
          new THREE.Vector3(0.12, 1.95, -0.05),
          new THREE.Vector3(-0.55, 1.5, -0.55),
          new THREE.Vector3(-0.52, -0.6, -0.65),
        ]);

        const particleGeo = new THREE.SphereGeometry(0.085, 10, 10);
        const poorMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x1d4ed8, emissiveIntensity: 0.6 });
        const richMat = new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0xdc2626, emissiveIntensity: 0.6 });
        const count = 24;
        const poorInst = new THREE.InstancedMesh(particleGeo, poorMat, count);
        const richInst = new THREE.InstancedMesh(particleGeo, richMat, count);
        poorInst.frustumCulled = false;
        richInst.frustumCulled = false;
        rootGroup.add(poorInst, richInst);

        animRefs.current = {
          atriaGroup,
          ventriclesGroup,
          valvesGroup,
          bloodPoorInst: poorInst,
          bloodRichInst: richInst,
          poorCurve,
          richCurve,
        };
        return { initialCameraDir: new THREE.Vector3(0.25, 0.18, 1) };
      }

      // MODE: LUNG & DIAPHRAGM
      const tracheaGroup = new THREE.Group();
      tracheaGroup.userData.partId = 'trachea';
      const tracheaTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 2.2, segs),
        new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, roughness: 0.4, transparent: true, opacity: 0.85 }),
      );
      tracheaTube.position.set(0, 1.7, 0);
      tracheaGroup.add(tracheaTube);
      for (let i = 0; i < 8; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.255, 0.04, 10, segs),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 0.8 + i * 0.24, 0);
        tracheaGroup.add(ring);
      }
      rootGroup.add(tracheaGroup);

      // Bronchi
      const bronchiGroup = new THREE.Group();
      bronchiGroup.userData.partId = 'bronchi';
      const bronchusMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.45 });
      [-1, 1].forEach((side) => {
        const mainBr = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.65, 0),
          new THREE.Vector3(side * 0.65, 0.3, 0),
          new THREE.Vector3(side * 1.15, -0.2, 0.05),
        ]);
        const brMesh = new THREE.Mesh(new THREE.TubeGeometry(mainBr, 20, 0.14, 12, false), bronchusMat);
        bronchiGroup.add(brMesh);
        [-0.35, 0.15, 0.45].forEach((dy) => {
          const sub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.75, 10), bronchusMat);
          sub.position.set(side * 1.25, -0.25 + dy, 0.08);
          sub.rotation.z = side * (0.4 + dy);
          bronchiGroup.add(sub);
        });
      });
      rootGroup.add(bronchiGroup);

      // Lungs + Alveoli
      const lungsContainer = new THREE.Group();
      lungsContainer.userData.partId = 'lungs';
      const lungMat = new THREE.MeshPhysicalMaterial({
        color: 0xfb7185,
        roughness: 0.45,
        transparent: true,
        opacity: 0.55,
        clearcoat: 0.2,
      });

      const rightLung = new THREE.Group();
      rightLung.position.set(-1.18, -0.35, 0);
      const rlGeo = new THREE.SphereGeometry(1.05, segs, segs);
      const rlMesh = new THREE.Mesh(rlGeo, lungMat);
      rlMesh.scale.set(0.88, 1.38, 0.85);
      rightLung.add(rlMesh);

      const leftLung = new THREE.Group();
      leftLung.position.set(1.18, -0.35, 0);
      const llMesh = new THREE.Mesh(rlGeo.clone(), lungMat);
      llMesh.scale.set(0.82, 1.32, 0.82);
      leftLung.add(llMesh);

      // Alveolar grape clusters inside lungs
      const alvMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.4 });
      for (let i = 0; i < 10; i++) {
        const a1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), alvMat);
        a1.position.set((Math.random() - 0.5) * 0.65, (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 0.4);
        rightLung.add(a1);
        const a2 = a1.clone();
        a2.position.x *= -1;
        leftLung.add(a2);
      }

      lungsContainer.add(rightLung, leftLung);
      rootGroup.add(lungsContainer);

      // Diaphragm dome
      const diaGeo = new THREE.SphereGeometry(2.15, segs, 18, 0, Math.PI * 2, 0, Math.PI * 0.36);
      const diaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55, side: THREE.DoubleSide });
      const diaphragm = new THREE.Mesh(diaGeo, diaMat);
      diaphragm.userData.partId = 'diaphragm';
      diaphragm.position.set(0, -2.55, 0);
      diaphragm.scale.set(1.05, 0.55, 0.8);
      rootGroup.add(diaphragm);

      // Ribcage arcs
      const ribcage = new THREE.Group();
      ribcage.userData.partId = 'ribcage';
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.08 });
      for (let r = 0; r < 6; r++) {
        const yPos = 0.65 - r * 0.42;
        const rad = 1.68 + Math.sin((r / 5) * Math.PI) * 0.45;
        const rib = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.055, 10, 32, Math.PI * 1.35), boneMat);
        rib.rotation.x = Math.PI / 2;
        rib.rotation.z = -Math.PI * 0.175;
        rib.position.set(0, yPos, 0);
        rib.scale.set(1.12, 0.72, 1);
        ribcage.add(rib);
      }
      rootGroup.add(ribcage);

      // O2 / CO2 Gas Particles
      const gasGeo = new THREE.SphereGeometry(0.075, 10, 10);
      const o2Inst = new THREE.InstancedMesh(
        gasGeo,
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.7 }),
        18,
      );
      const co2Inst = new THREE.InstancedMesh(
        gasGeo,
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.6 }),
        18,
      );
      o2Inst.frustumCulled = false;
      co2Inst.frustumCulled = false;
      rootGroup.add(o2Inst, co2Inst);

      animRefs.current = {
        leftLung,
        rightLung,
        diaphragm,
        ribcage,
        gasO2Inst: o2Inst,
        gasCO2Inst: co2Inst,
      };
      return { initialCameraDir: new THREE.Vector3(0.2, 0.15, 1) };
    };
  }, [mode, glbFileBuffer]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);

  const handleAnimateFrame = (ctx: SceneUpdateContext) => {
    const refs = animRefs.current;
    const t = ctx.isPlaying ? ctx.elapsed * ctx.speed : ctx.simTime;

    if (mode === 'heart') {
      const freq = heartRate / 60;
      const phase = (t * freq) % 1;
      // Systole atria (0 - 0.15), systole ventricles (0.15 - 0.45), diastole (0.45 - 1.0)
      const atrialScale = phase < 0.18 ? 1 - 0.1 * Math.sin((phase / 0.18) * Math.PI) : 1;
      const ventScale = phase >= 0.15 && phase < 0.48 ? 1 - 0.14 * Math.sin(((phase - 0.15) / 0.33) * Math.PI) : 1;
      refs.atriaGroup?.scale.setScalar(atrialScale);
      refs.ventriclesGroup?.scale.setScalar(ventScale);

      if (refs.bloodPoorInst && refs.poorCurve) {
        refs.bloodPoorInst.visible = showO2Flow;
        for (let i = 0; i < refs.bloodPoorInst.count; i++) {
          const u = ((t * freq * 0.35 + i / refs.bloodPoorInst.count) % 1 + 1) % 1;
          refs.poorCurve.getPointAt(u, tempPos);
          dummy.position.copy(tempPos);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          refs.bloodPoorInst.setMatrixAt(i, dummy.matrix);
        }
        refs.bloodPoorInst.instanceMatrix.needsUpdate = true;
      }
      if (refs.bloodRichInst && refs.richCurve) {
        refs.bloodRichInst.visible = showO2Flow;
        for (let i = 0; i < refs.bloodRichInst.count; i++) {
          const u = ((t * freq * 0.35 + i / refs.bloodRichInst.count) % 1 + 1) % 1;
          refs.richCurve.getPointAt(u, tempPos);
          dummy.position.copy(tempPos);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          refs.bloodRichInst.setMatrixAt(i, dummy.matrix);
        }
        refs.bloodRichInst.instanceMatrix.needsUpdate = true;
      }
    } else if (mode === 'lung') {
      const freq = breathRate / 60;
      const breathWave = Math.sin(t * freq * Math.PI * 2); // +1 inhale, -1 exhale
      const expand = 1 + breathWave * 0.085;
      refs.leftLung?.scale.set(expand, 1 + breathWave * 0.05, expand);
      refs.rightLung?.scale.set(expand, 1 + breathWave * 0.05, expand);
      if (refs.diaphragm) {
        // Diaphragm lowers on inhale (breathWave > 0)
        refs.diaphragm.position.y = -2.55 - breathWave * 0.28;
      }
      if (refs.ribcage) {
        refs.ribcage.scale.set(1 + breathWave * 0.04, 1, 1 + breathWave * 0.05);
      }
      if (refs.gasO2Inst && refs.gasCO2Inst) {
        refs.gasO2Inst.visible = showO2Flow;
        refs.gasCO2Inst.visible = showO2Flow;
        for (let i = 0; i < 18; i++) {
          const prog = ((t * freq * 0.7 + i / 18) % 1 + 1) % 1;
          const side = i % 2 === 0 ? -1 : 1;
          // O2 travels down trachea into lung
          const yIn = 2.7 - prog * 3.1;
          const xIn = prog > 0.55 ? side * (prog - 0.55) * 2.5 : Math.sin(i * 2.1) * 0.08;
          dummy.position.set(xIn, yIn, Math.cos(i) * 0.08);
          dummy.updateMatrix();
          refs.gasO2Inst.setMatrixAt(i, dummy.matrix);

          // CO2 travels out of lung up trachea
          const yOut = -0.4 + prog * 3.1;
          const xOut = prog < 0.45 ? side * (0.45 - prog) * 2.5 : Math.sin(i * 1.7) * 0.08;
          dummy.position.set(xOut, yOut, Math.sin(i) * 0.08);
          dummy.updateMatrix();
          refs.gasCO2Inst.setMatrixAt(i, dummy.matrix);
        }
        refs.gasO2Inst.instanceMatrix.needsUpdate = true;
        refs.gasCO2Inst.instanceMatrix.needsUpdate = true;
      }
    }
  };

  const handleUploadGlb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGlbError(null);
    try {
      const buf = await file.arrayBuffer();
      setGlbFileBuffer(buf);
      setMode('custom-glb');
    } catch {
      setGlbError('Không thể đọc tệp GLB từ máy tính.');
    }
  };

  const handleLoadGlbUrl = async () => {
    if (!glbUrlInput.trim()) {
      setGlbError('Vui lòng nhập đường dẫn tệp GLB/glTF hợp lệ.');
      return;
    }
    setGlbLoading(true);
    setGlbError(null);
    try {
      const res = await fetch(glbUrlInput.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      setGlbFileBuffer(buf);
      setMode('custom-glb');
    } catch {
      setGlbError(
        'Không tải được mô hình giải phẫu từ đường dẫn này (do mạng hoặc chính sách CORS). Hãy thử tải tệp GLB về máy rồi nạp trực tiếp, hoặc chuyển về mô hình Tim/Phổi sẵn có.',
      );
    } finally {
      setGlbLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Lab Mode Selector */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        <span className="font-semibold text-slate-800 text-ui-label mr-2">Chọn mô hình giải phẫu:</span>
        <button
          type="button"
          onClick={() => setMode('heart')}
          className={`min-h-[44px] px-4 py-2 rounded-lg font-semibold text-ui-min ${
            mode === 'heart' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
          }`}
        >
          Tim & Chu kì tim
        </button>
        <button
          type="button"
          onClick={() => setMode('lung')}
          className={`min-h-[44px] px-4 py-2 rounded-lg font-semibold text-ui-min ${
            mode === 'lung' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
          }`}
        >
          Phổi & Cơ hoành
        </button>
        <button
          type="button"
          onClick={() => setMode('custom-glb')}
          className={`min-h-[44px] px-4 py-2 rounded-lg font-semibold text-ui-min ${
            mode === 'custom-glb' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
          }`}
        >
          Nạp GLB / BodyParts3D
        </button>
      </div>

      {mode === 'custom-glb' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-ui-card-title">
                Trình nạp dữ liệu Giải phẫu mở (BodyParts3D / GLB / glTF)
              </h3>
              <p className="text-slate-600 text-ui-min">
                Nguồn chuẩn BodyParts3D (https://lifesciencedb.jp/bp3d/, giấy phép CC BY-SA 2.1 JP). Nạp tệp .glb/.gltf để kiểm tra các hệ cơ quan thật.
              </p>
            </div>
            <label className="min-h-[44px] px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 cursor-pointer inline-flex items-center gap-2 text-ui-min">
              <Upload className="w-4 h-4" />
              Chọn tệp .GLB từ máy
              <input type="file" accept=".glb,.gltf" onChange={handleUploadGlb} className="hidden" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="url"
              value={glbUrlInput}
              onChange={(e) => setGlbUrlInput(e.target.value)}
              placeholder="Hoặc dán URL tệp .glb cho phép CORS..."
              className="flex-1 min-w-[240px] min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-ui-min"
            />
            <button
              type="button"
              onClick={handleLoadGlbUrl}
              disabled={glbLoading}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 inline-flex items-center gap-2 text-ui-min disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${glbLoading ? 'animate-spin' : ''}`} />
              {glbLoading ? 'Đang tải...' : 'Tải mô hình'}
            </button>
          </div>
          {glbError && (
            <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-amber-900 text-ui-min flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
              <div>
                <div className="font-semibold">Chưa tải được dữ liệu giải phẫu ngoài</div>
                <div>{glbError}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <LabWorkspaceLayout
        title="Phòng Lab 01 – Giải phẫu người 3D"
        subtitle={
          mode === 'heart'
            ? 'Quan sát 4 ngăn tim, van tim và dòng máu giàu O₂ (đỏ) / nghèo O₂ (xanh)'
            : mode === 'lung'
              ? 'Quan sát cơ chế thông khí phổi, cơ hoành và trao đổi khí O₂ / CO₂'
              : 'Khám phá mô hình giải phẫu đa hệ cơ quan GLB / BodyParts3D'
        }
        viewerRef={viewer.viewerRef}
        parts={activeParts}
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
          viewer.setSimStepOffset((s) => s + 0.15);
        }}
        onResetSim={() => {
          setHeartRate(72);
          setBreathRate(16);
          viewer.resetViewAndParts();
        }}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        sourceMeta={sourceMeta}
        isPresentation={isPresentation}
        onTogglePresentation={onTogglePresentation}
        teacherGuideNote="Thầy cô có thể dùng thanh Cắt lát ngang để cho học sinh nhìn rõ buồng tim và độ dày thành tâm thất trái so với tâm thất phải."
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`anatomy-${mode}-${glbFileBuffer ? 'loaded' : 'empty'}`}
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
            parts={activeParts}
            quality={viewer.quality}
            fallbackTitle="Sơ đồ Tuần hoàn & Hô hấp 2D"
            fallbackItems={activeParts.map((p) => `${p.vietnameseName}: ${p.function}`)}
          />
        }
        simulationControlsExtra={
          mode === 'heart' ? (
            <div className="space-y-3">
              <label className="block space-y-1">
                <div className="flex justify-between font-medium text-slate-800 text-ui-min">
                  <span>Nhịp tim mô phỏng:</span>
                  <span className="font-mono-tabular font-bold text-rose-700">{heartRate} lần/phút</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={150}
                  step={2}
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full accent-rose-600 h-2 cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-2 text-slate-800 text-ui-min cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={showO2Flow}
                  onChange={(e) => setShowO2Flow(e.target.checked)}
                  className="w-5 h-5 accent-teal-700"
                />
                <span>Hiện dòng chảy máu giàu O₂ (đỏ) & nghèo O₂ (xanh)</span>
              </label>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-ui-min">
                Đây là thông số mô phỏng minh họa phục vụ dạy học, không dùng để chẩn đoán sức khỏe.
              </div>
            </div>
          ) : mode === 'lung' ? (
            <div className="space-y-3">
              <label className="block space-y-1">
                <div className="flex justify-between font-medium text-slate-800 text-ui-min">
                  <span>Nhịp hô hấp mô phỏng:</span>
                  <span className="font-mono-tabular font-bold text-blue-700">{breathRate} nhịp/phút</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={32}
                  step={1}
                  value={breathRate}
                  onChange={(e) => setBreathRate(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-2 text-slate-800 text-ui-min cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={showO2Flow}
                  onChange={(e) => setShowO2Flow(e.target.checked)}
                  className="w-5 h-5 accent-teal-700"
                />
                <span>Hiện dòng khí O₂ (xanh lam) & CO₂ (vàng)</span>
              </label>
            </div>
          ) : null
        }
        knowledgeContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">Trọng tâm kiến thức Sinh học 11</h4>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li>
                <strong>Màu sắc máu theo nồng độ O₂:</strong> Máu giàu O₂ có màu đỏ tươi (từ phổi qua tĩnh mạch phổi về tim trái và ra động mạch chủ). Máu nghèo O₂ có màu đỏ thẫm (kí hiệu xanh dương trong sơ đồ).
              </li>
              <li>
                <strong>Động mạch phổi</strong> dẫn máu nghèo O₂ từ tâm thất phải lên phổi; <strong>tĩnh mạch phổi</strong> dẫn máu giàu O₂ từ phổi về tâm nhĩ trái.
              </li>
              <li>
                <strong>Thông khí ở phổi:</strong> Khi cơ hoành co (hạ xuống) và cơ liên sườn nâng xương sườn, thể tích lồng ngực tăng → áp suất phế nang giảm → không khí tràn vào.
              </li>
            </ul>
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">Nhiệm vụ thực hành trên lớp</h4>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700">
              <li>Nhấp vào từng buồng tim để phân biệt thành tâm thất trái và tâm thất phải.</li>
              <li>Quan sát đường đi của các hạt màu xanh và màu đỏ để giải thích vai trò van tim.</li>
              <li>Chuyển sang mô hình Phổi, điều chỉnh nhịp thở lên 26 nhịp/phút và mô tả sự thay đổi của cơ hoành.</li>
            </ol>
          </div>
        }
      />
    </div>
  );
};
