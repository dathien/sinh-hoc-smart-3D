import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { RESPIRATION_QUESTION_BANK } from '../../data/respiration/respirationQuestions';
import {
  BloomLevel,
  RespMatchingQuestion,
  RespMcqQuestion,
  RespOrderingQuestion,
  RespQuestion,
  RespTrueFalseQuestion,
  RespirationSimId,
} from '../../data/respiration/respirationTypes';

interface RespirationQuizBankProps {
  simId?: RespirationSimId | 'all';
  onFocusPart?: (partId: string) => void;
  compact?: boolean;
}

function deterministicShuffle(items: string[], seedStr: string): string[] {
  const arr = [...items];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) % 100000;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 100000;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Ensure ordering items do not start already solved when length > 1
  if (arr.length > 1 && arr.every((v, idx) => v === items[idx])) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

export const RespirationQuizBank: React.FC<RespirationQuizBankProps> = ({
  simId = 'all',
  onFocusPart,
  compact = false,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | BloomLevel>('all');
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, boolean>>({});
  const [matchAnswers, setMatchAnswers] = useState<Record<string, Record<number, string>>>({});
  const [orderAnswers, setOrderAnswers] = useState<Record<string, string[]>>({});
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({});

  const questions = useMemo(() => {
    return RESPIRATION_QUESTION_BANK.filter((q) => {
      const matchSim = simId === 'all' || q.simId === simId;
      const matchLevel = levelFilter === 'all' || q.level === levelFilter;
      return matchSim && matchLevel;
    });
  }, [simId, levelFilter]);

  const isQuestionCorrect = (q: RespQuestion): boolean => {
    if (q.format === 'mcq' || q.format === 'identify' || q.format === 'analysis') {
      return mcqAnswers[q.id] === q.correctIndex;
    }
    if (q.format === 'true-false') {
      return tfAnswers[q.id] === q.correctAnswer;
    }
    if (q.format === 'matching') {
      const m = matchAnswers[q.id] || {};
      return q.pairs.every((p, idx) => m[idx] === p.right);
    }
    if (q.format === 'ordering') {
      const current = orderAnswers[q.id] ?? deterministicShuffle(q.correctOrder, q.id);
      return q.correctOrder.every((step, idx) => current[idx] === step);
    }
    return false;
  };

  const submittedCount = questions.filter((q) => submittedIds[q.id]).length;
  const correctCount = questions.filter((q) => submittedIds[q.id] && isQuestionCorrect(q)).length;

  const handleResetAll = () => {
    setMcqAnswers({});
    setTfAnswers({});
    setMatchAnswers({});
    setOrderAnswers({});
    setSubmittedIds({});
  };

  const moveOrderStep = (q: RespOrderingQuestion, idx: number, dir: -1 | 1) => {
    const current = [...(orderAnswers[q.id] ?? deterministicShuffle(q.correctOrder, q.id))];
    const target = idx + dir;
    if (target < 0 || target >= current.length) return;
    [current[idx], current[target]] = [current[target], current[idx]];
    setOrderAnswers((prev) => ({ ...prev, [q.id]: current }));
  };

  const renderMcqCard = (q: RespMcqQuestion) => {
    const picked = mcqAnswers[q.id];
    const done = !!submittedIds[q.id];
    return (
      <div className="space-y-2.5">
        {q.format === 'identify' && q.targetPartId && onFocusPart && (
          <button
            type="button"
            onClick={() => onFocusPart(q.targetPartId!)}
            className="px-3.5 py-2 rounded-lg bg-sky-50 border border-sky-300 text-sky-900 font-semibold hover:bg-sky-100 min-h-[44px] text-[15px]"
          >
            Phóng tới cấu trúc liên quan trên mô hình 3D
          </button>
        )}
        <div className="grid grid-cols-1 gap-2">
          {q.options.map((opt, idx) => {
            const isPicked = picked === idx;
            const isRight = idx === q.correctIndex;
            let cls = 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50';
            if (done) {
              if (isRight) cls = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
              else if (isPicked) cls = 'border-rose-500 bg-rose-50 text-rose-950';
            } else if (isPicked) {
              cls = 'border-teal-600 bg-teal-50 text-teal-950 font-semibold ring-1 ring-teal-500';
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setMcqAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors min-h-[44px] text-[15px] ${cls}`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTrueFalseCard = (q: RespTrueFalseQuestion) => {
    const picked = tfAnswers[q.id];
    const done = !!submittedIds[q.id];
    return (
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Đúng', val: true },
          { label: 'Sai', val: false },
        ].map((item) => {
          const isPicked = picked === item.val;
          const isRight = q.correctAnswer === item.val;
          let cls = 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50';
          if (done) {
            if (isRight) cls = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
            else if (isPicked) cls = 'border-rose-500 bg-rose-50 text-rose-950 font-bold';
          } else if (isPicked) {
            cls = 'border-teal-600 bg-teal-50 text-teal-950 font-bold ring-1 ring-teal-500';
          }
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setTfAnswers((prev) => ({ ...prev, [q.id]: item.val }))}
              className={`px-4 py-3 rounded-lg border text-center min-h-[44px] text-[16px] ${cls}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMatchingCard = (q: RespMatchingQuestion) => {
    const rightOptions = deterministicShuffle(
      q.pairs.map((p) => p.right),
      q.id + '-match',
    );
    const current = matchAnswers[q.id] || {};
    const done = !!submittedIds[q.id];

    return (
      <div className="space-y-2.5">
        {q.pairs.map((pair, idx) => {
          const val = current[idx] ?? '';
          const ok = val === pair.right;
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center gap-2.5 justify-between ${
                done
                  ? ok
                    ? 'border-emerald-400 bg-emerald-50/70'
                    : 'border-rose-400 bg-rose-50/70'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className="font-semibold text-slate-900 text-[15px]">{pair.left}</span>
              <select
                value={val}
                aria-label={`Chọn cặp nối cho ${pair.left}`}
                onChange={(e) =>
                  setMatchAnswers((prev) => ({
                    ...prev,
                    [q.id]: { ...(prev[q.id] || {}), [idx]: e.target.value },
                  }))
                }
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 min-h-[44px] text-[15px] sm:max-w-[60%]"
              >
                <option value="">-- Chọn đặc điểm tương ứng --</option>
                {rightOptions.map((opt, oi) => (
                  <option key={oi} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOrderingCard = (q: RespOrderingQuestion) => {
    const current = orderAnswers[q.id] ?? deterministicShuffle(q.correctOrder, q.id);
    const done = !!submittedIds[q.id];

    return (
      <div className="space-y-2">
        {current.map((step, idx) => {
          const isStepRight = step === q.correctOrder[idx];
          return (
            <div
              key={`${step}-${idx}`}
              className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-[15px] ${
                done
                  ? isStepRight
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-rose-400 bg-rose-50'
                  : 'border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-900 font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-900 font-medium">{step}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveOrderStep(q, idx, -1)}
                  disabled={idx === 0}
                  aria-label="Chuyển lên"
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOrderStep(q, idx, 1)}
                  disabled={idx === current.length - 1}
                  aria-label="Chuyển xuống"
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
              {simId === 'all'
                ? `Luyện tập tổng hợp Bài 9 (${questions.length} câu hỏi · 6 dạng · 3 mức độ)`
                : `Câu hỏi thực hành mô phỏng (${questions.length} câu hỏi)`}
            </h4>
            <p className="text-slate-600 text-[15px]">
              Ngân hàng câu hỏi tự biên soạn bám sát yêu cầu cần đạt Chương trình GDPT 2018 – Sinh học 11 (không trích sao nguyên văn từ sách giáo khoa).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-teal-100 text-teal-900 font-bold text-[15px]">
              Đúng: {correctCount}/{submittedCount}
            </span>
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100 min-h-[44px] text-[15px]"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'Nhận biết', 'Thông hiểu', 'Vận dụng'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={`px-3.5 py-2 rounded-lg font-semibold border min-h-[44px] text-[15px] ${
                levelFilter === lvl
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {lvl === 'all' ? 'Tất cả mức độ' : lvl}
            </button>
          ))}
        </div>
      </div>

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        {questions.map((q, index) => {
          const done = !!submittedIds[q.id];
          const ok = done && isQuestionCorrect(q);
          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[15px]">
                  <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-bold">
                    Câu {index + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-teal-100 text-teal-900 font-semibold">
                    {q.formatLabel}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded font-semibold ${
                      q.level === 'Nhận biết'
                        ? 'bg-sky-100 text-sky-900'
                        : q.level === 'Thông hiểu'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-purple-100 text-purple-900'
                    }`}
                  >
                    {q.level}
                  </span>
                </div>

                <p className="font-semibold text-slate-900 text-[16px] leading-relaxed">
                  {q.prompt}
                </p>

                {(q.format === 'mcq' || q.format === 'identify' || q.format === 'analysis') &&
                  renderMcqCard(q)}
                {q.format === 'true-false' && renderTrueFalseCard(q)}
                {q.format === 'matching' && renderMatchingCard(q)}
                {q.format === 'ordering' && renderOrderingCard(q)}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => setSubmittedIds((prev) => ({ ...prev, [q.id]: true }))}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 min-h-[44px] text-[15px]"
                >
                  {done ? 'Kiểm tra lại' : 'Kiểm tra đáp án'}
                </button>

                {done && (
                  <div
                    className={`p-3 rounded-lg border text-[15px] leading-relaxed ${
                      ok
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      {ok ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          Chính xác!
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          Chưa chính xác — Xem giải thích khoa học:
                        </>
                      )}
                    </div>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
