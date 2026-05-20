/**
 * Физикийн жишээ агуулга — админ самбараар нэмэгдсэнтэй ижил бүтэц (Topic → Subtopic → questions).
 */

import { TopicModel } from '@/models/TopicModel';
import { SubtopicModel } from '@/models/SubtopicModel';
import { ExamModel } from '@/models/ExamModel';

export type SeedQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

export type SeedSubtopic = {
  name: string;
  description: string;
  content: string;
  questions: SeedQuestion[];
};

export type SeedTopic = {
  name: string;
  description: string;
  color: string;
  icon: string;
  subtopics: SeedSubtopic[];
};

export type SeedExam = {
  title: string;
  description: string;
  duration: number;
  questions: {
    id: string;
    question: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
  }[];
};

function q(
  question: string,
  options: [string, string, string, string],
  correctIndex: number,
  explanation: string,
): SeedQuestion {
  return { question, options, correctIndex, explanation };
}

export const PHYSICS_TOPICS: SeedTopic[] = [
  {
    name: 'Механик',
    description: 'Хүч, хөдөлгөөн, энерги — 10-р ангийн үндсэн сэдэв',
    color: '#10B981',
    icon: 'Φ',
    subtopics: [
      {
        name: 'Хурд, хурдатгал',
        description: 'Шулуун тэгш хэмжүүсэн хөдөлгөөн',
        content:
          'Шулуун тэгш хэмжүүсэн хөдөлгөөнд хурд v = Δx/Δt, хурдатгал a = Δv/Δt. v = v₀ + at, x = v₀t + ½at² томъёог ашиглана.',
        questions: [
          q('Хурдны SI нэгж аль вэ?', ['м/с', 'м/с²', 'Ньютон', 'Жоуль'], 0, 'Хурдны нэгж: метр/секунд (м/с).'),
          q('Хурдатгалын SI нэгж?', ['м/с²', 'м/с', 'кг', 'Па'], 0, 'Хурдатгал: м/с².'),
          q('Амьс 0-ээс 20 м/с хүртэл 4 с-д хурдасвал хурдатгал?', ['5 м/с²', '4 м/с²', '80 м/с²', '0.2 м/с²'], 0, 'a = (20−0)/4 = 5 м/с².'),
          q('v = v₀ + at томъёонд v₀ юу вэ?', ['Эхний хурд', 'Төгсгөлийн хурд', 'Зай', 'Хурдатгал'], 0, 'v₀ — эхний хурд.'),
          q('24 м/с хурдтай машин 6 с-д зогсвол хурдатгал?', ['−4 м/с²', '4 м/с²', '144 м/с²', '0.25 м/с²'], 0, 'a = (0−24)/6 = −4 м/с².'),
          q('5 м/с² хурдатгалаар 3 с явахад хэдэн метр (v₀=0)?', ['22.5 м', '15 м', '7.5 м', '45 м'], 0, 'x = ½at² = 22.5 м.'),
          q('x-t графикийн налалт юу өгөх вэ?', ['Хурд', 'Хурдатгал', 'Хүч', 'Масс'], 0, 'x-t налалт = хурд.'),
          q('10 м/с хурдтай би 2 с-д зогсвол зай (ойролцоо)?', ['10 м', '20 м', '5 м', '40 м'], 0, 'Дундаж хурд ≈ 5 м/с → ~10 м.'),
          q('Чөлөөт унах биеийн хурдатгал?', ['9.8 м/с²', '10 м/с', '9.8 м/с', '1 м/с²'], 0, 'g ≈ 9.8 м/с².'),
          q('72 км/ц хурд (м/с)?', ['20 м/с', '72 м/с', '2 м/с', '120 м/с'], 0, '72 км/ц = 20 м/с.'),
        ],
      },
      {
        name: 'Ньютоны хуулиуд',
        description: 'F = ma ба хүчний тэнцвэр',
        content: 'Ньютоны 2-р хууль: F = ma. 3-р хууль: үйлчлэл-тэсрэлцүүлэн тэнцүү.',
        questions: [
          q('Ньютоны 2-р хуулийн томьёо?', ['F = ma', 'p = mv', 'W = Fs', 'P = W/t'], 0, 'F = ma.'),
          q('2 кг, 3 м/с² → хүч?', ['6 Н', '5 Н', '1.5 Н', '0.67 Н'], 0, 'F = 6 Н.'),
          q('Жиний томьёо?', ['W = mg', 'F = ma', 'p = mv', 'E = mc²'], 0, 'W = mg.'),
          q('Инерци гэж?', ['Хөдөлгөөний төлөв өөрчлөхөд эсэргүүцэх', 'Хүчний нэгж', 'Энерги', 'Импульс'], 0, 'Инерци тодорхойлолт.'),
          q('10 Н, 5 кг → хурдатгал?', ['2 м/с²', '50 м/с²', '0.5 м/с²', '15 м/с²'], 0, 'a = 2 м/с².'),
          q('Тэнцвэрт нийлмэл хүч?', ['0', 'mg', 'ma', '∞'], 0, 'ΣF = 0.'),
          q('Импульс?', ['p = mv', 'F = ma', 'E = ½mv²', 'W = Fs'], 0, 'p = mv.'),
          q('3-р хуулийн жишээ?', ['Ракет', 'Ом', 'Дулаан', 'Тусгал'], 0, 'Ракет — action-reaction.'),
          q('4 кг, 5 м/с импульс?', ['20 кг·м/с', '9 кг·м/с', '1.25 кг·м/с', '80 кг·м/с'], 0, 'p = 20.'),
          q('Ньютон (Н) — юуны нэгж?', ['Хүч', 'Энерги', 'Хүчдэл', 'Хурд'], 0, 'Хүч.'),
        ],
      },
      {
        name: 'Энерги ба ажил',
        description: 'Кинетик, потенциал энерги',
        content: 'Ek = ½mv², Ep = mgh. Механик энергийн хадгалалт зүтгүүргүй системд.',
        questions: [
          q('Кинетик энерги?', ['½mv²', 'mgh', 'Fs', 'Pt'], 0, 'Ek = ½mv².'),
          q('2 кг, 3 м/с → Ek?', ['9 Ж', '6 Ж', '18 Ж', '3 Ж'], 0, '9 Ж.'),
          q('Потенциал энерги?', ['mgh', '½mv²', 'Fs', 'mv'], 0, 'Ep = mgh.'),
          q('1 кг, 10 м (g=10) → Ep?', ['100 Ж', '10 Ж', '50 Ж', '1000 Ж'], 0, '100 Ж.'),
          q('Ажил?', ['W = Fs cosα', 'P = IV', 'F = ma', 'p = mv'], 0, 'W = Fs cosα.'),
          q('10 Н, 5 м → ажил?', ['50 Ж', '2 Ж', '15 Ж', '0 Ж'], 0, '50 Ж.'),
          q('Жоуль — юу?', ['Энерги/ажил', 'Хүч', 'Хүчдэл', 'Хурд'], 0, 'Энерги.'),
          q('Механик энергийн хадгалалт?', ['Зүтгүүргүй системд', 'Үргэлж', 'Зөвхөн цахилгаан', 'Хэзээ ч биш'], 0, 'Зүтгүүргүй.'),
          q('Хурд буурвал Ek?', ['Буурна', 'Өснө', 'Тогтсон', 'Хоёр дахин'], 0, 'Буурна.'),
          q('1 кВт·ц = ? Ж', ['3.6×10⁶', '1000', '3600', '10⁶'], 0, '3.6×10⁶ Ж.'),
        ],
      },
    ],
  },
  {
    name: 'Цахилгаан',
    description: 'Хүчдэл, гүйдэл, эсэргүүцэл, хүч',
    color: '#F59E0B',
    icon: 'λ',
    subtopics: [
      {
        name: 'Ом-ын хууль',
        description: 'U, I, R',
        content: 'U = IR. Дараалан: I тогтмол. Зэрэгцээ: U тогтмол.',
        questions: [
          q('Ом-ын хууль?', ['U = IR', 'P = UI', 'F = ma', 'Q = It'], 0, 'U = IR.'),
          q('12 В, 3 А → R?', ['4 Ω', '36 Ω', '9 Ω', '0.25 Ω'], 0, '4 Ω.'),
          q('6 Ω, 2 А → U?', ['12 В', '3 В', '8 В', '0.33 В'], 0, '12 В.'),
          q('Дараалан 2+4 Ω?', ['6 Ω', '1.33 Ω', '8 Ω', '2 Ω'], 0, '6 Ω.'),
          q('Зэрэгцээ 6‖3 Ω?', ['2 Ω', '9 Ω', '18 Ω', '4.5 Ω'], 0, '2 Ω.'),
          q('Эсэргүүцлийн нэгж?', ['Ом', 'Вольт', 'Ампер', 'Ватт'], 0, 'Ом.'),
          q('Хүчдлийн нэгж?', ['Вольт', 'Ампер', 'Ом', 'Кулон'], 0, 'Вольт.'),
          q('Гүйдлийн нэгж?', ['Ампер', 'Вольт', 'Ватт', 'Ом'], 0, 'Ампер.'),
          q('24 В, 8 Ω → I?', ['3 А', '192 А', '32 А', '0.33 А'], 0, '3 А.'),
          q('Дараалан I?', ['Тогтмол', 'Нэмэгдэнэ', 'Тэг', 'Хоёр дахин'], 0, 'Тогтмол.'),
        ],
      },
      {
        name: 'Цахилгаан хүч',
        description: 'P = UI',
        content: 'P = UI = I²R. Q = UIt.',
        questions: [
          q('Цахилгаан хүч?', ['P = UI', 'U = IR', 'F = ma', 'E = mc²'], 0, 'P = UI.'),
          q('220 В, 2 А → P?', ['440 Вт', '110 Вт', '222 Вт', '4400 Вт'], 0, '440 Вт.'),
          q('100 Вт, 10 ц → кВт·ц?', ['1', '1000', '10', '0.1'], 0, '1 кВт·ц.'),
          q('Q = It — Q?', ['Цэнэг', 'Хүчдэл', 'Хүч', 'R'], 0, 'Цэнэг.'),
          q('5 А, 120 с → Q?', ['600 Кл', '24 Кл', '625 Кл', '0.04 Кл'], 0, '600 Кл.'),
          q('60 Вт, 5 ц → Ж (ойролцоо)?', ['1.08×10⁶', '300', '12', '3000'], 0, '1.08×10⁶ Ж.'),
          q('3 Ω, 4 А → P (I²R)?', ['48 Вт', '12 Вт', '7 Вт', '144 Вт'], 0, '48 Вт.'),
          q('Ватт — юу?', ['Хүч', 'Энерги', 'Цэнэг', 'U'], 0, 'Хүч.'),
          q('Зэрэгцээ U?', ['Тэнцүү', 'Нэмэгдэнэ', 'Тэг', '2 дахин'], 0, 'Тэнцүү.'),
          q('Аюулгүй байдал?', ['Гар сухай', 'Усанд залгах', 'Олон залгаа', 'Сүлжээгүй'], 0, 'Гар сухай.'),
        ],
      },
    ],
  },
  {
    name: 'Дулаан ба Оптик',
    description: 'Дулаан, гэрэл',
    color: '#8B5CF6',
    icon: 'π',
    subtopics: [
      {
        name: 'Дулаан',
        description: 'Q = cmΔT',
        content: 'Q = cmΔT. 0°C = 273 K.',
        questions: [
          q('Дулааны тоо?', ['Q = cmΔT', 'U = IR', 'F = ma', 'p = mv'], 0, 'Q = cmΔT.'),
          q('c нэгж?', ['Ж/(кг·К)', 'Ж/кг', 'Вт', 'К'], 0, 'Ж/(кг·К).'),
          q('1 кг ус 20→80°C (c=4200)?', ['252 кЖ', '42 кЖ', '168 кЖ', '84 кЖ'], 0, '252 кЖ.'),
          q('0°C = ? K', ['273', '0', '100', '-273'], 0, '273 K.'),
          q('Усны хөлдөх цэг?', ['0°C', '100°C', '-10°C', '273°C'], 0, '0°C.'),
          q('Дулаан дамжуулалт?', ['Дулаан дамжуулах', 'Зөвхөн цацрах', 'Масс нэмэх', 'Даралт'], 0, 'Дамжуулалт.'),
          q('ΔT?', ['Температурын зөрүү', 'Даралт', 'Хурд', 'Хүч'], 0, 'Зөрүү.'),
          q('Металл vs чулуу?', ['Металл сайн', 'Чулуу сайн', 'Ижил', 'Хамаагүй'], 0, 'Металл.'),
          q('Дулааны SI?', ['Жоуль', 'Ватт', 'Кельвин', 'Калори'], 0, 'Жоуль.'),
          q('100°C ус?', ['Хөрөгдөнө', 'Хөргөнө', 'Хатуу', 'Газ'], 0, 'Хөрөгдөнө.'),
        ],
      },
      {
        name: 'Оптик',
        description: 'Гэрэл, тусгал',
        content: 'c ≈ 3×10⁸ м/с. i ≈ r. λ = v/f.',
        questions: [
          q('Гэрлийн c?', ['3×10⁸ м/с', '340 м/с', '9.8 м/с²', '1.5×10¹¹'], 0, '3×10⁸ м/с.'),
          q('Тусгал i, r?', ['i = r', 'i = 2r', 'i+r=90', 'i=0'], 0, 'i = r.'),
          q('λ = v/f — λ?', ['Долгион урт', 'Давтамж', 'Хурд', 'U'], 0, 'Долгион урт.'),
          q('Давтамж нэгж?', ['Гц', 'м', 'с', 'Вт'], 0, 'Гц.'),
          q('Өнгө?', ['Гэрэл', 'Дуу', 'Дулаан', 'Даралт'], 0, 'Гэрэл.'),
          q('Линз?', ['Тодорхой зураг', 'Боломжгүй', 'Зөвхөн соронзон', 'Дулаан'], 0, 'Тодорхой.'),
          q('Нүдний хамгаалалт?', ['UV', 'Дуу', 'Даралт', 'Масс'], 0, 'UV.'),
          q('Гэрэл энерги?', ['Тийм', 'Үгүй', 'Зөвхөн металл', 'Зөвхөн ус'], 0, 'Тийм.'),
          q('Урт нэгж?', ['м', 'Гц', 'Вт', 'К'], 0, 'м.'),
          q('Толь?', ['Тусгал', 'Шингэн', 'Дарах', 'Хугарах'], 0, 'Тусгал.'),
        ],
      },
    ],
  },
];

