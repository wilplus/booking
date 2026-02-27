import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const teacherTimezone = process.env.TEACHER_TIMEZONE ?? "Europe/Paris";

  const teacher = await prisma.teacher.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      lessonTypes: {
        where: { isActive: true },
        orderBy: { duration: "asc" },
        select: { id: true, duration: true, price: true, currency: true, description: true },
      },
    },
  });
  if (!teacher) {
    return NextResponse.json({ error: "No teacher configured" }, { status: 404 });
  }
  return NextResponse.json({
    id: teacher.id,
    name: teacher.name,
    photoUrl: teacher.photoUrl ?? null,
    bio: teacher.bio ?? null,
    teacherTimezone,
    lessonTypes: teacher.lessonTypes,
  });
}
