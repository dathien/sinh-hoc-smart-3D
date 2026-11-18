import React, { useMemo } from 'react';
import { renderLatexToSvg } from '../../services/mathRenderer/mathjaxSvg';

interface FormulaRendererSVGProps {
  latex: string;
  display?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const FormulaRendererSVG: React.FC<FormulaRendererSVGProps> = ({
  latex,
  display = true,
  className = '',
  onClick,
  title,
}) => {
  const { svgMarkup, error } = useMemo(() => renderLatexToSvg(latex, display), [latex, display]);

  if (error || !svgMarkup) {
    return (
      <span
        onClick={onClick}
        title={title}
        className={`inline-block px-3 py-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-ui-body ${
          onClick ? 'cursor-pointer hover:border-teal-600' : ''
        } ${className}`}
      >
        {latex || 'Chưa có công thức'}
      </span>
    );
  }

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      title={title ?? (onClick ? 'Nhấp để chỉnh sửa công thức' : undefined)}
      className={`formula-svg-container inline-flex items-center max-w-full overflow-x-auto py-1 text-slate-900 ${
        onClick
          ? 'cursor-pointer rounded-lg px-2.5 py-1.5 border border-transparent hover:border-teal-500 hover:bg-teal-50/60 transition-colors'
          : ''
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};
