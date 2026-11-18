import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SearchBar } from '../components/layout/SearchBar';
import { ModelViewer3D } from '../components/viewer3d/ModelViewer3D';
import { CURRICULUM_LESSONS } from '../data/curriculum/lessons';
import { LAB_DEFINITIONS } from '../data/labsMeta';
import { AppPage, GradeLevel, LabId, QualityLevel } from '../types/biology';

interface HomePageProps {
  onNavigatePage: (page: AppPage) => void;
  onOpenLab: (labId: LabId) => void;
  onOpenLesson: (grade: GradeLevel, lessonId: string) => void;
}

const SLIDES: {
  title: string;
  desc: string;
  image: string;
  ctaLabel: string;
  action: { type: 'lab'; labId: LabId } | { type: 'page'; page: AppPage };
}[] = [
  {
    title: 'Khám phá Tế bào & Bào quan 3D',
    desc: 'Xoay, cắt lát ngang – dọc và tách rời từng bào quan tế bào động vật, thực vật và vi khuẩn.',
    image: '/src/assets/images/slider_cell_biology_1794973696157.jpg',
    ctaLabel: 'Mở Lab Thế giới Tế bào',
    action: { type: 'lab', labId: 'cell' },
  },
  {
    title: 'DNA, Phiên mã, Dịch mã & Phân tử thực',
    desc: 'Nhập trình tự nucleotide tạo mRNA, chuỗi polypeptide 3D và xem cấu trúc protein từ RCSB PDB / AlphaFold.',
    image: '/src/assets/images/slider_dna_molecular_1794973695837.jpg',
    ctaLabel: 'Mở Lab DNA & Protein',
    action: { type: 'lab', labId: 'molecular-bio' },
  },
  {
    title: '6 Mô hình Virus 3D & Chu trình tan',
    desc: 'Quan sát trực quan T4, SARS-CoV-2, Cúm A, HIV-1, Adenovirus, TMV và đường cong sinh trưởng vi khuẩn.',
    image: '/src/assets/images/slider_virus_virology_1794973698589.jpg',
    ctaLabel: 'Mở Lab Virus & Vi sinh',
    action: { type: 'lab', labId: 'virus' },
  },
  {
    title: 'Quang hợp C3 – C4 – CAM & Sinh lí Thực vật',
    desc: 'Phân biệt cơ chế tách không gian (C4) và tách thời gian (CAM), đóng mở khí khổng và vận chuyển mạch gỗ – mạch rây.',
    image: '/src/assets/images/slider_plant_physiology_1794973696723.jpg',
    ctaLabel: 'Mở Lab Sinh lí Thực vật',
    action: { type: 'lab', labId: 'plant-physiology' },
  },
  {
    title: 'Giải phẫu Tim, Phổi & Sinh lí Động vật',
    desc: 'Mô phỏng nhịp tim, vòng tuần hoàn máu giàu/nghèo O₂, lọc máu ở nephron và truyền xung qua synapse.',
    image: '/src/assets/images/slider_cell_biology_1794973696157.jpg',
    ctaLabel: 'Mở Lab Giải phẫu người 3D',
    action: { type: 'lab', labId: 'anatomy' },
  },
  {
    title: 'Nguyên phân, Giảm phân & Di truyền Mendel',
    desc: 'Theo dõi từng NST kép, chromatid qua các kì với 2n = 2, 4, 6, 8 và bảng lai Punnett – Hardy–Weinberg.',
    image: '/src/assets/images/slider_dna_molecular_1794973695837.jpg',
    ctaLabel: 'Mở Lab Phân bào 3D',
    action: { type: 'lab', labId: 'cell-division' },
  },
  {
    title: 'Sinh thái học 3D & Tiến hóa Quần thể',
    desc: 'Khám phá 5 hệ sinh thái, tháp năng lượng 10%, mô hình con mồi – vật ăn thịt và so sánh kịch bản tiến hóa.',
    image: '/src/assets/images/slider_ecology_ecosystem_1794973698183.jpg',
    ctaLabel: 'Mở Lab Sinh thái học',
    action: { type: 'lab', labId: 'ecology' },
  },
  {
    title: 'Soạn thảo Công thức Sinh học & Sơ đồ trực quan',
    desc: 'Gõ công thức Sinh học chuẩn không cần biết mã LaTeX, xuất ảnh SVG/PNG sắc nét chèn ngay vào bài giảng PowerPoint.',
    image: '/src/assets/images/slider_plant_physiology_1794973696723.jpg',
    ctaLabel: 'Mở Công thức & Sơ đồ',
    action: { type: 'page', page: 'formulas' },
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigatePage,
  onOpenLab,
  onOpenLesson,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);

  useEffect(() => {
    if (sliderPaused) return;
    const id = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [sliderPaused]);

  const buildHeroDna = (rootGroup: THREE.Group, quality: QualityLevel) => {
    const pairs = 14;
    const segs = quality === 'low' ? 10 : 18;
    const radius = 1.05;
    const rise = 0.34;
    const twist = 0.56;
    const colors = [0x22c55e, 0xef4444, 0x3b82f6, 0xfacc15];

    const backboneMat1 = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.3 });
    const backboneMat2 = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });

    for (let i = 0; i < pairs; i++) {
      const y = (i - pairs / 2) * rise;
      const a = i * twist;
      const p1 = new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
      const p2 = new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius);

      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, segs, segs), backboneMat1);
      s1.position.copy(p1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, segs, segs), backboneMat2);
      s2.position.copy(p2);

      const rung = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, radius * 2, 10),
        new THREE.MeshStandardMaterial({ color: colors[i % 4], roughness: 0.35 }),
      );
      rung.position.set(0, y, 0);
      rung.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        p2.clone().sub(p1).normalize(),
      );
      rootGroup.add(s1, s2, rung);
    }

    return { initialCameraDir: new THREE.Vector3(0.45, 0.25, 0.9) };
  };

  const currentSlide = SLIDES[slideIdx];

  return (
    <div className="space-y-10">
      {/* HERO SECTION */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5">
            <h1 className="font-extrabold text-slate-950 leading-tight text-ui-hero">
              SINH HỌC SMART 3D
            </h1>
            <p className="text-teal-800 font-semibold text-ui-section">
              Khám phá sự sống – Trải nghiệm khoa học
            </p>
            <p className="text-slate-700 text-ui-body">
              Nền tảng học tập và thực hành Sinh học THPT lớp 10, 11 và 12 (Chương trình GDPT 2018).
              Hỗ trợ giáo viên trình chiếu trực quan trên lớp với mô hình 3D tương tác, 12 phòng thí nghiệm ảo, trình soạn công thức trực quan và hoạt động ngoại tuyến mượt mà.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenLab('cell')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-bold inline-flex items-center gap-2 text-ui-button shadow-sm"
              >
                <Sparkles className="w-5 h-5" />
                Khám phá ngay
              </button>
              <button
                type="button"
                onClick={() => onNavigatePage('labs')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold inline-flex items-center gap-2 text-ui-button"
              >
                <FlaskConical className="w-5 h-5" />
                Mở phòng Lab 3D
              </button>
              <button
                type="button"
                onClick={() => onNavigatePage('grade10')}
                className="min-h-[48px] px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 font-semibold inline-flex items-center gap-2 text-ui-button"
              >
                <BookOpen className="w-5 h-5 text-teal-700" />
                Chọn bài học
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 h-[340px] md:h-[380px] rounded-2xl overflow-hidden border border-slate-200">
            <ModelViewer3D
              modelKey="hero-dna"
              buildModel={buildHeroDna}
              autoRotate
              showLabels={false}
              fallbackTitle="Phân tử DNA xoắn kép 3D"
              fallbackItems={[
                'Hai mạch polynucleotide song song ngược chiều (5′→3′ và 3′→5′)',
                'Liên kết bổ sung: A–T (2 liên kết hydrogen), G–C (3 liên kết hydrogen)',
              ]}
            />
          </div>
        </div>

        {/* GLOBAL SEARCH */}
        <div className="pt-7 mt-7 border-t border-slate-100">
          <SearchBar
            onNavigateLab={onOpenLab}
            onNavigateLesson={onOpenLesson}
            onNavigatePage={onNavigatePage}
          />
        </div>
      </section>

      {/* 8-SLIDE INTRO SLIDER */}
      <section
        aria-label="Giới thiệu các phân hệ học tập"
        onMouseEnter={() => setSliderPaused(true)}
        onMouseLeave={() => setSliderPaused(false)}
        className="rounded-3xl bg-slate-900 text-white overflow-hidden border border-slate-800 shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 relative min-h-[260px] md:min-h-[340px]">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-6 p-6 md:p-8 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="text-teal-300 font-semibold text-ui-min">
                Điểm nổi bật {slideIdx + 1} / {SLIDES.length}
              </div>
              <h2 className="font-bold text-white text-ui-lab">{currentSlide.title}</h2>
              <p className="text-slate-200 text-ui-body">{currentSlide.desc}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (currentSlide.action.type === 'lab') {
                    onOpenLab(currentSlide.action.labId);
                  } else {
                    onNavigatePage(currentSlide.action.page);
                  }
                }}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold inline-flex items-center gap-2 text-ui-min"
              >
                {currentSlide.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSlideIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
                  aria-label="Slide trước"
                  className="min-h-[44px] min-w-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white inline-flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Chuyển đến slide ${i + 1}`}
                      onClick={() => setSlideIdx(i)}
                      className={`h-3 rounded-full transition-all ${
                        i === slideIdx ? 'w-7 bg-teal-400' : 'w-3 bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSlideIdx((i) => (i + 1) % SLIDES.length)}
                  aria-label="Slide kế tiếp"
                  className="min-h-[44px] min-w-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white inline-flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GRADE 10, 11, 12 CARDS */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900 text-ui-section">Chương trình Sinh học THPT (GDPT 2018)</h2>
          <span className="text-slate-600 text-ui-min">Định hướng sách Kết nối tri thức với cuộc sống</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {([
            {
              grade: 10 as GradeLevel,
              page: 'grade10' as AppPage,
              title: 'Sinh học Lớp 10',
              subtitle: 'Tế bào – Chuyển hóa – Phân bào – Vi sinh vật & Virus',
              accent: 'bg-teal-700',
            },
            {
              grade: 11 as GradeLevel,
              page: 'grade11' as AppPage,
              title: 'Sinh học Lớp 11',
              subtitle: 'Quang hợp C3/C4/CAM – Tuần hoàn – Hô hấp – Cảm ứng & Miễn dịch',
              accent: 'bg-blue-600',
            },
            {
              grade: 12 as GradeLevel,
              page: 'grade12' as AppPage,
              title: 'Sinh học Lớp 12',
              subtitle: 'Di truyền phân tử – Mendel – Quần thể – Tiến hóa & Sinh thái',
              accent: 'bg-emerald-700',
            },
          ]).map((g) => {
            const count = CURRICULUM_LESSONS.filter((l) => l.grade === g.grade).length;
            return (
              <div
                key={g.grade}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-teal-500 transition-colors shadow-xs"
              >
                <div className="space-y-2">
                  <div className={`inline-block px-3 py-1 rounded-lg text-white font-bold text-ui-min ${g.accent}`}>
                    Khối {g.grade} · {count} bài học trọng tâm
                  </div>
                  <h3 className="font-bold text-slate-900 text-ui-card-title">{g.title}</h3>
                  <p className="text-slate-600 text-ui-body">{g.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigatePage(g.page)}
                  className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-900 font-semibold inline-flex items-center justify-center gap-2 transition-colors text-ui-min"
                >
                  Vào học Sinh học {g.grade}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 12 LABS CATALOG */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900 text-ui-section">Hệ thống 12 Phòng Lab 3D & Thí nghiệm Ảo</h2>
          <button
            type="button"
            onClick={() => onNavigatePage('labs')}
            className="min-h-[44px] px-4 py-2 rounded-lg text-teal-800 hover:bg-teal-50 font-semibold inline-flex items-center gap-1.5 text-ui-min"
          >
            Xem tất cả phòng Lab <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LAB_DEFINITIONS.map((lab) => (
            <button
              key={lab.id}
              type="button"
              onClick={() => onOpenLab(lab.id)}
              className="text-left bg-white border border-slate-200 hover:border-teal-600 rounded-2xl p-5 space-y-2.5 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-teal-800 text-ui-min">{lab.number}</span>
                  <span className="text-slate-600 font-medium text-ui-min">
                    Lớp {lab.grades.join(', ')}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-ui-card-title">{lab.title}</h3>
                <p className="text-slate-600 text-ui-min">{lab.shortDesc}</p>
              </div>
              <div className="pt-2 text-teal-700 font-semibold inline-flex items-center gap-1 text-ui-min">
                Mở phòng thí nghiệm <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* QUICK GUIDE FOR TEACHERS */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 text-ui-section inline-flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-700" />
            Hướng dẫn nhanh dành cho Giáo viên trình chiếu trên lớp
          </h2>
          <button
            type="button"
            onClick={() => onNavigatePage('guide')}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-ui-min"
          >
            Xem 17 tình huống giảng dạy chi tiết
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-ui-body">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Bước 1 · Chọn khối lớp hoặc Lab</div>
            <p className="text-slate-700">Mở bài học lớp 10–11–12 hoặc chọn thẳng một trong 12 phòng Lab 3D ở thanh điều hướng.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Bước 2 · Bật chế độ Trình chiếu</div>
            <p className="text-slate-700">Nhấn nút <em>Trình chiếu</em> trên góc phải để phóng to cỡ chữ từ 20–28px, hiển thị rõ trên tivi/máy chiếu.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Bước 3 · Tương tác & In phiếu</div>
            <p className="text-slate-700">Xoay, cắt lát mô hình 3D, điều chỉnh thông số mô phỏng và xuất hình PNG hoặc in phiếu học tập A4.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
