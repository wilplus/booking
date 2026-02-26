import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmation, sendNewBookingNotificationToTeacher } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { clientName, clientEmail, clientTimezone, lessonTypeId, startTime: startTimeStr } = body;

  if (
    typeof clientName !== "string" ||
    typeof clientEmail !== "string" ||
    typeof clientTimezone !== "string" ||
    typeof lessonTypeId !== "string" ||
    typeof startTimeStr !== "string"
  ) {
    return NextResponse.json(
      { error: "clientName, clientEmail, clientTimezone, lessonTypeId, startTime required" },
      { status: 400 }
    );
  }
  const startTime = new Date(startTimeStr);
  if (Number.isNaN(startTime.getTime())) {
    return NextResponse.json({ error: "Invalid startTime (ISO string)" }, { status: 400 });
  }

  const lessonType = await prisma.lessonType.findUnique({
    where: { id: lessonTypeId, isActive: true },
    include: { teacher: true },
  });
  if (!lessonType) {
    return NextResponse.json({ error: "Lesson type not found or inactive" }, { status: 400 });
  }
  const teacher = lessonType.teacher;
  const endTime = addMinutes(startTime, lessonType.duration);

  const result = await prisma.$transaction(async (tx) => {
    const bufferMs = teacher.bufferMinutes * 60 * 1000;
    const windowStart = new Date(startTime.getTime() - bufferMs);
    const windowEnd = new Date(endTime.getTime() + bufferMs);
    const existing = await tx.booking.findFirst({
      where: {
        teacherId: teacher.id,
        status: "CONFIRMED",
        startTime: { lt: windowEnd },
        endTime: { gt: windowStart },
      },
    });
    if (existing) return { conflict: true } as const;
    const booking = await tx.booking.create({
      data: {
        teacherId: teacher.id,
        lessonTypeId: lessonType.id,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        clientTimezone: clientTimezone.trim(),
        startTime,
        endTime,
        status: "CONFIRMED",
      },
      select: {
        id: true,
        managementToken: true,
        startTime: true,
        endTime: true,
        lessonType: { select: { duration: true } },
      },
    });
    return { conflict: false, booking } as const;
  });

  if (result.conflict) {
    return NextResponse.json(
      { error: "This slot is no longer available. Please choose another time." },
      { status: 409 }
    );
  }

  const b = result.booking;
  let meetLink: string | null = null;
  let googleEventId: string | null = null;

  try {
    const calendarResult = await createCalendarEvent(teacher, {
      summary: `Lesson with ${clientName.trim()} (${lessonType.duration} min)`,
      description: `Client: ${clientEmail.trim()}\nDuration: ${lessonType.duration} min`,
      start: b.startTime,
      end: b.endTime,
      attendeeEmail: clientEmail.trim(),
    });
    if (calendarResult) {
      meetLink = calendarResult.meetLink;
      googleEventId = calendarResult.eventId;
      await prisma.booking.update({
        where: { id: b.id },
        data: { meetLink, googleEventId },
      });
    }
  } catch (err) {
    console.error("Calendar event creation failed:", err);
  }

  let clientEmailSent = false;
  try {
    clientEmailSent = await sendBookingConfirmation({
      to: clientEmail.trim().toLowerCase(),
      clientName: clientName.trim(),
      teacherName: teacher.name,
      clientTimezone: clientTimezone.trim(),
      startTime: b.startTime.toISOString(),
      durationMinutes: b.lessonType.duration,
      meetLink,
      managementToken: b.managementToken,
    });
  } catch (err) {
    console.error("Confirmation email failed:", err);
  }

  const teacherTimezone = process.env.TEACHER_TIMEZONE ?? "Europe/Paris";
  try {
    await sendNewBookingNotificationToTeacher({
      to: teacher.email,
      teacherName: teacher.name,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      teacherTimezone,
      startTime: b.startTime.toISOString(),
      durationMinutes: b.lessonType.duration,
    });
  } catch (err) {
    console.error("Teacher notification email failed:", err);
  }

  return NextResponse.json({
    id: b.id,
    managementToken: b.managementToken,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    duration: b.lessonType.duration,
    meetLink,
    emailSent: clientEmailSent,
  });
}
