import { NextResponse } from "next/server";
import { subMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendPostSessionEmail } from "@/lib/email";

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
  const sessionEndedBy = subMinutes(now, 5);

  const due = await prisma.booking.findMany({
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

  let sent = 0;
  for (const b of due) {
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
        sent++;
      }
    } catch (err) {
      console.error("Post-session email failed for booking", b.id, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