export const PHYSICS_EXAMS: SeedExam[] = [
  {
    title: 'Физик 10 — Богино шалгалт',
    description: 'Механик ба цахилгаан (8 асуулт)',
    duration: 30,
    questions: [
      { id: '1', question: 'F = ma — F нэгж?', options: [{ id: 'A', text: 'Ньютон' }, { id: 'B', text: 'Жоуль' }, { id: 'C', text: 'Ватт' }, { id: 'D', text: 'Па' }], correctAnswer: 'A' },
      { id: '2', question: 'U = IR — хэнний хууль?', options: [{ id: 'A', text: 'Ом' }, { id: 'B', text: 'Ньютон' }, { id: 'C', text: 'Архимед' }, { id: 'D', text: 'Кулон' }], correctAnswer: 'A' },
      { id: '3', question: '½mv² — юу?', options: [{ id: 'A', text: 'Кинетик энерги' }, { id: 'B', text: 'Потенциал' }, { id: 'C', text: 'Импульс' }, { id: 'D', text: 'Ажил' }], correctAnswer: 'A' },
      { id: '4', question: '3Ω+5Ω дараалан?', options: [{ id: 'A', text: '8 Ω' }, { id: 'B', text: '1.875 Ω' }, { id: 'C', text: '15 Ω' }, { id: 'D', text: '2 Ω' }], correctAnswer: 'A' },
      { id: '5', question: 'g ойролцоо?', options: [{ id: 'A', text: '9.8 м/с²' }, { id: 'B', text: '9.8 м/с' }, { id: 'C', text: '10 Н' }, { id: 'D', text: '98 Ж' }], correctAnswer: 'A' },
      { id: '6', question: 'P = UI — P?', options: [{ id: 'A', text: 'Хүч' }, { id: 'B', text: 'Цахилгаан хүч' }, { id: 'C', text: 'Цэнэг' }, { id: 'D', text: 'R' }], correctAnswer: 'B' },
      { id: '7', question: 'p = mv — p?', options: [{ id: 'A', text: 'Импульс' }, { id: 'B', text: 'Даралт' }, { id: 'C', text: 'U' }, { id: 'D', text: 'v' }], correctAnswer: 'A' },
      { id: '8', question: 'Q = cmΔT — c?', options: [{ id: 'A', text: 'Дулаан багтаамж' }, { id: 'B', text: 'Хурд' }, { id: 'C', text: 'm' }, { id: 'D', text: 'F' }], correctAnswer: 'A' },
    ],
  },
  {
    title: 'ЭЕШ бэлтгэл — Физик 1-р хэсэг',
    description: '10 асуулт, 60 минут',
    duration: 60,
    questions: [
      { id: '1', question: '2 кг, 4 м/с → Ek?', options: [{ id: 'A', text: '16 Ж' }, { id: 'B', text: '8 Ж' }, { id: 'C', text: '32 Ж' }, { id: 'D', text: '4 Ж' }], correctAnswer: 'A' },
      { id: '2', question: '12 В, 6 Ω → I?', options: [{ id: 'A', text: '2 А' }, { id: 'B', text: '72 А' }, { id: 'C', text: '0.5 А' }, { id: 'D', text: '18 А' }], correctAnswer: 'A' },
      { id: '3', question: '4Ω‖4Ω → R?', options: [{ id: 'A', text: '2 Ω' }, { id: 'B', text: '8 Ω' }, { id: 'C', text: '16 Ω' }, { id: 'D', text: '1 Ω' }], correctAnswer: 'A' },
      { id: '4', question: 'W = mg — W?', options: [{ id: 'A', text: 'Жин' }, { id: 'B', text: 'm' }, { id: 'C', text: 'p' }, { id: 'D', text: 'U' }], correctAnswer: 'A' },
      { id: '5', question: '440 Вт, 2 ц → кВт·ц?', options: [{ id: 'A', text: '0.88' }, { id: 'B', text: '880' }, { id: 'C', text: '220' }, { id: 'D', text: '1.76' }], correctAnswer: 'A' },
      { id: '6', question: 'v = v₀+at — a?', options: [{ id: 'A', text: 'Хурдатгал' }, { id: 'B', text: 'Зай' }, { id: 'C', text: 'F' }, { id: 'D', text: 'Q' }], correctAnswer: 'A' },
      { id: '7', question: '0°C = ? K', options: [{ id: 'A', text: '273' }, { id: 'B', text: '0' }, { id: 'C', text: '100' }, { id: 'D', text: '-273' }], correctAnswer: 'A' },
      { id: '8', question: 'Гэрлийн c?', options: [{ id: 'A', text: '3×10⁸ м/с' }, { id: 'B', text: '340 м/с' }, { id: 'C', text: '9.8 м/с²' }, { id: 'D', text: '1.5×10¹¹' }], correctAnswer: 'A' },
      { id: '9', question: '10 Н, 2 кг → a?', options: [{ id: 'A', text: '5 м/с²' }, { id: 'B', text: '20 м/с²' }, { id: 'C', text: '0.2 м/с²' }, { id: 'D', text: '12 м/с²' }], correctAnswer: 'A' },
      { id: '10', question: '2 кг, h=5 м, g=10 → Ep?', options: [{ id: 'A', text: '100 Ж' }, { id: 'B', text: '50 Ж' }, { id: 'C', text: '20 Ж' }, { id: 'D', text: '10 Ж' }], correctAnswer: 'A' },
    ],
  },
];

