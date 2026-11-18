import React, { useMemo, useState } from 'react';
import { BookOpen, Calculator, FlaskConical, Search, X } from 'lucide-react';
import { CURRICULUM_LESSONS } from '../../data/curriculum/lessons';
import { FORMULA_LIBRARY } from '../../data/formulas/formulaLibrary';
import { LAB_DEFINITIONS } from '../../data/labsMeta';
import { AppPage, LabId } from '../../types/biology';
import { matchesSearchQuery } from '../../utils/vietnameseSearch';

interface SearchBarProps {
  onNavigateLesson: (grade: 10 | 11 | 12, lessonId: string) => void;
  onNavigateLab: (labId: LabId) => void;
  onNavigatePage: (page: AppPage) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onNavigateLesson,
  onNavigateLab,
  onNavigatePage,
}) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return { labs: [], lessons: [], formulas: [] };

    const labs = LAB_DEFINITIONS.filter((l) =>
      matchesSearchQuery(q, l.title, l.englishTitle, l.shortDesc, l.keywords),
    ).slice(0, 5);

    const lessons = CURRICULUM_LESSONS.filter((ls) =>
      matchesSearchQuery(q, ls.title, ls.topicName, ls.englishKeywords, ls.glossary.map((g) => g.term)),
    ).slice(0, 5);

    const formulas = FORMULA_LIBRARY.filter((f) =>
      matchesSearchQuery(q, f.name, f.topic, f.symbolExplanation),
    ).slice(0, 4);

    return { labs, lessons, formulas };
  }, [query]);

  const hasResults =
    results.labs.length > 0 || results.lessons.length > 0 || results.formulas.length > 0;

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-slate-500 absolute left-4 pointer-events-none" />
        <input
          type="search"
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 180)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm bài học, mô hình 3D, công thức (ví dụ: DNA, ti the, quang hop C4, Hardy-Weinberg)..."
          className="w-full min-h-[54px] pl-12 pr-12 py-3 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none shadow-sm text-ui-body"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Xóa từ khóa tìm kiếm"
            className="absolute right-3 p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {focused && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-[60px] z-40 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 max-h-[420px] overflow-y-auto space-y-3">
          {!hasResults ? (
            <p className="text-slate-600 text-ui-body p-2">
              Không tìm thấy kết quả phù hợp cho "{query}". Thử từ khóa như "tế bào", "virus", "phân bào", "quang hợp", "mendel".
            </p>
          ) : (
            <>
              {results.labs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 text-ui-min px-2">Phòng Lab & Mô hình 3D</div>
                  {results.labs.map((lab) => (
                    <button
                      key={lab.id}
                      type="button"
                      onMouseDown={() => {
                        onNavigateLab(lab.id);
                        setFocused(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-teal-50 flex items-start gap-2.5 min-h-[44px]"
                    >
                      <FlaskConical className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900 text-ui-min">
                          {lab.number} · {lab.title}
                        </div>
                        <div className="text-slate-600 text-ui-min">{lab.shortDesc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.lessons.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-700 text-ui-min px-2">Bài học SGK (Lớp 10–11–12)</div>
                  {results.lessons.map((ls) => (
                    <button
                      key={ls.id}
                      type="button"
                      onMouseDown={() => {
                        onNavigateLesson(ls.grade, ls.id);
                        setFocused(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 flex items-start gap-2.5 min-h-[44px]"
                    >
                      <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900 text-ui-min">
                          Sinh học {ls.grade} · {ls.title}
                        </div>
                        <div className="text-slate-600 text-ui-min">{ls.topicName}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.formulas.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-700 text-ui-min px-2">Công thức Sinh học</div>
                  {results.formulas.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onMouseDown={() => {
                        onNavigatePage('formulas');
                        setFocused(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 flex items-start gap-2.5 min-h-[44px]"
                    >
                      <Calculator className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900 text-ui-min">{f.name}</div>
                        <div className="text-slate-600 text-ui-min">{f.topic}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
