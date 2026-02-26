import { NextResponse } from "next/server";
import { subDays, addDays } from "date-fns";
import type { BookingStatus } from "@prisma/client";
import { getAdminTeacher } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  let from = fromParam ? new Date(fromParam + "T00:00:00Z") : subDays(now, 30);
  let to = toParam ? new Date(toParam + "T23:59:59.999Z") : addDays(now, 90);
  if (Number.isNaN(from.getTime())) from = subDays(now, 30);
  if (Number.isNaN(to.getTime())) to = addDays(now, 90);

  const statusFilter: BookingStatus | undefined =
    statusParam && ["CONFIRMED", "CANCELLED", "COMPLETED", "RESCHEDULED"].includes(statusParam)
      ? (statusParam as BookingStatus)
      : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      teacherId: teacher.id,
      ...(statusFilter && { status: statusFilter }),
      startTime: { gte: from, lte: to },
    },
    include: {
      lessonType: { select: { duration: true, price: true, currency: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const teacherTimezone = process.env.TEACHER_TIMEZONE ?? "Europe/Paris";
  const list = bookings.map((b) => ({
    id: b.id,
    clientName: b.clientName,
    clientEmail: b.clientEmail,
    clientTimezone: b.clientTimezone,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    duration: b.lessonType.duration,
    price: b.lessonType.price,
    currency: b.lessonType.currency,
    managementToken: b.managementToken,
    meetLink: b.meetLink,
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ bookings: list, teacherTimezone });
}
