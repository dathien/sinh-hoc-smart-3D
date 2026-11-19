import React, { useState } from 'react';
import { Dna, Minimize2 } from 'lucide-react';
import { AppPage, FontScaleMode } from '../../types/biology';
import { BrandSection } from './BrandSection';
import { HeaderUtilities } from './HeaderUtilities';
import { MainNavigation } from './MainNavigation';
import { MobileNavigation } from './MobileNavigation';

interface AppHeaderProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  fontScale: FontScaleMode;
  onChangeFontScale: (mode: FontScaleMode) => void;
  isPresentation: boolean;
  onTogglePresentation: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPage,
  onNavigate,
  fontScale,
  onChangeFontScale,
  isPresentation,
  onTogglePresentation,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Slim Presentation Top Bar maximizes 3D viewport height when teaching on a projector/TV
  if (isPresentation) {
    return (
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-700 shadow-xs no-print">
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2.5 min-h-[40px] text-left cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-teal-600 text-white inline-flex items-center justify-center shrink-0">
              <Dna className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="font-bold tracking-tight text-ui-label">
              SINH HỌC SMART 3D · Chế độ Trình chiếu lớp học
            </span>
          </button>

          <button
            type="button"
            onClick={onTogglePresentation}
            className="min-h-[42px] px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-2 text-ui-min transition-colors cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            Thoát trình chiếu (ESC)
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 bg-white/98 backdrop-blur-xs border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-[1440px] mx-auto px-4 py-2 space-y-1.5">
        {/* ROW 1: Brand (left) + Utilities (right) */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <BrandSection
            onClickHome={() => {
              onNavigate('home');
              setMobileOpen(false);
            }}
          />

          <HeaderUtilities
            fontScale={fontScale}
            onChangeFontScale={onChangeFontScale}
            isPresentation={isPresentation}
            onTogglePresentation={onTogglePresentation}
            mobileOpen={mobileOpen}
            onToggleMobile={() => setMobileOpen((v) => !v)}
          />
        </div>

        {/* ROW 2: Desktop Single-Row 8-Item Main Navigation (>= 1024px) */}
        <MainNavigation
          currentPage={currentPage}
          onNavigate={onNavigate}
          fontScale={fontScale}
        />
      </div>

      {/* Inline Collapsible Mobile/Tablet Navigation (< 1024px) */}
      <MobileNavigation
        open={mobileOpen}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onClose={() => setMobileOpen(false)}
        fontScale={fontScale}
        onChangeFontScale={onChangeFontScale}
        isPresentation={isPresentation}
        onTogglePresentation={onTogglePresentation}
      />
    </header>
  );
};
