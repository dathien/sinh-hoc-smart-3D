import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Compass,
  FlaskConical,
  HeartPulse,
  Info,
  Layers,
  ListChecks,
  Microscope,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  StepForward,
  Wind,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { ModelViewer3D, SceneUpdateContext } from '../../components/viewer3d/ModelViewer3D';
import {
  HUMAN_VS_BIRD_COMPARISON,
  RESPIRATION_SIM_MAP,
  RESPIRATION_SIMULATIONS,
} from '../../data/respiration/respirationContent';
import { RespirationSimId } from '../../data/respiration/respirationTypes';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { QualityLevel } from '../../types/biology';
import {
  AlveolarAnimHandles,
  AlveolarExchangeParams,
  animateAlveolarExchange,
  animateBreathingMechanics,
  animateHumanAnatomy,
  BreathingMechHandles,
  buildAlveolarExchange,
  buildBreathingCycleSeries,
  buildBreathingMechanics,
  buildHumanRespiratoryAnatomy,
  computeAlveolarMetrics,
  computeBreathingKinematics,
  HumanAnatomyAnimHandles,
} from './builders/humanRespirationBuilders';
import {
  animateAvianRespiration,
  animateBodySurface,
  animateFishGills,
  animateRespiratoryHealth,
  animateTrachealSystem,
  AvianAnimHandles,
  BodySurfaceAnimHandles,
  buildAvianRespiration,
  buildBodySurfaceExchange,
  buildFishGills,
  buildRespiratoryHealth,
  buildTrachealSystem,
  computeGillProfile,
  FishGillAnimHandles,
  HealthScenarioId,
  RespiratoryHealthAnimHandles,
  TrachealAnimHandles,
} from './builders/comparativeRespirationBuilders';
import { GasExchangeComparisonPanel } from './GasExchangeComparisonPanel';
import { RespirationQuizBank } from './RespirationQuizBank';

interface RespirationSystemLabProps {
  initialSimId?: RespirationSimId;
  embeddedInLesson?: boolean;
}

type ActiveHandles =
  | { kind: 'human-anatomy'; h: HumanAnatomyAnimHandles }
  | { kind: 'breathing-mechanics'; h: BreathingMechHandles }
  | { kind: 'alveolar-exchange'; h: AlveolarAnimHandles }
  | { kind: 'body-surface'; h: BodySurfaceAnimHandles }
  | { kind: 'tracheal-system'; h: TrachealAnimHandles }
  | { kind: 'fish-gills'; h: FishGillAnimHandles }
  | { kind: 'avian-respiration'; h: AvianAnimHandles }
  | { kind: 'respiratory-health'; h: RespiratoryHealthAnimHandles };

const AVIAN_STAGES = [
  {
    idx: 0,
    short: 'Giai đoạn 1 · Hít vào 1',
    detail: 'Không khí giàu O₂ mới đi qua khí quản → phế quản thẳng vào hệ thống TÚI KHÍ SAU (cả hai nhóm túi khí giãn ra).',
  },
  {
    idx: 1,
    short: 'Giai đoạn 2 · Thở ra 1',
    detail: 'Túi khí sau co lại đẩy gói khí giàu O₂ đi một chiều xuyên qua PHỔI (ống khí parabronchi) — nơi diễn ra TRAO ĐỔI KHÍ O₂/CO₂ với máu.',
  },
  {
    idx: 2,
    short: 'Giai đoạn 3 · Hít vào 2',
    detail: 'Túi khí giãn ra lần 2: gói khí đã trao đổi khí ở phổi được hút vào TÚI KHÍ TRƯỚC (đồng thời khí mới khác lại vào túi khí sau).',
  },
  {
    idx: 3,
    short: 'Giai đoạn 4 · Thở ra 2',
    detail: 'Túi khí trước co lại đẩy gói khí giàu CO₂ ra ngoài qua khí quản, khép kín chu trình 2 nhịp hô hấp.',
  },
];

const HEALTH_SCENARIOS: {
  id: HealthScenarioId;
  code: string;
  label: string;
  airwayStatus: string;
  ciliaStatus: string;
  clearanceNote: string;
  badgeClass: string;
}[] = [
  {
    id: 'healthy',
    code: 'A',
    label: 'Hệ hô hấp khỏe mạnh',
    airwayStatus: 'Đường dẫn khí thông thoáng, lớp chất nhầy mỏng sạch',
    ciliaStatus: 'Lông chuyển rung nhịp nhàng đồng bộ hướng lên hầu',
    clearanceNote: 'Bụi bẩn và vi sinh vật bị giữ ở lớp nhầy mỏng và nhanh chóng được quét ra khỏi đường thở.',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'smoke',
    code: 'B',
    label: 'Tiếp xúc khói thuốc lá',
    airwayStatus: 'Chất nhầy tiết nhiều và đặc hơn làm tăng sức cản dòng khí',
    ciliaStatus: 'Hoạt động rung của lông chuyển bị suy giảm rõ rệt',
    clearanceNote: 'Cơ chế tự làm sạch đường thở kém hiệu quả; khói bụi và tạp chất dễ tồn đọng lâu trên niêm mạc.',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'pollution',
    code: 'C',
    label: 'Bụi & ô nhiễm không khí',
    airwayStatus: 'Mật độ hạt bụi mịn cao lơ lửng trong luồng khí hít vào',
    ciliaStatus: 'Hệ thống nhầy – lông chuyển phải làm việc quá tải',
    clearanceNote: 'Đeo khẩu trang đạt chuẩn và tránh khu vực nhiều khói bụi giúp giảm gánh nặng cho niêm mạc hô hấp.',
    badgeClass: 'bg-slate-200 text-slate-900 border-slate-400',
  },
  {
    id: 'exercise',
    code: 'D',
    label: 'Hoạt động thể dục, thể thao',
    airwayStatus: 'Đường dẫn khí mở rộng thông thoáng, thông khí sâu và đều',
    ciliaStatus: 'Lông chuyển hoạt động linh hoạt, lưu thông khí mạnh mẽ',
    clearanceNote: 'Luyện tập thể dục đều đặn, vừa sức giúp cơ hoành và cơ liên sườn khỏe hơn, tăng hiệu quả trao đổi khí.',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
  },
];

