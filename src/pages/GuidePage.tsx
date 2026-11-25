import React from 'react';
import { ArrowRight, BookOpen, HelpCircle, Wind } from 'lucide-react';
import { AppPage, GradeLevel, LabId } from '../types/biology';
import { RespirationSimId } from '../data/respiration/respirationTypes';

interface GuidePageProps {
  onOpenLab: (labId: LabId, simId?: RespirationSimId) => void;
  onNavigatePage: (page: AppPage) => void;
  onOpenLesson?: (grade: GradeLevel, lessonId: string) => void;
}

const RESPIRATION_1_MINUTE_STEPS = [
  'Bước 1: Mở mục "Sinh học 11 → Bài 9. Hô hấp ở động vật" hoặc "Phòng Lab 3D → Lab 13: Hô hấp ở Động vật 3D".',
  'Bước 2: Chọn Mô phỏng 01 để xoay 360°, ẩn Lồng ngực/Màng phổi và nhấp vào 13 bộ phận giải phẫu (phổi phải 3 thùy, phổi trái 2 thùy).',
  'Bước 3: Chuyển sang Mô phỏng 02, nhấn Hít vào / Thở ra / Từng bước và chỉnh nhịp thở 8–40 lần/phút để quan sát cơ hoành cùng biểu đồ động.',
  'Bước 4: Chuyển lần lượt sang Mô phỏng 03 (Phế nang), 04 (Giun đất – Thủy tức), 05 (Ống khí Châu chấu), 06 (Mang cá ngược chiều), 07 (Phổi chim 2 chu kỳ) và 08 (Sức khỏe hô hấp).',
  'Bước 5: Mở mục "So sánh & Ghép loài" cho học sinh kéo thả 8 loài vật vào 4 cơ chế, sau đó luyện tập nhanh với 48 câu hỏi có giải thích.',
  'Bước 6: Bật chế độ "Trình chiếu" khi dạy trên máy chiếu/Tivi lớp học, và tải trước "Gói 15 · Sinh học 11 – Hô hấp ở động vật" trong Dữ liệu ngoại tuyến để dạy không cần mạng.',
];

interface GuideScenario {
  number: string;
  title: string;
  steps: string;
  actionLabel: string;
  target: { type: 'lab'; labId: LabId } | { type: 'page'; page: AppPage };
}

