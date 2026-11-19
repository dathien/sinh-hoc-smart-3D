import React from 'react';
import { RotateCcw, Tag } from 'lucide-react';
import { AnnotationMode, useSmartLabels } from '../../../context/SmartLabelContext';

const MODE_OPTIONS: { id: AnnotationMode; label: string; desc: string }[] = [
  {
    id: 'smart',
    label: 'Chú thích thông minh',
    desc: 'Tự xếp hai bên ngoài mô hình kèm đường dẫn rõ nét',
  },
  {
    id: 'numbered',
    label: 'Đánh số và chú giải',
    desc: 'Gắn số thứ tự gọn trên mô hình và bảng chú giải bên dưới',
  },
  {
    id: 'selected-only',
    label: 'Chỉ hiện bộ phận đang chọn',
    desc: 'Tập trung làm nổi bật đúng một bộ phận đang giảng dạy',
  },
  {
    id: 'hidden',
    label: 'Ẩn toàn bộ chú thích',
    desc: 'Mở rộng tối đa vùng quan sát mô hình 3D',
  },
];

export const AnnotationSettingsPanel: React.FC = () => {
  const {
    settings,
    effectiveFontSize,
    isPresentation,
    setMode,
    setFontSize,
    setShowLeaderLines,
    resetDefaults,
  } = useSmartLabels();

  return (
    <div className="pt-3 border-t border-slate-200 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900 text-ui-label inline-flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-teal-700" />
          Hiển thị chú thích
        </h3>
        <button
          type="button"
          onClick={resetDefaults}
          className="min-h-[38px] px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1 text-ui-min"
          title="Khôi phục cài đặt chú thích mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Mặc định
        </button>
      </div>

      {/* 4 Annotation Modes */}
      <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Chế độ hiển thị chú thích 3D">
        {MODE_OPTIONS.map((opt) => {
          const active = settings.mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(opt.id)}
              className={`min-h-[44px] px-3 py-2 rounded-lg border text-left transition-colors ${
                active
                  ? 'bg-teal-700 text-white border-teal-700 font-semibold shadow-xs'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-teal-50/70 hover:border-teal-300 font-medium'
              }`}
            >
              <div className="text-ui-min leading-snug">{opt.label}</div>
            </button>
          );
        })}
      </div>

      {/* Font Size Slider (15 - 30px) */}
      <label className="block space-y-1 pt-1">
        <div className="flex justify-between items-center text-slate-800 font-medium text-ui-min">
          <span>Cỡ chữ chú thích</span>
          <span className="font-mono-tabular font-semibold text-teal-800">
            {effectiveFontSize}px{isPresentation && settings.fontSize < 20 ? ' (Trình chiếu)' : ''}
          </span>
        </div>
        <input
          type="range"
          min={15}
          max={30}
          step={1}
          value={settings.fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full accent-teal-700 h-2 cursor-pointer"
        />
      </label>

      {/* Leader Lines Toggle */}
      <label className="flex items-center justify-between gap-2 min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
        <span className="font-medium text-slate-800 text-ui-min">Hiện đường dẫn nối tới bộ phận</span>
        <input
          type="checkbox"
          checked={settings.showLeaderLines}
          onChange={(e) => setShowLeaderLines(e.target.checked)}
          className="w-5 h-5 accent-teal-700 cursor-pointer"
        />
      </label>
    </div>
  );
};
