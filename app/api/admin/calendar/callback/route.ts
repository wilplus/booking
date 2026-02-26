import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!session?.user?.email || session.user.email.toLowerCase() !== adminEmail) {
    return NextResponse.redirect(new URL("/admin/sign-in", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const calendarUrl = new URL("/admin/calendar", baseUrl);

  if (error) {
    calendarUrl.searchParams.set("error", error);
    return NextResponse.redirect(calendarUrl);
  }
  if (!code || !state) {
    calendarUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(calendarUrl);
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: state },
  });
  if (!teacher) {
    calendarUrl.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(calendarUrl);
  }

  const redirectUri = `${baseUrl}/api/admin/calendar/callback`;
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token && teacher.googleRefreshToken) {
    oauth2.setCredentials({ refresh_token: teacher.googleRefreshToken });
  } else if (tokens.refresh_token || tokens.access_token) {
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        googleAccessToken: tokens.access_token ?? null,
        googleRefreshToken: tokens.refresh_token ?? teacher.googleRefreshToken,
        googleCalendarId: teacher.googleCalendarId ?? "primary",
      },
    });
  }

  calendarUrl.searchParams.set("connected", "1");
  return NextResponse.redirect(calendarUrl);
}
