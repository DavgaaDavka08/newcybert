/**
 * Mock content for 2025 ЕЭШ физик сорил (landing + practice UI).
 * Сүлжээ/API-тай холбохдоо энэ өгөгдлийг солино.
 */

export const EES_META = {
  title: "2025 ОНЫ ФИЗИК А ХУВИЛБАР",
  subtitle: "Ерөнхий элсэлтийн шалгалтын сургагч сорил",
  durationMin: 100,
  totalQuestions: 50,
} as const;

/** Дээд хэсгийн таб — 1–46 + нэмэлт дугаарууд */
export const QUESTION_TAB_LABELS: string[] = [
  ...Array.from({ length: 46 }, (_, i) => String(i + 1)),
  "2.1",
  "2.2",
  "2.3",
  "2.4",
];

export const REFERENCE_TEXT =
  "Энэхүү сорил нь олон сонголттой 46 үндсэн даалгавар, нийт 76 оноотой байх загвартай (жишээ). Үндсэн хувилбарт физикийн мэдлэг, тооцоолох чадвар, багажийн уншилтыг шалгана. Цагийн хязгаар баримтлан хариулна уу.";

export type EesIllustration = "voltmeter" | null;

export interface EesOption {
  id: "A" | "B" | "C" | "D" | "E";
  text: string;
}

export interface EesQuestion {
  displayNum: number;
  topic: string;
  text: string;
  points: number;
  illustration: EesIllustration;
  options: EesOption[];
  correctId: EesOption["id"];
  solution: string;
}

const TOPICS_ROT = [
  "ЦАХИЛГААН БА СОРОНЗОН",
  "МЕХАНИК",
  "ДУЛААН",
  "ГЭРЭЛ СУДЛАЛ",
  "АТОМ ФИЗИК",
];

function genericQuestion(displayNum: number): EesQuestion {
  const topic = TOPICS_ROT[displayNum % TOPICS_ROT.length];
  const correctId = (["A", "B", "C", "D", "E"] as const)[displayNum % 5];
  return {
    displayNum,
    topic,
    text: `${displayNum}. Дараах өгүүлбэрүүдээс үнэнийг сонгоно уу. (2 оноо)`,
    points: 2,
    illustration: null,
    options: [
      { id: "A", text: "Зөвхөн I зөв" },
      { id: "B", text: "Зөвхөн II зөв" },
      { id: "C", text: "I ба II зөв" },
      { id: "D", text: "III зөв" },
      { id: "E", text: "Бүгд буруу" },
    ],
    correctId,
    solution: `Зөв хариулт: ${correctId}. Энэ нь жишээ тайлбар — бодит системд AI эсвэл багшийн шийдээр солигдоно.`,
  };
}

export function buildEesQuestions(): EesQuestion[] {
  const q1: EesQuestion = {
    displayNum: 1,
    topic: "ЦАХИЛГААН БА СОРОНЗОН",
    text: "1. Багажийн хуваарийн үнэ болон хэмжилтийн утгыг олно уу. (2 оноо)",
    points: 2,
    illustration: "voltmeter",
    options: [
      { id: "A", text: "0.1 В, 2.2 В" },
      { id: "B", text: "0.2 В, 2.4 В" },
      { id: "C", text: "1.0 В, 2.0 В" },
      { id: "D", text: "0.2 В, 2.2 В" },
      { id: "E", text: "1.0 В, 6.0 В" },
    ],
    correctId: "D",
    solution:
      "Хуваарь 0–6 В хооронд 30 хэсэгт хуваагдсан тул нэг хэсгийн үнэ 6/30 = 0.2 В. Зүү 2.6 В-ийг зааж байна. Зөв хариулт D.",
  };

  return [q1, ...Array.from({ length: EES_META.totalQuestions - 1 }, (_, i) => genericQuestion(i + 2))];
}
