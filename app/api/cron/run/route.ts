import { NextResponse } from "next/server";
import { addHours, addMinutes, subMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  sendReminder24h,
  sendReminder1h,
  sendPostSessionEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7) === secret;
  const key = new URL(request.url).searchParams.get("key");
  return key === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let sent24h = 0;
  let sent1h = 0;
  let sentPost = 0;

  // —— Reminders: 24h and 1h ——
  const in23h = addHours(now, 23);
  const in25h = addHours(now, 25);
  const in50m = addMinutes(now, 50);
  const in70m = addMinutes(now, 70);

  const due24h = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminder24hSent: false,
      startTime: { gte: in23h, lte: in25h },
    },
    include: { teacher: true, lessonType: { select: { duration: true } } },
  });

  const due1h = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminder1hSent: false,
      startTime: { gte: in50m, lte: in70m },
    },
    include: { teacher: true, lessonType: { select: { duration: true } } },
  });

  for (const b of due24h) {
    try {
      const ok = await sendReminder24h({
        to: b.clientEmail,
        clientName: b.clientName,
        teacherName: b.teacher.name,
        clientTimezone: b.clientTimezone,
        startTime: b.startTime.toISOString(),
        durationMinutes: b.lessonType.duration,
        meetLink: b.meetLink,
        managementToken: b.managementToken,
      });
      if (ok) {
        await prisma.booking.update({
          where: { id: b.id },
          data: { reminder24hSent: true },
        });
        sent24h++;
      }
    } catch (err) {
      console.error("Reminder 24h failed for booking", b.id, err);
    }
  }

  for (const b of due1h) {
    try {
      const ok = await sendReminder1h({
        to: b.clientEmail,
        clientName: b.clientName,
        teacherName: b.teacher.name,
        clientTimezone: b.clientTimezone,
        startTime: b.startTime.toISOString(),
        durationMinutes: b.lessonType.duration,
        meetLink: b.meetLink,
        managementToken: b.managementToken,
      });
      if (ok) {
        await prisma.booking.update({
          where: { id: b.id },
          data: { reminder1hSent: true },
        });
        sent1h++;
      }
    } catch (err) {
      console.error("Reminder 1h failed for booking", b.id, err);
    }
  }

  // —— Post-session emails ——
  const sessionEndedBy = subMinutes(now, 5);
  const duePost = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      postSessionEmailSent: false,
      endTime: { lt: sessionEndedBy },
    },
    include: {
      teacher: true,
      lessonType: { select: { duration: true } },
    },
  });

  for (const b of duePost) {
    try {
      const ok = await sendPostSessionEmail({
        to: b.clientEmail,
        clientName: b.clientName,
        teacherName: b.teacher.name,
        clientTimezone: b.clientTimezone,
        startTime: b.startTime.toISOString(),
        durationMinutes: b.lessonType.duration,
        message: b.teacher.postSessionMessage ?? null,
        paymentLink: b.teacher.stripePaymentLink ?? null,
      });
      if (ok) {
        await prisma.booking.update({
          where: { id: b.id },
          data: { postSessionEmailSent: true },
        });
        sentPost++;
      }
    } catch (err) {
      console.error("Post-session email failed for booking", b.id, err);
    }
  }

  return NextResponse.json({
    ok: true,
    sent24h,
    sent1h,
    sentPostSession: sentPost,
  });
}
