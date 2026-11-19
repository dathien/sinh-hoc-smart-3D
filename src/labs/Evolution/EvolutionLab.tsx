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

type EvolutionMechanism = 'selection' | 'drift' | 'bottleneck' | 'founder' | 'gene-flow';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface EvoParams {
  mechanism: EvolutionMechanism;
  popSize: number;
  initP: number;
  selAdvantage: number; // 0 to 0.5 for allele A
  migrationRate: number; // 0 to 0.3
  generations: number;
  seed: number;
}

function runEvolutionSeries(params: EvoParams) {
  const rand = mulberry32(params.seed);
  const data: { gen: number; p: number; q: number; het: number; popN: number }[] = [];
  let p = params.initP;
  let currentN = params.popSize;

  for (let g = 0; g <= params.generations; g++) {
    const q = Math.max(0, Math.min(1, 1 - p));
    data.push({
      gen: g,
      p: Number(p.toFixed(3)),
      q: Number(q.toFixed(3)),
      het: Number((2 * p * q).toFixed(3)),
      popN: currentN,
    });

    let nextP = p;
    let nEffective = params.popSize;

    if (params.mechanism === 'selection') {
      const wAA = 1 + params.selAdvantage;
      const wAa = 1 + params.selAdvantage * 0.7;
      const waa = 1;
      const wBar = p * p * wAA + 2 * p * q * wAa + q * q * waa;
      nextP = wBar > 0 ? (p * p * wAA + p * q * wAa) / wBar : p;
    } else if (params.mechanism === 'bottleneck') {
      nEffective = g >= 5 && g <= 9 ? Math.max(8, Math.round(params.popSize * 0.08)) : params.popSize;
    } else if (params.mechanism === 'founder') {
      nEffective = g === 1 ? Math.max(6, Math.round(params.popSize * 0.06)) : params.popSize;
    } else if (params.mechanism === 'gene-flow') {
      const migrantP = 0.85;
      nextP = (1 - params.migrationRate) * p + params.migrationRate * migrantP;
    }

    currentN = nEffective;
    // Binomial Wright-Fisher sampling for genetic drift
    let countA = 0;
    const alleles = Math.max(4, nEffective * 2);
    for (let i = 0; i < alleles; i++) {
      if (rand() < nextP) countA++;
    }
    p = countA / alleles;
  }
  return data;
}

const MECHANISM_LABELS: Record<EvolutionMechanism, string> = {
  selection: 'Chọn lọc tự nhiên',
  drift: 'Phiêu bạt di truyền (yếu tố ngẫu nhiên)',
  bottleneck: 'Hiệu ứng thắt cổ chai (thiên tai)',
  founder: 'Hiệu ứng kẻ sáng lập',
  'gene-flow': 'Dòng gene (Di – nhập gene)',
};

