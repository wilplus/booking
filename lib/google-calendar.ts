import { google } from "googleapis";
import type { Teacher } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const calendar = google.calendar("v3");

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
  return new google.auth.OAuth2(clientId, clientSecret, "");
}

export async function refreshTeacherTokens(teacher: Teacher): Promise<void> {
  if (!teacher.googleRefreshToken) return;
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    refresh_token: teacher.googleRefreshToken,
    access_token: teacher.googleAccessToken ?? undefined,
  });
  const res = await oauth2.getAccessToken();
  const newToken = res.token ?? null;
  if (newToken && newToken !== teacher.googleAccessToken) {
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { googleAccessToken: newToken },
    });
  }
}

export type CreateCalendarEventParams = {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendeeEmail: string;
};

export type CreateCalendarEventResult = {
  eventId: string;
  meetLink: string | null;
  htmlLink: string | null;
};

/**
 * Creates a Google Calendar event with Google Meet. Refreshes the teacher's
 * access token if needed. Does not throw if calendar is not connected.
 */
export async function createCalendarEvent(
  teacher: Teacher,
  params: CreateCalendarEventParams
): Promise<CreateCalendarEventResult | null> {
  if (!teacher.googleRefreshToken) return null;
  const calendarId = teacher.googleCalendarId ?? "primary";

  await refreshTeacherTokens(teacher);
  const updated = await prisma.teacher.findUnique({
    where: { id: teacher.id },
    select: { googleAccessToken: true },
  });
  const accessToken = updated?.googleAccessToken ?? teacher.googleAccessToken;
  if (!accessToken) return null;

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    refresh_token: teacher.googleRefreshToken,
    access_token: accessToken,
  });

  const requestId = `booking-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const resource = {
    summary: params.summary,
    description: params.description ?? undefined,
    start: { dateTime: params.start.toISOString(), timeZone: "UTC" },
    end: { dateTime: params.end.toISOString(), timeZone: "UTC" },
    attendees: params.attendeeEmail ? [{ email: params.attendeeEmail }] : undefined,
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const res = await calendar.events.insert({
    auth: oauth2,
    calendarId,
    requestBody: resource,
    conferenceDataVersion: 1,
  });

  const event = res.data;
  const meetLink =
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ?? null;
  return {
    eventId: event.id ?? "",
    meetLink,
    htmlLink: event.htmlLink ?? null,
  };
}

export type FreebusySlot = { start: Date; end: Date };

/**
 * Returns busy time ranges for the teacher's calendar in the given window.
 * Used to block slots when computing availability.
 */
export async function getFreebusy(
  teacher: Teacher,
  timeMin: Date,
  timeMax: Date
): Promise<FreebusySlot[]> {
  if (!teacher.googleRefreshToken) return [];
  const calendarId = teacher.googleCalendarId ?? "primary";

  await refreshTeacherTokens(teacher);
  const updated = await prisma.teacher.findUnique({
    where: { id: teacher.id },
    select: { googleAccessToken: true },
  });
  const accessToken = updated?.googleAccessToken ?? teacher.googleAccessToken;
  if (!accessToken) return [];

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    refresh_token: teacher.googleRefreshToken,
    access_token: accessToken,
  });

  try {
    const res = await calendar.freebusy.query({
      auth: oauth2,
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId }],
      },
    });
    const cal = res.data.calendars?.[calendarId];
    if (cal?.errors?.length) {
      console.warn("[getFreebusy] Calendar API returned errors for", calendarId, cal.errors);
    }
    const busy = cal?.busy ?? [];
    return busy
      .filter((b) => b.start && b.end)
      .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
  } catch (err) {
    console.error("[getFreebusy] Failed to fetch busy slots:", err);
    return [];
  }
}

/**
 * Tests whether freebusy can be read for the teacher's calendar.
 * Returns { ok: true } or { ok: false, error: string }. Used for admin status.
 */
export async function getFreebusyStatus(
  teacher: Teacher,
  timeMin: Date,
  timeMax: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!teacher.googleRefreshToken) return { ok: false, error: "Calendar not connected" };
  const calendarId = teacher.googleCalendarId ?? "primary";

  await refreshTeacherTokens(teacher);
  const updated = await prisma.teacher.findUnique({
    where: { id: teacher.id },
    select: { googleAccessToken: true },
  });
  const accessToken = updated?.googleAccessToken ?? teacher.googleAccessToken;
  if (!accessToken) return { ok: false, error: "No access token" };

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    refresh_token: teacher.googleRefreshToken,
    access_token: accessToken,
  });

  try {
    const res = await calendar.freebusy.query({
      auth: oauth2,
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId }],
      },
    });
    const cal = res.data.calendars?.[calendarId];
    if (cal?.errors?.length) {
      const msg = cal.errors
        .map((e) => (typeof e.reason === "string" ? e.reason : "unknown"))
        .join(", ");
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Deletes a Google Calendar event. Refreshes token if needed.
 */
export async function deleteCalendarEvent(
  teacher: Teacher,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  if (!teacher.googleRefreshToken) return false;
  await refreshTeacherTokens(teacher);
  const updated = await prisma.teacher.findUnique({
    where: { id: teacher.id },
    select: { googleAccessToken: true },
  });
  const accessToken = updated?.googleAccessToken ?? teacher.googleAccessToken;
  if (!accessToken) return false;

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    refresh_token: teacher.googleRefreshToken,
    access_token: accessToken,
  });

  try {
    await calendar.events.delete({
      auth: oauth2,
      calendarId: calendarId || "primary",
      eventId,
    });
    return true;
  } catch {
    return false;
  }
}
