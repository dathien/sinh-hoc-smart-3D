import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { ModelViewer3D } from '../../components/viewer3d/ModelViewer3D';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';

type DivisionMode = 'mitosis' | 'meiosis1' | 'meiosis2' | 'cell-cycle';

interface StageSpec {
  id: string;
  label: string;
  chrFormula: (n2: number) => string;
  stateLabel: string;
  chromatidsFormula: (n2: number) => string;
  dnaRel: (n2: number) => string;
  cellCountLabel: string;
  explanation: string;
}

const MITOSIS_STAGES: StageSpec[] = [
  {
    id: 'prophase',
    label: 'Kì đầu',
    chrFormula: (n2) => `${n2} NST`,
    stateLabel: 'Kép (2 chromatid)',
    chromatidsFormula: (n2) => `${n2 * 2} chromatid`,
    dnaRel: () => '4c (trên 1 tế bào đang phân chia)',
    cellCountLabel: '1 tế bào đang phân chia',
    explanation: 'NST kép bắt đầu co xoắn, màng nhân tiêu biến dần, thoi phân bào hình thành từ 2 trung thể.',
  },
  {
    id: 'metaphase',
    label: 'Kì giữa',
    chrFormula: (n2) => `${n2} NST`,
    stateLabel: 'Kép (co xoắn cực đại)',
    chromatidsFormula: (n2) => `${n2 * 2} chromatid`,
    dnaRel: () => '4c (trên 1 tế bào đang phân chia)',
    cellCountLabel: '1 tế bào đang phân chia',
    explanation: 'Các NST kép xếp thành 1 hàng trên mặt phẳng xích đạo của thoi phân bào.',
  },
  {
    id: 'anaphase',
    label: 'Kì sau',
    chrFormula: (n2) => `${n2 * 2} NST (trong tế bào đang chia)`,
    stateLabel: 'Đơn (tách tại tâm động)',
    chromatidsFormula: () => '0 chromatid',
    dnaRel: () => '4c (chia đều về 2 cực)',
    cellCountLabel: '1 tế bào đang phân chia',
    explanation: 'Mỗi NST kép tách thành 2 NST đơn phân li về 2 cực tế bào (tạm thời có 4n NST đơn trong tế bào đang chia).',
  },
  {
    id: 'telophase',
    label: 'Kì cuối & Phân chia TBC',
    chrFormula: (n2) => `${n2} NST / mỗi tế bào con`,
    stateLabel: 'Đơn',
    chromatidsFormula: () => '0 chromatid',
    dnaRel: () => '2c / mỗi tế bào con',
    cellCountLabel: '2 tế bào con giống mẹ',
    explanation: 'Màng nhân tái lập quanh hai bộ NST ở 2 cực, tế bào chất phân chia tạo 2 tế bào con có bộ NST 2n.',
  },
];

const MEIOSIS_I_STAGES: StageSpec[] = [
  {
    id: 'prophase1',
    label: 'Kì đầu I (Tiếp hợp & Trao đổi chéo)',
    chrFormula: (n2) => `${n2} NST`,
    stateLabel: 'Kép (ghép đôi tương đồng)',
    chromatidsFormula: (n2) => `${n2 * 2} chromatid`,
    dnaRel: () => '4c (trên 1 tế bào)',
    cellCountLabel: '1 tế bào đang giảm phân I',
    explanation: 'Các NST kép tương đồng tiếp hợp và có thể trao đổi chéo giữa các chromatid không chị em.',
  },
  {
    id: 'metaphase1',
    label: 'Kì giữa I',
    chrFormula: (n2) => `${n2} NST`,
    stateLabel: 'Kép (xếp 2 hàng tương đồng)',
    chromatidsFormula: (n2) => `${n2 * 2} chromatid`,
    dnaRel: () => '4c (trên 1 tế bào)',
    cellCountLabel: '1 tế bào đang giảm phân I',
    explanation: 'Các cặp NST kép tương đồng xếp thành 2 hàng trên mặt phẳng xích đạo.',
  },
  {
    id: 'anaphase1',
    label: 'Kì sau I',
    chrFormula: (n2) => `${n2} NST (về 2 cực: mỗi cực n kép)`,
    stateLabel: 'Kép (không tách tâm động)',
    chromatidsFormula: (n2) => `${n2 * 2} chromatid`,
    dnaRel: () => '4c (trong tế bào đang chia)',
    cellCountLabel: '1 tế bào đang giảm phân I',
    explanation: 'Mỗi NST kép trong cặp tương đồng phân li độc lập về một cực của tế bào.',
  },
  {
    id: 'telophase1',
    label: 'Kì cuối I',
    chrFormula: (n2) => `${n2 / 2} NST / mỗi tế bào con`,
    stateLabel: 'Kép',
    chromatidsFormula: (n2) => `${n2} chromatid / mỗi tế bào con`,
    dnaRel: () => '2c / mỗi tế bào con',
    cellCountLabel: '2 tế bào con (n kép)',
    explanation: 'Tạo 2 tế bào con, mỗi tế bào chứa bộ NST giảm đi một nửa nhưng ở trạng thái kép (n kép).',
  },
];

