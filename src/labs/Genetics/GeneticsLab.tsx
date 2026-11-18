import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FormulaRendererSVG } from '../../components/formula/FormulaRendererSVG';
import { ModelViewer3D } from '../../components/viewer3d/ModelViewer3D';
import { ModelPartInfo, QualityLevel } from '../../types/biology';

type CrossMode =
  | 'monohybrid'
  | 'dihybrid'
  | 'incomplete'
  | 'codominance'
  | 'epistasis'
  | 'linkage'
  | 'sex-linked'
  | 'maternal';

interface CrossOutcome {
  genotype: string;
  phenotype: string;
  count: number;
}

const CROSS_LABELS: Record<CrossMode, string> = {
  monohybrid: 'Lai 1 cặp tính trạng (Mendel)',
  dihybrid: 'Lai 2 cặp tính trạng (Phân li độc lập)',
  incomplete: 'Trội không hoàn toàn (Hoa phấn)',
  codominance: 'Đồng trội (Nhóm máu ABO)',
  epistasis: 'Tương tác bổ sung (9 : 7)',
  linkage: 'Liên kết & Hoán vị gene (f%)',
  'sex-linked': 'Liên kết giới tính NST X',
  maternal: 'Di truyền ngoài nhân (theo dòng mẹ)',
};

const PEDIGREE_CASES = [
  {
    id: 'autosomal-recessive',
    title: 'Phả hệ 1: Bố mẹ bình thường sinh con mắc bệnh (Lặn trên NST thường)',
    reason: 'Cả bố (Aa) và mẹ (Aa) đều không biểu hiện bệnh nhưng sinh con gái mắc bệnh (aa) → Gene gây bệnh là lặn nằm trên NST thường.',
    generations: [
      { gen: 'I', members: [{ label: 'I.1 (♂ Bình thường - Aa)', affected: false }, { label: 'I.2 (♀ Bình thường - Aa)', affected: false }] },
      { gen: 'II', members: [{ label: 'II.1 (♂ A-)', affected: false }, { label: 'II.2 (♀ Bệnh aa)', affected: true }, { label: 'II.3 (♂ A-)', affected: false }] },
    ],
  },
  {
    id: 'x-recessive',
    title: 'Phả hệ 2: Bệnh mù màu (Lặn trên vùng không tương đồng của NST X)',
    reason: 'Di truyền chéo: Ông ngoại mắc bệnh (XᵃY) truyền NST Xᵃ cho mẹ bình thường (XᴬXᵃ), mẹ truyền cho con trai mắc bệnh (XᵃY).',
    generations: [
      { gen: 'I', members: [{ label: 'I.1 (♂ Bệnh XᵃY)', affected: true }, { label: 'I.2 (♀ XᴬXᴬ)', affected: false }] },
      { gen: 'II', members: [{ label: 'II.1 (♀ Mang gene XᴬXᵃ)', affected: false }, { label: 'II.2 (♂ XᴬY)', affected: false }] },
      { gen: 'III', members: [{ label: 'III.1 (♂ Bệnh XᵃY)', affected: true }, { label: 'III.2 (♀ XᴬX-)', affected: false }] },
    ],
  },
];

