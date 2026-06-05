/**

 */
import { EES_QUESTIONS } from "./ees-questions";

export const EES_META = {
  title: "2025 ОНЫ ФИЗИК А ХУВИЛБАР",
  subtitle: "ЭЕШ 2025 — Нэгдүгээр хэсэг",
  durationMin: 100,
  totalQuestions: 46,
  part2Count: 4,
  totalPoints: 100,
} as const;

export const REFERENCE_TEXT =
  "Санамж: Нэгдүгээр хэсэг 46 сонгох даалгавартай нийт 76 оноотой. Даалгавар тус бүр таван сонголттой. Тэдгээрээс зөвхөн нэг зөв хариултыг сонгоно уу. Хоёрдугаар хэсэг 4 даалгавартай нийт 24 оноотой — хариултыг хариултын хуудсанд тэмдэглэнэ. Цагийн хязгаар: 100 минут. Амжилт хүсье.";

export type EesIllustration =
  | "voltmeter"
  | "velocity-graph"
  | "heating-graph"
  | "mass-square"
  | "voltage-divider"
  | "truth-table"
  | "magnetic-force"
  | "electric-field"
  | "circuit"
  | "wave"
  | "interference"
  | "oscillation-graph"
  | "reflection"
  | "lens"
  | null;

export type EesQuestionType = "choice" | "open";
export type EesSection = "part1" | "part2";

export interface EesOption {
  id: "A" | "B" | "C" | "D" | "E";
  text: string;
}

export interface EesQuestion {
  label: string;
  displayNum: number | string;
  section: EesSection;
  type: EesQuestionType;
  topic: string;
  text: string;
  points: number;
  illustration: EesIllustration;
  contextNote?: string;
  options: EesOption[];
  correctId: EesOption["id"];
  solution: string;
}

export function buildEesQuestions(): EesQuestion[] {
  return EES_QUESTIONS;
}

export function getQuestionTabLabels(questions: EesQuestion[]): string[] {
  return questions.map((q) => q.label);
}
