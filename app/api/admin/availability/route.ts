import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const availability = await prisma.weeklyAvailability.findMany({
    where: { teacherId: teacher.id },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(availability);
}

export async function PUT(request: Request) {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json(
      { error: "Body must be a non-empty array of { dayOfWeek, startTime, endTime, isActive }" },
      { status: 400 }
    );
  }
  for (const row of body) {
    const { dayOfWeek, startTime, endTime, isActive } = row;
    if (
      typeof dayOfWeek !== "number" ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Each row must have dayOfWeek (0-6), startTime, endTime (HH:mm), isActive (boolean)" },
        { status: 400 }
      );
    }
  }
  const updated = await prisma.$transaction(
    body.map((row: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }) =>
      prisma.weeklyAvailability.upsert({
        where: {
          teacherId_dayOfWeek: { teacherId: teacher.id, dayOfWeek: row.dayOfWeek },
        },
        update: {
          startTime: row.startTime,
          endTime: row.endTime,
          isActive: row.isActive,
        },
        create: {
          teacherId: teacher.id,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          isActive: row.isActive,
        },
      })
    )
  );
  return NextResponse.json(updated);
}
