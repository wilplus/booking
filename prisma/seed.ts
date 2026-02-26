import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_AVAILABILITY = [
  { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isActive: false }, // Sunday
  { dayOfWeek: 1, startTime: "12:30", endTime: "20:30", isActive: true },  // Monday
  { dayOfWeek: 2, startTime: "10:00", endTime: "20:30", isActive: true },  // Tuesday
  { dayOfWeek: 3, startTime: "12:30", endTime: "20:30", isActive: true },  // Wednesday
  { dayOfWeek: 4, startTime: "10:00", endTime: "20:30", isActive: true },  // Thursday
  { dayOfWeek: 5, startTime: "12:30", endTime: "20:30", isActive: true },  // Friday
  { dayOfWeek: 6, startTime: "00:00", endTime: "00:00", isActive: false }, // Saturday
];

const DEFAULT_LESSON_TYPES = [
  { duration: 30, price: 40, currency: "EUR" },
  { duration: 60, price: 70, currency: "EUR" },
  { duration: 90, price: 95, currency: "EUR" },
];

async function main() {
  const teacherEmail =
    process.env.SEED_TEACHER_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "admin@example.com";
  const teacherName =
    process.env.SEED_TEACHER_NAME ||
    process.env.NEXT_PUBLIC_TEACHER_NAME ||
    "Teacher";

  const teacher = await prisma.teacher.upsert({
    where: { email: teacherEmail },
    update: {},
    create: {
      email: teacherEmail,
      name: teacherName,
      bufferMinutes: 0,
      minNoticeHours: 24,
      maxAdvanceBookingDays: 28,
    },
  });

  for (const slot of DEFAULT_AVAILABILITY) {
    await prisma.weeklyAvailability.upsert({
      where: {
        teacherId_dayOfWeek: { teacherId: teacher.id, dayOfWeek: slot.dayOfWeek },
      },
      update: {
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
      },
      create: {
        teacherId: teacher.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
      },
    });
  }

  for (const lt of DEFAULT_LESSON_TYPES) {
    await prisma.lessonType.upsert({
      where: {
        teacherId_duration: { teacherId: teacher.id, duration: lt.duration },
      },
      update: { price: lt.price, currency: lt.currency },
      create: {
        teacherId: teacher.id,
        duration: lt.duration,
        price: lt.price,
        currency: lt.currency,
      },
    });
  }

  console.log("Seed complete. Teacher:", teacher.email);
  console.log("Weekly availability: 7 days configured.");
  console.log("Lesson types: 30, 60, 90 min.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
