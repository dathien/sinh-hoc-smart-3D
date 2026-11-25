import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  GripVertical,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  ANIMAL_MATCHING_ITEMS,
  GAS_EXCHANGE_COMPARISON_ROWS,
} from '../../data/respiration/respirationContent';
import { RespirationSimId } from '../../data/respiration/respirationTypes';

interface GasExchangeComparisonPanelProps {
  onOpenSim?: (simId: RespirationSimId) => void;
}

type MechanismBucketId = 'be-mat' | 'ong-khi' | 'mang' | 'phoi';

const BUCKET_META: { id: MechanismBucketId; title: string; simId: RespirationSimId; style: string }[] = [
  {
    id: 'be-mat',
    title: '1. Qua bề mặt cơ thể',
    simId: 'body-surface',
    style: 'border-amber-300 bg-amber-50/70',
  },
  {
    id: 'ong-khi',
    title: '2. Qua hệ thống ống khí',
    simId: 'tracheal-system',
    style: 'border-emerald-300 bg-emerald-50/70',
  },
  {
    id: 'mang',
    title: '3. Qua mang',
    simId: 'fish-gills',
    style: 'border-blue-300 bg-blue-50/70',
  },
  {
    id: 'phoi',
    title: '4. Qua phổi',
    simId: 'human-anatomy',
    style: 'border-teal-300 bg-teal-50/70',
  },
];

