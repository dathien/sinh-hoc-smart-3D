import React, { useMemo, useState } from 'react';
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
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { ModelViewer3D } from '../../components/viewer3d/ModelViewer3D';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';

type ExperimentId = 'starch' | 'protein' | 'glucose' | 'amylase' | 'plasmolysis' | 'photosynth-bubble' | 'respiration-seed';

interface ProtocolStep {
  id: string;
  label: string;
  detail: string;
}

interface ExperimentSpec {
  id: ExperimentId;
  title: string;
  grade: string;
  safetyNote: string;
  liquidInitColor: number;
  liquidFinalColor: number;
  steps: ProtocolStep[];
  resultSummary: string;
}

const EXPERIMENTS: Record<ExperimentId, ExperimentSpec> = {
  starch: {
    id: 'starch',
    title: '1. Nhận biết Tinh bột (Thuốc thử Lugol)',
    grade: 'Sinh học 10',
    safetyNote: 'Dung dịch Lugol chứa Iodine có thể làm ố da và quần áo; không nếm dung dịch thí nghiệm.',
    liquidInitColor: 0xf1f5f9,
    liquidFinalColor: 0x1e1b4b,
    steps: [
      { id: 's1', label: 'Lấy 2 mL hồ tinh bột vào ống nghiệm sạch', detail: 'Dung dịch có màu trắng đục nhẹ.' },
      { id: 's2', label: 'Nhỏ 3 giọt thuốc thử Lugol (I₂/KI)', detail: 'Iodine xen vào cấu trúc xoắn amylose của tinh bột.' },
      { id: 's3', label: 'Lắc đều và quan sát sự đổi màu', detail: 'Dung dịch chuyển ngay sang màu xanh tím đặc trưng.' },
    ],
    resultSummary: 'Hiện tượng: Xuất hiện phức hợp màu xanh tím đặc trưng chứng tỏ mẫu thử có tinh bột.',
  },
  protein: {
    id: 'protein',
    title: '2. Nhận biết Protein (Phản ứng Biuret)',
    grade: 'Sinh học 10',
    safetyNote: 'NaOH 10% là dung dịch kiềm gây ăn mòn; tránh để bắn vào mắt hoặc da.',
    liquidInitColor: 0xfef9c3,
    liquidFinalColor: 0x7e22ce,
    steps: [
      { id: 'p1', label: 'Cho 2 mL dung dịch lòng trắng trứng vào ống nghiệm', detail: 'Mẫu chứa nhiều phân tử protein (albumin).' },
      { id: 'p2', label: 'Thêm 1 mL dung dịch NaOH 10% (tạo môi trường kiềm)', detail: 'Lắc nhẹ để đồng nhất môi trường.' },
      { id: 'p3', label: 'Nhỏ từ từ 3 giọt CuSO₄ 1%', detail: 'Ion Cu²⁺ tạo phức với các liên kết peptide tạo màu tím đặc trưng.' },
    ],
    resultSummary: 'Hiện tượng: Dung dịch chuyển từ xanh nhạt sang màu tím hoa cà (phản ứng Biuret dương tính).',
  },
  glucose: {
    id: 'glucose',
    title: '3. Nhận biết Đường khử Glucose (Benedict + Đun nóng)',
    grade: 'Sinh học 10',
    safetyNote: 'Dùng kẹp gỗ khi đun ống nghiệm trên bếp đun hoặc ngọn lửa đèn cồn; hướng miệng ống nghiệm ra chỗ trống.',
    liquidInitColor: 0x38bdf8,
    liquidFinalColor: 0xc2410c,
    steps: [
      { id: 'g1', label: 'Cho 2 mL dung dịch glucose 2% vào ống nghiệm', detail: 'Glucose là đường đơn có nhóm khử.' },
      { id: 'g2', label: 'Thêm 2 mL thuốc thử Benedict (màu xanh lam)', detail: 'Thuốc thử chứa Cu²⁺ trong môi trường kiềm nhẹ.' },
      { id: 'g3', label: 'Đun cách thủy ống nghiệm ở 80–95°C trong 2 phút', detail: 'Nhiệt độ cung cấp năng lượng hoạt hóa cho phản ứng khử Cu²⁺ → Cu₂O kết tủa đỏ gạch.' },
    ],
    resultSummary: 'Hiện tượng: Dung dịch xanh lam chuyển sang xanh lục → vàng → kết tủa đỏ gạch Cu₂O.',
  },
  amylase: {
    id: 'amylase',
    title: '4. Ảnh hưởng của Nhiệt độ & pH đến Enzyme Amylase',
    grade: 'Sinh học 10',
    safetyNote: 'Kiểm soát chính xác nhiệt kế trước khi trộn enzyme và cơ chất.',
    liquidInitColor: 0x1e1b4b,
    liquidFinalColor: 0xfef08a,
    steps: [
      { id: 'a1', label: 'Chuẩn bị ống nghiệm chứa hồ tinh bột 1%', detail: 'Cơ chất tinh bột.' },
      { id: 'a2', label: 'Ổn định nhiệt độ và pH theo bảng điều chỉnh', detail: 'Đưa cả enzyme và cơ chất về cùng nhiệt độ thử nghiệm.' },
      { id: 'a3', label: 'Trộn enzyme Amylase và thử màu với Lugol sau 5 phút', detail: 'Ở 37°C, pH ≈ 7, tinh bột bị thủy phân hoàn toàn nên không còn màu xanh tím.' },
    ],
    resultSummary: 'Ở 37°C và pH = 7: Enzyme đạt hoạt tính tối ưu, thủy phân tinh bột nhanh. Ở 80°C enzyme biến tính mất hoạt tính.',
  },
  plasmolysis: {
    id: 'plasmolysis',
    title: '5. Thí nghiệm Co nguyên sinh & Phản co nguyên sinh',
    grade: 'Sinh học 10',
    safetyNote: 'Thao tác nhẹ tay với lá kính (lamen) để không làm vỡ tiêu bản.',
    liquidInitColor: 0x22c55e,
    liquidFinalColor: 0x86efac,
    steps: [
      { id: 'pl1', label: 'Tách lớp biểu bì lá thài lài tía đặt lên lam kính', detail: 'Quan sát tế bào trương nước ban đầu.' },
      { id: 'pl2', label: 'Nhỏ dung dịch đường/muối ưu trương (KNO₃ 0,5M)', detail: 'Nước thẩm thấu ra ngoài khiến màng sinh chất tách khỏi thành tế bào.' },
      { id: 'pl3', label: 'Nhỏ lại nước cất để quan sát phản co nguyên sinh', detail: 'Tế bào hút nước trở lại, màng áp sát thành tế bào.' },
    ],
    resultSummary: 'Kết luận: Sự co và phản co nguyên sinh chứng minh màng sinh chất có tính thấm chọn lọc và tế bào còn sống.',
  },
  'photosynth-bubble': {
    id: 'photosynth-bubble',
    title: '6. Đo tốc độ quang hợp bằng đếm bọt khí O₂ ở rong đuôi chó',
    grade: 'Sinh học 11',
    safetyNote: 'Tránh để đèn chiếu sáng công suất lớn làm nước nóng quá 35°C.',
    liquidInitColor: 0x0ea5e9,
    liquidFinalColor: 0x38bdf8,
    steps: [
      { id: 'pb1', label: 'Đặt cành rong đuôi chó ngập trong cốc nước có NaHCO₃ 0,5%', detail: 'NaHCO₃ cung cấp nguồn CO₂ hòa tan.' },
      { id: 'pb2', label: 'Bật đèn chiếu sáng ở khoảng cách đã chọn', detail: 'Dịch chuyển khoảng cách đèn làm thay đổi cường độ ánh sáng.' },
      { id: 'pb3', label: 'Bấm đồng hồ đếm số bọt khí O₂ thoát ra trong 1 phút', detail: 'Ánh sáng mạnh hơn → số bọt khí O₂ tăng đến điểm bão hòa ánh sáng.' },
    ],
    resultSummary: 'Tốc độ giải phóng bọt khí O₂ tỉ lệ thuận với cường độ quang hợp trong ngưỡng chưa bão hòa ánh sáng.',
  },
  'respiration-seed': {
    id: 'respiration-seed',
    title: '7. Hô hấp ở hạt nảy mầm (Hấp thụ O₂ & Thải CO₂)',
    grade: 'Sinh học 11',
    safetyNote: 'Dùng nút cao su kín miệng bình tam giác để khí không thoát ra ngoài.',
    liquidInitColor: 0xe2e8f0,
    liquidFinalColor: 0xf8fafc,
    steps: [
      { id: 'rs1', label: 'Cho 50 g hạt đậu xanh đang nảy mầm vào bình tam giác', detail: 'Hạt nảy mầm có cường độ hô hấp mạnh.' },
      { id: 'rs2', label: 'Đặt ống dẫn khí sục vào cốc nước vôi trong Ca(OH)₂', detail: 'Nước vôi trong dùng để phát hiện khí CO₂.' },
      { id: 'rs3', label: 'Theo dõi sau 20 phút và đọc nhiệt kế trong bình hạt', detail: 'Nước vôi trong vẩn đục (CaCO₃) và nhiệt độ bình hạt tăng nhẹ.' },
    ],
    resultSummary: 'Chứng minh hạt nảy mầm hô hấp thải khí CO₂ và giải phóng một phần nhiệt năng.',
  },
};

