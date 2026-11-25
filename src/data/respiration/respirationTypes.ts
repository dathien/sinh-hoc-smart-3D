import { ModelPartInfo, ScientificSourceMeta } from '../../types/biology';

export type RespirationSimId =
  | 'human-anatomy'
  | 'breathing-mechanics'
  | 'alveolar-exchange'
  | 'body-surface'
  | 'tracheal-system'
  | 'fish-gills'
  | 'avian-respiration'
  | 'respiratory-health';

export type BloomLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';

export type RespQuestionFormat =
  | 'mcq'
  | 'true-false'
  | 'matching'
  | 'identify'
  | 'ordering'
  | 'analysis';

export interface RespQuestionBase {
  id: string;
  simId: RespirationSimId;
  level: BloomLevel;
  format: RespQuestionFormat;
  formatLabel: string;
  prompt: string;
  explanation: string;
}

export interface RespMcqQuestion extends RespQuestionBase {
  format: 'mcq' | 'identify' | 'analysis';
  options: string[];
  correctIndex: number;
  targetPartId?: string;
}

export interface RespTrueFalseQuestion extends RespQuestionBase {
  format: 'true-false';
  correctAnswer: boolean;
}

export interface RespMatchingQuestion extends RespQuestionBase {
  format: 'matching';
  pairs: { left: string; right: string }[];
}

export interface RespOrderingQuestion extends RespQuestionBase {
  format: 'ordering';
  correctOrder: string[];
}

export type RespQuestion =
  | RespMcqQuestion
  | RespTrueFalseQuestion
  | RespMatchingQuestion
  | RespOrderingQuestion;

export interface RespirationSimMeta {
  id: RespirationSimId;
  number: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  mechanismCategory: 'phoi' | 'be-mat' | 'ong-khi' | 'mang' | 'suc-khoe';
  observationGoal: string;
  operationGuide: string[];
  predictionQuestion: string;
  discoveryTask: string;
  corePoints: string[];
  extendedPoints: string[];
  conclusion: string;
  teacherGuideNote: string;
  sourceMeta: ScientificSourceMeta;
  parts: ModelPartInfo[];
  secondaryParts?: ModelPartInfo[]; // e.g., Hydra in Sim 04
}

export interface GasExchangeComparisonRow {
  id: string;
  mechanismName: string;
  simId: RespirationSimId;
  representatives: string;
  organSurface: string;
  o2Path: string;
  co2Path: string;
  adaptations: string;
  habitat: string;
  accentClass: string;
}

export interface AnimalMatchItem {
  id: string;
  animalName: string;
  hint: string;
  correctMechanismId: 'be-mat' | 'ong-khi' | 'mang' | 'phoi';
  explanation: string;
}