const PROTECTION_HABITS = [
  'Không hút thuốc lá, thuốc lá điện tử và tránh hít phải khói thuốc thụ động.',
  'Đeo khẩu trang đạt chuẩn khi di chuyển nơi nhiều bụi mịn, khói xe hoặc công trường.',
  'Giữ không gian lớp học, phòng ngủ thông thoáng, sạch bụi và trồng thêm cây xanh.',
  'Luyện tập thể dục thể thao đều đặn, hít thở sâu đúng kỹ thuật và vừa sức.',
  'Giữ vệ sinh mũi họng, tiêm phòng đầy đủ theo khuyến cáo y tế để phòng bệnh hô hấp.',
];

export const RespirationSystemLab: React.FC<RespirationSystemLabProps> = ({
  initialSimId = 'human-anatomy',
  embeddedInLesson = false,
}) => {
  const [activeSimId, setActiveSimId] = useState<RespirationSimId>(initialSimId);
  const [sectionView, setSectionView] = useState<'lab' | 'compare' | 'practice-all'>('lab');

  useEffect(() => {
    setActiveSimId(initialSimId);
    setSectionView('lab');
  }, [initialSimId]);

  const viewer = useLabViewerState(true);
  const handlesRef = useRef<ActiveHandles | null>(null);

  // --- Per-Simulation Interactive States ---
  // Sim 01: Human Anatomy airflow direction
  const [anatomyFlowDir, setAnatomyFlowDir] = useState<'auto' | 'inhale' | 'exhale'>('auto');

  // Sim 02: Breathing Mechanics synchronized state
  const [bpm, setBpm] = useState(16);
  const [breathMode, setBreathMode] = useState<'continuous' | 'inhale-hold' | 'exhale-hold' | 'step'>('continuous');
  const [breathPhaseRad, setBreathPhaseRad] = useState(Math.PI * 0.5);
  const breathPhaseRef = useRef(Math.PI * 0.5);
  const lastUiSyncRef = useRef(0);

  // Sim 03: Alveolar Exchange biological parameters
  const [alveolarParams, setAlveolarParams] = useState<AlveolarExchangeParams>({
    ventilationSpeed: 1.0,
    bloodFlowSpeed: 1.0,
    surfaceAreaRel: 1.0,
    barrierThicknessRel: 1.0,
    deltaPO2Rel: 1.0,
    deltaPCO2Rel: 1.0,
    useBlueVenousConvention: false,
  });

  // Sim 04: Body surface (Earthworm vs Hydra)
  const [surfaceSpecies, setSurfaceSpecies] = useState<'earthworm' | 'hydra'>('earthworm');
  const [wormMoisture, setWormMoisture] = useState(85);

  // Sim 05: Grasshopper tracheal system
  const [spiraclesOpen, setSpiraclesOpen] = useState(true);
  const [tracheaZoomed, setTracheaZoomed] = useState(false);

  // Sim 06: Fish gills
  const [gillViewMode, setGillViewMode] = useState<'whole' | 'lamella'>('whole');
  const [gillFlowType, setGillFlowType] = useState<'countercurrent' | 'concurrent'>('countercurrent');
  const [gillWaterSpeed, setGillWaterSpeed] = useState(1.0);
  const [gillBloodSpeed, setGillBloodSpeed] = useState(1.0);
  const [gillDissolvedO2, setGillDissolvedO2] = useState(95);

  // Sim 07: Avian respiration (4 stages across 2 cycles)
  const [avianAutoCycle, setAvianAutoCycle] = useState(true);
  const [avianStageIdx, setAvianStageIdx] = useState(0);
  const avianStageRef = useRef(0);
  const avianProgressRef = useRef(0);

  // Sim 08: Respiratory health 4 scenarios
  const [healthScenario, setHealthScenario] = useState<HealthScenarioId>('healthy');

  // Mutable ref so WebGL animation loop always reads fresh control state without rebuilding WebGLRenderer
  const simParamsRef = useRef({
    activeSimId,
    anatomyFlowDir,
    bpm,
    breathMode,
    alveolarParams,
    wormMoisture,
    spiraclesOpen,
    gillFlowType,
    gillWaterSpeed,
    gillBloodSpeed,
    gillDissolvedO2,
    avianAutoCycle,
    avianStageIdx,
    healthScenario,
  });
  simParamsRef.current = {
    activeSimId,
    anatomyFlowDir,
    bpm,
    breathMode,
    alveolarParams,
    wormMoisture,
    spiraclesOpen,
    gillFlowType,
    gillWaterSpeed,
    gillBloodSpeed,
    gillDissolvedO2,
    avianAutoCycle,
    avianStageIdx,
    healthScenario,
  };

  const activeSim = RESPIRATION_SIM_MAP[activeSimId];
  const activeParts = useMemo(() => {
    if (activeSimId === 'body-surface' && surfaceSpecies === 'hydra' && activeSim.secondaryParts) {
      return activeSim.secondaryParts;
    }
    if (activeSimId === 'fish-gills' && gillViewMode === 'lamella') {
      return activeSim.parts.filter((p) =>
        ['gill-filaments', 'gill-lamellae', 'gill-capillaries'].includes(p.id),
      );
    }
    return activeSim.parts;
  }, [activeSim, activeSimId, surfaceSpecies, gillViewMode]);

  // Unique modelKey triggers clean geometry rebuild only when model topology changes
  const modelKey = useMemo(() => {
    if (activeSimId === 'body-surface') return `resp-body-surface-${surfaceSpecies}`;
    if (activeSimId === 'tracheal-system') return `resp-tracheal-${tracheaZoomed ? 'zoom' : 'whole'}`;
    if (activeSimId === 'fish-gills') return `resp-fish-gills-${gillViewMode}`;
    return `resp-${activeSimId}`;
  }, [activeSimId, surfaceSpecies, tracheaZoomed, gillViewMode]);

  // Reset part selection/hiding cleanly when switching simulations
  const handleSelectSim = useCallback(
    (nextId: RespirationSimId) => {
      setActiveSimId(nextId);
      setSectionView('lab');
      viewer.resetViewAndParts();
    },
    [viewer],
  );

  // Build 3D scene for active simulation
  const buildModel = useCallback(
    (rootGroup: THREE.Group, quality: QualityLevel) => {
      handlesRef.current = null;

      if (activeSimId === 'human-anatomy') {
        const res = buildHumanRespiratoryAnatomy(rootGroup, quality);
        handlesRef.current = { kind: 'human-anatomy', h: res.handles };
        return { initialCameraDir: res.initialCameraDir };
      }
      if (activeSimId === 'breathing-mechanics') {
        const res = buildBreathingMechanics(rootGroup, quality);
        handlesRef.current = { kind: 'breathing-mechanics', h: res.handles };
        return { initialCameraDir: res.initialCameraDir };
      }
      if (activeSimId === 'alveolar-exchange') {
        const res = buildAlveolarExchange(rootGroup, quality);
        handlesRef.current = { kind: 'alveolar-exchange', h: res.handles };
        return { initialCameraDir: res.initialCameraDir };
      }
      if (activeSimId === 'body-surface') {
        const res = buildBodySurfaceExchange(rootGroup, quality, surfaceSpecies);
        handlesRef.current = { kind: 'body-surface', h: res.handles };
        return { initialCameraDir: res.initialCameraDir };
      }
      if (activeSimId === 'tracheal-system') {
        const res = buildTrachealSystem(rootGroup, quality, tracheaZoomed);
        handlesRef.current = { kind: 'tracheal-system', h: res.handles };
        return { initialCameraDir: res.initialCameraDir };
      }
      if (activeSimId === 'fish-gills') {
        const res = buildFishGills(rootGroup, quality, gillViewMode);
        handlesRef.current = { kind: 'fish-gills', h: res.handles };
        return { initialCameraDir: res.initialCameraDir };
      }
      if (activeSimId === 'avian-respiration') {
        const res = buildAvianRespiration(rootGroup, quality);
        handlesRef.current = { kind: 'avian-respiration', h: res.handles };
        return { initialCameraDir: res.initialCameraDir };
      }
      const res = buildRespiratoryHealth(rootGroup, quality);
      handlesRef.current = { kind: 'respiratory-health', h: res.handles };
      return { initialCameraDir: res.initialCameraDir };
    },
    [activeSimId, surfaceSpecies, tracheaZoomed, gillViewMode],
  );

  // Per-frame animation loop updating 3D handles deterministically
  const handleAnimateFrame = useCallback((ctx: SceneUpdateContext) => {
    const active = handlesRef.current;
    if (!active) return;
    const p = simParamsRef.current;

    if (active.kind === 'human-anatomy') {
      animateHumanAnatomy(active.h, ctx.simTime, p.anatomyFlowDir);
      return;
    }

    if (active.kind === 'breathing-mechanics') {
      const omega = (p.bpm / 60) * Math.PI * 2;
      if (p.breathMode === 'continuous' && ctx.isPlaying) {
        breathPhaseRef.current =
          (breathPhaseRef.current + ctx.delta * omega * ctx.speed) % (Math.PI * 2);
      } else if (p.breathMode === 'inhale-hold') {
        // Animate smoothly toward peak inhale (PI) if not yet there
        const target = Math.PI * 0.55;
        breathPhaseRef.current += (target - breathPhaseRef.current) * Math.min(1, ctx.delta * 4.5);
      } else if (p.breathMode === 'exhale-hold') {
        const target = Math.PI * 1.55;
        breathPhaseRef.current += (target - breathPhaseRef.current) * Math.min(1, ctx.delta * 4.5);
      }
      animateBreathingMechanics(active.h, breathPhaseRef.current, p.bpm);

      // Throttled React sync (~12fps) to drive live Recharts marker smoothly with zero lag
      if (ctx.elapsed - lastUiSyncRef.current > 0.08) {
        lastUiSyncRef.current = ctx.elapsed;
        setBreathPhaseRad(breathPhaseRef.current);
      }
      return;
    }

    if (active.kind === 'alveolar-exchange') {
      animateAlveolarExchange(active.h, ctx.simTime, p.alveolarParams);
      return;
    }

    if (active.kind === 'body-surface') {
      animateBodySurface(active.h, ctx.simTime, p.wormMoisture);
      return;
    }

    if (active.kind === 'tracheal-system') {
      animateTrachealSystem(active.h, ctx.simTime, p.spiraclesOpen);
      return;
    }

    if (active.kind === 'fish-gills') {
      animateFishGills(active.h, ctx.simTime, {
        flowType: p.gillFlowType,
        waterSpeed: p.gillWaterSpeed,
        bloodSpeed: p.gillBloodSpeed,
        dissolvedO2Pct: p.gillDissolvedO2,
      });
      return;
    }

    if (active.kind === 'avian-respiration') {
      if (p.avianAutoCycle && ctx.isPlaying) {
        avianProgressRef.current += ctx.delta * 0.42 * ctx.speed;
        if (avianProgressRef.current >= 1) {
          avianProgressRef.current -= 1;
          avianStageRef.current = (avianStageRef.current + 1) % 4;
          setAvianStageIdx(avianStageRef.current);
        }
      } else {
        avianStageRef.current = p.avianStageIdx;
        if (ctx.isPlaying) {
          avianProgressRef.current = (avianProgressRef.current + ctx.delta * 0.45 * ctx.speed) % 1;
        }
      }
      animateAvianRespiration(active.h, avianStageRef.current, avianProgressRef.current, ctx.simTime);
      return;
    }

    if (active.kind === 'respiratory-health') {
      animateRespiratoryHealth(active.h, ctx.simTime, p.healthScenario);
    }
  }, []);

  // Derived deterministic physiology readouts for charts & indicators
  const breathingSeries = useMemo(() => buildBreathingCycleSeries(bpm, 48), [bpm]);
  const currentBreath = useMemo(
    () => computeBreathingKinematics(breathPhaseRad, bpm),
    [breathPhaseRad, bpm],
  );
  const alveolarMetrics = useMemo(() => computeAlveolarMetrics(alveolarParams), [alveolarParams]);
  const gillSummary = useMemo(
    () => computeGillProfile(gillFlowType, gillWaterSpeed, gillBloodSpeed, gillDissolvedO2),
    [gillFlowType, gillWaterSpeed, gillBloodSpeed, gillDissolvedO2],
  );
  const activeHealthInfo = useMemo(
    () => HEALTH_SCENARIOS.find((s) => s.id === healthScenario) ?? HEALTH_SCENARIOS[0],
    [healthScenario],
  );

  // Handlers for Sim 02 step & reset
  const handleStepForward = () => {
    if (activeSimId === 'breathing-mechanics') {
      setBreathMode('step');
      const next = (breathPhaseRef.current + Math.PI / 4) % (Math.PI * 2);
      breathPhaseRef.current = next;
      setBreathPhaseRad(next);
      return;
    }
    if (activeSimId === 'avian-respiration') {
      setAvianAutoCycle(false);
      const next = (avianStageIdx + 1) % 4;
      setAvianStageIdx(next);
      avianStageRef.current = next;
      avianProgressRef.current = 0.55;
      return;
    }
    viewer.setIsPlaying(false);
    viewer.setSimStepOffset((v) => v + 0.6);
  };

  const handleResetSim = () => {
    viewer.resetViewAndParts();
    if (activeSimId === 'breathing-mechanics') {
      setBpm(16);
      setBreathMode('continuous');
      breathPhaseRef.current = 0;
      setBreathPhaseRad(0);
    } else if (activeSimId === 'alveolar-exchange') {
      setAlveolarParams({
        ventilationSpeed: 1.0,
        bloodFlowSpeed: 1.0,
        surfaceAreaRel: 1.0,
        barrierThicknessRel: 1.0,
        deltaPO2Rel: 1.0,
        deltaPCO2Rel: 1.0,
        useBlueVenousConvention: false,
      });
    } else if (activeSimId === 'body-surface') {
      setWormMoisture(85);
    } else if (activeSimId === 'tracheal-system') {
      setSpiraclesOpen(true);
    } else if (activeSimId === 'fish-gills') {
      setGillFlowType('countercurrent');
      setGillWaterSpeed(1.0);
      setGillBloodSpeed(1.0);
      setGillDissolvedO2(95);
    } else if (activeSimId === 'avian-respiration') {
      setAvianAutoCycle(true);
      setAvianStageIdx(0);
      avianStageRef.current = 0;
      avianProgressRef.current = 0;
    } else if (activeSimId === 'respiratory-health') {
      setHealthScenario('healthy');
    }
  };

  // --- Per-Simulation Controls inside Tab "Mô phỏng" ---
  const simulationControlsExtra = useMemo(() => {
    if (activeSimId === 'human-anatomy') {
      return (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="font-bold text-slate-900 text-[15px]">Chiều đường đi không khí</div>
          <div className="grid grid-cols-1 gap-2">
            {(
              [
                { id: 'auto', label: 'Tự động luân phiên (Hít vào ⇄ Thở ra)' },
                { id: 'inhale', label: 'Hít vào: Khoang mũi → ... → Phế nang' },
                { id: 'exhale', label: 'Thở ra: Phế nang → ... → Khoang mũi' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAnatomyFlowDir(m.id)}
                className={`px-3 py-2.5 rounded-lg border text-left font-semibold min-h-[44px] text-[15px] ${
                  anatomyFlowDir === m.id
                    ? 'bg-teal-600 text-white border-teal-700'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-[15px] text-sky-950">
            <strong>Quy ước màu dòng khí:</strong> Hạt xanh ngọc là khí hít vào giàu O₂; hạt cam là khí thở ra giàu CO₂.
          </div>
        </div>
      );
    }

    if (activeSimId === 'breathing-mechanics') {
      return (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="font-bold text-slate-900 text-[15px]">Điều khiển chu kỳ thông khí</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setBreathMode('inhale-hold');
                viewer.setIsPlaying(true);
              }}
              className={`px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                breathMode === 'inhale-hold'
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Hít vào
            </button>
            <button
              type="button"
              onClick={() => {
                setBreathMode('exhale-hold');
                viewer.setIsPlaying(true);
              }}
              className={`px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                breathMode === 'exhale-hold'
                  ? 'bg-orange-600 text-white border-orange-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Thở ra
            </button>
            <button
              type="button"
              onClick={() => {
                setBreathMode('continuous');
                viewer.setIsPlaying(true);
              }}
              className={`col-span-2 px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] flex items-center justify-center gap-1.5 ${
                breathMode === 'continuous'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Play className="w-4 h-4" /> Chạy liên tục nhịp thở
            </button>
          </div>

          <label className="block space-y-1 text-[15px]">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Nhịp thở mô phỏng</span>
              <span className="text-teal-700 font-bold">{bpm} lần/phút</span>
            </div>
            <input
              type="range"
              min={8}
              max={40}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <p className="text-slate-600 text-[15px]">
              Thông số mô phỏng dạy học (mặc định 16 lần/phút), không dùng để chẩn đoán sức khỏe.
            </p>
          </label>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-[15px]">
            <div className="font-bold text-slate-900">Trạng thái cơ hô hấp hiện tại:</div>
            <div className="text-slate-700">
              • Cơ hoành: <strong>{currentBreath.isInhaling ? 'Co và hạ xuống' : 'Dãn và nâng vòm lên'}</strong>
            </div>
            <div className="text-slate-700">
              • Cơ liên sườn ngoài:{' '}
              <strong>{currentBreath.isInhaling ? 'Co (nâng xương sườn)' : 'Dãn (xương sườn hạ thụ động)'}</strong>
            </div>
            <div className="text-slate-700">
              • Áp suất phế nang tương đối:{' '}
              <strong className={currentBreath.alveolarPressureRel < 0 ? 'text-teal-700' : 'text-orange-700'}>
                {currentBreath.alveolarPressureRel > 0 ? '+' : ''}
                {currentBreath.alveolarPressureRel} đv
              </strong>
            </div>
          </div>
        </div>
      );
    }

    if (activeSimId === 'alveolar-exchange') {
      const sliders: {
        key: keyof AlveolarExchangeParams;
        label: string;
        min: number;
        max: number;
        step: number;
        fmt: (v: number) => string;
      }[] = [
        { key: 'ventilationSpeed', label: 'Tốc độ thông khí phế nang', min: 0.3, max: 2.0, step: 0.1, fmt: (v) => `${v.toFixed(1)}×` },
        { key: 'bloodFlowSpeed', label: 'Tốc độ dòng máu mao mạch', min: 0.3, max: 2.0, step: 0.1, fmt: (v) => `${v.toFixed(1)}×` },
        { key: 'surfaceAreaRel', label: 'Diện tích trao đổi khí tương đối', min: 0.4, max: 1.5, step: 0.1, fmt: (v) => `${Math.round(v * 100)}%` },
        { key: 'barrierThicknessRel', label: 'Độ dày hàng rào trao đổi khí', min: 0.6, max: 2.5, step: 0.1, fmt: (v) => `${v.toFixed(1)}×` },
        { key: 'deltaPO2Rel', label: 'Chênh lệch phân áp ΔP_O₂', min: 0.3, max: 1.6, step: 0.1, fmt: (v) => `${Math.round(v * 100)}%` },
        { key: 'deltaPCO2Rel', label: 'Chênh lệch phân áp ΔP_CO₂', min: 0.3, max: 1.6, step: 0.1, fmt: (v) => `${Math.round(v * 100)}%` },
      ];
      return (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="font-bold text-slate-900 text-[15px]">Yếu tố ảnh hưởng khuếch tán khí</div>
          {sliders.map((s) => (
            <label key={s.key} className="block space-y-1 text-[15px]">
              <div className="flex justify-between text-slate-800 font-medium">
                <span>{s.label}</span>
                <span className="font-bold text-teal-700">{s.fmt(alveolarParams[s.key] as number)}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={alveolarParams[s.key] as number}
                onChange={(e) =>
                  setAlveolarParams((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))
                }
                className="w-full accent-teal-600"
              />
            </label>
          ))}

          <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer text-[15px]">
            <input
              type="checkbox"
              checked={alveolarParams.useBlueVenousConvention}
              onChange={(e) =>
                setAlveolarParams((prev) => ({ ...prev, useBlueVenousConvention: e.target.checked }))
              }
              className="mt-1 w-4 h-4 accent-teal-600"
            />
            <span className="text-slate-700">
              Hiển thị máu nghèo O₂ màu xanh lam (chỉ là quy ước sơ đồ giáo dục; thực tế máu nghèo O₂ màu đỏ sẫm).
            </span>
          </label>
        </div>
      );
    }

    if (activeSimId === 'body-surface') {
      return (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="font-bold text-slate-900 text-[15px]">Chọn đối tượng so sánh</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSurfaceSpecies('earthworm');
                viewer.setSelectedPartId(null);
              }}
              className={`px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                surfaceSpecies === 'earthworm'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              A. Giun đất
            </button>
            <button
              type="button"
              onClick={() => {
                setSurfaceSpecies('hydra');
                viewer.setSelectedPartId(null);
              }}
              className={`px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                surfaceSpecies === 'hydra'
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              B. Thủy tức
            </button>
          </div>

          {surfaceSpecies === 'earthworm' ? (
            <label className="block space-y-1.5 text-[15px]">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Độ ẩm bề mặt da giun đất</span>
                <span className={wormMoisture < 35 ? 'text-rose-700 font-bold' : 'text-teal-700 font-bold'}>
                  {wormMoisture}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={wormMoisture}
                onChange={(e) => setWormMoisture(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <p className="text-slate-700 text-[15px]">
                {wormMoisture < 35
                  ? 'Cảnh báo sinh học: Da khô làm khí O₂ khó hòa tan → tốc độ khuếch tán qua da giảm mạnh!'
                  : 'Lớp chất nhầy ẩm hòa tan tốt khí O₂ giúp khuếch tán nhanh vào mạng mao mạch dưới da.'}
              </p>
            </label>
          ) : (
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-950 text-[15px]">
              <strong>Điểm cốt lõi ở Thủy tức:</strong> Thành cơ thể chỉ gồm 2 lớp tế bào tiếp xúc trực tiếp với nước (mặt ngoài & khoang tiêu hóa), <strong>KHÔNG có hệ tuần hoàn và mao mạch</strong>.
            </div>
          )}
        </div>
      );
    }

    if (activeSimId === 'tracheal-system') {
      return (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="font-bold text-slate-900 text-[15px]">Điều khiển hệ thống ống khí</div>
          <button
            type="button"
            onClick={() => setSpiraclesOpen((v) => !v)}
            className={`w-full px-3.5 py-2.5 rounded-lg border font-bold min-h-[44px] text-[15px] ${
              spiraclesOpen
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {spiraclesOpen ? 'Lỗ thở đang MỞ (Nhấp để ĐÓNG)' : 'Lỗ thở đang ĐÓNG (Nhấp để MỞ)'}
          </button>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setTracheaZoomed(false)}
              className={`px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                !tracheaZoomed
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Góc nhìn: Toàn thân châu chấu (xuyên thấu)
            </button>
            <button
              type="button"
              onClick={() => setTracheaZoomed(true)}
              className={`px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                tracheaZoomed
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Phóng đại: Ống khí nhỏ → Tế bào cơ
            </button>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-[15px]">
            O₂ đi thẳng từ <strong>Lỗ thở → Ống khí → Ống khí nhỏ → Tế bào</strong> mà <strong>không nhờ máu</strong> làm phương tiện vận chuyển chính.
          </div>
        </div>
      );
    }

    if (activeSimId === 'fish-gills') {
      return (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="font-bold text-slate-900 text-[15px]">Chế độ quan sát mang cá</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGillViewMode('whole')}
              className={`px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                gillViewMode === 'whole'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Toàn bộ mang cá
            </button>
            <button
              type="button"
              onClick={() => setGillViewMode('lamella')}
              className={`px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                gillViewMode === 'lamella'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Phóng đại phiến mang
            </button>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900 text-[15px]">So sánh chiều dòng chảy</div>
            <button
              type="button"
              onClick={() => {
                setGillFlowType('countercurrent');
                setGillViewMode('lamella');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                gillFlowType === 'countercurrent'
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Ngược chiều (Cơ chế thực ở cá xương)
            </button>
            <button
              type="button"
              onClick={() => {
                setGillFlowType('concurrent');
                setGillViewMode('lamella');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                gillFlowType === 'concurrent'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Cùng chiều (Mô hình so sánh nguyên lí)
            </button>
          </div>

          <label className="block space-y-1 text-[15px]">
            <div className="flex justify-between font-medium">
              <span>Tốc độ dòng nước qua mang</span>
              <span className="font-bold text-blue-700">{gillWaterSpeed.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.0}
              step={0.1}
              value={gillWaterSpeed}
              onChange={(e) => setGillWaterSpeed(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </label>
          <label className="block space-y-1 text-[15px]">
            <div className="flex justify-between font-medium">
              <span>Tốc độ dòng máu mao mạch</span>
              <span className="font-bold text-rose-700">{gillBloodSpeed.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.0}
              step={0.1}
              value={gillBloodSpeed}
              onChange={(e) => setGillBloodSpeed(Number(e.target.value))}
              className="w-full accent-rose-600"
            />
          </label>
          <label className="block space-y-1 text-[15px]">
            <div className="flex justify-between font-medium">
              <span>Lượng O₂ hòa tan trong nước</span>
              <span className="font-bold text-teal-700">{gillDissolvedO2}%</span>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              step={5}
              value={gillDissolvedO2}
              onChange={(e) => setGillDissolvedO2(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
          </label>
        </div>
      );
    }

    if (activeSimId === 'avian-respiration') {
      return (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="font-bold text-slate-900 text-[15px]">Theo dõi gói khí qua 2 chu kỳ (4 giai đoạn)</div>
          <button
            type="button"
            onClick={() => setAvianAutoCycle((v) => !v)}
            className={`w-full px-3 py-2.5 rounded-lg border font-bold min-h-[44px] text-[15px] ${
              avianAutoCycle
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {avianAutoCycle ? 'Đang chạy tự động 2 chu kỳ liên tiếp' : 'Bật chạy tự động 2 chu kỳ'}
          </button>

          <div className="grid grid-cols-1 gap-2">
            {AVIAN_STAGES.map((st) => (
              <button
                key={st.idx}
                type="button"
                onClick={() => {
                  setAvianAutoCycle(false);
                  setAvianStageIdx(st.idx);
                  avianStageRef.current = st.idx;
                  avianProgressRef.current = 0.25;
                }}
                className={`text-left px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                  avianStageIdx === st.idx
                    ? 'bg-teal-600 text-white border-teal-700'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {st.short}
              </button>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[15px]">
            <strong>Ghi nhớ khoa học:</strong> Phổi chim giữ thể tích cố định (không phồng xẹp); túi khí đóng vai trò ống bễ bơm khí một chiều qua phổi.
          </div>
        </div>
      );
    }

    // Sim 08: Respiratory Health 4 scenarios
    return (
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="font-bold text-slate-900 text-[15px]">Chọn 4 tình huống sư phạm</div>
        <div className="grid grid-cols-1 gap-2">
          {HEALTH_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setHealthScenario(sc.id)}
              className={`text-left px-3 py-2.5 rounded-lg border font-semibold min-h-[44px] text-[15px] ${
                healthScenario === sc.id
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {sc.code}. {sc.label}
            </button>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[15px]">
          Lưu ý: Mô phỏng sư phạm minh họa hoạt động lông chuyển – chất nhầy, không thay thế tư vấn hay chẩn đoán y khoa.
        </div>
      </div>
    );
  }, [
    activeSimId,
    anatomyFlowDir,
    breathMode,
    bpm,
    currentBreath,
    alveolarParams,
    surfaceSpecies,
    wormMoisture,
    spiraclesOpen,
    tracheaZoomed,
    gillViewMode,
    gillFlowType,
    gillWaterSpeed,
    gillBloodSpeed,
    gillDissolvedO2,
    avianAutoCycle,
    avianStageIdx,
    healthScenario,
    viewer,
  ]);

  // --- Rich Knowledge Tab Content ---
  const knowledgeContent = useMemo(
    () => (
      <div className="space-y-4 text-[15px] leading-relaxed">
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-1.5">
          <div className="font-bold text-teal-950 flex items-center gap-1.5">
            <Compass className="w-4 h-4 shrink-0" /> Mục tiêu quan sát
          </div>
          <p className="text-teal-900">{activeSim.observationGoal}</p>
        </div>

        <div className="space-y-1.5">
          <div className="font-bold text-slate-900">Hướng dẫn thao tác nhanh</div>
          <ol className="list-decimal pl-5 space-y-1 text-slate-700">
            {activeSim.operationGuide.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
          <div className="font-bold text-amber-950">Câu hỏi dự đoán trước khi chạy mô phỏng</div>
          <p className="text-amber-900">{activeSim.predictionQuestion}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 space-y-1.5">
          <div className="font-bold text-sky-950">Nhiệm vụ khám phá</div>
          <p className="text-sky-900">{activeSim.discoveryTask}</p>
        </div>

        <div className="space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kiến thức cốt lõi (Trọng tâm Bài 9)
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-800">
            {activeSim.corePoints.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" /> Khám phá mở rộng
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
            {activeSim.extendedPoints.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
          <div className="font-bold text-emerald-950">Kết luận khoa học</div>
          <p className="text-emerald-900">{activeSim.conclusion}</p>
        </div>
      </div>
    ),
    [activeSim],
  );

  // --- Per-Simulation Synchronized Below-Stage Live Panel (Graphs, Indicators, Tables) ---
  const belowStagePanel = useMemo(() => {
    if (activeSimId === 'breathing-mechanics') {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Biểu đồ động đồng bộ với hoạt cảnh 3D (Thể tích phổi – Áp suất phế nang – Lưu lượng khí)
              </h3>
              <p className="text-slate-600 text-[15px]">
                Pha hiện tại: <strong className="text-teal-800">{currentBreath.phaseLabel}</strong> · Nhịp thở mô phỏng: <strong>{bpm} lần/phút</strong> (dữ liệu sư phạm tính trực tiếp từ pha hoạt cảnh).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStepForward}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50 min-h-[44px] text-[15px]"
              >
                <StepForward className="w-4 h-4" /> Từng bước
              </button>
              <button
                type="button"
                onClick={handleResetSim}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50 min-h-[44px] text-[15px]"
              >
                <RotateCcw className="w-4 h-4" /> Làm lại
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[15px]">
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
              <div className="text-teal-800 font-semibold">Thể tích phổi tương đối</div>
              <div className="text-2xl font-bold text-teal-950">{currentBreath.lungVolumeRel}%</div>
            </div>
            <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200">
              <div className="text-orange-800 font-semibold">Áp suất phế nang tương đối (ΔP)</div>
              <div className="text-2xl font-bold text-orange-950">
                {currentBreath.alveolarPressureRel > 0 ? '+' : ''}
                {currentBreath.alveolarPressureRel} đv
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
              <div className="text-sky-800 font-semibold">Chiều & tốc độ dòng khí</div>
              <div className="text-xl font-bold text-sky-950">
                {currentBreath.isZeroFlow
                  ? '0 (Dừng chuyển pha)'
                  : currentBreath.isInhaling
                    ? `Đi vào phổi (+${currentBreath.airflowRate})`
                    : `Đi ra ngoài (${currentBreath.airflowRate})`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-[240px] border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <div className="font-bold text-slate-800 text-[15px] mb-2">
                1. Thể tích phổi tương đối (%) theo chu kỳ thở
              </div>
              <ResponsiveContainer width="100%" height="84%">
                <AreaChart data={breathingSeries} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                  <XAxis dataKey="timeSec" unit="s" tick={{ fontSize: 13 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 13 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="lungVolumeRel"
                    name="Thể tích phổi (%)"
                    stroke="#0D9488"
                    fill="#99F6E4"
                    strokeWidth={2.5}
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    x={currentBreath.timeSec}
                    stroke="#0F172A"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[240px] border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <div className="font-bold text-slate-800 text-[15px] mb-2">
                2. Áp suất phế nang tương đối (ΔP) — Mốc 0 là áp suất khí quyển
              </div>
              <ResponsiveContainer width="100%" height="84%">
                <LineChart data={breathingSeries} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                  <XAxis dataKey="timeSec" unit="s" tick={{ fontSize: 13 }} />
                  <YAxis domain={[-2.5, 2.5]} tick={{ fontSize: 13 }} />
                  <Tooltip />
                  <ReferenceLine y={0} stroke="#64748B" strokeWidth={1.5} />
                  <Line
                    type="monotone"
                    dataKey="alveolarPressureRel"
                    name="Áp suất phế nang ΔP"
                    stroke="#EA580C"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    x={currentBreath.timeSec}
                    stroke="#0F172A"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    if (activeSimId === 'alveolar-exchange') {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Microscope className="w-5 h-5 text-teal-600" />
            Chỉ số khuếch tán khí mô phỏng (giá trị tương đối sư phạm)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[15px]">
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
              <div className="text-teal-800 font-semibold">Hiệu quả khuếch tán O₂ (Phế nang → Máu)</div>
              <div className="text-2xl font-bold text-teal-950">{alveolarMetrics.o2DiffusionIndex}/100</div>
            </div>
            <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200">
              <div className="text-orange-800 font-semibold">Hiệu quả thải CO₂ (Máu → Phế nang)</div>
              <div className="text-2xl font-bold text-orange-950">{alveolarMetrics.co2DiffusionIndex}/100</div>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-rose-800 font-semibold">Mức gắn O₂ hồng cầu rời mao mạch</div>
              <div className="text-2xl font-bold text-rose-950">{alveolarMetrics.rbcOxygenationExit}%</div>
            </div>
          </div>
          <p className="text-slate-700 text-[15px]">
            <strong>Nhận xét:</strong> {alveolarMetrics.statusLabel}. O₂ (xanh ngọc) và CO₂ (cam) khuếch tán thụ động theo quy luật chênh lệch áp suất riêng phần.
          </p>
        </div>
      );
    }

    if (activeSimId === 'fish-gills') {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Đồ thị phân áp O₂ dọc theo chiều dài phiến mang ({gillFlowType === 'countercurrent' ? 'Ngược chiều – Cơ chế thực' : 'Cùng chiều – So sánh nguyên lí'})
              </h3>
              <p className="text-slate-700 text-[15px]">{gillSummary.explanationNote}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-teal-50 border border-teal-300 text-teal-950 font-bold text-[16px]">
              Hiệu quả lấy O₂ mô phỏng: {gillSummary.extractionEfficiencyPct}%
            </div>
          </div>

          <div className="h-[250px] border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gillSummary.profile} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis dataKey="positionPct" unit="%" tick={{ fontSize: 13 }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 13 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '15px' }} />
                <Line
                  type="monotone"
                  dataKey="waterO2"
                  name="Phân áp O₂ trong nước (%)"
                  stroke="#0284C7"
                  strokeWidth={3}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="bloodO2"
                  name="Phân áp O₂ trong máu (%)"
                  stroke="#DC2626"
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (activeSimId === 'avian-respiration') {
      const stageInfo = AVIAN_STAGES[avianStageIdx];
      return (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-[16px] text-amber-950 space-y-1">
            <div className="font-bold">Đang hiển thị: {stageInfo.short}</div>
            <p>{stageInfo.detail}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-lg">
              Bảng so sánh trực quan: Hệ hô hấp ở Người và Chim
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px] text-[15px]">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-200 text-slate-800">
                    <th className="p-3 font-bold">Tiêu chí so sánh</th>
                    <th className="p-3 font-bold">Hệ hô hấp ở Người (Thú)</th>
                    <th className="p-3 font-bold">Hệ hô hấp ở Chim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {HUMAN_VS_BIRD_COMPARISON.map((row, i) => (
                    <tr key={i}>
                      <td className="p-3 font-semibold text-slate-900">{row.criterion}</td>
                      <td className="p-3 text-slate-700">{row.human}</td>
                      <td className="p-3 text-teal-900 font-medium bg-teal-50/40">{row.bird}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSimId === 'respiratory-health') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`rounded-xl border p-5 space-y-2.5 ${activeHealthInfo.badgeClass}`}>
            <div className="font-bold text-lg flex items-center gap-2">
              <HeartPulse className="w-5 h-5" />
              Tình huống {activeHealthInfo.code}: {activeHealthInfo.label}
            </div>
            <div className="text-[15px]">
              <strong>Đường dẫn khí:</strong> {activeHealthInfo.airwayStatus}
            </div>
            <div className="text-[15px]">
              <strong>Hoạt động lông chuyển:</strong> {activeHealthInfo.ciliaStatus}
            </div>
            <div className="text-[15px]">
              <strong>Cơ chế bảo vệ:</strong> {activeHealthInfo.clearanceNote}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              5 biện pháp bảo vệ sức khỏe hệ hô hấp
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-[15px]">
              {PROTECTION_HABITS.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    return null;
  }, [
    activeSimId,
    breathingSeries,
    currentBreath,
    bpm,
    alveolarMetrics,
    gillFlowType,
    gillSummary,
    avianStageIdx,
    activeHealthInfo,
  ]);

  return (
    <div className="space-y-5">
      {/* Top Banner + 8-Simulation Ribbon */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-teal-700 font-bold text-[15px]">
              <Wind className="w-5 h-5" />
              Sinh học 11 · Bài 9: Hô hấp ở động vật (Hệ thống 8 mô phỏng 3D tương tác)
            </div>
            {!embeddedInLesson && (
              <h1 className="font-extrabold text-slate-900 text-2xl mt-0.5">
                Phòng thực hành 3D Hô hấp ở Động vật
              </h1>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSectionView('lab')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold border min-h-[44px] text-[15px] ${
                sectionView === 'lab'
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FlaskConical className="w-4 h-4" /> 8 Mô phỏng 3D
            </button>
            <button
              type="button"
              onClick={() => setSectionView('compare')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold border min-h-[44px] text-[15px] ${
                sectionView === 'compare'
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" /> So sánh & Ghép loài
            </button>
            <button
              type="button"
              onClick={() => setSectionView('practice-all')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold border min-h-[44px] text-[15px] ${
                sectionView === 'practice-all'
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ListChecks className="w-4 h-4" /> Luyện tập (48 câu)
            </button>
          </div>
        </div>

        {/* 8 Simulation Selector Buttons */}
        {sectionView === 'lab' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {RESPIRATION_SIMULATIONS.map((sim) => {
              const active = sim.id === activeSimId;
              return (
                <button
                  key={sim.id}
                  type="button"
                  onClick={() => handleSelectSim(sim.id)}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-all min-h-[48px] flex items-center gap-2.5 text-[15px] ${
                    active
                      ? 'bg-teal-600 text-white border-teal-700 shadow-sm font-bold'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-teal-50/70 hover:border-teal-300 font-semibold'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 text-[15px] ${
                      active ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-900'
                    }`}
                  >
                    {sim.number}
                  </span>
                  <span className="leading-snug">{sim.shortTitle}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section Content */}
      {sectionView === 'lab' && (
        <div className="space-y-5">
          <LabWorkspaceLayout
            title={activeSim.title}
            subtitle={activeSim.subtitle}
            viewerRef={viewer.viewerRef}
            stageContent={
              <ModelViewer3D
                ref={viewer.viewerRef}
                modelKey={modelKey}
                buildModel={buildModel}
                onAnimateFrame={handleAnimateFrame}
                parts={activeParts}
                selectedPartId={viewer.selectedPartId}
                onSelectPart={viewer.setSelectedPartId}
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
                quality={viewer.quality}
                fallbackTitle={activeSim.title}
                fallbackItems={activeParts.map((p) => `${p.vietnameseName}: ${p.function}`)}
              />
            }
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
            supportsSimulation
            isPlaying={viewer.isPlaying}
            onTogglePlay={() => viewer.setIsPlaying((v) => !v)}
            onStepForward={handleStepForward}
            onResetSim={handleResetSim}
            speed={viewer.speed}
            onChangeSpeed={viewer.setSpeed}
            quality={viewer.quality}
            onChangeQuality={viewer.setQuality}
            simulationControlsExtra={simulationControlsExtra}
            knowledgeContent={knowledgeContent}
            practiceContent={
              <RespirationQuizBank
                simId={activeSimId}
                compact
                onFocusPart={(partId) => {
                  viewer.setSelectedPartId(partId);
                  viewer.viewerRef.current?.focusPart(partId);
                }}
              />
            }
            teacherGuideNote={activeSim.teacherGuideNote}
            sourceMeta={activeSim.sourceMeta}
          />

          {/* Synchronized live graphs / indicators / comparison tables below 3D stage */}
          {belowStagePanel}

          {/* Scientific Distinction Reminder Banner (External Gas Exchange vs Cellular Respiration) */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3 text-[15px] text-sky-950">
            <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <strong>Phân biệt khoa học quan trọng:</strong> <em>Trao đổi khí (hô hấp ngoài)</em> ở bề mặt cơ thể, ống khí, mang hoặc phổi là quá trình lấy O₂ từ môi trường vào cơ thể và thải CO₂ ra ngoài theo chênh lệch phân áp. <em>Hô hấp tế bào</em> diễn ra bên trong tế bào (chủ yếu ở ti thể) nhằm phân giải chất hữu cơ tạo năng lượng ATP cung cấp cho các hoạt động sống.
            </div>
          </div>
        </div>
      )}

      {sectionView === 'compare' && (
        <GasExchangeComparisonPanel onOpenSim={handleSelectSim} />
      )}

      {sectionView === 'practice-all' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Ngân hàng 48 câu hỏi tương tác Bài 9 – Hô hấp ở động vật
            </div>
            <button
              type="button"
              onClick={() => setSectionView('lab')}
              className="px-4 py-2 rounded-lg border border-teal-300 bg-teal-50 text-teal-900 font-semibold hover:bg-teal-100 min-h-[44px] text-[15px]"
            >
              Quay lại mô hình 3D
            </button>
          </div>
          <RespirationQuizBank simId="all" />
        </div>
      )}
    </div>
  );
};