export type SeedResult = {
  topics: number;
  subtopics: number;
  questions: number;
  exams: number;
  skipped?: boolean;
};

export async function seedPhysicsContent(options?: { clear?: boolean; force?: boolean }): Promise<SeedResult> {
  const existing = await TopicModel.countDocuments();
  if (existing > 0 && !options?.clear && !options?.force) {
    return { topics: 0, subtopics: 0, questions: 0, exams: 0, skipped: true };
  }

  if (options?.clear) {
    await SubtopicModel.deleteMany({});
    await TopicModel.deleteMany({});
    for (const exam of PHYSICS_EXAMS) {
      await ExamModel.deleteMany({ title: exam.title });
    }
  }

  let subtopicCount = 0;
  let questionCount = 0;

  for (let ti = 0; ti < PHYSICS_TOPICS.length; ti++) {
    const t = PHYSICS_TOPICS[ti];
    const topic = await TopicModel.create({
      name: t.name,
      description: t.description,
      color: t.color,
      icon: t.icon,
      order: ti,
      isActive: true,
    });

    for (let si = 0; si < t.subtopics.length; si++) {
      const s = t.subtopics[si];
      await SubtopicModel.create({
        topicId: topic._id,
        name: s.name,
        description: s.description,
        content: s.content,
        order: si,
        isActive: true,
        questions: s.questions,
      });
      subtopicCount++;
      questionCount += s.questions.length;
    }
  }

  let examCount = 0;
  for (const exam of PHYSICS_EXAMS) {
    const exists = await ExamModel.findOne({ title: exam.title });
    if (!exists) {
      await ExamModel.create(exam);
      examCount++;
    }
  }

  return {
    topics: PHYSICS_TOPICS.length,
    subtopics: subtopicCount,
    questions: questionCount,
    exams: examCount,
  };
}
