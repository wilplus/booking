import { NextResponse } from "next/server";
import { addDays, format, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slots";
import { getFreebusy } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

const TEACHER_TIMEZONE = process.env.TEACHER_TIMEZONE ?? "Europe/Paris";
const DATE_RANGE_DAYS = 28;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const durationParam = searchParams.get("duration");

  if (!durationParam) {
    return NextResponse.json(
      { error: "Query param duration (30|60|90) required" },
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

  const teacher = await prisma.teacher.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      availability: { orderBy: { dayOfWeek: "asc" } },
      lessonTypes: { where: { duration, isActive: true } },
    },
  });
  if (!teacher || teacher.lessonTypes.length === 0) {
    return NextResponse.json({ dates: [] });
  }

  const now = new Date();
  const todayInTeacherTz = format(toZonedTime(now, TEACHER_TIMEZONE), "yyyy-MM-dd");
  const maxAllowedDate = addDays(parseISO(todayInTeacherTz), teacher.maxAdvanceBookingDays);
  const dateStrings: string[] = [];
  for (let i = 0; i < DATE_RANGE_DAYS; i++) {
    const d = addDays(parseISO(todayInTeacherTz), i);
    const dateStr = format(d, "yyyy-MM-dd");
    if (dateStr > format(maxAllowedDate, "yyyy-MM-dd")) break;
    dateStrings.push(dateStr);
  }

  if (dateStrings.length === 0) {
    return NextResponse.json({ dates: [] });
  }

  const rangeStart = fromZonedTime(`${dateStrings[0]}T00:00:00`, TEACHER_TIMEZONE);
  const lastDate = dateStrings[dateStrings.length - 1];
  const rangeEnd = fromZonedTime(`${lastDate}T23:59:59.999`, TEACHER_TIMEZONE);

  let busySlots: { start: Date; end: Date }[] = [];
  try {
    busySlots = await getFreebusy(teacher, rangeStart, rangeEnd);
  } catch {
    // ignore
  }

  const bookings = await prisma.booking.findMany({
    where: {
      teacherId: teacher.id,
      status: "CONFIRMED",
      startTime: { gte: rangeStart },
      endTime: { lte: rangeEnd },
    },
    select: { startTime: true, endTime: true },
  });

  const overrideDates = dateStrings.map((d) => new Date(d + "T12:00:00Z"));
  const overrides = await prisma.dateOverride.findMany({
    where: {
      teacherId: teacher.id,
      date: { in: overrideDates },
    },
  });
  const overrideByDate = new Map(
    overrides.map((o) => [format(o.date, "yyyy-MM-dd"), o])
  );

  const datesWithSlots: string[] = [];
  for (const dateStr of dateStrings) {
    const dayOfWeek = new Date(dateStr + "T12:00:00Z").getUTCDay();
    const weeklySlot = teacher.availability.find((a) => a.dayOfWeek === dayOfWeek) ?? null;
    const dateOverride = overrideByDate.get(dateStr) ?? null;

    const dateStart = new Date(dateStr + "T00:00:00Z");
    const dateEnd = new Date(dateStr + "T23:59:59.999Z");
    const dayBookings = bookings.filter(
      (b) => b.startTime.getTime() < dateEnd.getTime() && b.endTime.getTime() > dateStart.getTime()
    );

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
      existingBookings: dayBookings.map((b) => ({ start: b.startTime, end: b.endTime })),
      busySlots,
    });

    if (slots.length > 0) {
      datesWithSlots.push(dateStr);
    }
  }

  return NextResponse.json({ dates: datesWithSlots });
}
