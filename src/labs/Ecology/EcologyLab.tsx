import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CartesianGrid,
  Legend,
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

type EcosystemId = 'forest' | 'pond' | 'grassland' | 'marine' | 'agro';

interface EcoPreset {
  title: string;
  chain: string[];
  groundColor: number;
  waterColor: number;
  parts: ModelPartInfo[];
}

const ECOSYSTEMS: Record<EcosystemId, EcoPreset> = {
  forest: {
    title: 'Hệ sinh thái Rừng nhiệt đới',
    chain: ['Cây gỗ & Thực vật tầng tán (SVSX)', 'Sâu ăn lá / Nai (SVTT bậc 1)', 'Chim ăn sâu / Báo (SVTT bậc 2–3)', 'Nấm & Vi khuẩn (SV phân giải)'],
    groundColor: 0x166534,
    waterColor: 0x0284c7,
    parts: [
      { id: 'producer', vietnameseName: 'Sinh vật sản xuất (Thực vật rừng)', scientificName: 'Producers (Autotrophs)', location: 'Tầng tán và tầng bụi', structure: 'Cây xanh quang hợp tổng hợp chất hữu cơ.', function: 'Chuyển quang năng thành hóa năng nuôi toàn bộ hệ sinh thái.', relatedLessons: ['Hệ sinh thái'], colorHex: '#16A34A' },
      { id: 'consumer1', vietnameseName: 'Sinh vật tiêu thụ bậc 1', scientificName: 'Primary Consumers (Herbivores)', location: 'Tầng giữa & mặt đất', structure: 'Động vật ăn thực vật.', function: 'Chuyển hóa năng lượng từ thực vật lên bậc dinh dưỡng tiếp theo.', relatedLessons: ['Chuỗi thức ăn'], colorHex: '#F59E0B' },
      { id: 'consumer2', vietnameseName: 'Sinh vật tiêu thụ bậc 2–3', scientificName: 'Secondary / Tertiary Consumers', location: 'Đỉnh lưới thức ăn', structure: 'Động vật ăn thịt kiểm soát mật độ con mồi.', function: 'Giữ cân bằng sinh học quần xã.', relatedLessons: ['Lưới thức ăn'], colorHex: '#EF4444' },
      { id: 'decomposer', vietnameseName: 'Sinh vật phân giải', scientificName: 'Decomposers (Fungi & Bacteria)', location: 'Tầng thảm mục đất rừng', structure: 'Nấm hoại sinh và vi khuẩn đất.', function: 'Phân giải xác hữu cơ thành chất khoáng trả lại môi trường cho thực vật.', relatedLessons: ['Chu trình vật chất'], colorHex: '#A16207' },
    ],
  },
  pond: {
    title: 'Hệ sinh thái Ao hồ nước ngọt',
    chain: ['Thực vật phù du & Rong (SVSX)', 'Động vật phù du / Cá trắm cỏ (SVTT bậc 1)', 'Cá quả / Cò (SVTT bậc 2–3)', 'Vi khuẩn bùn đáy (SV phân giải)'],
    groundColor: 0x3f6212,
    waterColor: 0x0ea5e9,
    parts: [
      { id: 'producer', vietnameseName: 'Tảo lục & Thực vật thủy sinh', scientificName: 'Phytoplankton & Macrophytes', location: 'Tầng nước mặt có ánh sáng', structure: 'Thực vật nổi và rong thủy sinh.', function: 'Quang hợp tạo O₂ hòa tan và sinh khối sơ cấp.', relatedLessons: ['Hệ sinh thái nước ngọt'], colorHex: '#22C55E' },
      { id: 'consumer1', vietnameseName: 'Động vật phù du & Cá ăn thực vật', scientificName: 'Zooplankton & Herbivorous Fish', location: 'Tầng nước giữa', structure: 'Giáp xác nhỏ, cá ăn tảo.', function: 'Tiêu thụ sản xuất sơ cấp.', relatedLessons: ['Tháp sinh thái'], colorHex: '#FBBF24' },
      { id: 'consumer2', vietnameseName: 'Cá ăn thịt & Chim nước', scientificName: 'Carnivorous Fish', location: 'Tầng mặt & đáy', structure: 'Động vật săn mồi bậc cao.', function: 'Điều hòa quần thể cá nhỏ.', relatedLessons: ['Quan hệ dinh dưỡng'], colorHex: '#F97316' },
      { id: 'decomposer', vietnameseName: 'Vi sinh vật bùn đáy', scientificName: 'Benthic Decomposers', location: 'Lớp bùn đáy ao', structure: 'Vi khuẩn phân giải kị khí và hiếu khí.', function: 'Khoáng hóa chất thải, hoàn nguyên chu trình dinh dưỡng.', relatedLessons: ['Chu trình Carbon & Nitrogen'], colorHex: '#78350F' },
    ],
  },
  grassland: {
    title: 'Hệ sinh thái Thảo nguyên',
    chain: ['Cỏ thảo nguyên (SVSX)', 'Châu chấu / Linh dương (SVTT bậc 1)', 'Sói / Sư tử (SVTT bậc 2)', 'Vi khuẩn & Nấm đất (SV phân giải)'],
    groundColor: 0x65a30d,
    waterColor: 0x38bdf8,
    parts: [
      { id: 'producer', vietnameseName: 'Thảm cỏ thảo nguyên', scientificName: 'Grassland Producers', location: 'Toàn bộ bề mặt đồng cỏ', structure: 'Hệ thực vật C4 chịu hạn.', function: 'Nguồn năng lượng gốc cho đàn động vật ăn cỏ.', relatedLessons: ['Tháp sinh khối'], colorHex: '#65A30D' },
      { id: 'consumer1', vietnameseName: 'Động vật ăn cỏ', scientificName: 'Grazing Herbivores', location: 'Trên đồng cỏ', structure: 'Côn trùng, thú gặm cỏ.', function: 'Bậc tiêu thụ sơ cấp.', relatedLessons: ['Chuỗi thức ăn'], colorHex: '#EAB308' },
      { id: 'consumer2', vietnameseName: 'Động vật ăn thịt', scientificName: 'Apex Predators', location: 'Vùng săn mồi', structure: 'Thú săn mồi tốc độ cao.', function: 'Khống chế sinh học quần thể ăn cỏ.', relatedLessons: ['Biến động số lượng'], colorHex: '#DC2626' },
      { id: 'decomposer', vietnameseName: 'Hệ vi sinh vật đất', scientificName: 'Soil Decomposers', location: 'Tầng đất mặt', structure: 'Vi khuẩn cố định đạm và phân giải.', function: 'Tái tạo độ phì nhiêu đất.', relatedLessons: ['Chu trình Nitrogen'], colorHex: '#92400E' },
    ],
  },
  marine: {
    title: 'Hệ sinh thái Biển & Rạn san hô',
    chain: ['Tảo biển & Thực vật phù du (SVSX)', 'Nhuyễn thể / Cá rạn (SVTT bậc 1)', 'Cá ngừ / Cá mập (SVTT bậc 2–3)', 'Vi khuẩn biển sâu (SV phân giải)'],
    groundColor: 0x0f766e,
    waterColor: 0x0369a1,
    parts: [
      { id: 'producer', vietnameseName: 'Thực vật phù du & Tảo biển', scientificName: 'Marine Phytoplankton', location: 'Tầng nước chiếu sáng (0–200 m)', structure: 'Tảo đơn bào, rong biển.', function: 'Đóng góp tỉ trọng lớn sản lượng sơ cấp và O₂ toàn cầu.', relatedLessons: ['Sinh quyển'], colorHex: '#14B8A6' },
      { id: 'consumer1', vietnameseName: 'Động vật phù du & Cá nhỏ', scientificName: 'Krill & Reef Fish', location: 'Tầng nước mặt & rạn san hô', structure: 'Giáp xác, cá ăn tảo.', function: 'Mắt xích truyền năng lượng biển.', relatedLessons: ['Lưới thức ăn biển'], colorHex: '#F59E0B' },
      { id: 'consumer2', vietnameseName: 'Động vật săn mồi đại dương', scientificName: 'Pelagic Predators', location: 'Vùng biển khơi', structure: 'Cá săn mồi kích thước lớn.', function: 'Bậc dinh dưỡng cao.', relatedLessons: ['Tháp năng lượng'], colorHex: '#EF4444' },
      { id: 'decomposer', vietnameseName: 'Vi khuẩn phân giải biển', scientificName: 'Marine Decomposers', location: 'Tầng đáy đại dương', structure: 'Vi khuẩn phân giải xác sinh vật chìm xuống.', function: 'Tuần hoàn khoáng chất biển.', relatedLessons: ['Chu trình sinh địa hóa'], colorHex: '#475569' },
    ],
  },
  agro: {
    title: 'Hệ sinh thái Nông nghiệp (Ruộng lúa)',
    chain: ['Cây lúa (SVSX)', 'Rầy nâu / Sâu cuốn lá (SVTT bậc 1)', 'Nhện / Ếch / Chim sâu (SVTT bậc 2)', 'Vi sinh vật đất ruộng (SV phân giải)'],
    groundColor: 0x4d7c0f,
    waterColor: 0x0284c7,
    parts: [
      { id: 'producer', vietnameseName: 'Quần thể cây lúa', scientificName: 'Oryza sativa', location: 'Trên mặt ruộng ngập nước nông', structure: 'Quần thể đồng nhất năng suất cao nhờ chăm sóc.', function: 'Cung cấp lương thực; cần bảo vệ đa dạng thiên địch.', relatedLessons: ['Hệ sinh thái nhân tạo'], colorHex: '#84CC16' },
      { id: 'consumer1', vietnameseName: 'Sâu hại lúa (Rầy nâu)', scientificName: 'Rice Pests', location: 'Thân và lá lúa', structure: 'Côn trùng chích hút nhựa cây.', function: 'Bùng phát dịch nếu mất thiên địch.', relatedLessons: ['Khống chế sinh học'], colorHex: '#F97316' },
      { id: 'consumer2', vietnameseName: 'Thiên địch (Ếch, Nhện, Chim)', scientificName: 'Natural Enemies', location: 'Mặt ruộng và bờ ruộng', structure: 'Động vật ăn sâu hại.', function: 'Kiểm soát sâu hại bền vững, giảm thuốc bảo vệ thực vật.', relatedLessons: ['Ứng dụng sinh thái'], colorHex: '#2563EB' },
      { id: 'decomposer', vietnameseName: 'Vi khuẩn phân giải rơm rạ', scientificName: 'Paddy Decomposers', location: 'Lớp bùn ruộng', structure: 'Vi sinh vật hiếu/kị khí.', function: 'Phân giải rơm rạ thành mùn hữu cơ.', relatedLessons: ['Nông nghiệp bền vững'], colorHex: '#713F12' },
    ],
  },
};

