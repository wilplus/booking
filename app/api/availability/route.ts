import { NextResponse } from "next/server";
import { addDays, format, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slots";
import { getFreebusy } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

const TEACHER_TIMEZONE = process.env.TEACHER_TIMEZONE ?? "Europe/Paris";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  if (!dateStr || !durationParam) {
    return NextResponse.json(
      { error: "Query params date (YYYY-MM-DD) and duration (30|60|90) required" },
      { status: 400 }
    );
  }
  const duration = parseInt(durationParam, 10);
  if (![30, 60, 90].includes(duration)) {
    return NextResponse.json(
      { error: "duration must be 30, 60, or 90" },
      { status: 400 }
    );
  }
  const dateMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!dateMatch) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      availability: { orderBy: { dayOfWeek: "asc" } },
      lessonTypes: { where: { duration, isActive: true } },
    },
  });
  if (!teacher || teacher.lessonTypes.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  const dayOfWeek = new Date(dateStr + "T12:00:00Z").getUTCDay();
  const weeklySlot = teacher.availability.find((a) => a.dayOfWeek === dayOfWeek) ?? null;
  const dateOverride = await prisma.dateOverride.findUnique({
    where: {
      teacherId_date: { teacherId: teacher.id, date: new Date(dateStr + "T12:00:00Z") },
    },
  });

  const dateStart = new Date(dateStr + "T00:00:00Z");
  const dateEnd = new Date(dateStr + "T23:59:59.999Z");
  const existingBookings = await prisma.booking.findMany({
    where: {
      teacherId: teacher.id,
      status: "CONFIRMED",
      startTime: { gte: dateStart },
      endTime: { lte: dateEnd },
    },
    select: { startTime: true, endTime: true },
  });

  let busySlots: { start: Date; end: Date }[] = [];
  try {
    const timeMin = fromZonedTime(`${dateStr}T00:00:00`, TEACHER_TIMEZONE);
    const nextDay = format(addDays(parseISO(dateStr), 1), "yyyy-MM-dd");
    const timeMax = fromZonedTime(`${nextDay}T00:00:00`, TEACHER_TIMEZONE);
    busySlots = await getFreebusy(teacher, timeMin, timeMax);
  } catch {
    // ignore freebusy errors
  }

  const slots = getAvailableSlots({
    dateStr,
    durationMinutes: duration,
    bufferMinutes: teacher.bufferMinutes,
    minNoticeHours: teacher.minNoticeHours,
    maxAdvanceBookingDays: teacher.maxAdvanceBookingDays,
    teacherTimezone: TEACHER_TIMEZONE,
    weeklySlot: weeklySlot
      ? { startTime: weeklySlot.startTime, endTime: weeklySlot.endTime, isActive: weeklySlot.isActive }
      : null,
    dateOverride: dateOverride
      ? {
          isBlocked: dateOverride.isBlocked,
          startTime: dateOverride.startTime,
          endTime: dateOverride.endTime,
        }
      : null,
    existingBookings: existingBookings.map((b) => ({ start: b.startTime, end: b.endTime })),
    busySlots,
  });

  return NextResponse.json({
    slots: slots.map((d) => d.toISOString()),
  });
}
