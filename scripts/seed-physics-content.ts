// Run: npx tsx scripts/seed-physics-content.ts
// Clear & re-seed: npx tsx scripts/seed-physics-content.ts --clear
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../src/lib/mongodb';
import { seedPhysicsContent } from '../src/lib/seed-physics-content';

dotenv.config({ path: '.env.local' });

async function main() {
  const clear = process.argv.includes('--clear');
  const force = process.argv.includes('--force');

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI байхгүй (.env.local)');
    process.exit(1);
  }

  await connectDB();
  console.log('MongoDB холбогдлоо');

  const result = await seedPhysicsContent({ clear, force: clear || force });

  if (result.skipped) {
    console.log('⚠️  Сэдэв аль хэдийн байна. Дахин суулгах: npx tsx scripts/seed-physics-content.ts --clear');
  } else {
    console.log(`✅ ${result.topics} сэдэв, ${result.subtopics} хичээл, ${result.questions} асуулт`);
    console.log(`✅ ${result.exams} шинэ шалгалт`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
