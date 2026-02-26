import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const overrides = await prisma.dateOverride.findMany({
    where: { teacherId: teacher.id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(overrides);
}

export async function POST(request: Request) {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { date, isBlocked, startTime, endTime, reason } = body;
  if (!date || typeof isBlocked !== "boolean") {
    return NextResponse.json(
      { error: "date (YYYY-MM-DD) and isBlocked (boolean) are required" },
      { status: 400 }
    );
  }
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!isBlocked && (typeof startTime !== "string" || typeof endTime !== "string")) {
    return NextResponse.json(
      { error: "startTime and endTime (HH:mm) required when isBlocked is false" },
      { status: 400 }
    );
  }
  const override = await prisma.dateOverride.upsert({
    where: {
      teacherId_date: {
        teacherId: teacher.id,
        date: dateObj,
      },
    },
    update: {
      isBlocked,
      startTime: isBlocked ? null : startTime,
      endTime: isBlocked ? null : endTime,
      reason: reason ?? null,
    },
    create: {
      teacherId: teacher.id,
      date: dateObj,
      isBlocked,
      startTime: isBlocked ? null : startTime,
      endTime: isBlocked ? null : endTime,
      reason: reason ?? null,
    },
  });
  return NextResponse.json(override);
}