export const EvolutionLab: React.FC = () => {
  const [mechanism, setMechanism] = useState<EvolutionMechanism>('selection');
  const [popSize, setPopSize] = useState(120);
  const [initP, setInitP] = useState(0.5);
  const [selAdvantage, setSelAdvantage] = useState(0.22);
  const [migrationRate, setMigrationRate] = useState(0.12);
  const [seed, setSeed] = useState(2026);
  const [activeGenIndex, setActiveGenIndex] = useState(0);
  const [compareSnapshot, setCompareSnapshot] = useState<{ label: string; data: ReturnType<typeof runEvolutionSeries> } | null>(null);

  const viewer = useLabViewerState(true);
  const swarmRefs = useRef<THREE.Mesh[]>([]);

  const seriesA = useMemo(
    () =>
      runEvolutionSeries({
        mechanism,
        popSize,
        initP,
        selAdvantage,
        migrationRate,
        generations: 30,
        seed,
      }),
    [mechanism, popSize, initP, selAdvantage, migrationRate, seed],
  );

  const chartData = useMemo(() => {
    return seriesA.map((pt, i) => ({
      gen: `T${pt.gen}`,
      pA: pt.p,
      qA: pt.q,
      pB: compareSnapshot?.data[i]?.p ?? undefined,
    }));
  }, [seriesA, compareSnapshot]);

  const currentPoint = seriesA[Math.min(activeGenIndex, seriesA.length - 1)] ?? seriesA[0];

  const parts: ModelPartInfo[] = [
    {
      id: 'allele-a-pop',
      vietnameseName: 'Nhóm cá thể mang kiểu hình allele A (Màu xanh ngọc)',
      scientificName: 'Phenotype A (Allele A Frequency p)',
      location: 'Trong không gian sinh cảnh quần thể',
      structure: 'Tỉ lệ cá thể biểu hiện kiểu hình quy định bởi allele A.',
      function: 'Nếu allele A mang lại ưu thế sống sót hoặc sinh sản trong môi trường hiện tại, tần số p tăng dần qua các thế hệ.',
      relatedLessons: ['Các nhân tố tiến hóa'],
      colorHex: '#0D9488',
    },
    {
      id: 'allele-a-small',
      vietnameseName: 'Nhóm cá thể đồng hợp lặn aa (Màu hổ phách)',
      scientificName: 'Recessive Phenotype aa (Allele a Frequency q)',
      location: 'Cùng sinh cảnh quần thể',
      structure: 'Các cá thể biểu hiện tính trạng lặn.',
      function: 'Ở quần thể kích thước nhỏ, yếu tố ngẫu nhiên có thể làm mất hoặc cố định allele bất kể có lợi hay hại.',
      relatedLessons: ['Phiêu bạt di truyền'],
      colorHex: '#F59E0B',
    },
  ];

  const buildModel = (rootGroup: THREE.Group, quality: QualityLevel) => {
    const segs = quality === 'low' ? 10 : 16;
    swarmRefs.current = [];

    const habitat = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }),
    );
    habitat.position.y = -1.2;
    rootGroup.add(habitat);

    const groupA = new THREE.Group();
    groupA.userData.partId = 'allele-a-pop';
    const groupB = new THREE.Group();
    groupB.userData.partId = 'allele-a-small';

    const total = 48;
    const rand = mulberry32(99);
    for (let i = 0; i < total; i++) {
      const isDominant = i < Math.round(currentPoint.p * total);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, segs, segs),
        new THREE.MeshStandardMaterial({
          color: isDominant ? 0x0d9488 : 0xf59e0b,
          roughness: 0.35,
        }),
      );
      const angle = rand() * Math.PI * 2;
      const rad = 0.4 + rand() * 2.4;
      mesh.position.set(Math.cos(angle) * rad, -0.8 + rand() * 1.6, Math.sin(angle) * rad);
      mesh.userData.basePos = mesh.position.clone();
      mesh.userData.phase = rand() * Math.PI * 2;
      if (isDominant) groupA.add(mesh);
      else groupB.add(mesh);
      swarmRefs.current.push(mesh);
    }
    rootGroup.add(groupA, groupB);

    return { partsMeta: parts, initialCameraDir: new THREE.Vector3(0.4, 0.55, 0.85) };
  };

  const handleAnimateFrame = (ctx: SceneUpdateContext) => {
    if (!ctx.isPlaying) return;
    const t = ctx.elapsed * ctx.speed;
    swarmRefs.current.forEach((m) => {
      const base = m.userData.basePos as THREE.Vector3;
      const ph = m.userData.phase as number;
      if (!base) return;
      m.position.x = base.x + Math.sin(t * 1.1 + ph) * 0.16;
      m.position.y = base.y + Math.cos(t * 1.4 + ph) * 0.12;
      m.position.z = base.z + Math.cos(t * 0.9 + ph) * 0.16;
    });
  };

  const sourceMeta: ScientificSourceMeta = {
    name: 'Mô phỏng Tiến hóa Quần thể (Wright–Fisher)',
    source: 'Sinh học 12 – Tiến hóa (Chương trình GDPT 2018)',
    identifier: `EVO-${mechanism.toUpperCase()}-SEED-${seed}`,
    version: '1.0',
    license: 'Học liệu số giáo dục THPT',
    dataType: 'Mô phỏng định lượng',
    verifiedStatus: 'Dùng bộ sinh số ngẫu nhiên có seed tái lập; đột biến là vô hướng, chọn lọc dựa trên mức thích nghi tương đối',
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-3">
        {(Object.keys(MECHANISM_LABELS) as EvolutionMechanism[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMechanism(m)}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
              mechanism === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {MECHANISM_LABELS[m]}
          </button>
        ))}
      </div>

      <LabWorkspaceLayout
        title="Phòng Lab 10 · Tiến hóa Quần thể"
        subtitle="Theo dõi biến đổi tần số allele p, q và kiểu gene qua 30 thế hệ; so sánh hai kịch bản tiến hóa"
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
        onStepForward={() => setActiveGenIndex((v) => Math.min(30, v + 1))}
        onResetSim={() => {
          setActiveGenIndex(0);
          setSeed(2026);
          viewer.resetViewAndParts();
        }}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        teacherGuideNote="Lưu ý học sinh: Sinh vật không 'chủ động biến đổi để thích nghi'. Đột biến phát sinh ngẫu nhiên; môi trường đóng vai trò sàng lọc giữ lại kiểu hình thích nghi hơn."
        sourceMeta={sourceMeta}
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`evo-${mechanism}-${activeGenIndex}-${currentPoint.p}`}
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
            parts={parts}
            quality={viewer.quality}
            fallbackTitle="Mô phỏng Tiến hóa Quần thể 2D"
            fallbackItems={parts.map((p) => `${p.vietnameseName}: ${p.function}`)}
          />
        }
        simulationControlsExtra={
          <div className="space-y-3">
            <label className="block space-y-1">
              <div className="flex justify-between text-ui-min font-medium">
                <span>Thế hệ quan sát trong 3D</span>
                <span className="font-mono-tabular font-bold text-teal-700">
                  Thế hệ {currentPoint.gen} (p = {currentPoint.p}, q = {currentPoint.q})
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={activeGenIndex}
                onChange={(e) => setActiveGenIndex(Number(e.target.value))}
                className="w-full accent-teal-700 h-2"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-ui-min font-medium">
                <span>Kích thước quần thể (N)</span>
                <span className="font-mono-tabular">{popSize} cá thể</span>
              </div>
              <input
                type="range"
                min={16}
                max={400}
                step={8}
                value={popSize}
                onChange={(e) => setPopSize(Number(e.target.value))}
                className="w-full accent-blue-600 h-2"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-ui-min font-medium">
                <span>Tần số allele A ban đầu (p₀)</span>
                <span className="font-mono-tabular">{initP.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={initP}
                onChange={(e) => setInitP(Number(e.target.value))}
                className="w-full accent-teal-700 h-2"
              />
            </label>

            {mechanism === 'selection' && (
              <label className="block space-y-1">
                <div className="flex justify-between text-ui-min font-medium">
                  <span>Hệ số chọn lọc có lợi cho allele A (s)</span>
                  <span className="font-mono-tabular">{selAdvantage.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.02}
                  max={0.5}
                  step={0.02}
                  value={selAdvantage}
                  onChange={(e) => setSelAdvantage(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-2"
                />
              </label>
            )}

            {mechanism === 'gene-flow' && (
              <label className="block space-y-1">
                <div className="flex justify-between text-ui-min font-medium">
                  <span>Tỉ lệ nhập cư (m)</span>
                  <span className="font-mono-tabular">{Math.round(migrationRate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.02}
                  max={0.35}
                  step={0.02}
                  value={migrationRate}
                  onChange={(e) => setMigrationRate(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2"
                />
              </label>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSeed((s) => s + 7)}
                className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-ui-min font-medium"
              >
                Chạy mẫu ngẫu nhiên mới (Seed #{seed})
              </button>
              <button
                type="button"
                onClick={() =>
                  setCompareSnapshot({
                    label: `${MECHANISM_LABELS[mechanism]} (N=${popSize})`,
                    data: seriesA,
                  })
                }
                className="min-h-[44px] px-3 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 text-ui-min font-semibold"
              >
                Lưu làm Kịch bản B để so sánh
              </button>
            </div>
          </div>
        }
        knowledgeContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900">Biểu đồ biến đổi tần số allele p(A) qua 30 thế hệ</h4>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="gen" tick={{ fontSize: 15, fill: '#334155' }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 15, fill: '#334155' }} />
                  <Tooltip contentStyle={{ fontSize: '15px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '15px' }} />
                  <Line type="monotone" dataKey="pA" stroke="#0D9488" strokeWidth={2.5} name="Kịch bản hiện tại p(A)" dot={false} />
                  <Line type="monotone" dataKey="qA" stroke="#F59E0B" strokeWidth={2} name="Tần số q(a)" dot={false} />
                  {compareSnapshot && (
                    <Line
                      type="monotone"
                      dataKey="pB"
                      stroke="#2563EB"
                      strokeDasharray="5 5"
                      strokeWidth={2.5}
                      name={`So sánh B: ${compareSnapshot.label}`}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900">Thí nghiệm so sánh kích thước quần thể</div>
              <p className="text-slate-700">
                Chọn <strong>Phiêu bạt di truyền</strong> với N = 320, nhấn <em>Lưu làm Kịch bản B</em>, sau đó giảm N xuống 24. Quan sát độ dao động mạnh của tần số allele ở quần thể nhỏ.
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
};
