import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { LessonDetailView } from '../components/common/LessonDetailView';
import { CURRICULUM_LESSONS } from '../data/curriculum/lessons';
import { GradeLevel, LabId } from '../types/biology';

interface CurriculumGradePageProps {
  grade: GradeLevel;
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string | null) => void;
  onOpenLab: (labId: LabId) => void;
}

export const CurriculumGradePage: React.FC<CurriculumGradePageProps> = ({
  grade,
  selectedLessonId,
  onSelectLesson,
  onOpenLab,
}) => {
  const gradeLessons = useMemo(
    () => CURRICULUM_LESSONS.filter((l) => l.grade === grade),
    [grade],
  );
  const [topicFilter, setTopicFilter] = useState<string>('all');

  const topics = useMemo(
    () => Array.from(new Set(gradeLessons.map((l) => l.topicName))),
    [gradeLessons],
  );

  const visibleLessons =
    topicFilter === 'all'
      ? gradeLessons
      : gradeLessons.filter((l) => l.topicName === topicFilter);

  const activeLesson =
    gradeLessons.find((l) => l.id === selectedLessonId) ?? gradeLessons[0];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-slate-900 text-ui-page">
              Chương trình Sinh học Lớp {grade}
            </h1>
            <p className="text-slate-600 text-ui-body">
              Chuẩn Chương trình GDPT 2018 · Định hướng bộ sách Kết nối tri thức với cuộc sống
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTopicFilter('all')}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
                topicFilter === 'all' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              Tất cả chủ đề ({gradeLessons.length})
            </button>
            {topics.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setTopicFilter(tp)}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
                  topicFilter === tp ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {visibleLessons.map((ls) => {
            const isActive = activeLesson?.id === ls.id;
            return (
              <button
                key={ls.id}
                type="button"
                onClick={() => onSelectLesson(ls.id)}
                className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between gap-2 ${
                  isActive
                    ? 'border-teal-700 bg-teal-50/80'
                    : 'border-slate-200 bg-white hover:border-teal-400'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-teal-800 font-semibold text-ui-min">
                    {ls.topicCode} · {ls.topicName}
                  </div>
                  <div className="font-bold text-slate-900 text-ui-card-title flex items-start gap-2">
                    <BookOpen className="w-5 h-5 text-teal-700 shrink-0 mt-1" />
                    <span>{ls.title}</span>
                  </div>
                </div>
                <div className="text-blue-700 font-semibold inline-flex items-center gap-1 text-ui-min">
                  {isActive ? 'Đang mở bài học này' : 'Mở bài học'}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeLesson && (
        <LessonDetailView lesson={activeLesson} onOpenLab={onOpenLab} />
      )}
    </div>
  );
};
