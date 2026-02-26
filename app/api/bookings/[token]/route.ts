import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const booking = await prisma.booking.findUnique({
    where: { managementToken: token },
    include: {
      lessonType: { select: { duration: true, price: true, currency: true } },
      teacher: { select: { name: true } },
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: booking.id,
    managementToken: booking.managementToken,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    clientTimezone: booking.clientTimezone,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    status: booking.status,
    meetLink: booking.meetLink,
    duration: booking.lessonType.duration,
    price: booking.lessonType.price,
    currency: booking.lessonType.currency,
    teacherName: booking.teacher.name,
  });
}
