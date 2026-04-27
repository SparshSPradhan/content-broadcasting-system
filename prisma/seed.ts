import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.contentAnalytics.deleteMany();
  await prisma.contentSchedule.deleteMany();
  await prisma.content.deleteMany();
  await prisma.contentSlot.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Create Principal
  const principal = await prisma.user.create({
    data: {
      name: 'Principal Admin',
      email: 'principal@school.com',
      passwordHash,
      role: Role.principal,
    },
  });

  // Create Teachers
  const teacher1 = await prisma.user.create({
    data: {
      name: 'Teacher One',
      email: 'teacher1@school.com',
      passwordHash,
      role: Role.teacher,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      name: 'Teacher Two',
      email: 'teacher2@school.com',
      passwordHash,
      role: Role.teacher,
    },
  });

  console.log('✅ Users created');
  console.log(`   Principal: principal@school.com / Password123!`);
  console.log(`   Teacher 1: teacher1@school.com / Password123!`);
  console.log(`   Teacher 2: teacher2@school.com / Password123!`);

  // Create content slots
  await prisma.contentSlot.createMany({
    data: [
      { subject: 'maths', teacherId: teacher1.id },
      { subject: 'science', teacherId: teacher1.id },
      { subject: 'maths', teacherId: teacher2.id },
    ],
  });

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });