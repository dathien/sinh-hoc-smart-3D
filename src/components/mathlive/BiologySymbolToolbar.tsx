import React from 'react';
import { BIOLOGY_SYMBOL_GROUPS, BiologySymbolGroup, SymbolButtonDef } from '../../data/formulas/symbolGroups';

interface BiologySymbolToolbarProps {
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onInsertSymbol: (symbol: SymbolButtonDef) => void;
  onInsertPreset: (latex: string) => void;
}

export const BiologySymbolToolbar: React.FC<BiologySymbolToolbarProps> = ({
  activeGroupId,
  onSelectGroup,
  onInsertSymbol,
  onInsertPreset,
}) => {
  const activeGroup: BiologySymbolGroup =
    BIOLOGY_SYMBOL_GROUPS.find((g) => g.id === activeGroupId) ?? BIOLOGY_SYMBOL_GROUPS[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Nhóm ký hiệu Sinh học">
        {BIOLOGY_SYMBOL_GROUPS.map((group) => {
          const active = group.id === activeGroup.id;
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectGroup(group.id)}
              className={`min-h-[44px] px-3 py-2 rounded-lg font-medium transition-colors text-ui-min whitespace-nowrap ${
                active
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-600 hover:text-teal-800'
              }`}
            >
              {group.shortName}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="font-semibold text-slate-900 text-ui-label">{activeGroup.name}</h4>
          <span className="text-slate-600 text-ui-min">
            Bấm ký hiệu để chèn trực tiếp tại vị trí con trỏ
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeGroup.symbols.map((sym, idx) => (
            <button
              key={`${activeGroup.id}-sym-${idx}`}
              type="button"
              title={sym.tooltip}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInsertSymbol(sym)}
              className="min-h-[44px] min-w-[48px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-medium hover:border-teal-600 hover:bg-teal-50 active:bg-teal-100 transition-colors text-ui-label"
            >
              {sym.label}
            </button>
          ))}
        </div>
      </div>

      {activeGroup.presets.length > 0 && (
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <p className="font-medium text-slate-700 text-ui-min">Mẫu công thức dựng sẵn:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeGroup.presets.map((preset, idx) => (
              <button
                key={`${activeGroup.id}-preset-${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onInsertPreset(preset.latex)}
                className="min-h-[44px] text-left px-3 py-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-semibold text-slate-900 text-ui-min">{preset.title}</div>
                <div className="text-slate-600 text-ui-min mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