const GUIDE_SCENARIOS: GuideScenario[] = [
  { number: '01', title: 'Trình chiếu trên máy chiếu / Tivi lớp học', steps: 'Nhấn nút "Trình chiếu" trên thanh trên cùng hoặc trong Phòng Lab để phóng to chữ từ 20–28px; nhấn phím ESC để thoát nhanh.', actionLabel: 'Mở Phòng Lab trình chiếu', target: { type: 'lab', labId: 'cell' } },
  { number: '02', title: 'Tìm bài học hoặc mô hình không cần gõ dấu tiếng Việt', steps: 'Nhập từ khóa không dấu hoặc tiếng Anh vào ô Tìm kiếm ở Trang chủ (ví dụ: "ti the", "quang hop C4", "mitosis", "mang ca").', actionLabel: 'Về Trang chủ tìm kiếm', target: { type: 'page', page: 'home' } },
  { number: '03', title: 'Xoay, phóng to, cắt lát ngang/dọc và tách lớp cấu trúc 3D', steps: 'Mở tab "Quan sát" trong bất kỳ Phòng Lab nào để chọn 8 góc nhìn nhanh, kéo thanh Cắt lát ngang/dọc hoặc Tách lớp cấu trúc.', actionLabel: 'Thực hành với Tế bào 3D', target: { type: 'lab', labId: 'cell' } },
  { number: '04', title: 'Cô lập và phóng to riêng một bào quan / cơ quan', steps: 'Nhấp trực tiếp vào bộ phận trên mô hình 3D hoặc chọn trong tab "Thành phần", sau đó nhấn "Phóng to riêng" hoặc "Cô lập đối tượng".', actionLabel: 'Mở Giải phẫu người 3D', target: { type: 'lab', labId: 'anatomy' } },
  { number: '05', title: 'Chụp ảnh mô hình 3D chèn vào bài giảng PowerPoint', steps: 'Trong tab "Quan sát", chọn chất lượng cao rồi nhấn "Xuất hình ảnh PNG" để tải ảnh sắc nét ngay về máy.', actionLabel: 'Mở Lab Virus 3D', target: { type: 'lab', labId: 'virus' } },
  { number: '06', title: 'Soạn thảo công thức Sinh học không cần biết LaTeX', steps: 'Nhấp vào công thức trong bài học hoặc mở mục "Công thức và sơ đồ", chọn ký hiệu trên thanh 10 nhóm chuyên biệt rồi nhấn "Áp dụng".', actionLabel: 'Mở trình soạn công thức', target: { type: 'page', page: 'formulas' } },
  { number: '07', title: 'Xuất công thức ra file SVG hoặc PNG nền trong suốt', steps: 'Trong trình soạn công thức, chọn độ phân giải PNG 2x/3x và Nền trong suốt để chèn đè lên slide bài giảng đẹp mắt.', actionLabel: 'Thử xuất công thức ngay', target: { type: 'page', page: 'formulas' } },
  { number: '08', title: 'Vẽ sơ đồ lai, lưới thức ăn và chu trình Carbon/Nitrogen', steps: 'Chuyển sang tab "Trình tạo Sơ đồ Sinh học", chọn mẫu có sẵn, kéo thả các khối và nối mũi tên rồi xuất SVG/PNG.', actionLabel: 'Mở Trình tạo Sơ đồ', target: { type: 'page', page: 'diagrams' } },
  { number: '09', title: 'In phiếu học tập A4 cho học sinh làm trên lớp', steps: 'Mở bất kỳ bài học Lớp 10, 11 hoặc 12, nhấn nút "In phiếu học tập A4" ở góc trên để in bản giấy gọn sạch.', actionLabel: 'Xem bài học Sinh học 10', target: { type: 'page', page: 'grade10' } },
  { number: '10', title: 'Nhập trình tự DNA quan sát Phiên mã & Dịch mã tức thì', steps: 'Vào Lab 04, gõ chuỗi A/T/G/C, chọn mạch gốc hoặc mạch bổ sung để xem mRNA, chuỗi amino acid và đột biến thay thế/thêm/mất.', actionLabel: 'Thực hành Lab DNA & Protein', target: { type: 'lab', labId: 'molecular-bio' } },
  { number: '11', title: 'Xem cấu trúc phân tử thực tế từ RCSB PDB & AlphaFold', steps: 'Mở Lab 05: mẫu B-DNA 1BNA chạy sẵn không cần mạng; khi có Internet có thể tải Hemoglobin 1A3N, Insulin 1TRZ hoặc AlphaFold P69905.', actionLabel: 'Mở Trình xem Phân tử 3D', target: { type: 'lab', labId: 'molecular-viewer' } },
  { number: '12', title: 'Dạy bài Nguyên phân & Giảm phân với bảng NST chi tiết', steps: 'Vào Lab 06, đổi bộ NST 2n = 2, 4, 6 hoặc 8 và bấm "Từng bước" để học sinh đếm số NST đơn, NST kép, chromatid qua từng kì.', actionLabel: 'Mở Lab Phân bào 3D', target: { type: 'lab', labId: 'cell-division' } },
  { number: '13', title: 'So sánh quang hợp C3, C4 và CAM trực quan', steps: 'Mở Lab 07, chọn tab "Quang hợp C3 – C4 – CAM", điều chỉnh ánh sáng, CO₂, nhiệt độ và quan sát phân tách không gian/thời gian.', actionLabel: 'Mở Lab Sinh lí Thực vật', target: { type: 'lab', labId: 'plant-physiology' } },
  { number: '14', title: 'Kiểm chứng định luật Mendel & Hardy–Weinberg bằng số liệu', steps: 'Mở Lab 09, dùng bảng Punnett, bấm "Gieo phép lai" với 2000 cá thể hoặc nhập số liệu AA, Aa, aa để tính kiểm định χ² tự động.', actionLabel: 'Mở Lab Di truyền học', target: { type: 'lab', labId: 'genetics' } },
  { number: '15', title: 'So sánh 2 kịch bản Tiến hóa (Chọn lọc vs Phiêu bạt)', steps: 'Mở Lab 10, chạy một kịch bản và nhấn "Lưu làm Kịch bản B để so sánh", sau đó đổi kích thước quần thể N để đối chiếu đường đồ thị.', actionLabel: 'Mở Lab Tiến hóa Quần thể', target: { type: 'lab', labId: 'evolution' } },
  { number: '16', title: 'Hướng dẫn thí nghiệm ảo theo đúng quy trình an toàn', steps: 'Vào Lab 12, chọn 1 trong 7 thí nghiệm (Lugol, Biuret, Benedict, Amylase...). Học sinh phải bấm đúng thứ tự từng bước phản ứng mới xảy ra.', actionLabel: 'Mở Lab Thực nghiệm Ảo', target: { type: 'lab', labId: 'experiments' } },
  { number: '17', title: 'Cài đặt ứng dụng & tải gói dữ liệu dùng khi mất mạng (Offline)', steps: 'Nhấn "Cài đặt ứng dụng" ở thanh trên cùng và tải trước 15 gói dữ liệu trong mục "Dữ liệu ngoại tuyến" để dạy học không cần Internet.', actionLabel: 'Mở Quản lí Ngoại tuyến', target: { type: 'page', page: 'offline' } },
];

