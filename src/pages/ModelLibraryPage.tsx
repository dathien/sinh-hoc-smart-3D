import React, { useMemo, useState } from 'react';
import { ArrowRight, Box, Search } from 'lucide-react';
import { LAB_DEFINITIONS } from '../data/labsMeta';
import { RespirationSimId } from '../data/respiration/respirationTypes';
import { GradeLevel, LabId } from '../types/biology';
import { matchesSearchQuery } from '../utils/vietnameseSearch';

interface ModelCatalogItem {
  id: string;
  name: string;
  englishName: string;
  grade: GradeLevel | 'all';
  category: string;
  dataType: string;
  description: string;
  labId: LabId;
  simId?: RespirationSimId;
}

const MODEL_CATALOG: ModelCatalogItem[] = [
  { id: 'm-animal-cell', name: 'Tế bào động vật 3D', englishName: 'Eukaryotic Animal Cell', grade: 10, category: 'Tế bào học', dataType: 'Mô hình giản lược sư phạm', description: 'Nhân, nhân con, ti thể, lưới nội chất, bộ máy Golgi, lysosome, trung thể, màng sinh chất.', labId: 'cell' },
  { id: 'm-plant-cell', name: 'Tế bào thực vật 3D', englishName: 'Plant Cell', grade: 10, category: 'Tế bào học', dataType: 'Mô hình giản lược sư phạm', description: 'Thành tế bào cellulose, không bào trung tâm lớn, lục lạp, nhân, ti thể.', labId: 'cell' },
  { id: 'm-bacteria', name: 'Tế bào vi khuẩn (Nhân sơ)', englishName: 'Prokaryotic Cell', grade: 10, category: 'Tế bào học', dataType: 'Mô hình giản lược sư phạm', description: 'Vùng nhân DNA vòng, plasmid, ribosome 70S, màng nhầy (bật/tắt), tiên mao (bật/tắt).', labId: 'cell' },
  { id: 'm-mito', name: 'Cấu trúc Ti thể', englishName: 'Mitochondrion', grade: 10, category: 'Bào quan', dataType: 'Mô hình giản lược sư phạm', description: 'Màng ngoài trơn, màng trong gấp nếp tạo mào (cristae), chất nền, DNA vòng.', labId: 'cell' },
  { id: 'm-chloro', name: 'Cấu trúc Lục lạp', englishName: 'Chloroplast', grade: 10, category: 'Bào quan', dataType: 'Mô hình giản lược sư phạm', description: 'Màng kép, hệ thống túi thylakoid xếp chồng thành hạt grana, chất nền stroma.', labId: 'cell' },
  { id: 'm-membrane', name: 'Màng sinh chất Khảm – Động', englishName: 'Fluid Mosaic Bilayer', grade: 10, category: 'Vận chuyển qua màng', dataType: 'Mô hình giản lược sư phạm', description: 'Lớp kép phospholipid, protein xuyên màng, kênh ion và 6 chế độ vận chuyển.', labId: 'cell' },
  { id: 'm-t4', name: 'Thể thực khuẩn T4', englishName: 'Bacteriophage T4', grade: 10, category: 'Virus & Vi sinh', dataType: 'Mô hình giản lược sư phạm', description: 'Đầu capsid khối 20 mặt kéo dài, bao đuôi co rút, đĩa gốc và 6 sợi đuôi.', labId: 'virus' },
  { id: 'm-sars', name: 'Virus SARS-CoV-2', englishName: 'Coronavirus', grade: 10, category: 'Virus & Vi sinh', dataType: 'Mô hình giản lược sư phạm', description: 'Gai glycoprotein S, vỏ ngoài lipid và lõi nucleocapsid xoắn ssRNA (+).', labId: 'virus' },
  { id: 'm-hiv', name: 'Virus HIV-1 (Retrovirus)', englishName: 'HIV-1', grade: 10, category: 'Virus & Vi sinh', dataType: 'Mô hình giản lược sư phạm', description: 'Gai gp120, vỏ ngoài lipid, capsid hình nón p24, 2 bản sao ssRNA và enzyme phiên mã ngược.', labId: 'virus' },
  { id: 'm-1bna', name: 'Phân tử B-DNA thực (PDB 1BNA)', englishName: 'Drew-Dickerson B-DNA', grade: 12, category: 'Phân tử sinh học thực', dataType: 'Mô hình dữ liệu khoa học thực', description: 'Cấu trúc tinh thể tia X độ phân giải nguyên tử của đoạn DNA xoắn kép (hiển thị qua 3Dmol.js).', labId: 'molecular-viewer' },
  { id: 'm-1a3n', name: 'Hemoglobin gắn O₂ (PDB 1A3N)', englishName: 'Human Hemoglobin', grade: 11, category: 'Phân tử sinh học thực', dataType: 'Mô hình dữ liệu khoa học thực', description: 'Cấu trúc bậc 4 gồm 4 chuỗi polypeptide và 4 nhân Heme.', labId: 'molecular-viewer' },
  { id: 'm-af-hb', name: 'Alpha-Hemoglobin dự đoán (AlphaFold P69905)', englishName: 'AlphaFold Prediction', grade: 12, category: 'Phân tử sinh học dự đoán', dataType: 'Mô hình khoa học dự đoán', description: 'Mô hình dự đoán AI kèm thang tin cậy pLDDT từng amino acid.', labId: 'molecular-viewer' },
  { id: 'm-heart', name: 'Tim người & Chu kì tim', englishName: 'Human Heart & Cardiac Cycle', grade: 11, category: 'Giải phẫu & Sinh lí người', dataType: 'Mô hình giản lược sư phạm', description: '4 ngăn tim, van nhĩ thất, van bán nguyệt, điều chỉnh nhịp 40–150 lần/phút.', labId: 'anatomy' },
  { id: 'm-lung', name: 'Phổi – Khí quản – Cơ hoành (Giải phẫu nhanh)', englishName: 'Lungs & Diaphragm', grade: 11, category: 'Giải phẫu & Sinh lí người', dataType: 'Mô hình giản lược sư phạm', description: 'Mô phỏng nhịp hít vào – thở ra và trao đổi khí O₂ – CO₂ trong Lab Giải phẫu.', labId: 'anatomy' },
  { id: 'm-resp-01', name: 'Hệ hô hấp người 13 thành phần (Bài 9)', englishName: 'Human Respiratory Anatomy (13 Parts)', grade: 11, category: 'Hô hấp ở động vật', dataType: 'Mô hình giản lược sư phạm', description: 'Khoang mũi, hầu, thanh quản, khí quản, phế quản, tiểu phế quản, phổi phải 3 thùy, phổi trái 2 thùy, phế nang, màng phổi, cơ hoành, lồng ngực, cơ liên sườn.', labId: 'respiration', simId: 'human-anatomy' },
  { id: 'm-resp-02', name: 'Cơ chế hít vào & thở ra + Biểu đồ động', englishName: 'Breathing Mechanics & Pressure Graph', grade: 11, category: 'Hô hấp ở động vật', dataType: 'Mô phỏng định lượng', description: 'Đồng bộ cơ hoành, cơ liên sườn ngoài, xương sườn, thể tích phổi và áp suất phế nang (nhịp thở 8–40 lần/phút).', labId: 'respiration', simId: 'breathing-mechanics' },
  { id: 'm-resp-03', name: 'Trao đổi khí tại Phế nang – Mao mạch', englishName: 'Alveolar Gas Exchange 3D', grade: 11, category: 'Hô hấp ở động vật', dataType: 'Mô phỏng định tính', description: 'Phóng đại phế nang, hàng rào trao đổi khí, hồng cầu đổi màu đỏ sẫm → đỏ sáng, khuếch tán O₂/CO₂.', labId: 'respiration', simId: 'alveolar-exchange' },
  { id: 'm-resp-04', name: 'Trao đổi khí qua bề mặt cơ thể (Giun đất & Thủy tức)', englishName: 'Body Surface Gas Exchange', grade: 11, category: 'Hô hấp ở động vật', dataType: 'Mô hình giản lược sư phạm', description: 'So sánh da ẩm có mao mạch dưới da ở giun đất (chỉnh độ ẩm) và khuếch tán trực tiếp không hệ tuần hoàn ở thủy tức.', labId: 'respiration', simId: 'body-surface' },
  { id: 'm-resp-05', name: 'Hệ thống ống khí ở Châu chấu', englishName: 'Insect Tracheal System 3D', grade: 11, category: 'Hô hấp ở động vật', dataType: 'Mô hình giản lược sư phạm', description: 'Lỗ thở đóng mở, ống khí và phóng đại ống khí nhỏ đưa O₂ trực tiếp tới từng tế bào cơ.', labId: 'respiration', simId: 'tracheal-system' },
  { id: 'm-resp-06', name: 'Mang cá xương & Dòng chảy ngược chiều', englishName: 'Fish Gills & Countercurrent Exchange', grade: 11, category: 'Hô hấp ở động vật', dataType: 'Mô phỏng định lượng', description: 'Hoạt động miệng – nắp mang, 4 cung mang, phóng đại phiến mang so sánh ngược chiều vs cùng chiều.', labId: 'respiration', simId: 'fish-gills' },
  { id: 'm-resp-07', name: 'Hệ hô hấp ở Chim (Phổi ống khí & Túi khí)', englishName: 'Avian Unidirectional Respiration', grade: 11, category: 'Hô hấp ở động vật', dataType: 'Mô hình giản lược sư phạm', description: 'Theo dõi gói khí đi một chiều qua phổi không phồng xẹp trong 2 chu kỳ hô hấp (4 giai đoạn) nhờ túi khí trước – sau.', labId: 'respiration', simId: 'avian-respiration' },
  { id: 'm-resp-08', name: 'Bảo vệ sức khỏe hô hấp (Lông chuyển – Chất nhầy)', englishName: 'Mucociliary Airway Clearance', grade: 11, category: 'Hô hấp ở động vật', dataType: 'Mô phỏng định tính', description: '4 tình huống sư phạm: Đường thở khỏe mạnh, khói thuốc lá, bụi ô nhiễm không khí và luyện tập thể dục.', labId: 'respiration', simId: 'respiratory-health' },
  { id: 'm-mitosis', name: 'Chu trình Phân bào (Nguyên phân & Giảm phân)', englishName: 'Mitosis & Meiosis 3D', grade: 10, category: 'Phân bào', dataType: 'Mô hình giản lược sư phạm', description: 'Theo dõi NST đơn/kép và trao đổi chéo cho bộ 2n = 2, 4, 6, 8.', labId: 'cell-division' },
  { id: 'm-plant-c4', name: 'Quang hợp C3 – C4 – CAM & Mạch dẫn', englishName: 'Plant Physiology 3D', grade: 11, category: 'Sinh lí Thực vật', dataType: 'Mô hình giản lược sư phạm', description: 'Rễ, mạch gỗ, mạch rây, khí khổng, mô giậu và bao bó mạch.', labId: 'plant-physiology' },
  { id: 'm-nephron', name: 'Đơn vị thận (Nephron) & Synapse', englishName: 'Nephron & Chemical Synapse', grade: 11, category: 'Sinh lí Động vật', dataType: 'Mô hình giản lược sư phạm', description: 'Lọc cầu thận, tái hấp thụ ống thận và truyền xung qua khe synapse.', labId: 'animal-physiology' },
  { id: 'm-eco', name: '5 Hệ sinh thái 3D', englishName: '3D Ecosystems', grade: 12, category: 'Sinh thái học', dataType: 'Mô hình giản lược sư phạm', description: 'Rừng nhiệt đới, ao hồ, thảo nguyên, biển và ruộng lúa nông nghiệp.', labId: 'ecology' },
];

