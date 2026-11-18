export type GradeLevel = 10 | 11 | 12;

export type FontScaleMode = 'standard' | 'large' | 'presentation';

export type QualityLevel = 'low' | 'standard' | 'high';

export type AppPage =
  | 'home'
  | 'grade10'
  | 'grade11'
  | 'grade12'
  | 'labs'
  | 'models'
  | 'formulas'
  | 'diagrams'
  | 'guide'
  | 'offline';

export type LabId =
  | 'anatomy'
  | 'cell'
  | 'virus'
  | 'molecular-bio'
  | 'molecular-viewer'
  | 'cell-division'
  | 'plant-physiology'
  | 'animal-physiology'
  | 'genetics'
  | 'evolution'
  | 'ecology'
  | 'experiments';

export interface ScientificSourceMeta {
  name: string;
  source: string;
  identifier: string;
  version: string;
  license: string;
  dataType:
    | 'Mô hình dữ liệu khoa học thực'
    | 'Mô hình khoa học dự đoán'
    | 'Mô hình giản lược sư phạm'
    | 'Mô phỏng định lượng'
    | 'Mô phỏng định tính';
  verifiedStatus: string;
  scaleNote?: string;
}

export interface ModelPartInfo {
  id: string;
  vietnameseName: string;
  scientificName: string;
  group?: string;
  location: string;
  structure: string;
  function: string;
  relatedLessons: string[];
  colorHex: string;
}

export interface FormulaItem {
  id: string;
  name: string;
  latex: string;
  grade: GradeLevel | 'all';
  topic: string;
  groupId: string;
  level: 'Cơ bản' | 'Mở rộng';
  symbolExplanation: string;
  units: string;
  conditions: string;
  example: string;
  sourceNote?: string;
  isCustom?: boolean;
  isFavorite?: boolean;
}

export interface QuestionItem {
  id: string;
  level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
  type: 'Quan sát mô hình' | 'Nhận diện thành phần' | 'So sánh' | 'Giải thích' | 'Dự đoán' | 'Phân tích' | 'Vận dụng thực tế';
  question: string;
  answer: string;
  teacherNote: string;
}

export interface ActivityItem {
  id: string;
  phase: 'Khởi động' | 'Khám phá' | 'Dự đoán' | 'Thực hành' | 'Kết luận' | 'Vận dụng';
  title: string;
  objective: string;
  task: string;
  guide: string;
  expectedProduct: string;
  teacherScript: string;
  rubric: string;
}

export interface LessonData {
  id: string;
  grade: GradeLevel;
  topicCode: string;
  topicName: string;
  title: string;
  englishKeywords: string[];
  textbookAlignmentNote: string;
  objectives: string[];
  coreKnowledge: {
    heading: string;
    points: string[];
    formulaLatex?: string;
  }[];
  glossary: { term: string; english: string; definition: string }[];
  relatedLabId: LabId;
  relatedLabModelId?: string;
  activities: ActivityItem[];
  questions: QuestionItem[];
  rememberNotes: string[];
}

export interface LabDefinition {
  id: LabId;
  number: string;
  title: string;
  englishTitle: string;
  shortDesc: string;
  grades: GradeLevel[];
  keywords: string[];
  previewImage?: string;
  accentColor: string;
}

export interface OfflinePackageInfo {
  id: string;
  title: string;
  description: string;
  estimatedSizeKB: number;
  status: 'not-downloaded' | 'downloading' | 'ready' | 'error';
  progress: number;
  updatedAt?: string;
}
