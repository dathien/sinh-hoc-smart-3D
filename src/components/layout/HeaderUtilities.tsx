import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Menu, MonitorPlay, Type, X } from 'lucide-react';
import { FontScaleMode } from '../../types/biology';
import { OfflineIndicator } from '../offline/OfflineIndicator';
import { PWAInstallButton } from '../offline/PWAInstallButton';

interface HeaderUtilitiesProps {
  fontScale: FontScaleMode;
  onChangeFontScale: (mode: FontScaleMode) => void;
  isPresentation: boolean;
  onTogglePresentation: () => void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

const FONT_SCALE_OPTIONS: { id: FontScaleMode; label: string; desc: string }[] = [
  { id: 'standard', label: 'Tiêu chuẩn', desc: 'Mặc định cân đối' },
  { id: 'large', label: 'Chữ lớn', desc: 'Dễ đọc hơn (+15%)' },
  { id: 'presentation', label: 'Trình chiếu', desc: 'Cỡ lớn cho tivi & máy chiếu' },
];

export const HeaderUtilities: React.FC<HeaderUtilitiesProps> = ({
  fontScale,
  onChangeFontScale,
  isPresentation,
  onTogglePresentation,
  mobileOpen,
  onToggleMobile,
}) => {
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const fontMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!fontMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setFontMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFontMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [fontMenuOpen]);

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Desktop & Tablet utilities */}
      <div className="hidden md:flex items-center gap-2">
        <OfflineIndicator />

        {/* Compact "Cỡ chữ" dropdown */}
        <div ref={fontMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFontMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={fontMenuOpen}
            aria-label="Chọn cỡ chữ giao diện"
            className="min-h-[42px] md:min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold inline-flex items-center gap-1.5 text-ui-min transition-colors cursor-pointer"
          >
            <Type className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
            <span>Cỡ chữ</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${fontMenuOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {fontMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-40"
            >
              {FONT_SCALE_OPTIONS.map((opt) => {
                const selected = fontScale === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      onChangeFontScale(opt.id);
                      setFontMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2 text-left flex items-center justify-between gap-2 text-ui-min transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 text-teal-900 font-semibold'
                        : 'text-slate-800 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Presentation Mode button */}
        <button
          type="button"
          onClick={onTogglePresentation}
          className={`min-h-[42px] md:min-h-[44px] px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 text-ui-min transition-colors cursor-pointer shrink-0 ${
            isPresentation
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
          }`}
        >
          <MonitorPlay className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{isPresentation ? 'Thoát trình chiếu' : 'Trình chiếu'}</span>
        </button>

        {/* PWA Install button (visible on all desktop >= 1024px; also in MobileNavigation < 1024px) */}
        <div className="hidden lg:block">
          <PWAInstallButton />
        </div>
      </div>

      {/* Mobile/Tablet Hamburger Toggle (< 1024px) */}
      <button
        type="button"
        onClick={onToggleMobile}
        aria-label={mobileOpen ? 'Đóng trình đơn điều hướng' : 'Mở trình đơn điều hướng'}
        aria-expanded={mobileOpen}
        className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 inline-flex items-center justify-center cursor-pointer"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </div>
  );
};
