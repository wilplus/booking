import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";

export async function GET() {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    connected: Boolean(teacher.googleRefreshToken),
    calendarId: teacher.googleCalendarId ?? null,
  });
}
