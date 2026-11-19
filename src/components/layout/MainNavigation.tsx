import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, Database, MoreHorizontal, Sigma } from 'lucide-react';
import { AppPage, FontScaleMode } from '../../types/biology';
import { ToolsDropdown } from './ToolsDropdown';

interface MainNavigationProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  fontScale: FontScaleMode;
}

type NavEntry =
  | { kind: 'page'; id: AppPage; label: string }
  | { kind: 'tools'; id: 'tools'; label: string };

const DESKTOP_NAV_ENTRIES: NavEntry[] = [
  { kind: 'page', id: 'home', label: 'Trang chủ' },
  { kind: 'page', id: 'grade10', label: 'Sinh học 10' },
  { kind: 'page', id: 'grade11', label: 'Sinh học 11' },
  { kind: 'page', id: 'grade12', label: 'Sinh học 12' },
  { kind: 'page', id: 'labs', label: 'Phòng Lab 3D' },
  { kind: 'page', id: 'models', label: 'Thư viện mô hình' },
  { kind: 'tools', id: 'tools', label: 'Công cụ' },
  { kind: 'page', id: 'guide', label: 'Hướng dẫn' },
];

export const MainNavigation: React.FC<MainNavigationProps> = ({
  currentPage,
  onNavigate,
  fontScale,
}) => {
  const navRef = useRef<HTMLElement | null>(null);
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [compact, setCompact] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(DESKTOP_NAV_ENTRIES.length);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const recomputeFit = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return;
    const availWidth = navEl.clientWidth;
    if (availWidth <= 0) return;

    const naturalWidths = DESKTOP_NAV_ENTRIES.map((_, idx) => {
      const el = measureRefs.current[idx];
      return el ? Math.ceil(el.getBoundingClientRect().width) : 110;
    });

    // Pass 1: Standard padding (px-3.5 = +28px, gap-1.5 = 6px)
    const stdItemPad = 28;
    const stdGap = 6;
    const totalStd =
      naturalWidths.reduce((s, w) => s + w + stdItemPad, 0) +
      Math.max(0, naturalWidths.length - 1) * stdGap;

    if (totalStd <= availWidth) {
      setCompact(false);
      setVisibleCount(DESKTOP_NAV_ENTRIES.length);
      return;
    }

    // Pass 2: Compact padding (px-2.5 = +20px, gap-1 = 4px) — keeps all 8 items in 1 single row
    const cmpItemPad = 20;
    const cmpGap = 4;
    const totalCmp =
      naturalWidths.reduce((s, w) => s + w + cmpItemPad, 0) +
      Math.max(0, naturalWidths.length - 1) * cmpGap;

    if (totalCmp <= availWidth) {
      setCompact(true);
      setVisibleCount(DESKTOP_NAV_ENTRIES.length);
      return;
    }

    // Pass 3: Fold overflow trailing items into "Thêm" dropdown (never wrap to 3rd row)
    setCompact(true);
    const moreBtnReserve = 104;
    let used = 0;
    let fit = 0;
    for (let i = 0; i < naturalWidths.length; i++) {
      const w = naturalWidths[i] + cmpItemPad + (i > 0 ? cmpGap : 0);
      if (used + w + moreBtnReserve <= availWidth) {
        used += w;
        fit = i + 1;
      } else {
        break;
      }
    }
    setVisibleCount(Math.max(3, fit));
  }, []);

  useLayoutEffect(() => {
    recomputeFit();
  }, [recomputeFit, fontScale]);

  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;
    const ro = new ResizeObserver(() => {
      recomputeFit();
    });
    ro.observe(navEl);
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => recomputeFit());
    }
    return () => ro.disconnect();
  }, [recomputeFit]);

  useEffect(() => {
    if (!moreOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const visibleEntries = DESKTOP_NAV_ENTRIES.slice(0, visibleCount);
  const overflowEntries = DESKTOP_NAV_ENTRIES.slice(visibleCount);

  const isOverflowActive = overflowEntries.some((entry) => {
    if (entry.kind === 'tools') {
      return currentPage === 'formulas' || currentPage === 'diagrams' || currentPage === 'offline';
    }
    return currentPage === entry.id;
  });

  return (
    <nav
      ref={navRef}
      aria-label="Điều hướng chính"
      className="relative hidden lg:flex items-center flex-nowrap w-full pt-1.5 border-t border-slate-100"
      style={{ gap: compact ? '4px' : '6px' }}
    >
      {/* Hidden intrinsic text measurement spans so ResizeObserver computes real pixel widths */}
      <div
        aria-hidden="true"
        className="pointer-events-none invisible fixed -top-[9999px] left-0 flex items-center whitespace-nowrap"
      >
        {DESKTOP_NAV_ENTRIES.map((entry, idx) => (
          <span
            key={entry.id}
            ref={(el) => {
              measureRefs.current[idx] = el;
            }}
            className="font-semibold text-ui-label inline-flex items-center gap-1.5"
          >
            <span>{entry.label}</span>
            {entry.kind === 'tools' && <ChevronDown className="w-4 h-4" />}
          </span>
        ))}
      </div>

      {visibleEntries.map((entry) => {
        if (entry.kind === 'tools') {
          return (
            <ToolsDropdown
              key="tools"
              currentPage={currentPage}
              onNavigate={onNavigate}
              compact={compact}
            />
          );
        }

        const active = currentPage === entry.id;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onNavigate(entry.id)}
            className={`min-h-[42px] ${compact ? 'px-2.5' : 'px-3.5'} py-1.5 rounded-lg font-semibold text-ui-label whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              active
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            {entry.label}
          </button>
        );
      })}

      {/* Overflow "Thêm" dropdown if viewport + large font scale exceeds single row */}
      {overflowEntries.length > 0 && (
        <div ref={moreRef} className="relative shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            className={`min-h-[42px] px-2.5 py-1.5 rounded-lg font-semibold text-ui-label inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
              isOverflowActive
                ? 'bg-teal-700 text-white'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>Thêm</span>
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-40"
            >
              {overflowEntries.map((entry) => {
                if (entry.kind === 'tools') {
                  return (
                    <React.Fragment key="overflow-tools">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreOpen(false);
                          onNavigate('formulas');
                        }}
                        className={`w-full min-h-[44px] px-3.5 py-2 text-left flex items-center gap-2 font-medium text-ui-min cursor-pointer ${
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
                        role="menuitem"
                        onClick={() => {
                          setMoreOpen(false);
                          onNavigate('offline');
                        }}
                        className={`w-full min-h-[44px] px-3.5 py-2 text-left flex items-center gap-2 font-medium text-ui-min cursor-pointer ${
                          currentPage === 'offline'
                            ? 'bg-teal-50 text-teal-900 font-semibold'
                            : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <Database className="w-4 h-4 text-teal-700 shrink-0" />
                        <span>Dữ liệu ngoại tuyến</span>
                      </button>
                    </React.Fragment>
                  );
                }

                return (
                  <button
                    key={entry.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      onNavigate(entry.id);
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2 text-left font-medium text-ui-min cursor-pointer ${
                      currentPage === entry.id
                        ? 'bg-teal-50 text-teal-900 font-semibold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
