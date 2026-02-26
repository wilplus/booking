import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";
import { getFreebusy } from "@/lib/google-calendar";
import { startOfDay, endOfDay } from "date-fns";
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
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);
      const timeMin = fromZonedTime(`${dateStr}T00:00:00`, TEACHER_TIMEZONE);
      const timeMax = fromZonedTime(`${dateStr}T23:59:59`, TEACHER_TIMEZONE);
      const busy = await getFreebusy(teacher, timeMin, timeMax);
      freebusyOk = true;
    } catch (err) {
      freebusyOk = false;
      freebusyError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    connected,
    calendarId,
    freebusyOk,
    freebusyError,
  });
}