export const GuidePage: React.FC<GuidePageProps> = ({
  onOpenLab,
  onNavigatePage,
  onOpenLesson,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
        <h1 className="font-bold text-slate-900 text-ui-page inline-flex items-center gap-2.5">
          <HelpCircle className="w-8 h-8 text-teal-700" />
          Hướng dẫn Sử dụng Dành cho Giáo viên & Học sinh
        </h1>
        <p className="text-slate-700 text-ui-body">
          Hướng dẫn nhanh 1 phút cho chuyên đề Hô hấp ở động vật cùng 17 tình huống thực tế giúp thầy cô sử dụng thành thạo SINH HỌC SMART 3D ngay từ tiết dạy đầu tiên.
        </p>
      </div>

      {/* Featured 1-minute Quick Start for Animal Respiration */}
      <section className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold text-teal-950 text-xl inline-flex items-center gap-2">
            <Wind className="w-6 h-6 text-teal-700" />
            Khám phá hệ hô hấp trong 1 phút (Sinh học 11 · Bài 9)
          </h2>
          <div className="flex flex-wrap gap-2">
            {onOpenLesson && (
              <button
                type="button"
                onClick={() => onOpenLesson(11, 'bio11-respiration')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-teal-400 text-teal-900 hover:bg-teal-100 font-bold inline-flex items-center gap-2 text-[15px]"
              >
                <BookOpen className="w-4 h-4" /> Mở Bài 9 (SGK 11)
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenLab('respiration', 'human-anatomy')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-bold inline-flex items-center gap-2 text-[15px]"
            >
              Mở 8 Mô phỏng Hô hấp 3D <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[15px] text-teal-950">
          {RESPIRATION_1_MINUTE_STEPS.map((step, idx) => (
            <li
              key={idx}
              className="bg-white/90 border border-teal-200 rounded-xl p-3.5 leading-relaxed font-medium"
            >
              {step}
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDE_SCENARIOS.map((g) => (
          <div
            key={g.number}
            className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="font-bold text-teal-800 text-ui-min">Tình huống {g.number}</div>
              <h2 className="font-bold text-slate-900 text-ui-card-title">{g.title}</h2>
              <p className="text-slate-700 text-ui-body">{g.steps}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (g.target.type === 'lab') {
                  onOpenLab(g.target.labId);
                } else {
                  onNavigatePage(g.target.page);
                }
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-semibold inline-flex items-center justify-center gap-2 text-ui-min self-start"
            >
              {g.actionLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
