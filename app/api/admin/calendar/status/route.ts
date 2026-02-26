import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";
import { getFreebusyStatus } from "@/lib/google-calendar";
import { fromZonedTime } from "date-fns-tz";

export const dynamic = "force-dynamic";

const TEACHER_TIMEZONE = process.env.TEACHER_TIMEZONE ?? "Europe/Paris";

export async function GET() {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connected = Boolean(teacher.googleRefreshToken);
  const calendarId = teacher.googleCalendarId ?? null;

  let freebusyOk: boolean | null = null;
  let freebusyError: string | null = null;
  if (connected) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const timeMin = fromZonedTime(`${dateStr}T00:00:00`, TEACHER_TIMEZONE);
    const timeMax = fromZonedTime(`${dateStr}T23:59:59`, TEACHER_TIMEZONE);
    const status = await getFreebusyStatus(teacher, timeMin, timeMax);
    freebusyOk = status.ok;
    freebusyError = status.ok ? null : status.error;
  }

  return NextResponse.json({
    connected,
    calendarId,
    freebusyOk,
    freebusyError,
  });
}
