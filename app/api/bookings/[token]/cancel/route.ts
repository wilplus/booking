import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { sendCancellationConfirmation } from "@/lib/email";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const booking = await prisma.booking.findUnique({
    where: { managementToken: token },
    include: { teacher: true, lessonType: { select: { duration: true } } },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Booking is already cancelled or completed." },
      { status: 400 }
    );
  }

  const minStart = addHours(new Date(), booking.teacher.minNoticeHours);
  if (booking.startTime < minStart) {
    return NextResponse.json(
      {
        error: `Cancellations must be made at least ${booking.teacher.minNoticeHours} hours in advance. Please contact the teacher directly.`,
      },
      { status: 400 }
    );
  }

  if (booking.googleEventId && booking.teacher.googleRefreshToken) {
    try {
      await deleteCalendarEvent(
        booking.teacher,
        booking.teacher.googleCalendarId ?? "primary",
        booking.googleEventId
      );
    } catch (err) {
      console.error("Failed to delete calendar event:", err);
    }
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  try {
    await sendCancellationConfirmation({
      to: booking.clientEmail,
      clientName: booking.clientName,
      teacherName: booking.teacher.name,
      clientTimezone: booking.clientTimezone,
      startTime: booking.startTime.toISOString(),
      durationMinutes: booking.lessonType.duration,
    });
  } catch (err) {
    console.error("Cancellation email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
