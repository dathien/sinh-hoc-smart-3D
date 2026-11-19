import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Database, Sigma } from 'lucide-react';
import { AppPage } from '../../types/biology';

interface ToolsDropdownProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  compact?: boolean;
}

export const ToolsDropdown: React.FC<ToolsDropdownProps> = ({
  currentPage,
  onNavigate,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const isToolsActive =
    currentPage === 'formulas' || currentPage === 'diagrams' || currentPage === 'offline';

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleSelect = (page: AppPage) => {
    setOpen(false);
    onNavigate(page);
  };

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`min-h-[42px] ${compact ? 'px-2.5' : 'px-3.5'} py-1.5 rounded-lg font-semibold text-ui-label inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
          isToolsActive
            ? 'bg-teal-700 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
        }`}
      >
        <span>Công cụ</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-40 transition-opacity duration-150"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect('formulas')}
            className={`w-full min-h-[44px] px-3.5 py-2 text-left flex items-center gap-2.5 font-medium text-ui-min transition-colors cursor-pointer ${
              currentPage === 'formulas' || currentPage === 'diagrams'
                ? 'bg-teal-50 text-teal-900 font-semibold'
                : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sigma className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
            <span>Công thức và sơ đồ</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect('offline')}
            className={`w-full min-h-[44px] px-3.5 py-2 text-left flex items-center gap-2.5 font-medium text-ui-min transition-colors cursor-pointer ${
              currentPage === 'offline'
                ? 'bg-teal-50 text-teal-900 font-semibold'
                : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
            <span>Dữ liệu ngoại tuyến</span>
          </button>
        </div>
      )}
    </div>
  );
};