export const GeneticsLab: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'punnett' | 'hardy' | 'pedigree'>('punnett');
  const [crossMode, setCrossMode] = useState<CrossMode>('monohybrid');
  const [p1Mono, setP1Mono] = useState<'AA' | 'Aa' | 'aa'>('Aa');
  const [p2Mono, setP2Mono] = useState<'AA' | 'Aa' | 'aa'>('Aa');
  const [recombFreq, setRecombFreq] = useState(20); // % f for linkage (Ab/aB x ab/ab)
  const [sampleSize, setSampleSize] = useState(400);
  const [simulatedCounts, setSimulatedCounts] = useState<Record<string, number> | null>(null);

  // Hardy-Weinberg inputs
  const [hwP, setHwP] = useState(0.6);
  const [obsAA, setObsAA] = useState(360);
  const [obsAa, setObsAa] = useState(480);
  const [obsaa, setObsaa] = useState(160);

  // Pedigree selector
  const [pedigreeIdx, setPedigreeIdx] = useState(0);

  const punnettData = useMemo(() => {
    const getMonoGametes = (g: string) => [g[0], g[1]];
    let rowGametes: { label: string; prob: number }[] = [];
    let colGametes: { label: string; prob: number }[] = [];
    let cells: { r: number; c: number; genotype: string; phenotype: string; prob: number }[] = [];

    if (crossMode === 'monohybrid' || crossMode === 'incomplete') {
      rowGametes = getMonoGametes(p1Mono).map((g) => ({ label: g, prob: 0.5 }));
      colGametes = getMonoGametes(p2Mono).map((g) => ({ label: g, prob: 0.5 }));
      rowGametes.forEach((rg, r) => {
        colGametes.forEach((cg, c) => {
          const sorted = [rg.label, cg.label].sort().join('');
          let pheno = sorted === 'aa' ? 'Thấp (lặn)' : 'Cao (trội)';
          if (crossMode === 'incomplete') {
            pheno = sorted === 'AA' ? 'Hoa đỏ' : sorted === 'Aa' ? 'Hoa hồng' : 'Hoa trắng';
          }
          cells.push({ r, c, genotype: sorted, phenotype: pheno, prob: rg.prob * cg.prob });
        });
      });
    } else if (crossMode === 'dihybrid' || crossMode === 'epistasis') {
      const g4 = ['AB', 'Ab', 'aB', 'ab'];
      rowGametes = g4.map((g) => ({ label: g, prob: 0.25 }));
      colGametes = g4.map((g) => ({ label: g, prob: 0.25 }));
      rowGametes.forEach((rg, r) => {
        colGametes.forEach((cg, c) => {
          const a = [rg.label[0], cg.label[0]].sort().join('');
          const b = [rg.label[1], cg.label[1]].sort().join('');
          const geno = `${a}${b}`;
          const hasA = a.includes('A');
          const hasB = b.includes('B');
          const pheno =
            crossMode === 'epistasis'
              ? hasA && hasB
                ? 'Hoa đỏ (A-B-)'
                : 'Hoa trắng (thiếu A hoặc B)'
              : `${hasA ? 'Vàng' : 'Xanh'}, ${hasB ? 'Trơn' : 'Nhăn'}`;
          cells.push({ r, c, genotype: geno, phenotype: pheno, prob: 1 / 16 });
        });
      });
    } else if (crossMode === 'codominance') {
      const g1 = ['I^A', 'i'];
      const g2 = ['I^B', 'i'];
      rowGametes = g1.map((g) => ({ label: g, prob: 0.5 }));
      colGametes = g2.map((g) => ({ label: g, prob: 0.5 }));
      rowGametes.forEach((rg, r) => {
        colGametes.forEach((cg, c) => {
          const pair = [rg.label, cg.label].sort();
          const geno = pair.join('');
          const pheno =
            geno.includes('I^A') && geno.includes('I^B')
              ? 'Nhóm máu AB'
              : geno.includes('I^A')
                ? 'Nhóm máu A'
                : geno.includes('I^B')
                  ? 'Nhóm máu B'
                  : 'Nhóm máu O';
          cells.push({ r, c, genotype: geno, phenotype: pheno, prob: 0.25 });
        });
      });
    } else if (crossMode === 'linkage') {
      // AB/ab x ab/ab with crossing-over frequency f%
      const f = recombFreq / 100;
      const pLink = (1 - f) / 2;
      const pCross = f / 2;
      rowGametes = [
        { label: 'AB', prob: pLink },
        { label: 'ab', prob: pLink },
        { label: 'Ab', prob: pCross },
        { label: 'aB', prob: pCross },
      ];
      colGametes = [{ label: 'ab', prob: 1 }];
      rowGametes.forEach((rg, r) => {
        const geno = `${rg.label}/ab`;
        const pheno =
          rg.label === 'AB'
            ? 'Thân cao, hạt tròn (liên kết)'
            : rg.label === 'ab'
              ? 'Thân thấp, hạt dài (liên kết)'
              : rg.label === 'Ab'
                ? 'Thân cao, hạt dài (hoán vị)'
                : 'Thân thấp, hạt tròn (hoán vị)';
        cells.push({ r, c: 0, genotype: geno, phenotype: pheno, prob: rg.prob });
      });
    } else if (crossMode === 'sex-linked') {
      rowGametes = [
        { label: 'X^A', prob: 0.5 },
        { label: 'X^a', prob: 0.5 },
      ];
      colGametes = [
        { label: 'X^a', prob: 0.5 },
        { label: 'Y', prob: 0.5 },
      ];
      rowGametes.forEach((rg, r) => {
        colGametes.forEach((cg, c) => {
          const geno = `${rg.label}${cg.label}`;
          const isFemale = cg.label.startsWith('X');
          const hasDom = rg.label === 'X^A';
          const pheno = `${isFemale ? '♀' : '♂'} ${hasDom ? 'Bình thường' : 'Mắc bệnh'}`;
          cells.push({ r, c, genotype: geno, phenotype: pheno, prob: 0.25 });
        });
      });
    } else {
      rowGametes = [{ label: 'Noãn mẹ (Lục lạp khảm xanh–trắng)', prob: 1 }];
      colGametes = [{ label: 'Hạt phấn bố (Không truyền lục lạp)', prob: 1 }];
      cells = [
        {
          r: 0,
          c: 0,
          genotype: 'Tế bào chất từ mẹ',
          phenotype: '100% kiểu hình giống cây mẹ (lá đốm/trắng/xanh tùy bầu noãn)',
          prob: 1,
        },
      ];
    }

    const phenoTotals = new Map<string, number>();
    cells.forEach((cell) => {
      phenoTotals.set(cell.phenotype, (phenoTotals.get(cell.phenotype) ?? 0) + cell.prob);
    });
    const outcomes: CrossOutcome[] = Array.from(phenoTotals.entries()).map(([phenotype, p]) => ({
      genotype: phenotype,
      phenotype,
      count: Math.round(p * 1000) / 10,
    }));

    return { rowGametes, colGametes, cells, outcomes };
  }, [crossMode, p1Mono, p2Mono, recombFreq]);

  const runRandomOffspringSim = () => {
    const counts: Record<string, number> = {};
    punnettData.cells.forEach((c) => {
      counts[c.phenotype] = 0;
    });
    for (let i = 0; i < sampleSize; i++) {
      let r = Math.random();
      for (const cell of punnettData.cells) {
        r -= cell.prob;
        if (r <= 0) {
          counts[cell.phenotype] = (counts[cell.phenotype] ?? 0) + 1;
          break;
        }
      }
    }
    setSimulatedCounts(counts);
  };

  // Hardy-Weinberg math & Chi-square test
  const hwQ = Math.round((1 - hwP) * 1000) / 1000;
  const expTotal = Math.max(1, obsAA + obsAa + obsaa);
  const obsP = (2 * obsAA + obsAa) / (2 * expTotal);
  const obsQ = 1 - obsP;
  const eAA = obsP * obsP * expTotal;
  const eAa = 2 * obsP * obsQ * expTotal;
  const eaa = obsQ * obsQ * expTotal;
  const chiSq =
    (eAA > 0 ? Math.pow(obsAA - eAA, 2) / eAA : 0) +
    (eAa > 0 ? Math.pow(obsAa - eAa, 2) / eAa : 0) +
    (eaa > 0 ? Math.pow(obsaa - eaa, 2) / eaa : 0);

  const chrParts: ModelPartInfo[] = [
    {
      id: 'chr-a',
      vietnameseName: 'Cặp NST tương đồng số 1 (Locus A/a & B/b)',
      scientificName: 'Homologous Chromosome Pair',
      location: 'Nhân tế bào lưỡng bội 2n',
      structure: 'Hai chiếc giống nhau về hình thái, kích thước; một từ bố, một từ mẹ.',
      function: 'Mang các cặp allele tương ứng; trao đổi chéo giữa hai chromatid khác nguồn tạo hoán vị gene.',
      relatedLessons: ['Liên kết gene và hoán vị gene'],
      colorHex: '#0D9488',
    },
    {
      id: 'centromere',
      vietnameseName: 'Tâm động & Trao đổi chéo',
      scientificName: 'Centromere & Chiasma',
      location: 'Điểm bắt chéo giữa hai chromatid không chị em',
      structure: 'Vùng DNA đặc biệt gắn thoi phân bào và điểm tiếp hợp trao đổi đoạn.',
      function: 'Khoảng cách càng xa nhau thì tần số hoán vị f càng lớn (tối đa 50%).',
      relatedLessons: ['Bản đồ di truyền'],
      colorHex: '#F59E0B',
    },
  ];

  const buildLinkage3D = (rootGroup: THREE.Group, quality: QualityLevel) => {
    const segs = quality === 'low' ? 12 : 20;
    const chrG = new THREE.Group();
    chrG.userData.partId = 'chr-a';
    const c1 = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 2.8, 8, segs),
      new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.35 }),
    );
    c1.position.set(-0.55, 0, 0);
    const c2 = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 2.8, 8, segs),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 }),
    );
    c2.position.set(0.55, 0, 0);
    chrG.add(c1, c2);
    rootGroup.add(chrG);

    const locusG = new THREE.Group();
    locusG.userData.partId = 'centromere';
    const bandPositions = [
      { y: 0.9, color: 0xfacc15 },
      { y: 0.9 - (recombFreq / 50) * 1.6, color: 0xef4444 },
    ];
    bandPositions.forEach((b) => {
      const ringL = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.05, 8, 16),
        new THREE.MeshStandardMaterial({ color: b.color }),
      );
      ringL.rotation.x = Math.PI / 2;
      ringL.position.set(-0.55, b.y, 0);
      const ringR = ringL.clone();
      ringR.position.set(0.55, b.y, 0);
      locusG.add(ringL, ringR);
    });
    rootGroup.add(locusG);

    return { partsMeta: chrParts, initialCameraDir: new THREE.Vector3(0.2, 0.2, 1) };
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-ui-lab">Phòng Lab 09 · Di truyền học & Quần thể</h2>
          <p className="text-slate-600 text-ui-body">
            Bảng lai Punnett tương tác, mô phỏng xác suất đời con, phân tích phả hệ và cân bằng Hardy–Weinberg
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'punnett' as const, label: 'Bảng lai Punnett' },
            { id: 'hardy' as const, label: 'Cân bằng Hardy–Weinberg' },
            { id: 'pedigree' as const, label: 'Phân tích Phả hệ' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTool(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-lg font-semibold text-ui-min ${
                activeTool === tab.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTool === 'punnett' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="space-y-2">
              <label className="block font-semibold text-slate-900 text-ui-label">Chọn quy luật di truyền:</label>
              <select
                value={crossMode}
                onChange={(e) => {
                  setCrossMode(e.target.value as CrossMode);
                  setSimulatedCounts(null);
                }}
                className="w-full min-h-[46px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-body"
              >
                {(Object.keys(CROSS_LABELS) as CrossMode[]).map((k) => (
                  <option key={k} value={k}>
                    {CROSS_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            {(crossMode === 'monohybrid' || crossMode === 'incomplete') && (
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-medium text-slate-800 text-ui-min">Kiểu gene P1 (Bố/Mẹ 1):</span>
                  <select
                    value={p1Mono}
                    onChange={(e) => setP1Mono(e.target.value as 'AA' | 'Aa' | 'aa')}
                    className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-ui-body"
                  >
                    <option value="AA">AA</option>
                    <option value="Aa">Aa</option>
                    <option value="aa">aa</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-medium text-slate-800 text-ui-min">Kiểu gene P2 (Bố/Mẹ 2):</span>
                  <select
                    value={p2Mono}
                    onChange={(e) => setP2Mono(e.target.value as 'AA' | 'Aa' | 'aa')}
                    className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-ui-body"
                  >
                    <option value="AA">AA</option>
                    <option value="Aa">Aa</option>
                    <option value="aa">aa</option>
                  </select>
                </label>
              </div>
            )}

            {crossMode === 'linkage' && (
              <label className="block space-y-1">
                <div className="flex justify-between font-medium text-ui-min">
                  <span>Tần số hoán vị gene (f) giữa locus A và B (AB/ab × ab/ab):</span>
                  <span className="font-mono-tabular font-bold text-teal-700">{recombFreq}% ({recombFreq} cM)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={2}
                  value={recombFreq}
                  onChange={(e) => {
                    setRecombFreq(Number(e.target.value));
                    setSimulatedCounts(null);
                  }}
                  className="w-full accent-teal-700 h-2"
                />
              </label>
            )}

            {/* Punnett Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center text-ui-min">
                <thead>
                  <tr>
                    <th className="p-2.5 border border-slate-300 bg-slate-100 font-semibold">Giao tử</th>
                    {punnettData.colGametes.map((cg, idx) => (
                      <th key={idx} className="p-2.5 border border-slate-300 bg-teal-50 text-teal-900 font-bold">
                        {cg.label} ({Math.round(cg.prob * 100)}%)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {punnettData.rowGametes.map((rg, rIdx) => (
                    <tr key={rIdx}>
                      <th className="p-2.5 border border-slate-300 bg-blue-50 text-blue-900 font-bold">
                        {rg.label} ({Math.round(rg.prob * 100)}%)
                      </th>
                      {punnettData.colGametes.map((_, cIdx) => {
                        const cell = punnettData.cells.find((x) => x.r === rIdx && x.c === cIdx);
                        if (!cell) return <td key={cIdx} className="border border-slate-300" />;
                        return (
                          <td key={cIdx} className="p-2.5 border border-slate-300 bg-white">
                            <div className="font-bold text-slate-900">{cell.genotype}</div>
                            <div className="text-slate-600">{cell.phenotype}</div>
                            <div className="font-mono-tabular text-teal-700 font-semibold">
                              {(cell.prob * 100).toFixed(1)}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Random Offspring Simulator */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 text-ui-label">
                    Mô phỏng gieo ngẫu nhiên đời con (Kiểm chứng tỉ lệ lí thuyết)
                  </div>
                  <p className="text-slate-600 text-ui-min">
                    Số cá thể con càng lớn, tỉ lệ thực nghiệm càng tiệm cận tỉ lệ lí thuyết.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-ui-min"
                  >
                    <option value={40}>40 cá thể</option>
                    <option value={200}>200 cá thể</option>
                    <option value={400}>400 cá thể</option>
                    <option value={2000}>2000 cá thể</option>
                  </select>
                  <button
                    type="button"
                    onClick={runRandomOffspringSim}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 text-ui-min"
                  >
                    Gieo phép lai
                  </button>
                </div>
              </div>

              {simulatedCounts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {punnettData.outcomes.map((o) => {
                    const actual = simulatedCounts[o.phenotype] ?? 0;
                    const actualPct = ((actual / sampleSize) * 100).toFixed(1);
                    return (
                      <div key={o.phenotype} className="p-3 rounded-lg bg-white border border-slate-200 text-ui-min">
                        <div className="font-semibold text-slate-900">{o.phenotype}</div>
                        <div className="text-slate-700 font-mono-tabular">
                          Thực nghiệm: {actual}/{sampleSize} ({actualPct}%) · Lí thuyết: {o.count}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right side: 3D Chromosome & Linkage visual */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-ui-card-title">
                Minh họa 3D Cặp NST tương đồng & Khoảng cách gene
              </h3>
              <div className="h-[340px] rounded-xl overflow-hidden border border-slate-200">
                <ModelViewer3D
                  modelKey={`genetics-chr-${recombFreq}`}
                  buildModel={buildLinkage3D}
                  parts={chrParts}
                  showLabels
                  autoRotate
                  fallbackTitle="Sơ đồ Cặp NST tương đồng"
                  fallbackItems={chrParts.map((p) => `${p.vietnameseName}: ${p.function}`)}
                />
              </div>
              <p className="text-slate-700 text-ui-min">
                Khoảng cách hai vạch màu (locus A và B) tỉ lệ thuận với tần số hoán vị f = {recombFreq}% ({recombFreq} cM).
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTool === 'hardy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-ui-section">Máy tính Cân bằng Hardy–Weinberg</h3>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-center">
              <FormulaRendererSVG latex="p + q = 1 \quad;\quad p^2 + 2pq + q^2 = 1" />
            </div>

            <label className="block space-y-1">
              <div className="flex justify-between font-medium text-ui-body">
                <span>Tần số allele trội (p)</span>
                <span className="font-mono-tabular font-bold text-teal-700">
                  p = {hwP.toFixed(2)} · q = {hwQ.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.95}
                step={0.05}
                value={hwP}
                onChange={(e) => setHwP(Number(e.target.value))}
                className="w-full accent-teal-700 h-2"
              />
            </label>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                <div className="text-slate-700 text-ui-min">Đồng hợp trội (p² AA)</div>
                <div className="font-bold text-teal-900 font-mono-tabular text-ui-card-title">
                  {(hwP * hwP * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="text-slate-700 text-ui-min">Dị hợp (2pq Aa)</div>
                <div className="font-bold text-blue-900 font-mono-tabular text-ui-card-title">
                  {(2 * hwP * hwQ * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-slate-700 text-ui-min">Đồng hợp lặn (q² aa)</div>
                <div className="font-bold text-amber-900 font-mono-tabular text-ui-card-title">
                  {(hwQ * hwQ * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-ui-min">
              <div className="font-bold text-slate-900">5 Điều kiện nghiệm đúng định luật Hardy–Weinberg:</div>
              <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                <li>Kích thước quần thể rất lớn.</li>
                <li>Các cá thể giao phối ngẫu nhiên (ngẫu phối).</li>
                <li>Không có chọn lọc tự nhiên tác động lên kiểu gene đang xét.</li>
                <li>Không phát sinh đột biến mới (hoặc đột biến thuận = nghịch).</li>
                <li>Không có sự di – nhập gene (quần thể cách li).</li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-ui-section">Kiểm định Quần thể (Số liệu quan sát vs Kì vọng)</h3>
            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="font-medium text-slate-800 text-ui-min">Số cá thể AA</span>
                <input
                  type="number"
                  min={0}
                  value={obsAA}
                  onChange={(e) => setObsAA(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 font-mono-tabular text-ui-body"
                />
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-800 text-ui-min">Số cá thể Aa</span>
                <input
                  type="number"
                  min={0}
                  value={obsAa}
                  onChange={(e) => setObsAa(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 font-mono-tabular text-ui-body"
                />
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-800 text-ui-min">Số cá thể aa</span>
                <input
                  type="number"
                  min={0}
                  value={obsaa}
                  onChange={(e) => setObsaa(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 font-mono-tabular text-ui-body"
                />
              </label>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'AA', QuanSat: obsAA, KiVong: Math.round(eAA) },
                    { name: 'Aa', QuanSat: obsAa, KiVong: Math.round(eAa) },
                    { name: 'aa', QuanSat: obsaa, KiVong: Math.round(eaa) },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 15, fill: '#334155' }} />
                  <YAxis tick={{ fontSize: 15, fill: '#334155' }} />
                  <Tooltip contentStyle={{ fontSize: '15px', borderRadius: '8px' }} />
                  <Bar dataKey="QuanSat" fill="#0D9488" name="Quan sát" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="KiVong" fill="#2563EB" name="Kì vọng cân bằng" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div
              className={`p-4 rounded-xl border text-ui-body ${
                chiSq < 3.84 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div>
                Tần số allele ước tính: <strong className="font-mono-tabular">p(A) = {obsP.toFixed(3)}</strong>,{' '}
                <strong className="font-mono-tabular">q(a) = {obsQ.toFixed(3)}</strong> · Chỉ số χ² ={' '}
                <strong className="font-mono-tabular">{chiSq.toFixed(3)}</strong> (bậc tự do df = 1, ngưỡng 3,84).
              </div>
              <div className="font-semibold mt-1">
                Kết luận: {chiSq < 3.84 ? 'Quần thể ĐANG đạt trạng thái cân bằng di truyền.' : 'Quần thể CHƯA cân bằng di truyền (có nhân tố tiến hóa hoặc giao phối không ngẫu nhiên).'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTool === 'pedigree' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {PEDIGREE_CASES.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPedigreeIdx(i)}
                className={`min-h-[44px] px-4 py-2 rounded-lg font-semibold text-ui-min ${
                  pedigreeIdx === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-5">
            {PEDIGREE_CASES[pedigreeIdx].generations.map((g) => (
              <div key={g.gen} className="flex flex-wrap items-center gap-4">
                <div className="w-16 font-bold text-slate-900 text-ui-card-title">Thế hệ {g.gen}</div>
                <div className="flex flex-wrap gap-3">
                  {g.members.map((m) => (
                    <div
                      key={m.label}
                      className={`px-4 py-3 rounded-xl border-2 font-medium text-ui-min flex items-center gap-2.5 ${
                        m.affected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-900 border-slate-400'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 inline-block border-2 ${
                          m.label.includes('♂') ? 'rounded-none' : 'rounded-full'
                        } ${m.affected ? 'bg-rose-500 border-white' : 'bg-white border-slate-700'}`}
                      />
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-ui-body">
              <strong>Biện luận di truyền:</strong> {PEDIGREE_CASES[pedigreeIdx].reason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
