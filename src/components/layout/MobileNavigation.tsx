import React, { useState } from 'react';
import { ChevronDown, Database, MonitorPlay, Sigma, Type } from 'lucide-react';
import { AppPage, FontScaleMode } from '../../types/biology';
import { OfflineIndicator } from '../offline/OfflineIndicator';
import { PWAInstallButton } from '../offline/PWAInstallButton';

interface MobileNavigationProps {
  open: boolean;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onClose: () => void;
  fontScale: FontScaleMode;
  onChangeFontScale: (mode: FontScaleMode) => void;
  isPresentation: boolean;
  onTogglePresentation: () => void;
}

const PRIMARY_ITEMS: { id: AppPage; label: string }[] = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'grade10', label: 'Sinh học 10' },
  { id: 'grade11', label: 'Sinh học 11' },
  { id: 'grade12', label: 'Sinh học 12' },
  { id: 'labs', label: 'Phòng Lab 3D' },
  { id: 'models', label: 'Thư viện mô hình' },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  open,
  currentPage,
  onNavigate,
  onClose,
  fontScale,
  onChangeFontScale,
  isPresentation,
  onTogglePresentation,
}) => {
  const [toolsExpanded, setToolsExpanded] = useState(
    currentPage === 'formulas' || currentPage === 'diagrams' || currentPage === 'offline',
  );

  if (!open) return null;

  const isToolsActive =
    currentPage === 'formulas' || currentPage === 'diagrams' || currentPage === 'offline';

  const handleGo = (page: AppPage) => {
    onNavigate(page);
    onClose();
  };

  return (
    <nav
      aria-label="Điều hướng di động"
      className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2.5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {PRIMARY_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleGo(item.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-left font-semibold text-ui-label transition-colors cursor-pointer ${
                active
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}

        {/* Collapsible Công cụ group */}
        <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/70 overflow-hidden">
          <button
            type="button"
            onClick={() => setToolsExpanded((v) => !v)}
            aria-expanded={toolsExpanded}
            className={`w-full min-h-[44px] px-3.5 py-2 flex items-center justify-between font-semibold text-ui-label transition-colors cursor-pointer ${
              isToolsActive ? 'bg-teal-700 text-white' : 'text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span>Công cụ</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-150 ${toolsExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {toolsExpanded && (
            <div className="p-1.5 space-y-1 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleGo('formulas')}
                className={`w-full min-h-[44px] px-3 py-2 rounded-lg text-left flex items-center gap-2.5 font-medium text-ui-min transition-colors cursor-pointer ${
                  currentPage === 'formulas' || currentPage === 'diagrams'
                    ? 'bg-teal-50 text-teal-900 font-semibold'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Sigma className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Công thức và sơ đồ</span>
              </button>
              <button
                type="button"
                onClick={() => handleGo('offline')}
                className={`w-full min-h-[44px] px-3 py-2 rounded-lg text-left flex items-center gap-2.5 font-medium text-ui-min transition-colors cursor-pointer ${
                  currentPage === 'offline'
                    ? 'bg-teal-50 text-teal-900 font-semibold'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Database className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Dữ liệu ngoại tuyến</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleGo('guide')}
          className={`sm:col-span-2 min-h-[44px] px-3.5 py-2 rounded-lg text-left font-semibold text-ui-label transition-colors cursor-pointer ${
            currentPage === 'guide'
              ? 'bg-teal-700 text-white'
              : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
          }`}
        >
          Hướng dẫn
        </button>
      </div>

      {/* Inline Mobile Utilities (for < 768px where Row 1 stays clean and uncluttered) */}
      <div className="pt-2.5 border-t border-slate-200 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2 md:hidden">
          <OfflineIndicator />
          <button
            type="button"
            onClick={() => {
              onTogglePresentation();
              onClose();
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold inline-flex items-center gap-1.5 text-ui-min ${
              isPresentation
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white text-slate-800'
            }`}
          >
            <MonitorPlay className="w-4 h-4" />
            {isPresentation ? 'Thoát trình chiếu' : 'Trình chiếu'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:hidden">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 text-ui-min">
            <Type className="w-4 h-4 text-teal-700" />
            Cỡ chữ:
          </span>
          {(
            [
              { id: 'standard', label: 'Tiêu chuẩn' },
              { id: 'large', label: 'Chữ lớn' },
              { id: 'presentation', label: 'Trình chiếu' },
            ] as { id: FontScaleMode; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeFontScale(opt.id)}
              className={`min-h-[44px] px-3 py-1.5 rounded-lg border font-medium text-ui-min ${
                fontScale === opt.id
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-slate-800 border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PWAInstallButton />
        </div>
      </div>
    </nav>
  );
};
