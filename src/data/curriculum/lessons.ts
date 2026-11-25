import { LessonData } from '../../types/biology';

export const CURRICULUM_LESSONS: LessonData[] = [
  // ==================== LỚP 10 ====================
  {
    id: 'bio10-chem-comp',
    grade: 10,
    topicCode: 'Chủ đề A. Sinh học tế bào',
    topicName: 'Thành phần hóa học của tế bào',
    title: 'Các phân tử sinh học: Nước, Carbohydrate, Lipid, Protein, Nucleic acid',
    englishKeywords: ['water', 'carbohydrate', 'lipid', 'protein', 'nucleic acid', 'atp', 'dna', 'rna'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 10 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Nêu được vai trò sinh học của nước và các nguyên tố hóa học trong tế bào.',
      'Trình bày được cấu tạo đơn phân, liên kết hóa học và chức năng của Carbohydrate, Lipid, Protein và Nucleic acid.',
      'Vận dụng kiến thức nhận biết tinh bột, protein, đường khử trong thí nghiệm thực hành.',
    ],
    coreKnowledge: [
      {
        heading: 'Nước và liên kết hydrogen',
        points: [
          'Phân tử nước (H₂O) có tính phân cực do nguyên tử O tích điện âm nhẹ và hai nguyên tử H tích điện dương nhẹ.',
          'Giữa các phân tử nước hình thành liên kết hydrogen giúp nước làm dung môi hòa tan, điều hòa nhiệt và môi trường phản ứng.',
        ],
        formulaLatex: '\\mathrm{H_2O}\\;\\text{(phân cực)} \\rightarrow \\text{Liên kết hydrogen}',
      },
      {
        heading: 'Bốn đại phân tử hữu cơ chính',
        points: [
          'Carbohydrate: Đơn phân là đường đơn (glucose C₆H₁₂O₆), nguồn cung cấp năng lượng và cấu trúc thành tế bào thực vật (cellulose).',
          'Lipid: Kị nước, gồm mỡ (triglyceride), phospholipid (cấu tạo màng sinh chất), steroid.',
          'Protein: Đa phân cấu tạo từ amino acid liên kết bằng liên kết peptide; cấu trúc 4 bậc quyết định chức năng.',
          'Nucleic acid (DNA, RNA): Đa phân gồm các đơn phân nucleotide (đường 5C, nhóm phosphate, nitrogenous base).',
        ],
        formulaLatex: '\\mathrm{C_6H_{12}O_6} + 6\\mathrm{O_2} \\rightarrow 6\\mathrm{CO_2} + 6\\mathrm{H_2O} + \\text{Năng lượng}',
      },
    ],
    glossary: [
      { term: 'Đơn phân', english: 'Monomer', definition: 'Đơn vị cấu trúc nhỏ nhất lặp lại tạo nên đại phân tử đa phân.' },
      { term: 'Liên kết peptide', english: 'Peptide bond', definition: 'Liên kết cộng hóa trị nối nhóm carboxyl của amino acid này với nhóm amino của amino acid kế tiếp.' },
    ],
    relatedLabId: 'experiments',
    activities: [
      {
        id: 'act-10-1',
        phase: 'Thực hành',
        title: 'Thí nghiệm ảo nhận biết Tinh bột, Protein và Glucose',
        objective: 'Quan sát hiện tượng đổi màu đặc trưng với thuốc thử Lugol, Biuret và Benedict.',
        task: 'Mở Phòng Lab 12 – Thực nghiệm Sinh học, chọn ống nghiệm chứa dung dịch tinh bột, lòng trắng trứng và glucose rồi nhỏ từng thuốc thử phù hợp.',
        guide: 'Thực hiện đúng trình tự cho mẫu thử → nhỏ thuốc thử → đun nóng (với Benedict).',
        expectedProduct: 'Bảng ghi nhận màu sắc kết tủa/dung dịch của 3 mẫu thử.',
        teacherScript: 'Thầy cô hướng dẫn học sinh dự đoán màu trước khi nhỏ thuốc thử để rèn kĩ năng quan sát thực nghiệm.',
        rubric: 'Thực hiện đủ 3 phản ứng và giải thích đúng bản chất hóa sinh.',
      },
    ],
    questions: [
      {
        id: 'q-10-1',
        level: 'Thông hiểu',
        type: 'Giải thích',
        question: 'Tại sao khi đun nóng quá cao hoặc thay đổi pH đột ngột, protein lại bị mất chức năng sinh học?',
        answer: 'Nhiệt độ cao và pH bất thường phá vỡ các liên kết yếu (liên kết hydrogen, tương tác kị nước, cầu nối ion) duy trì cấu trúc không gian bậc 3, bậc 4 của protein, gây biến tính.',
        teacherNote: 'Liên hệ hiện tượng đông tụ lòng trắng trứng khi luộc.',
      },
    ],
    rememberNotes: [
      'Nước là dung môi vạn năng cho các phản ứng sinh hóa trong tế bào.',
      'Protein có chức năng đa dạng nhất nhờ cấu trúc không gian đặc thù từ 20 loại amino acid.',
    ],
  },
  {
    id: 'bio10-cell-struct',
    grade: 10,
    topicCode: 'Chủ đề A. Sinh học tế bào',
    topicName: 'Cấu trúc tế bào nhân sơ và tế bào nhân thực',
    title: 'Tế bào nhân sơ, tế bào động vật và tế bào thực vật',
    englishKeywords: ['cell', 'prokaryote', 'eukaryote', 'mitochondria', 'chloroplast', 'ribosome', 'golgi', 'ti thể', 'lục lạp'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 10 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Phân biệt được cấu trúc tế bào nhân sơ (vi khuẩn) và tế bào nhân thực.',
      'Nhận diện được các bào quan trên mô hình 3D: Nhân, Ti thể, Lục lạp, Lưới nội chất, Bộ máy Golgi, Ribosome, Lysosome, Không bào.',
      'So sánh được điểm giống và khác nhau giữa tế bào động vật và tế bào thực vật.',
    ],
    coreKnowledge: [
      {
        heading: 'Tế bào nhân sơ (Vi khuẩn)',
        points: [
          'Chưa có màng nhân hoàn chỉnh, vật chất di truyền là DNA vòng nằm ở vùng nhân.',
          'Không có các bào quan có màng bao bọc; chỉ có ribosome 70S; có thành tế bào peptidoglycan.',
          'Một số loài có thêm vỏ nhầy, roi hoặc lông bám tùy thích nghi sinh học.',
        ],
      },
      {
        heading: 'Tế bào nhân thực (Động vật & Thực vật)',
        points: [
          'Có nhân hoàn chỉnh được bao bọc bởi màng nhân kép và hệ thống nội màng phát triển.',
          'Tế bào thực vật có thành cellulose, lục lạp quang hợp, không bào trung tâm lớn và cầu sinh chất; không có trung thể (ở thực vật bậc cao) và lysosome điển hình như động vật.',
          'Tế bào động vật có trung thể và lysosome thực hiện tiêu hóa nội bào; không có thành tế bào và lục lạp.',
        ],
      },
    ],
    glossary: [
      { term: 'Ti thể', english: 'Mitochondrion', definition: 'Bào quan có màng kép, màng trong gấp nếp tạo mào (cristae), nơi diễn ra hô hấp tế bào tạo ATP.' },
      { term: 'Lục lạp', english: 'Chloroplast', definition: 'Bào quan đặc trưng ở thực vật và tảo, chứa diệp lục thực hiện quang hợp.' },
    ],
    relatedLabId: 'cell',
    activities: [
      {
        id: 'act-10-2',
        phase: 'Khám phá',
        title: 'Khám phá cấu trúc bên trong 3 loại tế bào 3D',
        objective: 'Nhận diện và cô lập từng bào quan bằng thao tác cắt lát 3D.',
        task: 'Mở Phòng Lab 02 – Thế giới Tế bào 3D, lần lượt chọn Tế bào động vật, Tế bào thực vật, Tế bào vi khuẩn và kéo thanh Cắt lát ngang.',
        guide: 'Nhấp trực tiếp vào Ti thể, Lục lạp, Bộ máy Golgi để đọc cấu tạo và nhấn "Cô lập đối tượng".',
        expectedProduct: 'Bảng so sánh 5 bào quan giữa tế bào nhân sơ, động vật và thực vật.',
        teacherScript: 'Nhấn mạnh không phải vi khuẩn nào cũng có vỏ nhầy hay roi; học sinh cần phân biệt đặc điểm chung và đặc điểm tùy loài.',
        rubric: 'Xác định đúng tên, vị trí và chức năng ít nhất 6 bào quan.',
      },
    ],
    questions: [
      {
        id: 'q-10-2',
        level: 'Thông hiểu',
        type: 'So sánh',
        question: 'Nêu 3 điểm khác biệt cấu trúc cơ bản giữa tế bào thực vật và tế bào động vật quan sát được trên mô hình 3D.',
        answer: 'Tế bào thực vật có: (1) Thành tế bào bằng cellulose; (2) Lục lạp quang hợp; (3) Không bào trung tâm lớn. Tế bào động vật không có các cấu trúc này nhưng có trung thể và lysosome.',
        teacherNote: 'Cho học sinh bật chế độ so sánh hoặc chuyển đổi nhanh giữa 2 mô hình trên máy chiếu.',
      },
    ],
    rememberNotes: [
      'Mọi sinh vật đều cấu tạo từ tế bào; tế bào nhân sơ chưa có màng nhân.',
      'Mỗi bào quan đảm nhận một chức năng chuyên biệt phối hợp nhịp nhàng trong tế bào nhân thực.',
    ],
  },
  {
    id: 'bio10-transport-energy',
    grade: 10,
    topicCode: 'Chủ đề A. Sinh học tế bào',
    topicName: 'Trao đổi chất qua màng và chuyển hóa năng lượng',
    title: 'Vận chuyển qua màng sinh chất, Enzyme, Quang hợp và Hô hấp tế bào',
    englishKeywords: ['membrane', 'osmosis', 'diffusion', 'enzyme', 'atp', 'photosynthesis', 'respiration', 'thẩm thấu', 'co nguyên sinh'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 10 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Phân biệt được vận chuyển thụ động (khuếch tán, thẩm thấu) và vận chuyển chủ động qua màng.',
      'Giải thích được hiện tượng co nguyên sinh và phản co nguyên sinh ở tế bào thực vật.',
      'Viết được phương trình tổng quát quang hợp, hô hấp và cơ chế xúc tác enzyme.',
    ],
    coreKnowledge: [
      {
        heading: 'Vận chuyển các chất qua màng sinh chất',
        points: [
          'Vận chuyển thụ động: Khuếch tán đơn giản, khuếch tán được hỗ trợ và thẩm thấu theo chiều gradient nồng độ, không tiêu tốn ATP.',
          'Vận chuyển chủ động: Ngược chiều gradient nồng độ qua bơm protein màng và tiêu tốn ATP.',
          'Nhập bào, xuất bào: Vận chuyển đại phân tử nhờ biến dạng màng sinh chất.',
        ],
      },
      {
        heading: 'Co và phản co nguyên sinh ở tế bào thực vật',
        points: [
          'Trong môi trường ưu trương, nước thoát ra khỏi tế bào thực vật làm khối nguyên sinh co lại và tách khỏi thành tế bào.',
          'Khi chuyển sang môi trường nhược trương, nước đi vào giúp khối nguyên sinh trương trở lại (phản co nguyên sinh).',
        ],
        formulaLatex: 'E + S \\rightleftharpoons ES \\rightarrow E + P',
      },
    ],
    glossary: [
      { term: 'Thẩm thấu', english: 'Osmosis', definition: 'Sự khuếch tán của các phân tử nước qua màng bán thấm từ nơi thế nước cao đến nơi thế nước thấp.' },
      { term: 'Co nguyên sinh', english: 'Plasmolysis', definition: 'Hiện tượng màng sinh chất tách khỏi thành tế bào thực vật khi mất nước trong môi trường ưu trương.' },
    ],
    relatedLabId: 'cell',
    activities: [
      {
        id: 'act-10-3',
        phase: 'Dự đoán',
        title: 'Mô phỏng vận chuyển qua màng và Co nguyên sinh',
        objective: 'Quan sát hướng di chuyển của phân tử nước và chất tan khi thay đổi nồng độ.',
        task: 'Trong Phòng Lab 02, chuyển sang chế độ Mô phỏng Vận chuyển qua màng và Co nguyên sinh; chọn lần lượt môi trường ưu trương, đẳng trương, nhược trương.',
        guide: 'Thay đổi chênh lệch nồng độ và theo dõi lượng phân tử qua kênh protein.',
        expectedProduct: 'Nhận xét sự thay đổi thể tích không bào và khối nguyên sinh ở tế bào thực vật.',
        teacherScript: 'Lưu ý nhấn mạnh co nguyên sinh là hiện tượng quan sát rõ ở tế bào có thành cứng như tế bào thực vật.',
        rubric: 'Giải thích đúng hướng di chuyển của nước trong cả 3 loại môi trường.',
      },
    ],
    questions: [
      {
        id: 'q-10-3',
        level: 'Vận dụng',
        type: 'Giải thích',
        question: 'Vì sao khi ngâm rau sống trong nước muối quá mặn, lá rau nhanh chóng bị héo mềm?',
        answer: 'Nước muối đậm đặc là môi trường ưu trương so với dịch bào tế bào rau, khiến nước thẩm thấu ra ngoài tế bào, gây hiện tượng co nguyên sinh và làm mất sức trương của mô lá.',
        teacherNote: 'Gợi ý học sinh đối chiếu với mô phỏng co nguyên sinh trong Lab 02.',
      },
    ],
    rememberNotes: [
      'ATP là đồng tiền năng lượng của tế bào; Enzyme làm giảm năng lượng hoạt hóa của phản ứng.',
      'Thẩm thấu là sự di chuyển thụ động của nước qua màng bán thấm.',
    ],
  },
  {
    id: 'bio10-cell-division',
    grade: 10,
    topicCode: 'Chủ đề A. Sinh học tế bào',
    topicName: 'Chu kì tế bào và phân bào',
    title: 'Chu kì tế bào, Nguyên phân và Giảm phân',
    englishKeywords: ['mitosis', 'meiosis', 'chromosome', 'chromatid', 'nguyên phân', 'giảm phân', 'phân bào'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 10 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Mô tả được các pha của chu kì tế bào (G1, S, G2, M) và diễn biến các kì của nguyên phân, giảm phân.',
      'Xác định chính xác số lượng NST, trạng thái NST (đơn/kép) và số chromatid qua từng kì.',
      'Giải thích được ý nghĩa của tiếp hợp, trao đổi chéo trong giảm phân tạo biến dị tổ hợp.',
    ],
    coreKnowledge: [
      {
        heading: 'Nguyên phân (Mitosis)',
        points: [
          'Từ 1 tế bào mẹ (2n) tạo ra 2 tế bào con có bộ NST giống hệt nhau và giống mẹ (2n).',
          'Kì giữa: NST kép xếp thành 1 hàng trên mặt phẳng xích đạo của thoi phân bào.',
          'Kì sau: Mỗi NST kép tách thành 2 NST đơn phân li về 2 cực tế bào (trong 1 tế bào đang phân chia tạm thời có 4n NST đơn).',
        ],
      },
      {
        heading: 'Giảm phân (Meiosis)',
        points: [
          'Gồm 2 lần phân bào liên tiếp (Giảm phân I và Giảm phân II) từ 1 tế bào 2n tạo 4 tế bào con đơn bội (n).',
          'Kì đầu I có hiện tượng tiếp hợp và có thể xảy ra trao đổi chéo giữa các chromatid khác nguồn trong cặp NST tương đồng.',
          'Kì sau I phân li các NST kép trong cặp tương đồng; Kì sau II phân li các chromatid chị em.',
        ],
      },
    ],
    glossary: [
      { term: 'Chromatid', english: 'Chromatid', definition: 'Mỗi sợi trong hai sợi giống hệt nhau của một nhiễm sắc thể kép gắn nhau tại tâm động.' },
      { term: 'Trao đổi chéo', english: 'Crossing over', definition: 'Sự trao đổi đoạn giữa các chromatid không chị em của cặp NST tương đồng ở kì đầu I.' },
    ],
    relatedLabId: 'cell-division',
    activities: [
      {
        id: 'act-10-4',
        phase: 'Dự đoán',
        title: 'Theo dõi biến động NST và Chromatid khi phân bào 3D',
        objective: 'Phân biệt số lượng NST, trạng thái đơn/kép và số chromatid trên từng tế bào.',
        task: 'Mở Phòng Lab 06 – Phân bào, chọn bộ NST 2n = 4, dự đoán số NST ở Kì sau nguyên phân trước khi bấm Chạy từng bước.',
        guide: 'Quan sát bảng thông số đồng bộ dưới mô hình 3D khi chuyển từng kì.',
        expectedProduct: 'Bảng ghi chép trạng thái NST qua Kì đầu, giữa, sau, cuối của Nguyên phân và Giảm phân.',
        teacherScript: 'Nhấn mạnh quy ước đếm tâm động để xác định số NST và đếm sợi kép để xác định số chromatid.',
        rubric: 'Không nhầm lẫn giữa số NST đơn (4n) và số chromatid (0) ở Kì sau nguyên phân.',
      },
    ],
    questions: [
      {
        id: 'q-10-4',
        level: 'Thông hiểu',
        type: 'Phân tích',
        question: 'Một tế bào sinh dục chín có bộ NST 2n = 8 đang ở kì giữa I của giảm phân. Xác định số NST, trạng thái NST và số chromatid trong tế bào đó.',
        answer: 'Trong tế bào đang phân chia có 8 NST ở trạng thái kép, xếp thành 4 cặp tương đồng trên 2 hàng mặt phẳng xích đạo, tổng cộng có 16 chromatid.',
        teacherNote: 'Chú ý phân biệt số lượng tính trên 1 tế bào đang phân chia với trên mỗi tế bào con.',
      },
    ],
    rememberNotes: [
      'Nguyên phân duy trì ổn định bộ NST qua các thế hệ tế bào sinh dưỡng.',
      'Giảm phân kết hợp thụ tinh là cơ chế tạo biến dị tổ hợp phong phú ở loài sinh sản hữu tính.',
    ],
  },
  {
    id: 'bio10-virus-micro',
    grade: 10,
    topicCode: 'Chủ đề B. Vi sinh vật và Virus',
    topicName: 'Sinh trưởng vi sinh vật và Cấu trúc, nhân lên của Virus',
    title: 'Sinh trưởng của quần thể vi khuẩn và Chu trình nhân lên của Virus',
    englishKeywords: ['virus', 'bacteriophage', 't4', 'sars-cov-2', 'hiv', 'vi sinh vật', 'chu trình tan'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 10 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Phân tích được 4 pha sinh trưởng của quần thể vi khuẩn trong nuôi cấy không liên tục.',
      'Phân biệt được virus có vỏ ngoài, virus trần, cấu trúc xoắn, khối và phức tạp.',
      'Trình bày được 5 giai đoạn chu trình nhân lên của thể thực khuẩn T4.',
    ],
    coreKnowledge: [
      {
        heading: '4 pha sinh trưởng của vi khuẩn (Nuôi cấy không liên tục)',
        points: [
          'Pha tiềm phát (Lag): Vi khuẩn thích nghi môi trường, tổng hợp enzyme, số lượng chưa tăng.',
          'Pha lũy thừa (Log): Tốc độ phân chia đạt cực đại theo cấp số nhân.',
          'Pha cân bằng: Số tế bào sinh ra tương đương số tế bào chết đi.',
          'Pha suy vong: Chất dinh dưỡng cạn kiệt, chất độc tích lũy làm số tế bào sống giảm.',
        ],
      },
      {
        heading: 'Cấu trúc và chu trình tan của Virus',
        points: [
          'Virus cấu tạo gồm lõi nucleic acid (DNA hoặc RNA) và vỏ capsid (protein); một số có thêm vỏ ngoài (envelope) gắn gai glycoprotein.',
          'Chu trình tan gồm 5 bước: Hấp phụ → Xâm nhập → Sinh tổng hợp → Lắp ráp → Giải phóng (làm tan tế bào chủ).',
        ],
      },
    ],
    glossary: [
      { term: 'Capsid', english: 'Capsid', definition: 'Lớp vỏ protein bao bọc bảo vệ lõi vật chất di truyền của virus, cấu tạo từ các đơn vị capsomere.' },
      { term: 'Thể thực khuẩn', english: 'Bacteriophage', definition: 'Virus kí sinh chuyên biệt trên tế bào vi khuẩn.' },
    ],
    relatedLabId: 'virus',
    activities: [
      {
        id: 'act-10-5',
        phase: 'Khám phá',
        title: 'So sánh 6 cấu trúc Virus 3D và mô phỏng chu trình tan T4',
        objective: 'Nhận diện cấu trúc xoắn (TMV), cấu trúc khối (Adenovirus), có vỏ ngoài (SARS-CoV-2, HIV-1, Cúm A) và phức tạp (T4).',
        task: 'Mở Phòng Lab 03 – Virus và Vi sinh vật, ẩn vỏ ngoài của SARS-CoV-2 để quan sát lõi RNA, sau đó chuyển sang hoạt cảnh 5 bước Chu trình tan T4.',
        guide: 'Sử dụng nút Từng bước để dừng tại mỗi giai đoạn xâm nhập và lắp ráp.',
        expectedProduct: 'Phiếu phân loại 6 loại virus theo hình thái capsid, vỏ ngoài và loại nucleic acid.',
        teacherScript: 'Nhấn mạnh sự khác biệt giữa virus trần và virus có vỏ ngoài trong khả năng nhạy cảm với chất tẩy rửa.',
        rubric: 'Phân loại chính xác cả 6 virus và nêu đúng trình tự 5 giai đoạn.',
      },
    ],
    questions: [
      {
        id: 'q-10-5',
        level: 'Vận dụng',
        type: 'Giải thích',
        question: 'Trong sản xuất sinh khối vi sinh vật từ nuôi cấy không liên tục, nên thu hoạch ở cuối pha nào để đạt năng suất cao nhất?',
        answer: 'Nên thu hoạch ở cuối pha lũy thừa – đầu pha cân bằng vì lúc này số lượng tế bào sống đạt mức tối đa và tốc độ sinh trưởng mạnh nhất.',
        teacherNote: 'Cho học sinh thử nghiệm trên biểu đồ mô phỏng Lab 03.',
      },
    ],
    rememberNotes: [
      'Virus là thực thể chưa có cấu tạo tế bào, sống kí sinh nội bào bắt buộc.',
      'Nuôi cấy liên tục bổ sung dinh dưỡng và lấy đi sản phẩm giúp duy trì pha lũy thừa.',
    ],
  },

  // ==================== LỚP 11 ====================
  {
    id: 'bio11-plant-transport-photo',
    grade: 11,
    topicCode: 'Chủ đề A. Trao đổi chất và chuyển hóa năng lượng',
    topicName: 'Trao đổi nước, khoáng và Quang hợp ở thực vật',
    title: 'Vận chuyển nước, đóng mở khí khổng và Quang hợp C3, C4, CAM',
    englishKeywords: ['plant', 'xylem', 'phloem', 'stomata', 'photosynthesis', 'c3', 'c4', 'cam', 'quang hợp', 'khí khổng'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 11 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Mô tả được con đường hấp thụ nước ở lông hút và vận chuyển theo mạch gỗ, mạch rây.',
      'Giải thích được cơ chế đóng mở khí khổng và vai trò thoát hơi nước.',
      'Phân biệt đúng con đường cố định CO₂ ở thực vật C₃, C₄ (tách biệt không gian) và CAM (tách biệt thời gian).',
    ],
    coreKnowledge: [
      {
        heading: 'Dòng mạch gỗ và dòng mạch rây',
        points: [
          'Mạch gỗ (Xylem): Vận chuyển nước và ion khoáng một chiều từ rễ lên thân, lá nhờ lực đẩy rễ, lực liên kết nước và lực hút do thoát hơi nước ở lá.',
          'Mạch rây (Phloem): Vận chuyển chất hữu cơ (chủ yếu sucrose) từ cơ quan nguồn (lá) đến cơ quan chứa (rễ, củ, quả).',
        ],
      },
      {
        heading: 'So sánh Quang hợp C₃, C₄ và CAM',
        points: [
          'C₃ (lúa, đậu...): Cố định CO₂ trực tiếp qua chu trình Calvin nhờ enzyme Rubisco tạo sản phẩm đầu tiên APG (3C).',
          'C₄ (ngô, mía...): Tách biệt về KHÔNG GIAN — cố định CO₂ sơ cấp ở tế bào mô giậu (nhờ PEP-carboxylase tạo AOA 4C), chu trình Calvin ở tế bào bao bó mạch.',
          'CAM (xương rồng, dứa...): Tách biệt về THỜI GIAN — mở khí khổng cố định CO₂ vào BAN ĐÊM, thực hiện chu trình Calvin vào BAN NGÀY khi khí khổng đóng để tiết kiệm nước.',
        ],
        formulaLatex: '6\\mathrm{CO_2} + 6\\mathrm{H_2O} \\xrightarrow{\\text{Ánh sáng, diệp lục}} \\mathrm{C_6H_{12}O_6} + 6\\mathrm{O_2}',
      },
    ],
    glossary: [
      { term: 'Khí khổng', english: 'Stoma', definition: 'Cấu trúc gồm 2 tế bào hình hạt đậu trên biểu bì lá giúp trao đổi khí và thoát hơi nước.' },
      { term: 'Chu trình Calvin', english: 'Calvin cycle', definition: 'Chuỗi phản ứng khử CO₂ thành carbohydrate diễn ra ở chất nền (stroma) lục lạp.' },
    ],
    relatedLabId: 'plant-physiology',
    activities: [
      {
        id: 'act-11-1',
        phase: 'Thực hành',
        title: 'Điều chỉnh ánh sáng, CO₂ và nhiệt độ trên mô hình Quang hợp 3D',
        objective: 'Quan sát phản ứng đóng mở khí khổng và đồ thị cường độ quang hợp mô phỏng của C₃, C₄, CAM.',
        task: 'Mở Phòng Lab 07 – Sinh lí Thực vật, tăng nhiệt độ lên 38°C và giảm độ ẩm không khí; quan sát khí khổng và đường cong quang hợp.',
        guide: 'Chuyển đổi giữa chế độ C₃, C₄, CAM để thấy sự khác biệt về điểm bão hòa ánh sáng và thích nghi khô hạn.',
        expectedProduct: 'Bảng so sánh C₃, C₄ và CAM về tế bào thực hiện và thời gian cố định CO₂.',
        teacherScript: 'Nhắc học sinh không đồng nhất C₄ với CAM: C₄ tách biệt không gian, CAM tách biệt thời gian.',
        rubric: 'Nêu đúng nguyên nhân thích nghi của thực vật CAM ở vùng sa mạc khô hạn.',
      },
    ],
    questions: [
      {
        id: 'q-11-1',
        level: 'Thông hiểu',
        type: 'So sánh',
        question: 'Điểm khác nhau căn bản về mặt thích nghi chống hô hấp sáng và mất nước giữa thực vật C₄ và thực vật CAM là gì?',
        answer: 'Thực vật C₄ phân tách 2 giai đoạn cố định CO₂ theo không gian (tế bào mô giậu và tế bào bao bó mạch), thích nghi cường độ sáng và nhiệt độ cao; thực vật CAM phân tách theo thời gian (đêm cố định CO₂, ngày đóng khí khổng chạy chu trình Calvin) để hạn chế mất nước.',
        teacherNote: 'Dùng biểu đồ so sánh trong Lab 07 để minh họa trực quan.',
      },
    ],
    rememberNotes: [
      'Thoát hơi nước là động lực đầu trên của dòng mạch gỗ và giúp hạ nhiệt bề mặt lá.',
      'Thực vật C₄ tách biệt không gian; thực vật CAM tách biệt thời gian cố định CO₂.',
    ],
  },
  {
    id: 'bio11-animal-phys',
    grade: 11,
    topicCode: 'Chủ đề A & B. Sinh lí động vật',
    topicName: 'Tuần hoàn, Hô hấp, Bài tiết, Cảm ứng và Miễn dịch',
    title: 'Chu kì tim, Trao đổi khí phổi, Lọc máu Nephron và Truyền tin Synapse',
    englishKeywords: ['tim', 'phổi', 'nephron', 'synapse', 'miễn dịch', 'tuần hoàn', 'heart', 'lung'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 11 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Mô tả được đường đi của máu qua 4 ngăn tim và phân biệt máu giàu/nghèo oxygen.',
      'Trình bày được cơ chế thông khí ở phổi nhờ cơ hoành và lồng ngực.',
      'Giải thích được quá trình truyền xung thần kinh qua synapse hóa học.',
    ],
    coreKnowledge: [
      {
        heading: 'Tuần hoàn máu và Chu kì tim',
        points: [
          'Chu kì tim gồm 3 pha: Pha co tâm nhĩ → Pha co tâm thất → Pha giãn chung.',
          'Động mạch phổi dẫn máu NGHÈO O₂ từ tâm thất phải lên phổi; Tĩnh mạch phổi dẫn máu GIÀU O₂ từ phổi về tâm nhĩ trái.',
          'Không phải mọi động mạch đều chứa máu giàu O₂ và không phải mọi tĩnh mạch đều chứa máu nghèo O₂.',
        ],
        formulaLatex: 'Q = V_{\\text{tâm thu}} \\times f_{\\text{nhịp tim}}',
      },
      {
        heading: 'Truyền tin qua Synapse hóa học',
        points: [
          'Xung thần kinh đến chùy synapse làm mở kênh Ca²⁺; ion Ca²⁺ đi vào kích thích túi chứa chất truyền tin (như acetylcholine) hòa màng và giải phóng vào khe synapse.',
          'Chất truyền tin gắn vào thụ thể màng sau synapse gây mở kênh ion (Na⁺) làm khử cực và lan truyền xung thần kinh.',
        ],
      },
    ],
    glossary: [
      { term: 'Synapse', english: 'Synapse', definition: 'Diện tiếp xúc giữa tế bào thần kinh với tế bào thần kinh hoặc với tế bào cơ, tuyến.' },
      { term: 'Nephron', english: 'Nephron', definition: 'Đơn vị cấu tạo và chức năng lọc máu tạo nước tiểu của thận.' },
    ],
    relatedLabId: 'anatomy',
    activities: [
      {
        id: 'act-11-2',
        phase: 'Khám phá',
        title: 'Điều chỉnh nhịp tim mô phỏng và quan sát dòng máu 3D',
        objective: 'Nhận biết 4 ngăn tim, van tim, đường đi máu giàu/nghèo O₂ và chuyển động cơ hoành.',
        task: 'Mở Phòng Lab 01 – Giải phẫu người 3D, chạy mô phỏng Tim đập và thử thay đổi nhịp tim minh họa từ 72 lên 120 lần/phút; sau đó chuyển sang mô phỏng Phổi.',
        guide: 'Nhấp vào Tâm thất trái, Động mạch phổi, Tĩnh mạch phổi để kiểm tra màu sắc theo nồng độ O₂.',
        expectedProduct: 'Sơ đồ đường đi của máu trong vòng tuần hoàn nhỏ và vòng tuần hoàn lớn.',
        teacherScript: 'Lưu ý nhắc học sinh: nhịp tim trên phần mềm là thông số mô phỏng dạy học, không dùng chẩn đoán y khoa.',
        rubric: 'Phân biệt chính xác loại máu trong động mạch phổi và tĩnh mạch phổi.',
      },
    ],
    questions: [
      {
        id: 'q-11-2',
        level: 'Nhận biết',
        type: 'Nhận diện thành phần',
        question: 'Trong hệ tuần hoàn kép ở người, mạch máu nào mang máu nghèo O₂ rời tim đi trao đổi khí?',
        answer: 'Động mạch phổi mang máu nghèo O₂ từ tâm thất phải lên phổi.',
        teacherNote: 'Mở Lab 01 hoặc Lab 08 để học sinh quan sát trực tiếp dòng hạt màu xanh ở động mạch phổi.',
      },
    ],
    rememberNotes: [
      'Màu sắc mạch máu trong sinh lí học biểu thị mức độ giàu hay nghèo O₂.',
      'Thông tin truyền qua synapse hóa học theo một chiều nhờ chất truyền tin và thụ thể đặc hiệu.',
    ],
  },
  {
    id: 'bio11-respiration',
    grade: 11,
    topicCode: 'Chủ đề A. Trao đổi chất và chuyển hóa năng lượng ở sinh vật',
    topicName: 'Hô hấp ở động vật',
    title: 'Bài 9. Hô hấp ở động vật',
    englishKeywords: [
      'hô hấp',
      'phổi',
      'khí quản',
      'phế nang',
      'cơ hoành',
      'hít vào',
      'thở ra',
      'mang cá',
      'ống khí',
      'túi khí',
      'trao đổi khí',
      'châu chấu',
      'giun đất',
      'thủy tức',
      'chim',
      'respiration',
      'alveoli',
      'gills',
      'trachea',
    ],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 – Sinh học 11 (định hướng bộ sách Kết nối tri thức với cuộc sống). Mô hình 3D và ngân hàng 48 câu hỏi tự biên soạn phục vụ dạy học trực quan.',
    objectives: [
      'Trình bày được vai trò của hô hấp ở động vật và phân biệt rõ trao đổi khí (hô hấp ngoài) với hô hấp tế bào.',
      'Phân tích được 4 hình thức trao đổi khí chủ yếu ở động vật: qua bề mặt cơ thể, qua hệ thống ống khí, qua mang và qua phổi (người và chim).',
      'Mô tả được cấu tạo 13 thành phần hệ hô hấp người, cơ chế thông khí (hít vào – thở ra) và trao đổi khí tại phế nang.',
      'Giải thích được ưu thế của dòng chảy ngược chiều ở mang cá và thông khí một chiều qua phổi nhờ túi khí ở chim.',
      'Đề xuất được các biện pháp bảo vệ sức khỏe hệ hô hấp và phòng tránh tác hại của khói thuốc lá, ô nhiễm không khí.',
    ],
    coreKnowledge: [
      {
        heading: '1. Vai trò của hô hấp và 4 hình thức trao đổi khí ở động vật',
        points: [
          'Hô hấp giúp động vật lấy O₂ từ môi trường cung cấp cho hô hấp tế bào tạo năng lượng ATP và thải CO₂ sinh ra từ tế bào ra môi trường.',
          'Bề mặt trao đổi khí hiệu quả cần có diện tích lớn, mỏng và luôn ẩm ướt, có sự lưu thông khí/nước và (ở nhóm có tuần hoàn) giàu mao mạch có sắc tố hô hấp.',
          '4 hình thức trao đổi khí chính: Qua bề mặt cơ thể (Thủy tức – không có hệ tuần hoàn; Giun đất – da ẩm có mao mạch dưới da), Qua hệ thống ống khí (Châu chấu – đưa O₂ trực tiếp tới tế bào), Qua mang (Cá xương – dòng nước và máu ngược chiều), Qua phổi (Thú/Người – phế nang; Chim – ống khí và hệ túi khí).',
        ],
        formulaLatex: '\\Delta P_{\\mathrm{O_2}} = P_{\\mathrm{O_2}\\,(\\text{phế nang})} - P_{\\mathrm{O_2}\\,(\\text{mao mạch})} > 0',
      },
      {
        heading: '2. Cấu tạo hệ hô hấp người, Cơ chế thông khí và Trao đổi khí tại phế nang',
        points: [
          'Đường dẫn khí gồm Khoang mũi → Hầu → Thanh quản → Khí quản → Phế quản → Tiểu phế quản dẫn khí tới hai lá phổi (Phổi phải 3 thùy, Phổi trái 2 thùy) chứa hàng trăm triệu Phế nang.',
          'Hít vào (chủ động): Cơ hoành co hạ xuống + cơ liên sườn ngoài co nâng xương sườn → thể tích lồng ngực tăng → áp suất phế nang nhỏ hơn áp suất khí quyển → khí đi vào phổi.',
          'Thở ra bình thường (thụ động): Cơ hoành và cơ liên sườn ngoài dãn + tính đàn hồi của phổi → thể tích lồng ngực giảm → áp suất phế nang lớn hơn áp suất khí quyển → khí đi ra ngoài.',
          'Tại phế nang: O₂ khuếch tán từ phế nang vào máu gắn Hemoglobin (đỏ sẫm → đỏ sáng); CO₂ khuếch tán ngược lại từ máu ra phế nang.',
        ],
        formulaLatex: '\\mathrm{Hb} + 4\\mathrm{O_2} \\rightleftharpoons \\mathrm{Hb(O_2)_4}',
      },
      {
        heading: '3. Đặc điểm thích nghi cao ở Mang cá, Phổi chim và Bảo vệ sức khỏe hô hấp',
        points: [
          'Cá xương: Miệng và nắp mang đóng mở nhịp nhàng tạo dòng nước 1 chiều; dòng máu trong mao mạch phiến mang chảy NGƯỢC CHIỀU dòng nước giúp duy trì chênh lệch phân áp O₂ suốt phiến mang.',
          'Chim: Phổi gồm hệ thống ống khí song song (không phồng xẹp như phổi người) phối hợp túi khí trước và túi khí sau giúp không khí giàu O₂ đi một chiều qua phổi trong 2 chu kỳ hô hấp (4 giai đoạn).',
          'Bảo vệ sức khỏe hô hấp: Không hút thuốc lá, tránh hít khói thuốc thụ động, giảm tiếp xúc bụi mịn ô nhiễm, giữ vệ sinh đường thở và tập thể dục thể thao đều đặn.',
        ],
      },
    ],
    glossary: [
      { term: 'Phế nang', english: 'Alveoli', definition: 'Các túi khí siêu nhỏ có thành mỏng ẩm và mạng mao mạch dày đặc — bề mặt trao đổi khí chính ở phổi người và thú.' },
      { term: 'Cơ hoành', english: 'Diaphragm', definition: 'Tấm cơ vân hình vòm ngăn khoang ngực và khoang bụng, co hạ xuống khi hít vào và dãn nâng lên khi thở ra bình thường.' },
      { term: 'Dòng chảy ngược chiều', english: 'Countercurrent exchange', definition: 'Cơ chế dòng máu trong mao mạch mang cá chảy ngược chiều dòng nước giúp tối ưu hóa chênh lệch phân áp O₂.' },
      { term: 'Hệ thống ống khí', english: 'Tracheal system', definition: 'Mạng lỗ thở, ống khí và ống khí nhỏ ở côn trùng đưa O₂ trực tiếp đến từng tế bào mà không cần máu vận chuyển chính.' },
      { term: 'Túi khí ở chim', english: 'Avian air sacs', definition: 'Các túi khí trước và sau co giãn như ống bễ đẩy không khí lưu thông một chiều qua phổi chim.' },
      { term: 'Lông chuyển & Chất nhầy', english: 'Mucociliary escalator', definition: 'Hệ thống tự làm sạch đường dẫn khí giúp giữ lại và đẩy bụi bẩn, vi sinh vật ra ngoài.' },
    ],
    relatedLabId: 'respiration',
    activities: [
      {
        id: 'act-11-resp-1',
        phase: 'Khám phá',
        title: 'Khám phá 13 bộ phận hệ hô hấp người và cơ chế hít vào – thở ra',
        objective: 'Nhận biết đủ 13 thành phần giải phẫu hệ hô hấp và liên hệ co/dãn cơ hô hấp với biến thiên thể tích – áp suất phế nang.',
        task: 'Mở Mô phỏng 01 và Mô phỏng 02 ngay trong tab "Mô hình 3D" hoặc "Mô phỏng" của bài học, quan sát 3 thùy phổi phải, 2 thùy phổi trái, cơ hoành và biểu đồ động.',
        guide: 'Dùng thanh Tách lớp cấu trúc và nút Hít vào / Thở ra / Từng bước để đọc giá trị áp suất phế nang tại 3 thời điểm đặc trưng.',
        expectedProduct: 'Sơ đồ đường đi không khí và bảng tóm tắt trạng thái cơ hoành – cơ liên sườn – áp suất khi hít vào và thở ra.',
        teacherScript: 'Nhấn mạnh thở ra bình thường là quá trình thụ động (dãn cơ + đàn hồi phổi) và lưu ý nhịp thở trên mô phỏng chỉ phục vụ dạy học.',
        rubric: 'Phân biệt chính xác hít vào chủ động và thở ra bình thường thụ động.',
      },
      {
        id: 'act-11-resp-2',
        phase: 'Thực hành',
        title: 'So sánh 4 hình thức trao đổi khí và ghép loài động vật',
        objective: 'Đối chiếu cấu tạo thích nghi của Giun đất, Thủy tức, Châu chấu, Cá xương, Chim và Người.',
        task: 'Hoàn thành Bảng so sánh tương tác và Hoạt động kéo – thả ghép 8 loài động vật với 4 hình thức trao đổi khí ngay bên dưới.',
        guide: 'Mở trực tiếp từng mô phỏng 04, 05, 06, 07 khi cần kiểm chứng cấu tạo thực tế của từng loài.',
        expectedProduct: 'Hoàn thành chính xác 8/8 loài trong hoạt động ghép nối và giải thích được đặc điểm thích nghi của từng nhóm.',
        teacherScript: 'Lưu ý phân biệt rõ: Thủy tức không có hệ tuần hoàn, Châu chấu dẫn O₂ thẳng tới tế bào, Phổi chim không phồng xẹp.',
        rubric: 'Giải thích đúng vai trò độ ẩm da giun đất, dòng chảy ngược chiều mang cá và 2 chu kỳ hô hấp ở chim.',
      },
    ],
    questions: [
      {
        id: 'q-11-resp-1',
        level: 'Thông hiểu',
        type: 'Giải thích',
        question: 'Tại sao khi cá lên cạn lại nhanh chóng chết ngạt dù hàm lượng O₂ trong không khí cao hơn nhiều so với trong nước?',
        answer: 'Khi lên cạn, các phiến mang mất lực đẩy nâng đỡ của nước nên dính bết lại với nhau làm diện tích bề mặt trao đổi khí giảm đột ngột, đồng thời bề mặt mang nhanh chóng bị khô khiến O₂ không thể hòa tan để khuếch tán vào máu.',
        teacherNote: 'Mở Mô phỏng 06 (Trao đổi khí qua mang) để học sinh quan sát cấu trúc sợi mang và phiến mang mỏng xếp sát nhau.',
      },
      {
        id: 'q-11-resp-2',
        level: 'Vận dụng',
        type: 'So sánh',
        question: 'So sánh vai trò của hệ tuần hoàn trong việc vận chuyển O₂ ở Giun đất, Thủy tức và Châu chấu.',
        answer: 'Giun đất có mạng mao mạch dưới da (hệ tuần hoàn kín) vận chuyển O₂ từ da vào mô; Thủy tức chưa có hệ tuần hoàn nên O₂ khuếch tán trực tiếp qua thành 2 lớp tế bào; Châu chấu có hệ tuần hoàn hở nhưng O₂ được hệ ống khí nhỏ dẫn trực tiếp đến từng tế bào mà không dựa vào máu.',
        teacherNote: 'Mở lần lượt Mô phỏng 04 (Giun đất / Thủy tức) và Mô phỏng 05 (Châu chấu) để học sinh trực tiếp đối chiếu.',
      },
    ],
    rememberNotes: [
      'Không nhầm lẫn trao đổi khí (hô hấp ngoài) với hô hấp tế bào (tạo ATP trong tế bào).',
      'Thở ra bình thường ở người là quá trình thụ động nhờ cơ hoành – cơ liên sườn ngoài dãn và tính đàn hồi của phổi.',
      'Mang cá tối ưu nhờ dòng máu chảy ngược chiều dòng nước; phổi chim tối ưu nhờ dòng khí một chiều qua ống khí nhờ hệ túi khí.',
      'Bảo vệ hệ hô hấp bắt đầu từ không hút thuốc lá, giảm tiếp xúc khói bụi và luyện tập thể thao đều đặn.',
    ],
  },

  // ==================== LỚP 12 ====================
  {
    id: 'bio12-molecular-genetics',
    grade: 12,
    topicCode: 'Chủ đề A. Di truyền học',
    topicName: 'Cơ sở phân tử của sự di truyền và biến dị',
    title: 'Tái bản DNA, Phiên mã, Dịch mã, Điều hòa Operon lac và Đột biến gene',
    englishKeywords: ['dna', 'rna', 'mrna', 'tái bản', 'phiên mã', 'dịch mã', 'operon lac', 'đột biến', 'aug'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 12 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Mô tả được cấu trúc DNA hai mạch đối song song và cơ chế tái bản DNA theo nguyên tắc bổ sung, bán bảo toàn.',
      'Thực hiện được quy trình phiên mã từ mạch khuôn 3′→5′ sang mRNA 5′→3′ và dịch mã thành chuỗi amino acid.',
      'Phân tích được cơ chế điều hòa Operon lac ở E. coli khi có và không có lactose.',
    ],
    coreKnowledge: [
      {
        heading: 'Cơ chế truyền thông tin di truyền',
        points: [
          'Tái bản DNA: Enzyme DNA polymerase chỉ tổng hợp mạch mới theo chiều 5′→3′; một mạch tổng hợp liên tục, một mạch tổng hợp gián đoạn thành các đoạn Okazaki rồi được ligase nối lại.',
          'Phiên mã: Enzyme RNA polymerase trượt trên mạch khuôn 3′→5′ tổng hợp mRNA 5′→3′ (A–U, T–A, G–C, C–G).',
          'Dịch mã: Ribosome trượt trên mRNA từ codon mở đầu 5′-AUG-3′ đến khi gặp codon kết thúc (UAA, UAG, UGA). Codon kết thúc không mã hóa amino acid.',
        ],
        formulaLatex: '\\mathrm{DNA} \\xrightarrow{\\text{Phiên mã}} \\mathrm{mRNA} \\xrightarrow{\\text{Dịch mã}} \\mathrm{Polypeptide}',
      },
      {
        heading: 'Đột biến gene và Operon lac',
        points: [
          'Đột biến thay thế một cặp nucleotide có thể làm thay đổi 1 amino acid, không đổi (đột biến đồng nghĩa) hoặc tạo codon kết thúc sớm.',
          'Đột biến thêm hoặc mất 1 cặp nucleotide gây dịch khung đọc từ vị trí đột biến trở về sau.',
        ],
      },
    ],
    glossary: [
      { term: 'Đoạn Okazaki', english: 'Okazaki fragment', definition: 'Các đoạn DNA ngắn được tổng hợp gián đoạn theo chiều 5′→3′ trên mạch khuôn 5′→3′.' },
      { term: 'Operon lac', english: 'Lac operon', definition: 'Cụm gene cấu trúc (lacZ, lacY, lacA) có chung vùng điều hòa P, O tham gia chuyển hóa lactose ở vi khuẩn E. coli.' },
    ],
    relatedLabId: 'molecular-bio',
    activities: [
      {
        id: 'act-12-1',
        phase: 'Thực hành',
        title: 'Giải mã trình tự DNA và kiểm chứng hậu quả đột biến dịch khung',
        objective: 'Xác định mạch khuôn, mRNA, chuỗi amino acid và so sánh trước/sau đột biến.',
        task: 'Mở Phòng Lab 04 – DNA, RNA và Protein, nhập trình tự mạch mã hóa 5′-ATGGCCAAATAG-3′, quan sát chuỗi amino acid; sau đó thử chế độ Đột biến mất 1 nucleotide.',
        guide: 'Kiểm tra bảng mã 64 codon và chế độ khung đọc từ AUG.',
        expectedProduct: 'Bản đối chiếu trình tự trước và sau đột biến thay thế/mất nucleotide.',
        teacherScript: 'Lưu ý học sinh chiều 5′→3′ của mạch mã hóa khớp với chiều mRNA (chỉ thay T bằng U), còn mạch khuôn có chiều 3′→5′.',
        rubric: 'Dịch đúng chuỗi amino acid và dừng tại codon kết thúc không gắn amino acid.',
      },
    ],
    questions: [
      {
        id: 'q-12-1',
        level: 'Vận dụng',
        type: 'Phân tích',
        question: 'Tại sao đột biến mất 1 cặp nucleotide ở gần đầu vùng mã hóa thường gây hậu quả nghiêm trọng hơn đột biến thay thế 1 cặp nucleotide ở cùng vị trí?',
        answer: 'Đột biến mất 1 cặp nucleotide làm dịch toàn bộ khung đọc các bộ ba từ vị trí đột biến trở về sau, dẫn tới thay đổi hàng loạt amino acid hoặc xuất hiện sớm codon kết thúc; trong khi thay thế thường chỉ ảnh hưởng tối đa 1 codon.',
        teacherNote: 'Cho học sinh thử nghiệm trực tiếp trên công cụ so sánh đột biến của Lab 04.',
      },
    ],
    rememberNotes: [
      'A liên kết T bằng 2 liên kết hydrogen; G liên kết C bằng 3 liên kết hydrogen.',
      'Codon kết thúc (UAA, UAG, UGA) là tín hiệu dừng dịch mã, không mã hóa amino acid.',
    ],
  },
  {
    id: 'bio12-genetics-hw',
    grade: 12,
    topicCode: 'Chủ đề A. Di truyền học',
    topicName: 'Các quy luật di truyền và Di truyền quần thể',
    title: 'Quy luật Mendel, Hoán vị gene, Liên kết giới tính và Cân bằng Hardy–Weinberg',
    englishKeywords: ['mendel', 'punnett', 'hardy-weinberg', 'hoán vị gene', 'giới tính', 'quần thể', 'allele'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 12 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Lập được bảng Punnett và tính tỉ lệ kiểu gene, kiểu hình cho phép lai 1 cặp, 2 cặp, hoán vị gene và liên kết giới tính.',
      'Tính được tần số allele, cấu trúc kiểu gene và kiểm định cân bằng Hardy–Weinberg.',
      'Nêu đủ 5 điều kiện nghiệm đúng của định luật Hardy–Weinberg.',
    ],
    coreKnowledge: [
      {
        heading: 'Các quy luật di truyền ở mức cơ thể',
        points: [
          'Không áp dụng một tỉ lệ Mendel (3:1 hoặc 9:3:3:1) cho mọi phép lai; cần xác định đúng quy luật chi phối (trội không hoàn toàn, tương tác gene, liên kết/hoán vị, liên kết giới tính, di truyền ngoài nhân).',
          'Di truyền ngoài nhân (gene ti thể, lục lạp): Con sinh ra có kiểu hình giống mẹ (di truyền theo dòng mẹ).',
        ],
        formulaLatex: 'P:\\; X^A X^a \\times X^a Y \\rightarrow F_1:\\; 1\\; X^A X^a : 1\\; X^a X^a : 1\\; X^A Y : 1\\; X^a Y',
      },
      {
        heading: 'Cấu trúc di truyền quần thể ngẫu phối',
        points: [
          'Tần số allele: p + q = 1.',
          'Quần thể đạt cân bằng Hardy–Weinberg khi thỏa mãn 5 điều kiện: kích thước lớn, ngẫu phối, không đột biến, không chọn lọc tự nhiên, không di nhập gene.',
          'Khi cân bằng: cấu trúc di truyền là p² AA + 2pq Aa + q² aa = 1.',
        ],
        formulaLatex: 'p^2 + 2pq + q^2 = 1',
      },
    ],
    glossary: [
      { term: 'Hoán vị gene', english: 'Gene recombination', definition: 'Sự đổi chỗ các allele giữa các NST tương đồng trong giảm phân với tần số f ≤ 50%.' },
      { term: 'Cân bằng Hardy–Weinberg', english: 'Hardy–Weinberg equilibrium', definition: 'Trạng thái quần thể ngẫu phối có tần số allele và thành phần kiểu gene duy trì không đổi qua các thế hệ.' },
    ],
    relatedLabId: 'genetics',
    activities: [
      {
        id: 'act-12-2',
        phase: 'Thực hành',
        title: 'Kiểm định cân bằng Hardy–Weinberg và Mô phỏng phép lai ngẫu nhiên',
        objective: 'Phân biệt số liệu kiểu gene quan sát thực tế và số liệu kì vọng khi cân bằng.',
        task: 'Mở Phòng Lab 09 – Di truyền học, nhập số lượng cá thể AA = 45, Aa = 30, aa = 25 vào máy tính Hardy–Weinberg để kiểm tra quần thể có đang cân bằng không.',
        guide: 'Quan sát giá trị χ² và biểu đồ cột so sánh giữa Quan sát với Kì vọng cân bằng.',
        expectedProduct: 'Kết luận trạng thái cân bằng của quần thể mẫu dựa trên p, q và χ².',
        teacherScript: 'Nhấn mạnh với học sinh rằng một quần thể tự nhiên có thể đang KHÔNG cân bằng; phải kiểm tra chứ không mặc định p²:2pq:q².',
        rubric: 'Tính đúng p, q và phân biệt đúng tần số quan sát với tần số kì vọng.',
      },
    ],
    questions: [
      {
        id: 'q-12-2',
        level: 'Thông hiểu',
        type: 'Phân tích',
        question: 'Một quần thể có 40% AA, 40% Aa, 20% aa. Quần thể này đã cân bằng di truyền chưa? Vì sao?',
        answer: 'Chưa cân bằng. Tần số allele p(A) = 0,4 + 0,4/2 = 0,6 và q(a) = 0,4. Theo Hardy–Weinberg, tỉ lệ kì vọng khi cân bằng phải là 0,36 AA : 0,48 Aa : 0,16 aa, khác với cấu trúc hiện tại.',
        teacherNote: 'Nhập trực tiếp số liệu này vào Lab 09 để lớp đối chiếu kết quả.',
      },
    ],
    rememberNotes: [
      'Cần kiểm tra điều kiện cân bằng trước khi áp dụng công thức p² + 2pq + q² = 1.',
      'Di truyền ngoài nhân cho kết quả phép lai thuận nghịch khác nhau, con mang tính trạng của mẹ.',
    ],
  },
  {
    id: 'bio12-evolution-ecology',
    grade: 12,
    topicCode: 'Chủ đề B & C. Tiến hóa và Sinh thái học',
    topicName: 'Nhân tố tiến hóa, Quần thể và Hệ sinh thái',
    title: 'Chọn lọc tự nhiên, Phiêu bạt di truyền, Chuỗi thức ăn và Chu trình sinh địa hóa',
    englishKeywords: ['evolution', 'ecology', 'tiến hóa', 'sinh thái', 'chọn lọc tự nhiên', 'chuỗi thức ăn', 'tháp sinh thái'],
    textbookAlignmentNote: 'Nội dung bám sát khung Chương trình GDPT 2018 Sinh học 12 (định hướng bộ sách Kết nối tri thức với cuộc sống).',
    objectives: [
      'Giải thích được vai trò của chọn lọc tự nhiên và phiêu bạt di truyền trong làm thay đổi tần số allele.',
      'Thiết lập được chuỗi thức ăn, lưới thức ăn với chiều mũi tên truyền vật chất và năng lượng đúng.',
      'Phân tích được mô hình tăng trưởng quần thể theo sức chứa môi trường K.',
    ],
    coreKnowledge: [
      {
        heading: 'Cơ chế tiến hóa quần thể',
        points: [
          'Tiến hóa là sự thay đổi tần số allele và thành phần kiểu gene của quần thể qua các thế hệ, KHÔNG có mục tiêu định trước và cá thể không tự biến đổi chỉ vì "nhu cầu thích nghi".',
          'Phiêu bạt di truyền (hiệu ứng thắt cổ chai, người sáng lập) gây biến động mạnh tần số allele một cách ngẫu nhiên, rõ rệt nhất ở quần thể kích thước nhỏ.',
        ],
      },
      {
        heading: 'Dòng năng lượng và chuỗi thức ăn',
        points: [
          'Chiều mũi tên trong chuỗi và lưới thức ăn luôn hướng từ sinh vật bị ăn → sinh vật tiêu thụ (chiều truyền vật chất và năng lượng).',
          'Năng lượng truyền qua mỗi bậc dinh dưỡng bị thất thoát lớn (hô hấp, nhiệt, chất thải); hiệu suất sinh thái phổ biến khoảng 10%.',
        ],
        formulaLatex: '\\frac{\\Delta N}{\\Delta t} = r N \\left(1 - \\frac{N}{K}\\right)',
      },
    ],
    glossary: [
      { term: 'Phiêu bạt di truyền', english: 'Genetic drift', definition: 'Sự thay đổi ngẫu nhiên tần số allele qua các thế hệ, mạnh nhất ở quần thể nhỏ.' },
      { term: 'Sức chứa môi trường', english: 'Carrying capacity (K)', definition: 'Số lượng cá thể tối đa mà nguồn sống của môi trường có thể duy trì ổn định.' },
    ],
    relatedLabId: 'ecology',
    activities: [
      {
        id: 'act-12-3',
        phase: 'Dự đoán',
        title: 'So sánh tác động kích thước quần thể (Lab 10) và Lưới thức ăn 3D (Lab 11)',
        objective: 'Thấy rõ vai trò của kích thước quần thể N đối với phiêu bạt di truyền và chiều dòng năng lượng trong hệ sinh thái.',
        task: 'Mở Phòng Lab 10 để chạy 2 kịch bản N = 20 và N = 1000 với cùng một seed; sau đó mở Lab 11 kiểm tra lưới thức ăn ao hồ.',
        guide: 'Quan sát biên độ dao động đường cong tần số allele p qua 50 thế hệ.',
        expectedProduct: 'Nhận xét quy luật ảnh hưởng của kích thước quần thể lên biến động ngẫu nhiên.',
        teacherScript: 'Nhấn mạnh tiến hóa diễn ra ở cấp độ quần thể qua sinh sản phân hóa, không phải cá thể tự biến đổi theo ý muốn.',
        rubric: 'Giải thích đúng sự khác biệt giữa hai kịch bản và vẽ đúng chiều mũi tên thức ăn.',
      },
    ],
    questions: [
      {
        id: 'q-12-3',
        level: 'Thông hiểu',
        type: 'Giải thích',
        question: 'Tại sao chuỗi thức ăn trong hệ sinh thái tự nhiên thường ít khi kéo dài quá 5–6 mắt xích?',
        answer: 'Do năng lượng bị thất thoát phần lớn qua hô hấp, tỏa nhiệt và chất thải ở mỗi bậc dinh dưỡng (chỉ khoảng ~10% truyền lên bậc kế tiếp), nên đến bậc cao năng lượng còn lại không đủ duy trì quần thể.',
        teacherNote: 'Minh họa bằng Tháp sinh thái năng lượng trong Lab 11.',
      },
    ],
    rememberNotes: [
      'Chọn lọc tự nhiên tác động trực tiếp lên kiểu hình, gián tiếp làm thay đổi tần số allele theo hướng thích nghi.',
      'Chiều mũi tên trong lưới thức ăn đi từ nguồn thức ăn đến sinh vật sử dụng.',
    ],
  },
];