export const ExperimentsLab: React.FC = () => {
  const [expId, setExpId] = useState<ExperimentId>('starch');
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);
  const [enzymeTemp, setEnzymeTemp] = useState(37);
  const [enzymePh, setEnzymePh] = useState(7);
  const [presentation, setPresentation] = useState(false);

  const viewer = useLabViewerState(true);
  const spec = EXPERIMENTS[expId];
  const isFinished = completedStepIds.length === spec.steps.length;

  const handleSelectStep = (step: ProtocolStep, index: number) => {
    if (completedStepIds.includes(step.id)) return;
    if (index !== completedStepIds.length) {
      const needed = spec.steps[completedStepIds.length];
      setStepFeedback(
        `Chưa đúng trình tự thí nghiệm! Em cần thực hiện bước ${completedStepIds.length + 1}: "${needed.label}" trước.`,
      );
      return;
    }
    setStepFeedback(null);
    setCompletedStepIds((prev) => [...prev, step.id]);
  };

  const resetExperiment = (nextId?: ExperimentId) => {
    if (nextId) setExpId(nextId);
    setCompletedStepIds([]);
    setStepFeedback(null);
  };

  // Amylase temperature curve
  const amylaseCurve = useMemo(() => {
    return [5, 15, 25, 37, 45, 55, 65, 80].map((t) => {
      const tempAct = Math.exp(-Math.pow(t - 37, 2) / (2 * 13 * 13)) * (t > 65 ? 0.12 : 1);
      const phAct = Math.exp(-Math.pow(enzymePh - 7, 2) / (2 * 1.6 * 1.6));
      return {
        temp: `${t}°C`,
        activity: Math.round(tempAct * phAct * 100),
      };
    });
  }, [enzymePh]);

  const parts: ModelPartInfo[] = [
    {
      id: 'glassware',
      vietnameseName: 'Hệ thống dụng cụ thủy tinh (Ống nghiệm, Cốc đong, Bình tam giác)',
      scientificName: 'Laboratory Glassware',
      location: 'Trên giá đỡ bàn thí nghiệm ảo',
      structure: 'Thủy tinh chịu nhiệt có vạch chia thể tích (mL).',
      function: 'Chứa mẫu sinh học và thuốc thử phản ứng.',
      relatedLessons: [spec.grade],
      colorHex: '#38BDF8',
    },
    {
      id: 'sample-liquid',
      vietnameseName: 'Mẫu thử & Phản ứng đổi màu',
      scientificName: 'Reaction Mixture',
      location: 'Bên trong ống nghiệm / bình phản ứng chính',
      structure: 'Dung dịch chứa đại phân tử sinh học hoặc mẫu tế bào sống.',
      function: 'Biến đổi màu sắc, kết tủa hoặc sinh bọt khí khi thực hiện đúng quy trình.',
      relatedLessons: [spec.title],
      colorHex: isFinished ? '#7E22CE' : '#0D9488',
    },
    {
      id: 'instruments',
      vietnameseName: 'Thiết bị hỗ trợ (Bếp đun, Kính hiển vi, Nhiệt kế)',
      scientificName: 'Lab Bench Instruments',
      location: 'Bên cạnh giá ống nghiệm',
      structure: 'Thiết bị gia nhiệt, đo nhiệt độ và quan sát vi mô.',
      function: 'Kiểm soát điều kiện phản ứng và quan sát kết quả chính xác.',
      relatedLessons: ['Thực hành Sinh học'],
      colorHex: '#F59E0B',
    },
  ];

  const buildModel = (rootGroup: THREE.Group, quality: QualityLevel) => {
    const segs = quality === 'low' ? 14 : 24;

    // Lab bench table
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.28, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }),
    );
    bench.position.y = -1.55;
    rootGroup.add(bench);

    // Glassware group: Test tube rack + Beaker + Erlenmeyer flask
    const glassG = new THREE.Group();
    glassG.userData.partId = 'glassware';
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
    });

    // Main test tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.2, segs, 1, true), glassMat);
    tube.position.set(-0.6, -0.2, 0);
    // Beaker
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.5, segs, 1, true), glassMat);
    beaker.position.set(1.2, -0.65, 0.3);
    // Erlenmeyer flask cone
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.72, 1.55, segs, 1, true), glassMat);
    flask.position.set(-2.1, -0.62, -0.2);

    glassG.add(tube, beaker, flask);
    rootGroup.add(glassG);

    // Sample liquid inside test tube (changes color as steps complete)
    const sampleG = new THREE.Group();
    sampleG.userData.partId = 'sample-liquid';
    const progressRatio = completedStepIds.length / spec.steps.length;
    const initC = new THREE.Color(spec.liquidInitColor);
    const finC = new THREE.Color(spec.liquidFinalColor);
    const curColor = initC.lerp(finC, progressRatio);

    const liquidHeight = 0.65 + progressRatio * 0.75;
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.29, liquidHeight, segs),
      new THREE.MeshStandardMaterial({ color: curColor, roughness: 0.25 }),
    );
    liquid.position.set(-0.6, -1.25 + liquidHeight / 2, 0);
    sampleG.add(liquid);

    if (expId === 'photosynth-bubble' && isFinished) {
      for (let i = 0; i < 6; i++) {
        const bubble = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 0.5 }),
        );
        bubble.position.set(1.2 + (i % 2) * 0.15, -0.9 + i * 0.22, 0.3);
        sampleG.add(bubble);
      }
    }
    rootGroup.add(sampleG);

    // Instruments: Heater plate + Microscope silhouette
    const instG = new THREE.Group();
    instG.userData.partId = 'instruments';
    const heater = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.22, 1.1),
      new THREE.MeshStandardMaterial({
        color: isFinished && expId === 'glucose' ? 0xef4444 : 0x64748b,
        emissive: isFinished && expId === 'glucose' ? 0xb91c1c : 0x000000,
        emissiveIntensity: 0.4,
      }),
    );
    heater.position.set(1.2, -1.35, 0.3);

    const scopeArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 1.4, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }),
    );
    scopeArm.position.set(2.45, -0.7, -0.35);
    instG.add(heater, scopeArm);
    rootGroup.add(instG);

    return { partsMeta: parts, initialCameraDir: new THREE.Vector3(0.35, 0.4, 0.9) };
  };

  const sourceMeta: ScientificSourceMeta = {
    name: `Bàn thí nghiệm ảo: ${spec.title}`,
    source: 'Chương trình Thực hành Sinh học THPT (GDPT 2018)',
    identifier: `WETLAB-${expId.toUpperCase()}`,
    version: '1.0',
    license: 'Học liệu số giáo dục THPT',
    dataType: 'Mô hình giản lược sư phạm',
    verifiedStatus: 'Kiểm tra đúng trình tự thao tác hóa chất & điều kiện an toàn trước khi cho phản ứng xảy ra',
  };

  return (
    <div className={presentation ? 'presentation-active' : ''}>
      <div className="mb-4 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-3">
        {(Object.keys(EXPERIMENTS) as ExperimentId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => resetExperiment(id)}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
              expId === id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {EXPERIMENTS[id].title}
          </button>
        ))}
      </div>

      <LabWorkspaceLayout
        title={`Phòng Lab 12 · ${spec.title}`}
        subtitle={`${spec.grade} · Thực hành thao tác đúng quy trình ống nghiệm 3D và đọc kết quả`}
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
        supportsSimulation={false}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        isPresentation={presentation}
        onTogglePresentation={() => setPresentation((v) => !v)}
        teacherGuideNote="Nếu học sinh bấm nhầm bước (ví dụ nhỏ thuốc thử trước khi lấy mẫu hoặc quên đun nóng với Benedict), hệ thống sẽ nhắc nhở đúng trình tự thực hành."
        sourceMeta={sourceMeta}
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`wetlab-${expId}-${completedStepIds.length}`}
            buildModel={buildModel}
            onSelectPart={viewer.setSelectedPartId}
            selectedPartId={viewer.selectedPartId}
            hiddenPartIds={viewer.hiddenPartIds}
            isolatedPartId={viewer.isolatedPartId}
            autoRotate={viewer.autoRotate}
            opacityLevel={viewer.opacityLevel}
            clipY={viewer.clipY}
            clipX={viewer.clipX}
            explodeFactor={viewer.explodeFactor}
            showLabels={viewer.showLabels}
            parts={parts}
            quality={viewer.quality}
            fallbackTitle={spec.title}
            fallbackItems={spec.steps.map((s) => `${s.label} — ${s.detail}`)}
          />
        }
        knowledgeContent={
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-950">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <div className="font-bold">Lưu ý an toàn phòng thí nghiệm</div>
                <div>{spec.safetyNote}</div>
              </div>
            </div>

            {expId === 'amylase' && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-ui-min">
                    <span>Nhiệt độ thử nghiệm</span>
                    <span className="font-mono-tabular">{enzymeTemp}°C</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    value={enzymeTemp}
                    onChange={(e) => setEnzymeTemp(Number(e.target.value))}
                    className="w-full accent-rose-600 h-2"
                  />
                </label>
                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-ui-min">
                    <span>Độ pH môi trường</span>
                    <span className="font-mono-tabular">pH = {enzymePh}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={11}
                    step={0.5}
                    value={enzymePh}
                    onChange={(e) => setEnzymePh(Number(e.target.value))}
                    className="w-full accent-teal-700 h-2"
                  />
                </label>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={amylaseCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="temp" tick={{ fontSize: 15, fill: '#334155' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 15, fill: '#334155' }} />
                      <Tooltip contentStyle={{ fontSize: '15px', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="activity" stroke="#0D9488" strokeWidth={2.5} name="Hoạt tính (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-slate-900">Các bước thao tác thực hành:</div>
              <button
                type="button"
                onClick={() => resetExperiment()}
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 text-ui-min font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Làm lại thí nghiệm
              </button>
            </div>

            {spec.steps.map((step, idx) => {
              const done = completedStepIds.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleSelectStep(step, idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    done
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                      : 'bg-white border-slate-200 hover:border-teal-500 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 mt-0.5 ${done ? 'text-emerald-600' : 'text-slate-300'}`}
                    />
                    <div>
                      <div className="font-semibold">
                        Bước {idx + 1}: {step.label}
                      </div>
                      {done && <div className="text-emerald-800 text-ui-min mt-1">{step.detail}</div>}
                    </div>
                  </div>
                </button>
              );
            })}

            {stepFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-medium text-ui-min">
                {stepFeedback}
              </div>
            )}

            {isFinished && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-300 text-teal-950 font-semibold">
                {spec.resultSummary}
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};
