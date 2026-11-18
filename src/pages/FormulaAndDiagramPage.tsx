import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, GitBranch, Plus, Search, Star, Trash2 } from 'lucide-react';
import { BiologyDiagramEditor } from '../components/diagrams/BiologyDiagramEditor';
import { FormulaRendererSVG } from '../components/formula/FormulaRendererSVG';
import { BiologyFormulaEditor } from '../components/mathlive/BiologyFormulaEditor';
import { FORMULA_LIBRARY } from '../data/formulas/formulaLibrary';
import { storageService } from '../services/storage/indexedDb';
import { FormulaItem, GradeLevel } from '../types/biology';
import { matchesSearchQuery } from '../utils/vietnameseSearch';

interface FormulaAndDiagramPageProps {
  initialTab?: 'formulas' | 'diagrams';
}

export const FormulaAndDiagramPage: React.FC<FormulaAndDiagramPageProps> = ({
  initialTab = 'formulas',
}) => {
  const [subTab, setSubTab] = useState<'formulas' | 'diagrams'>(initialTab);
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | GradeLevel | 'favorites'>('all');
  const [customFormulas, setCustomFormulas] = useState<FormulaItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [editingFormula, setEditingFormula] = useState<FormulaItem | null>(null);
  const [newFormulaName, setNewFormulaName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    storageService.getCustomFormulas().then(setCustomFormulas);
    storageService.getFavoriteFormulaIds().then(setFavoriteIds);
  }, []);

  const allFormulas = useMemo(
    () => [...customFormulas, ...FORMULA_LIBRARY],
    [customFormulas],
  );

  const filtered = useMemo(() => {
    return allFormulas.filter((f) => {
      if (gradeFilter === 'favorites' && !favoriteIds.includes(f.id)) return false;
      if (typeof gradeFilter === 'number' && f.grade !== gradeFilter) return false;
      return matchesSearchQuery(query, f.name, f.topic, f.symbolExplanation);
    });
  }, [allFormulas, gradeFilter, favoriteIds, query]);

  const toggleFavorite = async (id: string) => {
    const nextFav = !favoriteIds.includes(id);
    await storageService.toggleFavoriteFormula(id, nextFav);
    setFavoriteIds((prev) =>
      nextFav ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  const handleSaveEditedFormula = async (newLatex: string) => {
    if (isCreatingNew) {
      const created: FormulaItem = {
        id: `custom-${Date.now()}`,
        name: newFormulaName.trim() || 'Công thức Sinh học tự tạo',
        latex: newLatex,
        grade: 12,
        topic: 'Công thức tự tạo của giáo viên',
        groupId: 'genetics',
        level: 'Cơ bản',
        symbolExplanation: 'Lưu trữ ngoại tuyến trên trình duyệt.',
        units: 'Theo công thức',
        conditions: 'Do giáo viên/học sinh biên soạn.',
        example: '',
        isCustom: true,
      };
      await storageService.saveCustomFormula(created);
      setCustomFormulas(await storageService.getCustomFormulas());
      setIsCreatingNew(false);
      setEditingFormula(null);
      setNewFormulaName('');
      return;
    }

    if (editingFormula) {
      const updated: FormulaItem = {
        ...editingFormula,
        id: editingFormula.isCustom ? editingFormula.id : `edited-${editingFormula.id}-${Date.now()}`,
        name: editingFormula.isCustom ? editingFormula.name : `${editingFormula.name} (Bản chỉnh sửa)`,
        latex: newLatex,
        isCustom: true,
      };
      await storageService.saveCustomFormula(updated);
      setCustomFormulas(await storageService.getCustomFormulas());
      setEditingFormula(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-slate-900 text-ui-page">Công thức Sinh học & Sơ đồ trực quan</h1>
          <p className="text-slate-600 text-ui-body">
            Soạn công thức không cần biết LaTeX, lưu trữ ngoại tuyến và xuất hình ảnh SVG / PNG sắc nét cho bài giảng.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('formulas')}
            className={`min-h-[46px] px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-2 text-ui-min ${
              subTab === 'formulas' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Calculator className="w-5 h-5" />
            Thư viện & Soạn thảo Công thức
          </button>
          <button
            type="button"
            onClick={() => setSubTab('diagrams')}
            className={`min-h-[46px] px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-2 text-ui-min ${
              subTab === 'diagrams' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="w-5 h-5" />
            Trình tạo Sơ đồ Sinh học
          </button>
        </div>
      </div>

      {subTab === 'diagrams' ? (
        <BiologyDiagramEditor />
      ) : (
        <div className="space-y-5">
          {/* Search & Create New */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm công thức (vd: quang hop, ATP, Hardy-Weinberg, Michaelis)..."
                  className="w-full min-h-[46px] pl-11 pr-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-ui-body"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(true);
                  setEditingFormula({
                    id: 'new',
                    name: 'Công thức mới',
                    latex: 'p^2 + 2pq + q^2 = 1',
                    grade: 12,
                    topic: 'Tự tạo',
                    groupId: 'genetics',
                    level: 'Cơ bản',
                    symbolExplanation: '',
                    units: '',
                    conditions: '',
                    example: '',
                    isCustom: true,
                  });
                }}
                className="min-h-[46px] px-4 py-2 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-semibold inline-flex items-center gap-2 text-ui-min"
              >
                <Plus className="w-5 h-5" />
                Tạo công thức mới
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {([
                { id: 'all' as const, label: 'Tất cả' },
                { id: 10 as const, label: 'Sinh học 10' },
                { id: 11 as const, label: 'Sinh học 11' },
                { id: 12 as const, label: 'Sinh học 12' },
                { id: 'favorites' as const, label: `Yêu thích (${favoriteIds.length})` },
              ]).map((f) => (
                <button
                  key={String(f.id)}
                  type="button"
                  onClick={() => setGradeFilter(f.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
                    gradeFilter === f.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Editor */}
          {editingFormula && (
            <div className="space-y-3">
              {isCreatingNew && (
                <div className="bg-white border border-teal-300 rounded-xl p-4">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-900 text-ui-label">Tên công thức mới:</span>
                    <input
                      type="text"
                      value={newFormulaName}
                      onChange={(e) => setNewFormulaName(e.target.value)}
                      placeholder="Ví dụ: Công thức tính số nucleotide môi trường cung cấp"
                      className="w-full min-h-[46px] px-3 rounded-lg border border-slate-300 text-ui-body"
                    />
                  </label>
                </div>
              )}
              <BiologyFormulaEditor
                initialLatex={editingFormula.latex}
                defaultGroupId={editingFormula.groupId}
                title={isCreatingNew ? 'Soạn công thức Sinh học mới' : `Chỉnh sửa: ${editingFormula.name}`}
                onApply={(latex) => handleSaveEditedFormula(latex)}
                onCancel={() => {
                  setEditingFormula(null);
                  setIsCreatingNew(false);
                }}
              />
            </div>
          )}

          {/* Formula Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const isFav = favoriteIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-teal-800 font-semibold text-ui-min">
                          Sinh học {item.grade} · {item.topic} · {item.level}
                          {item.isCustom ? ' · Bản lưu của bạn' : ''}
                        </div>
                        <h3 className="font-bold text-slate-900 text-ui-card-title">{item.name}</h3>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id)}
                          aria-label="Đánh dấu yêu thích"
                          className={`min-h-[44px] min-w-[44px] rounded-lg border inline-flex items-center justify-center ${
                            isFav ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          <Star className={`w-5 h-5 ${isFav ? 'fill-amber-500' : ''}`} />
                        </button>
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={async () => {
                              await storageService.deleteCustomFormula(item.id);
                              setCustomFormulas(await storageService.getCustomFormulas());
                            }}
                            aria-label="Xóa công thức tự tạo"
                            className="min-h-[44px] min-w-[44px] rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-center overflow-x-auto">
                      <FormulaRendererSVG
                        latex={item.latex}
                        onClick={() => {
                          setIsCreatingNew(false);
                          setEditingFormula(item);
                        }}
                      />
                    </div>

                    <div className="space-y-1 text-slate-700 text-ui-min">
                      {item.symbolExplanation && (
                        <div>
                          <strong>Giải thích ký hiệu:</strong> {item.symbolExplanation}
                        </div>
                      )}
                      {item.conditions && (
                        <div>
                          <strong>Điều kiện áp dụng:</strong> {item.conditions}
                        </div>
                      )}
                      {item.example && (
                        <div>
                          <strong>Ví dụ:</strong> {item.example}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingFormula(item);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-900 font-semibold text-ui-min transition-colors"
                    >
                      Chỉnh sửa & Xuất SVG / PNG
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