const MEIOSIS_II_STAGES: StageSpec[] = [
  {
    id: 'prophase2',
    label: 'Kì đầu II',
    chrFormula: (n2) => `${n2 / 2} NST / mỗi tế bào`,
    stateLabel: 'Kép',
    chromatidsFormula: (n2) => `${n2} chromatid / mỗi tế bào`,
    dnaRel: () => '2c / mỗi tế bào',
    cellCountLabel: '2 tế bào bước vào giảm phân II',
    explanation: 'Màng nhân tiêu biến, các NST kép (n kép) co xoắn lại.',
  },
  {
    id: 'metaphase2',
    label: 'Kì giữa II',
    chrFormula: (n2) => `${n2 / 2} NST / mỗi tế bào`,
    stateLabel: 'Kép (xếp 1 hàng)',
    chromatidsFormula: (n2) => `${n2} chromatid / mỗi tế bào`,
    dnaRel: () => '2c / mỗi tế bào',
    cellCountLabel: '2 tế bào đang giảm phân II',
    explanation: 'Các NST kép xếp thành 1 hàng trên mặt phẳng xích đạo.',
  },
  {
    id: 'anaphase2',
    label: 'Kì sau II',
    chrFormula: (n2) => `${n2} NST đơn / mỗi tế bào đang chia`,
    stateLabel: 'Đơn',
    chromatidsFormula: () => '0 chromatid',
    dnaRel: () => '2c / mỗi tế bào đang chia',
    cellCountLabel: '2 tế bào đang phân li',
    explanation: 'Các chromatid chị em tách nhau tại tâm động thành NST đơn phân li về 2 cực.',
  },
  {
    id: 'telophase2',
    label: 'Kì cuối II',
    chrFormula: (n2) => `${n2 / 2} NST / mỗi tế bào con`,
    stateLabel: 'Đơn',
    chromatidsFormula: () => '0 chromatid',
    dnaRel: () => '1c / mỗi tế bào con',
    cellCountLabel: '4 tế bào con đơn bội (n)',
    explanation: 'Kết thúc giảm phân tạo 4 tế bào con có bộ NST đơn bội (n đơn).',
  },
];

const DIVISION_PARTS: ModelPartInfo[] = [
  { id: 'membrane', vietnameseName: 'Màng tế bào', scientificName: 'Membrana cellularis', location: 'Bao bọc bên ngoài tế bào', structure: 'Lớp màng sinh chất mềm dẻo có thể thắt eo ở kì cuối.', function: 'Phân chia tế bào chất ở động vật tạo các tế bào con.', relatedLessons: ['Nguyên phân & Giảm phân'], colorHex: '#38BDF8' },
  { id: 'spindle', vietnameseName: 'Thoi phân bào & Trung thể', scientificName: 'Mitotic Spindle & Centrosomes', location: 'Hai cực tế bào', structure: 'Hệ thống vi ống xuất phát từ hai trung thể.', function: 'Đính vào tâm động kéo nhiễm sắc thể phân li về hai cực.', relatedLessons: ['Phân bào'], colorHex: '#FACC15' },
  { id: 'chromosomes', vietnameseName: 'Nhiễm sắc thể & Tâm động', scientificName: 'Chromosomes & Centromere', location: 'Trong nhân / mặt phẳng xích đạo', structure: 'Các NST đơn hoặc kép gồm 2 chromatid chị em gắn tại tâm động.', function: 'Phân chia đều vật chất di truyền cho các tế bào con.', relatedLessons: ['Nguyên phân & Giảm phân'], colorHex: '#2563EB' },
];

