// scripts/seed.ts
// Run: npx tsx scripts/seed.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

const CategorySchema = new mongoose.Schema({
  name: String, nameEn: String, icon: String, color: String, totalLevels: Number, isActive: Boolean, order: Number,
});
const QuestionSchema = new mongoose.Schema({
  categoryId: mongoose.Schema.Types.ObjectId, level: Number, question: String,
  options: [String], correctIndex: Number, explanation: String,
  difficulty: String, xpReward: Number, coinReward: Number, isActive: Boolean,
});

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Question  = mongoose.models.Question  || mongoose.model("Question",  QuestionSchema);

const CATEGORIES = [
  { name: "Цахилгаан",  nameEn: "Electricity", icon: "⚡", color: "#FFD23F", totalLevels: 5, isActive: true, order: 1 },
  { name: "Механик",    nameEn: "Mechanics",   icon: "⚙️", color: "#5ECEBA", totalLevels: 5, isActive: true, order: 2 },
  { name: "Оптик",      nameEn: "Optics",      icon: "🔭", color: "#A78BFA", totalLevels: 5, isActive: true, order: 3 },
  { name: "Дулаан",     nameEn: "Thermal",     icon: "🌡️", color: "#FB923C", totalLevels: 5, isActive: true, order: 4 },
  { name: "Соронзон",   nameEn: "Magnetism",   icon: "🧲", color: "#34D399", totalLevels: 5, isActive: true, order: 5 },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Clear existing
  await Category.deleteMany({});
  await Question.deleteMany({});

  // Insert categories
  const cats = await Category.insertMany(CATEGORIES);
  console.log(`✅ ${cats.length} сэдэв оруулав`);

  const elec = cats[0];

  // Sample questions for Electricity Level 1
  const questions = [
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "Ом-ын хуулийн томъёо аль нь вэ?",
      options: ["I = U/R", "U = I²R", "R = UI", "P = UI²"],
      correctIndex: 0, xpReward: 10, coinReward: 5, difficulty: "easy",
      explanation: "Ом-ын хуулиар: гүйдэл I нь хүчдэл U-г эсэргүүцэл R-д хуваасантай тэнцүү. I = U/R",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "Цахилгааны хүчний нэгж аль нь вэ?",
      options: ["Ватт (W)", "Вольт (V)", "Ампер (A)", "Ом (Ω)"],
      correctIndex: 0, xpReward: 10, coinReward: 5, difficulty: "easy",
      explanation: "Цахилгааны хүч P-ийн нэгж нь Ватт (W). P = UI буюу P = I²R томъёогоор тооцдог.",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "Дараалан холбосон цахилгаан хэлхээнд юу тогтмол байдаг вэ?",
      options: ["Гүйдэл", "Хүчдэл", "Эсэргүүцэл", "Хүч"],
      correctIndex: 0, xpReward: 10, coinReward: 5, difficulty: "easy",
      explanation: "Дараалан холбосон хэлхээнд гүйдлийн хэмжээ хаа ч тогтмол байна: I₁ = I₂ = I",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "2Ω ба 4Ω эсэргүүцлийг зэрэгцээ холбоход нийт эсэргүүцэл хэд вэ?",
      options: ["4/3 Ω", "6 Ω", "8 Ω", "2 Ω"],
      correctIndex: 0, xpReward: 15, coinReward: 7, difficulty: "medium",
      explanation: "Зэрэгцээ хэлхээнд: 1/R = 1/R₁ + 1/R₂ = 1/2 + 1/4 = 3/4. Тиймээс R = 4/3 Ω ≈ 1.33 Ω",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "12V хүчдэлтэй эх үүсвэрт 6Ω эсэргүүцэл холбосон. Гүйдэл хэд байх вэ?",
      options: ["2 A", "0.5 A", "72 A", "18 A"],
      correctIndex: 0, xpReward: 15, coinReward: 7, difficulty: "medium",
      explanation: "Ом-ын хуулиар: I = U/R = 12/6 = 2 A",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "Цахилгааны ажлын нэгж аль вэ?",
      options: ["Жоуль (J)", "Ватт (W)", "Вольт (V)", "Кулон (C)"],
      correctIndex: 0, xpReward: 10, coinReward: 5, difficulty: "easy",
      explanation: "Ажлын буюу энергийн нэгж нь Жоуль (J). A = UIt томъёогоор тооцно.",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "Зэрэгцээ холбосон хэлхээнд юу тэнцүү байдаг вэ?",
      options: ["Хүчдэл", "Гүйдэл", "Эсэргүүцэл", "Хүч"],
      correctIndex: 0, xpReward: 10, coinReward: 5, difficulty: "easy",
      explanation: "Зэрэгцээ холбосон хэлхээнд мөчир бүр дэх хүчдэл тэнцүү байна: U₁ = U₂ = U",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "Цахилгааны гүйдлийн нэгж аль вэ?",
      options: ["Ампер (A)", "Вольт (V)", "Ватт (W)", "Ом (Ω)"],
      correctIndex: 0, xpReward: 10, coinReward: 5, difficulty: "easy",
      explanation: "Цахилгааны гүйдэл I-ийн нэгж нь Ампер (A). 1 A = 1 C/s",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "5A гүйдэл 3Ω эсэргүүцлийн дотуур гарахад ялгарах хүч хэд вэ?",
      options: ["75 W", "15 W", "8 W", "1.67 W"],
      correctIndex: 0, xpReward: 15, coinReward: 7, difficulty: "medium",
      explanation: "P = I²R = 5² × 3 = 25 × 3 = 75 W",
    },
    {
      categoryId: elec._id, level: 1, isActive: true,
      question: "Дараалан холбосон 3Ω, 5Ω, 2Ω эсэргүүцлийн нийт эсэргүүцэл?",
      options: ["10 Ω", "3.33 Ω", "0.8 Ω", "30 Ω"],
      correctIndex: 0, xpReward: 15, coinReward: 7, difficulty: "medium",
      explanation: "Дараалан холбосон хэлхээнд: R = R₁ + R₂ + R₃ = 3 + 5 + 2 = 10 Ω",
    },
  ];

  await Question.insertMany(questions);
  console.log(`✅ ${questions.length} асуулт оруулав (Цахилгаан Level 1)`);

  await mongoose.disconnect();
  console.log("✅ Seed дууслаа!");
}

seed().catch(console.error);
