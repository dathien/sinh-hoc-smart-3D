import React from 'react';
import { Dna } from 'lucide-react';

interface BrandSectionProps {
  onClickHome: () => void;
}

export const BrandSection: React.FC<BrandSectionProps> = ({ onClickHome }) => {
  return (
    <button
      type="button"
      onClick={onClickHome}
      className="flex items-center gap-3 text-left min-h-[44px] min-w-0 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-lg"
    >
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-700 group-hover:bg-teal-800 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs">
        <Dna className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div
          className="font-extrabold tracking-tight text-slate-900 leading-tight truncate"
          style={{ fontSize: 'clamp(20px, 2.2vw, 25px)' }}
        >
          SINH HỌC SMART 3D
        </div>
        <div className="text-slate-600 text-ui-min leading-snug">
          Khám phá sự sống – Trải nghiệm khoa học
        </div>
      </div>
    </button>
  );
};