export const CellDivisionLab: React.FC<{
  isPresentation?: boolean;
  onTogglePresentation?: () => void;
}> = ({ isPresentation, onTogglePresentation }) => {
  const viewer = useLabViewerState(false);
  const [mode, setMode] = useState<DivisionMode>('mitosis');
  const [diploid2n, setDiploid2n] = useState<2 | 4 | 6 | 8>(4);
  const [stageIdx, setStageIdx] = useState(0);
  const [predictionChoice, setPredictionChoice] = useState('');
  const [showPredictionAnswer, setShowPredictionAnswer] = useState(false);

  const stages = mode === 'mitosis' ? MITOSIS_STAGES : mode === 'meiosis1' ? MEIOSIS_I_STAGES : MEIOSIS_II_STAGES;
  const activeStage = stages[Math.min(stageIdx, stages.length - 1)];

  const sourceMeta: ScientificSourceMeta = {
    name: 'Mô phỏng Chu kì tế bào, Nguyên phân và Giảm phân 3D',
    source: 'SINH HỌC SMART 3D',
    identifier: `DIV-${mode.toUpperCase()}-2N${diploid2n}`,
    version: '1.0',
    license: 'Tài nguyên giáo dục nội bộ',
    dataType: 'Mô hình giản lược sư phạm',
    verifiedStatus: 'Số lượng NST và chromatid chuẩn quy ước SGK Sinh học 10',
  };

  const buildModel = useMemo(() => {
    return (rootGroup: THREE.Group, quality: QualityLevel) => {
      const segs = quality === 'low' ? 14 : 24;
      const stageId = activeStage.id;

      // Cell Membrane (pinches in telophase)
      const memMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.35,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const memGroup = new THREE.Group();
      memGroup.userData.partId = 'membrane';
      if (stageId.startsWith('telophase')) {
        [-1.35, 1.35].forEach((px) => {
          const c = new THREE.Mesh(new THREE.SphereGeometry(1.75, segs, segs), memMat);
          c.position.x = px;
          memGroup.add(c);
        });
      } else {
        const cell = new THREE.Mesh(new THREE.SphereGeometry(2.55, segs, segs), memMat);
        cell.scale.set(1.18, 0.95, 0.95);
        memGroup.add(cell);
      }
      rootGroup.add(memGroup);

      // Centrosomes & Spindle Fibers
      const spindleGroup = new THREE.Group();
      spindleGroup.userData.partId = 'spindle';
      const centMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
      const fiberMat = new THREE.LineBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.55 });
      [-2.35, 2.35].forEach((px) => {
        const cent = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), centMat);
        cent.position.set(px, 0, 0);
        spindleGroup.add(cent);
        for (let f = -3; f <= 3; f++) {
          const pts = [new THREE.Vector3(px, 0, 0), new THREE.Vector3(0, f * 0.42, (f % 2) * 0.35)];
          spindleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), fiberMat));
        }
      });
      rootGroup.add(spindleGroup);

      // Chromosomes
      const chrGroup = new THREE.Group();
      chrGroup.userData.partId = 'chromosomes';
      const pairs = diploid2n / 2;

      const drawChromosome = (pos: THREE.Vector3, isDouble: boolean, isPaternal: boolean, hasCrossover = false) => {
        const col = isPaternal ? 0x2563eb : 0xf97316;
        const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 });
        const arm1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.52, 6, 10), mat);
        arm1.rotation.z = isDouble ? 0.25 : 0;
        const g = new THREE.Group();
        g.add(arm1);
        if (isDouble) {
          const arm2 = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.08, 0.52, 6, 10),
            hasCrossover ? new THREE.MeshStandardMaterial({ color: isPaternal ? 0xf97316 : 0x2563eb, roughness: 0.35 }) : mat,
          );
          arm2.rotation.z = -0.25;
          arm2.position.x = 0.08;
          g.add(arm2);
        }
        const centro = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }),
        );
        g.add(centro);
        g.position.copy(pos);
        chrGroup.add(g);
      };

      const countToShow = mode === 'meiosis2' ? diploid2n / 2 : diploid2n;
      for (let i = 0; i < countToShow; i++) {
        const isPaternal = i % 2 === 0;
        const pairIdx = Math.floor(i / 2);
        const yOff = (pairIdx - (pairs - 1) / 2) * 0.9;
        const zOff = isPaternal ? 0.3 : -0.3;

        if (stageId === 'prophase' || stageId === 'prophase1' || stageId === 'prophase2') {
          drawChromosome(new THREE.Vector3(isPaternal ? -0.45 : 0.45, yOff, zOff), true, isPaternal, stageId === 'prophase1');
        } else if (stageId === 'metaphase' || stageId === 'metaphase2') {
          drawChromosome(new THREE.Vector3(0, (i - (countToShow - 1) / 2) * 0.62, 0), true, isPaternal);
        } else if (stageId === 'metaphase1') {
          drawChromosome(new THREE.Vector3(isPaternal ? -0.35 : 0.35, yOff, 0), true, isPaternal, true);
        } else if (stageId === 'anaphase' || stageId === 'anaphase2') {
          drawChromosome(new THREE.Vector3(-1.35, (i - (countToShow - 1) / 2) * 0.55, 0), false, isPaternal);
          drawChromosome(new THREE.Vector3(1.35, (i - (countToShow - 1) / 2) * 0.55, 0), false, isPaternal);
        } else if (stageId === 'anaphase1') {
          drawChromosome(new THREE.Vector3(isPaternal ? -1.35 : 1.35, yOff, 0), true, isPaternal, true);
        } else {
          // telophase
          const isDoubleEnd = stageId === 'telophase1';
          if (stageId === 'telophase1') {
            drawChromosome(new THREE.Vector3(isPaternal ? -1.35 : 1.35, yOff, 0), isDoubleEnd, isPaternal, true);
          } else {
            drawChromosome(new THREE.Vector3(-1.35, (i - (countToShow - 1) / 2) * 0.5, 0), false, isPaternal);
            drawChromosome(new THREE.Vector3(1.35, (i - (countToShow - 1) / 2) * 0.5, 0), false, isPaternal);
          }
        }
      }

      rootGroup.add(chrGroup);
      return { initialCameraDir: new THREE.Vector3(0.15, 0.2, 1) };
    };
  }, [mode, diploid2n, activeStage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['mitosis', 'Nguyên phân'],
              ['meiosis1', 'Giảm phân I'],
              ['meiosis2', 'Giảm phân II'],
              ['cell-cycle', 'Chu kì tế bào'],
            ] as [DivisionMode, string][]
          ).map(([dId, dLabel]) => (
            <button
              key={dId}
              type="button"
              onClick={() => {
                setMode(dId);
                setStageIdx(0);
              }}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
                mode === dId ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {dLabel}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-slate-900 font-semibold text-ui-min">
          <span>Bộ NST minh họa:</span>
          <select
            value={diploid2n}
            onChange={(e) => setDiploid2n(Number(e.target.value) as 2 | 4 | 6 | 8)}
            className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono-tabular"
          >
            <option value={2}>2n = 2</option>
            <option value={4}>2n = 4</option>
            <option value={6}>2n = 6</option>
            <option value={8}>2n = 8</option>
          </select>
        </label>
      </div>

      {/* Live Accurate Chromosome & Chromatid Telemetry Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900 text-ui-card-title">
            Giai đoạn hiện tại: {activeStage.label}
          </h3>
          <span className="font-semibold text-teal-800 text-ui-min">{activeStage.cellCountLabel}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-600 text-ui-min">Số lượng NST</div>
            <div className="font-bold text-slate-900 font-mono-tabular text-ui-label">
              {activeStage.chrFormula(diploid2n)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-600 text-ui-min">Trạng thái NST</div>
            <div className="font-bold text-slate-900 text-ui-label">{activeStage.stateLabel}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-600 text-ui-min">Số chromatid</div>
            <div className="font-bold text-slate-900 font-mono-tabular text-ui-label">
              {activeStage.chromatidsFormula(diploid2n)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-600 text-ui-min">Lượng DNA tương đối</div>
            <div className="font-bold text-slate-900 font-mono-tabular text-ui-label">
              {activeStage.dnaRel(diploid2n)}
            </div>
          </div>
        </div>
        <p className="text-slate-700 text-ui-body">{activeStage.explanation}</p>
      </div>

      <LabWorkspaceLayout
        title="Phòng Lab 06 – Phân bào 3D (Nguyên phân & Giảm phân)"
        subtitle="Theo dõi sự biến đổi hình thái, số lượng NST, chromatid và thoi phân bào qua từng kì"
        viewerRef={viewer.viewerRef}
        parts={DIVISION_PARTS}
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
        onTogglePlay={() => {
          viewer.setIsPlaying((v) => !v);
          setStageIdx((s) => (s + 1) % stages.length);
        }}
        onStepForward={() => setStageIdx((s) => (s + 1) % stages.length)}
        onResetSim={() => {
          setStageIdx(0);
          viewer.resetViewAndParts();
        }}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        sourceMeta={sourceMeta}
        isPresentation={isPresentation}
        onTogglePresentation={onTogglePresentation}
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`div-${mode}-${diploid2n}-${activeStage.id}`}
            buildModel={buildModel}
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
            parts={DIVISION_PARTS}
            quality={viewer.quality}
            fallbackTitle="Bảng biến động NST qua các kì"
            fallbackItems={stages.map((s) => `${s.label}: ${s.chrFormula(diploid2n)} · ${s.chromatidsFormula(diploid2n)}`)}
          />
        }
        simulationControlsExtra={
          <div className="space-y-2">
            <span className="font-semibold text-slate-900 text-ui-min block">Chọn nhanh giai đoạn:</span>
            {stages.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStageIdx(idx)}
                className={`w-full min-h-[44px] text-left px-3 py-2 rounded-lg border font-medium text-ui-min ${
                  stageIdx === idx
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        }
        knowledgeContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">So sánh Nguyên phân và Giảm phân</h4>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>Nguyên phân:</strong> 1 lần phân bào → 2 tế bào con (2n), NST kép xếp 1 hàng ở kì giữa.</li>
              <li><strong>Giảm phân:</strong> 2 lần phân bào → 4 tế bào con (n), có tiếp hợp và trao đổi chéo ở kì đầu I.</li>
              <li><strong>Quy tắc đếm:</strong> Số NST bằng số tâm động; khi NST đơn (kì sau NP, kì sau II) thì số chromatid = 0.</li>
            </ul>
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">Hoạt động dự đoán trước mô phỏng</h4>
            <p className="text-slate-700">
              Với bộ NST 2n = {diploid2n}, ở Kì sau nguyên phân, trong một tế bào đang phân chia có bao nhiêu NST đơn và bao nhiêu chromatid?
            </p>
            <input
              type="text"
              value={predictionChoice}
              onChange={(e) => setPredictionChoice(e.target.value)}
              placeholder="Nhập dự đoán của em..."
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-ui-min"
            />
            <button
              type="button"
              onClick={() => setShowPredictionAnswer((v) => !v)}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-ui-min"
            >
              {showPredictionAnswer ? 'Ẩn đáp án đối chiếu' : 'Kiểm tra kết quả'}
            </button>
            {showPredictionAnswer && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-ui-min">
                Đáp án: Trong 1 tế bào đang phân chia ở kì sau nguyên phân có {diploid2n * 2} NST đơn và 0 chromatid.
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};
