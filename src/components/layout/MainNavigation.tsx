import React, { useState } from 'react';
import { Dna, Menu, MonitorPlay, Type, X } from 'lucide-react';
import { AppPage, FontScaleMode } from '../../types/biology';
import { OfflineIndicator } from '../offline/OfflineIndicator';
import { PWAInstallButton } from '../offline/PWAInstallButton';

interface MainNavigationProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  fontScale: FontScaleMode;
  onChangeFontScale: (mode: FontScaleMode) => void;
  isPresentation: boolean;
  onTogglePresentation: () => void;
}

const NAV_ITEMS: { id: AppPage; label: string }[] = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'grade10', label: 'Sinh học 10' },
  { id: 'grade11', label: 'Sinh học 11' },
  { id: 'grade12', label: 'Sinh học 12' },
  { id: 'labs', label: 'Phòng Lab 3D' },
  { id: 'models', label: 'Thư viện mô hình' },
  { id: 'formulas', label: 'Công thức và sơ đồ' },
  { id: 'guide', label: 'Hướng dẫn' },
];

export const MainNavigation: React.FC<MainNavigationProps> = ({
  currentPage,
  onNavigate,
  fontScale,
  onChangeFontScale,
  isPresentation,
  onTogglePresentation,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-[1440px] mx-auto px-4 py-3 space-y-2.5">
        {/* Top Row: Brand + Quick Accessibility & PWA Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left min-h-[44px]"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-slate-900 leading-tight text-ui-lab">
                SINH HỌC SMART 3D
              </div>
              <div className="text-slate-600 text-ui-min leading-tight">
                Khám phá sự sống – Trải nghiệm khoa học
              </div>
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <OfflineIndicator />

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50">
              <Type className="w-4 h-4 text-slate-700" />
              <select
                aria-label="Chọn kích thước chữ giao diện"
                value={fontScale}
                onChange={(e) => onChangeFontScale(e.target.value as FontScaleMode)}
                className="min-h-[38px] bg-transparent text-slate-900 font-medium text-ui-min focus:outline-none"
              >
                <option value="standard">Cỡ chữ: Tiêu chuẩn</option>
                <option value="large">Cỡ chữ: Chữ lớn</option>
                <option value="presentation">Cỡ chữ: Trình chiếu</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onTogglePresentation}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold inline-flex items-center gap-1.5 text-ui-min transition-colors ${
                isPresentation
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <MonitorPlay className="w-4 h-4" />
              {isPresentation ? 'Thoát trình chiếu' : 'Trình chiếu'}
            </button>

            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Mở trình đơn điều hướng"
              className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-lg border border-slate-300 bg-white text-slate-800 inline-flex items-center justify-center"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          className={`${mobileOpen ? 'flex' : 'hidden'} lg:flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100`}
          aria-label="Điều hướng chính"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              currentPage === item.id ||
              (item.id === 'formulas' && currentPage === 'diagrams');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-label transition-colors ${
                  active
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              onNavigate('offline');
              setMobileOpen(false);
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-label transition-colors ${
              currentPage === 'offline'
                ? 'bg-teal-700 text-white'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Dữ liệu ngoại tuyến
          </button>
        </nav>
      </div>
    </header>
  );
};
