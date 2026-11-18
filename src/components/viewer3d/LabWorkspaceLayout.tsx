import React, { useState } from 'react';
import {
  Camera,
  Eye,
  EyeOff,
  Focus,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Scissors,
  SlidersHorizontal,
  StepForward,
  Tag,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';
import { CameraPreset, ModelViewer3DHandle } from './ModelViewer3D';

export type LabControlTab = 'observe' | 'parts' | 'simulate' | 'knowledge' | 'practice';

interface LabWorkspaceLayoutProps {
  title: string;
  subtitle: string;
  viewerRef: React.RefObject<ModelViewer3DHandle | null>;
  stageContent: React.ReactNode;
  parts: ModelPartInfo[];
  selectedPartId: string | null;
  onSelectPart: (id: string | null) => void;
  hiddenPartIds: string[];
  onToggleHidePart: (id: string) => void;
  isolatedPartId: string | null;
  onToggleIsolatePart: (id: string | null) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  opacityLevel: number;
  onChangeOpacity: (v: number) => void;
  clipY: number;
  onChangeClipY: (v: number) => void;
  clipX: number;
  onChangeClipX: (v: number) => void;
  explodeFactor: number;
  onChangeExplode: (v: number) => void;
  supportsSimulation?: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onStepForward?: () => void;
  onResetSim?: () => void;
  speed?: number;
  onChangeSpeed?: (s: number) => void;
  quality: QualityLevel;
  onChangeQuality: (q: QualityLevel) => void;
  simulationControlsExtra?: React.ReactNode;
  knowledgeContent: React.ReactNode;
  practiceContent: React.ReactNode;
  teacherGuideNote?: string;
  sourceMeta?: ScientificSourceMeta;
  isPresentation?: boolean;
  onTogglePresentation?: () => void;
}

export const LabWorkspaceLayout: React.FC<LabWorkspaceLayoutProps> = ({
  title,
  subtitle,
  viewerRef,
  stageContent,
  parts,
  selectedPartId,
  onSelectPart,
  hiddenPartIds,
  onToggleHidePart,
  isolatedPartId,
  onToggleIsolatePart,
  autoRotate,
  onToggleAutoRotate,
  showLabels,
  onToggleLabels,
  opacityLevel,
  onChangeOpacity,
  clipY,
  onChangeClipY,
  clipX,
  onChangeClipX,
  explodeFactor,
  onChangeExplode,
  supportsSimulation = true,
  isPlaying = true,
  onTogglePlay,
  onStepForward,
  onResetSim,
  speed = 1,
  onChangeSpeed,
  quality,
  onChangeQuality,
  simulationControlsExtra,
  knowledgeContent,
  practiceContent,
  teacherGuideNote,
  sourceMeta,
  isPresentation = false,
  onTogglePresentation,
}) => {
  const [activeTab, setActiveTab] = useState<LabControlTab>('observe');
  const [showControls, setShowControls] = useState(true);
  const [showTeacherNote, setShowTeacherNote] = useState(true);

  const selectedPart = parts.find((p) => p.id === selectedPartId) ?? null;

  const tabs: { id: LabControlTab; label: string }[] = [
    { id: 'observe', label: 'Quan sát' },
    { id: 'parts', label: 'Thành phần' },
    ...(supportsSimulation ? [{ id: 'simulate' as LabControlTab, label: 'Mô phỏng' }] : []),
    { id: 'knowledge', label: 'Kiến thức' },
    { id: 'practice', label: 'Thực hành' },
  ];

  const handlePreset = (p: CameraPreset) => {
    viewerRef.current?.setCameraPreset(p);
  };

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="font-bold text-slate-900 text-ui-lab">{title}</h2>
          <p className="text-slate-600 text-ui-body">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {teacherGuideNote && (
            <button
              type="button"
              onClick={() => setShowTeacherNote((v) => !v)}
              className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 text-ui-min font-medium"
            >
              {showTeacherNote ? 'Ẩn lời dẫn GV' : 'Hiện lời dẫn GV'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 inline-flex items-center gap-2 text-ui-min font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showControls ? 'Ẩn bảng điều khiển' : 'Hiện bảng điều khiển'}
          </button>
          {onTogglePresentation && (
            <button
              type="button"
              onClick={onTogglePresentation}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2 text-ui-min font-semibold"
            >
              {isPresentation ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isPresentation ? 'Thoát trình chiếu' : 'Trình chiếu lớp học'}
            </button>
          )}
        </div>
      </div>

      {teacherGuideNote && showTeacherNote && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-slate-800 text-ui-body">
          <span className="font-bold text-teal-900">Lời dẫn giáo viên: </span>
          {teacherGuideNote}
        </div>
      )}

      {/* Desktop 68% Stage / 32% Controls; Mobile stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className={showControls ? 'lg:col-span-8 space-y-3' : 'lg:col-span-12 space-y-3'}>
          <div className="h-[460px] md:h-[580px] lg:h-[640px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            {stageContent}
          </div>

          {/* Selected Component Quick Inspector */}
          {selectedPart && (
            <div className="rounded-xl border border-teal-300 bg-white p-4 space-y-2 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-teal-900 text-ui-card-title">
                    {selectedPart.vietnameseName}{' '}
                    <span className="font-normal text-slate-600">({selectedPart.scientificName})</span>
                  </h3>
                  <p className="text-slate-600 text-ui-min">Vị trí: {selectedPart.location}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => viewerRef.current?.focusPart(selectedPart.id)}
                    className="min-h-[44px] px-3 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 inline-flex items-center gap-1.5 text-ui-min font-medium"
                  >
                    <Focus className="w-4 h-4" />
                    Phóng to riêng
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onToggleIsolatePart(isolatedPartId === selectedPart.id ? null : selectedPart.id)
                    }
                    className={`min-h-[44px] px-3 py-2 rounded-lg border inline-flex items-center gap-1.5 text-ui-min font-medium ${
                      isolatedPartId === selectedPart.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isolatedPartId === selectedPart.id ? 'Bỏ cô lập' : 'Cô lập đối tượng'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-ui-body">
                <div>
                  <span className="font-semibold text-slate-900">Cấu tạo: </span>
                  <span className="text-slate-700">{selectedPart.structure}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Chức năng: </span>
                  <span className="text-slate-700">{selectedPart.function}</span>
                </div>
              </div>
              {selectedPart.relatedLessons.length > 0 && (
                <p className="text-slate-600 text-ui-min">
                  Bài học liên quan: {selectedPart.relatedLessons.join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* Source & Scientific Attribution */}
          {sourceMeta && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 text-ui-min space-y-1">
              <div className="font-semibold text-slate-900">
                Thông tin nguồn khoa học: {sourceMeta.name} ({sourceMeta.dataType})
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                <span>Nguồn: {sourceMeta.source}</span>
                <span aria-hidden="true">·</span>
                <span>Mã: {sourceMeta.identifier}</span>
                <span aria-hidden="true">·</span>
                <span>Giấy phép: {sourceMeta.license}</span>
                <span aria-hidden="true">·</span>
                <span>Trạng thái: {sourceMeta.verifiedStatus}</span>
              </div>
              {sourceMeta.scaleNote && <div className="text-amber-800">{sourceMeta.scaleNote}</div>}
            </div>
          )}
        </div>

        {/* 5-Tab Control Deck */}
        {showControls && (
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3" role="tablist">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-lg font-semibold transition-colors text-ui-min ${
                      active
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: QUAN SÁT */}
            {activeTab === 'observe' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 text-ui-label">Góc nhìn nhanh</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreset('front')}
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-800 font-medium text-ui-min"
                    >
                      Mặt trước
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreset('back')}
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-800 font-medium text-ui-min"
                    >
                      Mặt sau
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreset('left')}
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-800 font-medium text-ui-min"
                    >
                      Bên trái
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreset('right')}
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-800 font-medium text-ui-min"
                    >
                      Bên phải
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreset('top')}
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-800 font-medium text-ui-min"
                    >
                      Nhìn từ trên
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreset('bottom')}
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-800 font-medium text-ui-min"
                    >
                      Nhìn từ dưới
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreset('initial')}
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-ui-min"
                    >
                      Góc ban đầu
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreset('fit')}
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-ui-min"
                    >
                      Căn vừa khung
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => viewerRef.current?.zoomBy(0.8)}
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 text-slate-800 font-medium text-ui-min"
                  >
                    <ZoomIn className="w-4 h-4" />
                    Phóng to
                  </button>
                  <button
                    type="button"
                    onClick={() => viewerRef.current?.zoomBy(1.25)}
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 text-slate-800 font-medium text-ui-min"
                  >
                    <ZoomOut className="w-4 h-4" />
                    Thu nhỏ
                  </button>
                  <button
                    type="button"
                    onClick={onToggleAutoRotate}
                    className={`min-h-[44px] px-3 py-2 rounded-lg border inline-flex items-center justify-center gap-1.5 font-medium text-ui-min ${
                      autoRotate
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCw className="w-4 h-4" />
                    {autoRotate ? 'Dừng tự xoay' : 'Tự xoay'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleLabels}
                    className={`min-h-[44px] px-3 py-2 rounded-lg border inline-flex items-center justify-center gap-1.5 font-medium text-ui-min ${
                      showLabels
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    {showLabels ? 'Ẩn chú thích' : 'Hiện chú thích'}
                  </button>
                </div>

                {/* Sectioning & Transparency */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="block space-y-1">
                    <div className="flex justify-between text-slate-800 font-medium text-ui-min">
                      <span>Độ trong suốt (Xuyên thấu)</span>
                      <span className="font-mono-tabular">{Math.round(opacityLevel * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={1}
                      step={0.05}
                      value={opacityLevel}
                      onChange={(e) => onChangeOpacity(Number(e.target.value))}
                      className="w-full accent-teal-700 h-2 cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between text-slate-800 font-medium text-ui-min">
                      <span className="inline-flex items-center gap-1">
                        <Scissors className="w-4 h-4 text-teal-700" /> Cắt lát ngang
                      </span>
                      <span className="font-mono-tabular">{Math.round(((clipY + 1) / 2) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={-0.8}
                      max={1.1}
                      step={0.05}
                      value={clipY}
                      onChange={(e) => onChangeClipY(Number(e.target.value))}
                      className="w-full accent-teal-700 h-2 cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between text-slate-800 font-medium text-ui-min">
                      <span className="inline-flex items-center gap-1">
                        <Scissors className="w-4 h-4 text-blue-600" /> Cắt lát dọc
                      </span>
                      <span className="font-mono-tabular">{Math.round(((clipX + 1) / 2) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={-0.8}
                      max={1.1}
                      step={0.05}
                      value={clipX}
                      onChange={(e) => onChangeClipX(Number(e.target.value))}
                      className="w-full accent-blue-600 h-2 cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between text-slate-800 font-medium text-ui-min">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-4 h-4 text-emerald-700" /> Tách lớp cấu trúc
                      </span>
                      <span className="font-mono-tabular">{Math.round(explodeFactor * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={explodeFactor}
                      onChange={(e) => onChangeExplode(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-2 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Quality & PNG export */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800 text-ui-min">Chất lượng đồ họa:</span>
                    <select
                      value={quality}
                      onChange={(e) => onChangeQuality(e.target.value as QualityLevel)}
                      className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-min"
                    >
                      <option value="low">Tiết kiệm</option>
                      <option value="standard">Tiêu chuẩn</option>
                      <option value="high">Chất lượng cao</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => viewerRef.current?.exportPng(`${title.toLowerCase().replace(/\s+/g, '-')}.png`)}
                    className="w-full min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold inline-flex items-center justify-center gap-2 text-ui-min"
                  >
                    <Camera className="w-4 h-4 text-teal-700" />
                    Xuất hình ảnh PNG
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: THÀNH PHẦN */}
            {activeTab === 'parts' && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {isolatedPartId && (
                  <button
                    type="button"
                    onClick={() => onToggleIsolatePart(null)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-ui-min"
                  >
                    Đang cô lập một bộ phận · Nhấn để hiện lại toàn bộ
                  </button>
                )}
                {parts.map((part) => {
                  const isHidden = hiddenPartIds.includes(part.id);
                  const isSelected = selectedPartId === part.id;
                  return (
                    <div
                      key={part.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectPart(part.id)}
                          className="flex-1 text-left flex items-center gap-2.5 min-h-[44px]"
                        >
                          <span
                            className="w-4 h-4 rounded-sm shrink-0 border border-slate-300"
                            style={{ backgroundColor: part.colorHex }}
                          />
                          <div>
                            <div className="font-semibold text-slate-900 text-ui-min">
                              {part.vietnameseName}
                            </div>
                            <div className="text-slate-500 text-ui-min">{part.scientificName}</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleHidePart(part.id)}
                          title={isHidden ? 'Hiện thành phần' : 'Ẩn thành phần'}
                          className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 inline-flex items-center justify-center"
                        >
                          {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: MÔ PHỎNG */}
            {activeTab === 'simulate' && supportsSimulation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onTogglePlay}
                    className={`min-h-[44px] px-3 py-2 rounded-lg font-semibold inline-flex items-center justify-center gap-2 text-ui-min ${
                      isPlaying
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-teal-700 text-white hover:bg-teal-800'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? 'Tạm dừng' : 'Bắt đầu'}
                  </button>
                  <button
                    type="button"
                    onClick={onStepForward}
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium inline-flex items-center justify-center gap-1.5 text-ui-min"
                  >
                    <StepForward className="w-4 h-4" />
                    Từng bước
                  </button>
                  <button
                    type="button"
                    onClick={onResetSim}
                    className="col-span-2 min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium inline-flex items-center justify-center gap-1.5 text-ui-min"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Làm lại từ đầu
                  </button>
                </div>

                {onChangeSpeed && (
                  <div className="space-y-2">
                    <span className="font-medium text-slate-800 text-ui-min">Tốc độ mô phỏng:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[0.25, 0.5, 1, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => onChangeSpeed(s)}
                          className={`min-h-[44px] px-3 py-1.5 rounded-lg font-mono-tabular font-semibold text-ui-min ${
                            speed === s
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {simulationControlsExtra && (
                  <div className="pt-3 border-t border-slate-200 space-y-3">{simulationControlsExtra}</div>
                )}
              </div>
            )}

            {/* TAB 4: KIẾN THỨC */}
            {activeTab === 'knowledge' && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 text-ui-body">
                {knowledgeContent}
              </div>
            )}

            {/* TAB 5: THỰC HÀNH */}
            {activeTab === 'practice' && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 text-ui-body">
                {practiceContent}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
