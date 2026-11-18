import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Eye, EyeOff, FlaskConical, Printer } from 'lucide-react';
import { LabId, LessonData } from '../../types/biology';
import { BiologyFormulaEditor } from '../mathlive/BiologyFormulaEditor';

type LessonTab = 'explore' | 'knowledge' | 'model3d' | 'simulate' | 'practice' | 'remember' | 'questions';

interface LessonDetailViewProps {
  lesson: LessonData;
  onOpenLab: (labId: LabId) => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lesson, onOpenLab }) => {
  const [activeTab, setActiveTab] = useState<LessonTab>('explore');
  const [showTeacherScript, setShowTeacherScript] = useState(true);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [customFormulas, setCustomFormulas] = useState<Record<number, string>>({});

  const tabs: { id: LessonTab; label: string }[] = [
    { id: 'explore', label: 'Khám phá' },
    { id: 'knowledge', label: 'Kiến thức' },
    { id: 'model3d', label: 'Mô hình 3D' },
    { id: 'simulate', label: 'Mô phỏng' },
    { id: 'practice', label: 'Thực hành' },
    { id: 'remember', label: 'Ghi nhớ' },
    { id: 'questions', label: 'Câu hỏi củng cố' },
  ];

  return (
    <div className="space-y-4">
      {/* Lesson Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 print-sheet">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-teal-800 font-semibold text-ui-min">
              Sinh học {lesson.grade} · {lesson.topicCode} · {lesson.topicName}
            </div>
            <h2 className="font-bold text-slate-900 text-ui-lab">{lesson.title}</h2>
            <p className="text-slate-600 text-ui-min">{lesson.textbookAlignmentNote}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => setShowTeacherScript((v) => !v)}
              className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium inline-flex items-center gap-1.5 text-ui-min"
            >
              {showTeacherScript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showTeacherScript ? 'Ẩn lời dẫn GV' : 'Hiện lời dẫn GV'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium inline-flex items-center gap-1.5 text-ui-min"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              In phiếu học tập A4
            </button>
            <button
              type="button"
              onClick={() => onOpenLab(lesson.relatedLabId)}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 font-semibold inline-flex items-center gap-2 text-ui-min"
            >
              <FlaskConical className="w-4 h-4" />
              Mở Phòng Lab 3D liên quan
            </button>
          </div>
        </div>

        {/* 7 Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 no-print" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-lg font-semibold text-ui-min transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 print-sheet">
        {activeTab === 'explore' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-ui-section">Mục tiêu cần đạt</h3>
            <ul className="space-y-2">
              {lesson.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-800 text-ui-body">
                  <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-1" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
              <div className="font-bold text-teal-900 text-ui-card-title">Thuật ngữ khoa học trọng tâm</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lesson.glossary.map((g) => (
                  <div key={g.term} className="p-3 rounded-lg bg-white border border-teal-100">
                    <div className="font-bold text-slate-900">
                      {g.term} <span className="font-normal text-slate-500">({g.english})</span>
                    </div>
                    <p className="text-slate-700 text-ui-min mt-1">{g.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-5">
            {lesson.coreKnowledge.map((sec, idx) => {
              const currentLatex = customFormulas[idx] ?? sec.formulaLatex;
              return (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <h3 className="font-bold text-slate-900 text-ui-section flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-700" />
                    {sec.heading}
                  </h3>
                  <ul className="list-disc pl-6 space-y-1.5 text-slate-800 text-ui-body">
                    {sec.points.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                  {currentLatex && (
                    <BiologyFormulaEditor
                      initialLatex={currentLatex}
                      inlinePreview
                      startEditing={false}
                      title="Công thức minh họa (nhấp để chỉnh sửa trực quan)"
                      onApply={(nextLatex) =>
                        setCustomFormulas((prev) => ({ ...prev, [idx]: nextLatex }))
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(activeTab === 'model3d' || activeTab === 'simulate') && (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-4">
            <h3 className="font-bold text-slate-900 text-ui-section">
              {activeTab === 'model3d'
                ? 'Khám phá Mô hình 3D tương tác trực tiếp'
                : 'Chạy Mô phỏng động & Thay đổi thông số'}
            </h3>
            <p className="text-slate-700 text-ui-body max-w-2xl mx-auto">
              Nhấn nút bên dưới để mở Phòng Lab 3D chuyên biệt cho bài học <strong>{lesson.title}</strong> với đầy đủ góc nhìn, cắt lớp, tách cấu trúc và mô phỏng trực quan.
            </p>
            <button
              type="button"
              onClick={() => onOpenLab(lesson.relatedLabId)}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-bold inline-flex items-center gap-2 text-ui-button"
            >
              <FlaskConical className="w-5 h-5" />
              Mở Phòng Lab 3D ngay
            </button>
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-ui-section">Hoạt động trải nghiệm & Phiếu học tập</h3>
            {lesson.activities.map((act) => (
              <div key={act.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="font-bold text-teal-900 text-ui-card-title">
                  [{act.phase}] {act.title}
                </div>
                <p className="text-slate-800"><strong>Mục tiêu:</strong> {act.objective}</p>
                <p className="text-slate-800"><strong>Nhiệm vụ học sinh:</strong> {act.task}</p>
                <p className="text-slate-700"><strong>Hướng dẫn:</strong> {act.guide}</p>
                <p className="text-slate-700"><strong>Sản phẩm dự kiến:</strong> {act.expectedProduct}</p>
                <p className="text-slate-700"><strong>Tiêu chí đánh giá:</strong> {act.rubric}</p>
                {showTeacherScript && (
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-950 text-ui-min">
                    <strong>Lời dẫn dành cho giáo viên:</strong> {act.teacherScript}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'remember' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-ui-section">Ghi nhớ cốt lõi bài học</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lesson.rememberNotes.map((note, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-medium text-ui-body">
                  {idx + 1}. {note}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-ui-section">Câu hỏi củng cố & Phát triển năng lực</h3>
            {lesson.questions.map((q, idx) => {
              const shown = Boolean(revealedAnswers[q.id]);
              return (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-blue-700 text-ui-min">
                      Câu {idx + 1} · {q.level} · {q.type}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      className="min-h-[44px] px-3.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-medium text-ui-min no-print"
                    >
                      {shown ? 'Ẩn gợi ý trả lời' : 'Xem gợi ý trả lời'}
                    </button>
                  </div>
                  <p className="font-semibold text-slate-900 text-ui-body">{q.question}</p>
                  {shown && (
                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1.5 text-emerald-950">
                      <div>
                        <strong>Hướng dẫn trả lời:</strong> {q.answer}
                      </div>
                      {showTeacherScript && (
                        <div className="text-emerald-800 text-ui-min">
                          <strong>Gợi ý giảng dạy (GV):</strong> {q.teacherNote}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