export const GasExchangeComparisonPanel: React.FC<GasExchangeComparisonPanelProps> = ({
  onOpenSim,
}) => {
  const [assignments, setAssignments] = useState<Record<string, MechanismBucketId>>({});
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [draggedAnimalId, setDraggedAnimalId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const assignAnimal = (animalId: string, bucketId: MechanismBucketId) => {
    setAssignments((prev) => ({ ...prev, [animalId]: bucketId }));
    setSelectedAnimalId(null);
    setChecked(false);
  };

  const removeAssignment = (animalId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[animalId];
      return next;
    });
    setChecked(false);
  };

  const resetActivity = () => {
    setAssignments({});
    setSelectedAnimalId(null);
    setDraggedAnimalId(null);
    setChecked(false);
  };

  const unassignedAnimals = ANIMAL_MATCHING_ITEMS.filter((item) => !assignments[item.id]);
  const totalCount = ANIMAL_MATCHING_ITEMS.length;
  const assignedCount = Object.keys(assignments).length;
  const correctCount = ANIMAL_MATCHING_ITEMS.filter(
    (item) => assignments[item.id] === item.correctMechanismId,
  ).length;

  return (
    <div className="space-y-6">
      {/* PART A: Interactive 4-mechanism comparison matrix */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-xl">
              Bảng so sánh tương tác 4 hình thức trao đổi khí ở động vật
            </h3>
            <p className="text-slate-600 text-[16px]">
              Nhấp vào bất kỳ dòng hình thức nào để mở trực tiếp mô phỏng 3D tương ứng.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200 text-slate-800 text-[15px]">
                <th className="p-3 font-bold">Hình thức trao đổi khí</th>
                <th className="p-3 font-bold">Đại diện tiêu biểu</th>
                <th className="p-3 font-bold">Cơ quan / Bề mặt</th>
                <th className="p-3 font-bold">Đường đi O₂ → CO₂</th>
                <th className="p-3 font-bold">Đặc điểm thích nghi</th>
                <th className="p-3 font-bold">Môi trường sống</th>
                {onOpenSim && <th className="p-3 font-bold text-center">Mở 3D</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[15px]">
              {GAS_EXCHANGE_COMPARISON_ROWS.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onOpenSim?.(row.simId)}
                  className={`transition-colors ${
                    onOpenSim ? 'cursor-pointer hover:bg-teal-50/70' : ''
                  }`}
                >
                  <td className="p-3 font-bold text-slate-900 align-top">
                    <span className={`inline-block px-2.5 py-1 rounded-lg border ${row.accentClass}`}>
                      {row.mechanismName}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 align-top">{row.representatives}</td>
                  <td className="p-3 text-slate-700 align-top">{row.organSurface}</td>
                  <td className="p-3 text-slate-700 align-top space-y-1.5">
                    <div>
                      <span className="font-semibold text-teal-700">O₂: </span>
                      {row.o2Path}
                    </div>
                    <div>
                      <span className="font-semibold text-orange-700">CO₂: </span>
                      {row.co2Path}
                    </div>
                  </td>
                  <td className="p-3 text-slate-700 align-top">{row.adaptations}</td>
                  <td className="p-3 text-slate-700 align-top font-medium">{row.habitat}</td>
                  {onOpenSim && (
                    <td className="p-3 align-top text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSim(row.simId);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 min-h-[44px] whitespace-nowrap"
                      >
                        Xem 3D <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PART B: Interactive Drag-and-Drop + Click-Accessible Animal Matching */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Hoạt động kéo – thả: Ghép loài động vật với hình thức trao đổi khí
            </h3>
            <p className="text-slate-600 text-[16px]">
              Kéo thả thẻ loài vật vào đúng nhóm bên dưới, hoặc nhấp chọn loài vật rồi nhấp vào nhóm tương ứng (thuận tiện trên bảng tương tác / máy chiếu).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChecked(true)}
              disabled={assignedCount === 0}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 min-h-[44px] text-[16px]"
            >
              Kiểm tra kết quả ({assignedCount}/{totalCount})
            </button>
            <button
              type="button"
              onClick={resetActivity}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 min-h-[44px] text-[16px]"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại
            </button>
          </div>
        </div>

        {checked && (
          <div
            className={`p-4 rounded-xl border text-[16px] font-semibold flex flex-wrap items-center justify-between gap-2 ${
              correctCount === totalCount
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <span>
              Kết quả: Đúng {correctCount}/{totalCount} loài động vật.
              {correctCount === totalCount
                ? ' Xuất sắc! Bạn đã phân loại chuẩn xác tất cả 4 cơ chế trao đổi khí.'
                : ' Hãy xem giải thích màu đỏ ở các thẻ chưa đúng và thử điều chỉnh lại.'}
            </span>
          </div>
        )}

        {/* Unassigned bank */}
        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
          <div className="font-semibold text-slate-700 text-[15px]">
            Ngân hàng loài động vật chưa xếp ({unassignedAnimals.length}):
          </div>
          {unassignedAnimals.length === 0 ? (
            <p className="text-slate-600 text-[15px]">
              Tất cả loài vật đã được xếp vào các nhóm bên dưới. Nhấn “Kiểm tra kết quả” để đối chiếu đáp án.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {unassignedAnimals.map((animal) => {
                const isSelected = selectedAnimalId === animal.id;
                return (
                  <button
                    key={animal.id}
                    type="button"
                    draggable
                    onDragStart={() => setDraggedAnimalId(animal.id)}
                    onDragEnd={() => setDraggedAnimalId(null)}
                    onClick={() => setSelectedAnimalId(isSelected ? null : animal.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-left transition-all min-h-[44px] text-[15px] ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-300'
                        : 'bg-white text-slate-800 border-slate-300 hover:border-teal-400 hover:bg-teal-50/40'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 shrink-0 opacity-70" />
                    <div>
                      <div className="font-bold">{animal.animalName}</div>
                      <div className={`text-[15px] ${isSelected ? 'text-teal-50' : 'text-slate-600'}`}>
                        {animal.hint}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4 Drop Buckets */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {BUCKET_META.map((bucket) => {
            const placed = ANIMAL_MATCHING_ITEMS.filter((a) => assignments[a.id] === bucket.id);
            return (
              <div
                key={bucket.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedAnimalId) {
                    assignAnimal(draggedAnimalId, bucket.id);
                    setDraggedAnimalId(null);
                  }
                }}
                onClick={() => {
                  if (selectedAnimalId) {
                    assignAnimal(selectedAnimalId, bucket.id);
                  }
                }}
                className={`rounded-xl border-2 p-4 min-h-[190px] flex flex-col gap-3 transition-all ${
                  bucket.style
                } ${selectedAnimalId ? 'cursor-pointer ring-2 ring-teal-400 ring-offset-1' : ''}`}
              >
                <div className="font-bold text-slate-900 text-[16px] flex items-center justify-between gap-2">
                  <span>{bucket.title}</span>
                  {selectedAnimalId && (
                    <span className="px-2 py-0.5 rounded bg-teal-600 text-white text-[15px]">
                      + Đặt vào đây
                    </span>
                  )}
                </div>

                {placed.length === 0 ? (
                  <p className="text-slate-600 text-[15px] italic my-auto">
                    Kéo thả hoặc chọn loài vật để đưa vào nhóm này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {placed.map((animal) => {
                      const isCorrect = animal.correctMechanismId === bucket.id;
                      return (
                        <div
                          key={animal.id}
                          className={`p-3 rounded-lg border bg-white space-y-1.5 text-[15px] ${
                            checked
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50/70'
                                : 'border-rose-500 bg-rose-50/70'
                              : 'border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {checked &&
                                (isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                ))}
                              {animal.animalName}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAssignment(animal.id);
                              }}
                              className="px-2 py-1 rounded text-slate-600 hover:bg-slate-200 font-semibold text-[15px]"
                            >
                              Bỏ ra
                            </button>
                          </div>
                          {checked && (
                            <p className="text-slate-700 text-[15px] leading-snug">
                              {animal.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
