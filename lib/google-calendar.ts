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

const MAX_CALENDARS_FREEBUSY = 50;

/**
 * Returns calendar IDs to query for busy times: primary plus all calendars
 * from the user's calendar list (e.g. Preply Schedule, other subscribed calendars).
 */
async function getCalendarIdsForFreebusy(
  oauth2: ReturnType<typeof getOAuth2Client>
): Promise<string[]> {
  const ids = new Set<string>(["primary"]);
  try {
    let pageToken: string | undefined;
    do {
      const list = await calendar.calendarList.list({
        auth: oauth2,
        maxResults: 250,
        pageToken,
      });
      for (const item of list.data.items ?? []) {
        if (item.id) ids.add(item.id);
      }
      pageToken = list.data.nextPageToken ?? undefined;
    } while (pageToken);
  } catch (err) {
    console.warn("[getCalendarIdsForFreebusy] Could not list calendars, using primary only:", err);
  }
  return Array.from(ids).slice(0, MAX_CALENDARS_FREEBUSY);
}

/**
 * Returns busy time ranges for the teacher's calendars in the given window.
 * Includes primary calendar and all other calendars (e.g. Preply Schedule)
 * so events on any of them block availability.
 */
export async function getFreebusy(
  teacher: Teacher,
  timeMin: Date,
  timeMax: Date
): Promise<FreebusySlot[]> {
  if (!teacher.googleRefreshToken) return [];

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
    const calendarIds = await getCalendarIdsForFreebusy(oauth2);
    const res = await calendar.freebusy.query({
      auth: oauth2,
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map((id) => ({ id })),
      },
    });

    const allBusy: FreebusySlot[] = [];
    const calendars = res.data.calendars ?? {};
    for (const calId of Object.keys(calendars)) {
      const cal = calendars[calId];
      if (cal?.errors?.length) {
        console.warn("[getFreebusy] Calendar API returned errors for", calId, cal.errors);
      }
      const busy = cal?.busy ?? [];
      for (const b of busy) {
        if (b.start && b.end) {
          allBusy.push({ start: new Date(b.start), end: new Date(b.end) });
        }
      }
    }
    return allBusy;
  } catch (err) {
    console.error("[getFreebusy] Failed to fetch busy slots:", err);
    return [];
  }
}

/**
 * Tests whether freebusy can be read for the teacher's calendars.
 * Returns { ok: true } or { ok: false, error: string }. Used for admin status.
 */
export async function getFreebusyStatus(
  teacher: Teacher,
  timeMin: Date,
  timeMax: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!teacher.googleRefreshToken) return { ok: false, error: "Calendar not connected" };

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
    const calendarIds = await getCalendarIdsForFreebusy(oauth2);
    const res = await calendar.freebusy.query({
      auth: oauth2,
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map((id) => ({ id })),
      },
    });
    const calendars = res.data.calendars ?? {};
    const errors: string[] = [];
    for (const calId of Object.keys(calendars)) {
      const cal = calendars[calId];
      if (cal?.errors?.length) {
        const msg = cal.errors
          .map((e) => (typeof e.reason === "string" ? e.reason : "unknown"))
          .join(", ");
        errors.push(`${calId}: ${msg}`);
      }
    }
    if (errors.length > 0 && errors.length === Object.keys(calendars).length) {
      return { ok: false, error: errors.join("; ") };
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