export const EcologyLab: React.FC = () => {
  const [ecoId, setEcoId] = useState<EcosystemId>('forest');
  const [simMode, setSimMode] = useState<'predator-prey' | 'logistic' | 'pyramid'>('predator-prey');
  const [carryingK, setCarryingK] = useState(500);
  const [growthR, setGrowthR] = useState(0.45);
  const [preyInit, setPreyInit] = useState(120);
  const [predInit, setPredInit] = useState(25);

  const viewer = useLabViewerState(true);
  const floatRefs = useRef<THREE.Mesh[]>([]);
  const eco = ECOSYSTEMS[ecoId];

  // Safely clamped population simulation (always >= 0 and finite)
  const ecoSeries = useMemo(() => {
    const rows: { step: string; Prey: number; Predator: number; LogisticN: number }[] = [];
    let x = Math.max(1, preyInit);
    let y = Math.max(1, predInit);
    let logN = 20;

    const alpha = 0.08;
    const beta = 0.0022;
    const delta = 0.0011;
    const gamma = 0.14;
    const dt = 0.35;

    for (let t = 0; t <= 40; t++) {
      const safeX = Number.isFinite(x) ? Math.max(0, Math.round(x)) : 0;
      const safeY = Number.isFinite(y) ? Math.max(0, Math.round(y)) : 0;
      const safeLog = Number.isFinite(logN) ? Math.max(0, Math.round(logN)) : 0;
      rows.push({ step: `T${t}`, Prey: safeX, Predator: safeY, LogisticN: safeLog });

      // Sub-steps for numerical stability
      for (let s = 0; s < 4; s++) {
        const subDt = dt / 4;
        const dx = (alpha * x - beta * x * y) * subDt;
        const dy = (delta * x * y - gamma * y) * subDt;
        x = Math.min(2000, Math.max(0, x + dx));
        y = Math.min(1000, Math.max(0, y + dy));
      }
      const dLog = growthR * logN * (1 - logN / Math.max(50, carryingK));
      logN = Math.max(0, Math.min(carryingK * 1.1, logN + dLog * 0.5));
    }
    return rows;
  }, [preyInit, predInit, carryingK, growthR]);

  const buildModel = (rootGroup: THREE.Group, quality: QualityLevel) => {
    const segs = quality === 'low' ? 12 : 20;
    floatRefs.current = [];

    // Ground & water base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.6, 0.35, 28),
      new THREE.MeshStandardMaterial({ color: eco.groundColor, roughness: 0.75 }),
    );
    base.position.y = -1.3;
    rootGroup.add(base);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(3.35, 3.35, 0.12, 28),
      new THREE.MeshPhysicalMaterial({ color: eco.waterColor, transparent: true, opacity: 0.45, roughness: 0.2 }),
    );
    water.position.y = -1.08;
    rootGroup.add(water);

    // Producers
    const prodG = new THREE.Group();
    prodG.userData.partId = 'producer';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 1.3, 10),
        new THREE.MeshStandardMaterial({ color: 0x78350f }),
      );
      trunk.position.set(Math.cos(a) * 1.9, -0.45, Math.sin(a) * 1.9);
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 1.4, segs),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 }),
      );
      crown.position.set(Math.cos(a) * 1.9, 0.45, Math.sin(a) * 1.9);
      crown.userData.explodeDir = new THREE.Vector3(Math.cos(a), 0.5, Math.sin(a));
      prodG.add(trunk, crown);
    }
    rootGroup.add(prodG);

    // Consumer 1
    const c1G = new THREE.Group();
    c1G.userData.partId = 'consumer1';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const herb = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, segs, segs),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }),
      );
      herb.position.set(Math.cos(a) * 1.1, -0.65, Math.sin(a) * 1.1);
      herb.userData.baseAngle = a;
      herb.userData.radius = 1.1;
      c1G.add(herb);
      floatRefs.current.push(herb);
    }
    rootGroup.add(c1G);

    // Consumer 2
    const c2G = new THREE.Group();
    c2G.userData.partId = 'consumer2';
    const pred = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38, 0),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }),
    );
    pred.position.set(0, 0.35, 0);
    pred.userData.baseAngle = 0;
    pred.userData.radius = 0.7;
    c2G.add(pred);
    floatRefs.current.push(pred);
    rootGroup.add(c2G);

    // Decomposers
    const decG = new THREE.Group();
    decG.userData.partId = 'decomposer';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const mush = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.6 }),
      );
      mush.position.set(Math.cos(a) * 2.4, -1.05, Math.sin(a) * 2.4);
      decG.add(mush);
    }
    rootGroup.add(decG);

    return { partsMeta: eco.parts, initialCameraDir: new THREE.Vector3(0.5, 0.55, 0.85) };
  };

  const handleAnimateFrame = (ctx: SceneUpdateContext) => {
    if (!ctx.isPlaying) return;
    const t = ctx.elapsed * ctx.speed;
    floatRefs.current.forEach((m, idx) => {
      const r = m.userData.radius as number;
      const baseA = m.userData.baseAngle as number;
      const speedMul = idx === floatRefs.current.length - 1 ? 0.6 : 0.35;
      const a = baseA + t * speedMul;
      m.position.x = Math.cos(a) * r;
      m.position.z = Math.sin(a) * r;
    });
  };

  const sourceMeta: ScientificSourceMeta = {
    name: `Mô phỏng ${eco.title}`,
    source: 'Sinh học 12 – Sinh thái học (Chương trình GDPT 2018)',
    identifier: `ECO-${ecoId.toUpperCase()}`,
    version: '1.0',
    license: 'Học liệu số giáo dục THPT',
    dataType: 'Mô phỏng định lượng',
    verifiedStatus: 'Dòng năng lượng truyền một chiều (hiệu suất ~10%); vật chất tuần hoàn khép kín qua sinh vật phân giải',
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-3">
        {(Object.keys(ECOSYSTEMS) as EcosystemId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setEcoId(id);
              viewer.resetViewAndParts();
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
              ecoId === id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {ECOSYSTEMS[id].title}
          </button>
        ))}
      </div>

      <LabWorkspaceLayout
        title={`Phòng Lab 11 · ${eco.title}`}
        subtitle="Chuỗi – lưới thức ăn, tháp sinh thái 10%, mô phỏng tăng trưởng Logistic và biến động vật ăn thịt – con mồi"
        viewerRef={viewer.viewerRef}
        parts={eco.parts}
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
          setCarryingK(500);
          setGrowthR(0.45);
          setPreyInit(120);
          setPredInit(25);
          viewer.resetViewAndParts();
        }}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        teacherGuideNote="Nhấn mạnh chiều mũi tên trong chuỗi thức ăn luôn chỉ hướng truyền năng lượng (từ sinh vật bị ăn sang sinh vật ăn) và hiệu suất sinh thái chỉ đạt khoảng 10% qua mỗi bậc."
        sourceMeta={sourceMeta}
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`eco-${ecoId}`}
            buildModel={buildModel}
            onAnimateFrame={handleAnimateFrame}
            onSelectPart={viewer.setSelectedPartId}
            selectedPartId={viewer.selectedPartId}
            hiddenPartIds={viewer.hiddenPartIds}
            isolatedPartId={viewer.isolatedPartId}
            autoRotate={viewer.autoRotate}
            isPlaying={viewer.isPlaying}
            speed={viewer.speed}
            opacityLevel={viewer.opacityLevel}
            clipY={viewer.clipY}
            clipX={viewer.clipX}
            explodeFactor={viewer.explodeFactor}
            showLabels={viewer.showLabels}
            parts={eco.parts}
            quality={viewer.quality}
            fallbackTitle={`Sơ đồ ${eco.title}`}
            fallbackItems={eco.chain}
          />
        }
        simulationControlsExtra={
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'predator-prey' as const, label: 'Con mồi – Vật ăn thịt' },
                { id: 'logistic' as const, label: 'Đường cong Logistic (K)' },
                { id: 'pyramid' as const, label: 'Tháp năng lượng' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSimMode(s.id)}
                  className={`min-h-[44px] px-2 py-1.5 rounded-lg font-semibold text-ui-min ${
                    simMode === s.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {simMode === 'predator-prey' && (
              <>
                <label className="block space-y-1">
                  <div className="flex justify-between text-ui-min font-medium">
                    <span>Số lượng Con mồi ban đầu</span>
                    <span className="font-mono-tabular">{preyInit}</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={300}
                    step={10}
                    value={preyInit}
                    onChange={(e) => setPreyInit(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-2"
                  />
                </label>
                <label className="block space-y-1">
                  <div className="flex justify-between text-ui-min font-medium">
                    <span>Số lượng Vật ăn thịt ban đầu</span>
                    <span className="font-mono-tabular">{predInit}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={predInit}
                    onChange={(e) => setPredInit(Number(e.target.value))}
                    className="w-full accent-rose-600 h-2"
                  />
                </label>
              </>
            )}

            {simMode === 'logistic' && (
              <>
                <label className="block space-y-1">
                  <div className="flex justify-between text-ui-min font-medium">
                    <span>Sức chứa môi trường (K)</span>
                    <span className="font-mono-tabular">{carryingK} cá thể</span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={1000}
                    step={50}
                    value={carryingK}
                    onChange={(e) => setCarryingK(Number(e.target.value))}
                    className="w-full accent-teal-700 h-2"
                  />
                </label>
                <label className="block space-y-1">
                  <div className="flex justify-between text-ui-min font-medium">
                    <span>Tốc độ tăng trưởng nội tại (r)</span>
                    <span className="font-mono-tabular">{growthR.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    value={growthR}
                    onChange={(e) => setGrowthR(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2"
                  />
                </label>
              </>
            )}
          </div>
        }
        knowledgeContent={
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
              <div className="font-bold text-emerald-900">Chuỗi thức ăn tiêu biểu (Dòng năng lượng)</div>
              <div className="text-slate-800 font-medium">{eco.chain.join(' → ')}</div>
            </div>

            {simMode === 'pyramid' ? (
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Tháp năng lượng (Quy luật ~10%)</div>
                {[
                  { label: 'Bậc 3 · SV tiêu thụ bậc 2 (100 kcal)', w: '32%', color: 'bg-rose-500' },
                  { label: 'Bậc 2 · SV tiêu thụ bậc 1 (1.000 kcal)', w: '60%', color: 'bg-amber-500' },
                  { label: 'Bậc 1 · Sinh vật sản xuất (10.000 kcal)', w: '100%', color: 'bg-emerald-600' },
                ].map((tier) => (
                  <div key={tier.label} className="flex flex-col items-center">
                    <div
                      style={{ width: tier.w }}
                      className={`${tier.color} text-white font-semibold py-2.5 px-3 rounded-lg text-center text-ui-min`}
                    >
                      {tier.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ecoSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="step" tick={{ fontSize: 15, fill: '#334155' }} />
                    <YAxis tick={{ fontSize: 15, fill: '#334155' }} />
                    <Tooltip contentStyle={{ fontSize: '15px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '15px' }} />
                    {simMode === 'predator-prey' ? (
                      <>
                        <Line type="monotone" dataKey="Prey" stroke="#16A34A" strokeWidth={2.5} name="Con mồi" dot={false} />
                        <Line type="monotone" dataKey="Predator" stroke="#EF4444" strokeWidth={2.5} name="Vật ăn thịt" dot={false} />
                      </>
                    ) : (
                      <Line type="monotone" dataKey="LogisticN" stroke="#0D9488" strokeWidth={2.5} name="Kích thước N(t)" dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900">Bài tập Sinh thái</div>
              <p className="text-slate-700">
                Quan sát đồ thị Con mồi – Vật ăn thịt: Vì sao đỉnh số lượng vật ăn thịt luôn xuất hiện trễ hơn đỉnh số lượng con mồi một pha thời gian?
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
};