interface ModelLibraryPageProps {
  onOpenLab: (labId: LabId, simId?: RespirationSimId) => void;
}

export const ModelLibraryPage: React.FC<ModelLibraryPageProps> = ({ onOpenLab }) => {
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | GradeLevel>('all');

  const filtered = useMemo(() => {
    return MODEL_CATALOG.filter((m) => {
      const gradeOk = gradeFilter === 'all' || m.grade === gradeFilter;
      const qOk = matchesSearchQuery(query, m.name, m.englishName, m.category, m.description);
      return gradeOk && qOk;
    });
  }, [query, gradeFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-slate-900 text-ui-page">Thư viện Mô hình Sinh học 3D</h1>
            <p className="text-slate-600 text-ui-body">
              Tra cứu nhanh toàn bộ mô hình cấu trúc giải phẫu, hô hấp ở động vật, tế bào, virus, phân tử thực PDB/AlphaFold và hệ sinh thái.
            </p>
          </div>
          <div className="text-slate-600 font-medium text-ui-min">
            {filtered.length} / {MODEL_CATALOG.length} mô hình
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Lọc theo tên mô hình (vd: phổi, mang cá, ống khí, túi khí, giun đất, ti the, 1BNA)..."
              className="w-full min-h-[46px] pl-11 pr-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-ui-body"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['all', 10, 11, 12] as const).map((g) => (
              <button
                key={String(g)}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={`min-h-[44px] px-4 py-2 rounded-lg font-semibold text-ui-min ${
                  gradeFilter === g ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {g === 'all' ? 'Tất cả khối' : `Lớp ${g}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const labMeta = LAB_DEFINITIONS.find((l) => l.id === item.labId);
          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-teal-500 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-ui-min">
                  <span className="font-semibold text-teal-800">{item.category}</span>
                  <span className="text-slate-600 font-medium">Lớp {item.grade}</span>
                </div>
                <h2 className="font-bold text-slate-900 text-ui-card-title flex items-start gap-2">
                  <Box className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                  <span>{item.name}</span>
                </h2>
                <div className="text-slate-500 text-ui-min">{item.englishName}</div>
                <p className="text-slate-700 text-ui-min">{item.description}</p>
                <div className="text-slate-600 font-medium text-ui-min pt-1">
                  Loại dữ liệu: {item.dataType}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenLab(item.labId, item.simId)}
                className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-semibold inline-flex items-center justify-center gap-2 text-ui-min"
              >
                Mở trong {labMeta?.number ?? 'Phòng Lab'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
