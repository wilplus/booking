import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export async function GET() {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.redirect(new URL("/admin/sign-in", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/admin/calendar/callback`;
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: teacher.id,
  });
  return NextResponse.redirect(url);
}
