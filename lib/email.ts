import { Resend } from "resend";
import { render } from "@react-email/components";
import React from "react";
import BookingConfirmation from "@/components/emails/BookingConfirmation";
import CancellationConfirmation from "@/components/emails/CancellationConfirmation";
import Reminder24h from "@/components/emails/Reminder24h";
import Reminder1h from "@/components/emails/Reminder1h";
import PostSession from "@/components/emails/PostSession";
import NewBookingNotification from "@/components/emails/NewBookingNotification";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const from = process.env.EMAIL_FROM ?? "booking@willonski.com";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://booking.willonski.com";

// Emails require: RESEND_API_KEY set; EMAIL_FROM must be a verified domain in Resend (https://resend.com/domains).
// If emails don't send, check server logs for "[email]" errors and the Resend dashboard for delivery status.

function formatInTz(isoUtc: string, tz: string): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleString(undefined, {
      timeZone: tz,
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return new Date(isoUtc).toLocaleString();
  }
}

export async function sendBookingConfirmation(params: {
  to: string;
  clientName: string;
  teacherName: string;
  clientTimezone: string;
  startTime: string;
  durationMinutes: number;
  meetLink: string | null;
  managementToken: string;
}): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set – skipping client confirmation to", params.to);
    return false;
  }
  const manageUrl = `${appUrl}/manage/${params.managementToken}`;
  const startFormatted = formatInTz(params.startTime, params.clientTimezone || "UTC");
  const html = await render(
    React.createElement(BookingConfirmation, {
      clientName: params.clientName,
      teacherName: params.teacherName,
      startTimeFormatted: startFormatted,
      durationMinutes: params.durationMinutes,
      meetLink: params.meetLink,
      manageUrl,
      appUrl,
    })
  );
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Lesson confirmed with ${params.teacherName}`,
    html,
  });
  if (error) {
    console.error("[email] Client confirmation failed to", params.to, JSON.stringify(error));
    return false;
  }
  return true;
}

export async function sendCancellationConfirmation(params: {
  to: string;
  clientName: string;
  teacherName: string;
  clientTimezone: string;
  startTime: string;
  durationMinutes: number;
}): Promise<boolean> {
  if (!resend) return false;
  const startFormatted = formatInTz(params.startTime, params.clientTimezone || "UTC");
  const html = await render(
    React.createElement(CancellationConfirmation, {
      clientName: params.clientName,
      teacherName: params.teacherName,
      startTimeFormatted: startFormatted,
      durationMinutes: params.durationMinutes,
      appUrl,
    })
  );
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Booking cancelled – ${params.teacherName}`,
    html,
  });
  if (error) {
    console.error("[email] Cancellation failed to", params.to, JSON.stringify(error));
    return false;
  }
  return true;
}

export async function sendNewBookingNotificationToTeacher(params: {
  to: string;
  teacherName: string;
  clientName: string;
  clientEmail: string;
  teacherTimezone: string;
  startTime: string;
  durationMinutes: number;
}): Promise<boolean> {
  if (!resend) return false;
  const startFormatted = formatInTz(params.startTime, params.teacherTimezone || "UTC");
  const adminBookingsUrl = `${appUrl}/admin/bookings`;
  const html = await render(
    React.createElement(NewBookingNotification, {
      teacherName: params.teacherName,
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      startTimeFormatted: startFormatted,
      durationMinutes: params.durationMinutes,
      adminBookingsUrl,
    })
  );
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `New booking: ${params.clientName} – ${startFormatted}`,
    html,
  });
  if (error) {
    console.error("[email] Teacher notification failed to", params.to, JSON.stringify(error));
    return false;
  }
  return true;
}

export async function sendReminder24h(params: {
  to: string;
  clientName: string;
  teacherName: string;
  clientTimezone: string;
  startTime: string;
  durationMinutes: number;
  meetLink: string | null;
  managementToken: string;
}): Promise<boolean> {
  if (!resend) return false;
  const manageUrl = `${appUrl}/manage/${params.managementToken}`;
  const startFormatted = formatInTz(params.startTime, params.clientTimezone || "UTC");
  const html = await render(
    React.createElement(Reminder24h, {
      clientName: params.clientName,
      teacherName: params.teacherName,
      startTimeFormatted: startFormatted,
      durationMinutes: params.durationMinutes,
      meetLink: params.meetLink,
      manageUrl,
      appUrl,
    })
  );
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Reminder: lesson with ${params.teacherName} in 24 hours`,
    html,
  });
  if (error) {
    console.error("[email] Reminder 24h failed to", params.to, JSON.stringify(error));
    return false;
  }
  return true;
}

export async function sendReminder1h(params: {
  to: string;
  clientName: string;
  teacherName: string;
  clientTimezone: string;
  startTime: string;
  durationMinutes: number;
  meetLink: string | null;
  managementToken: string;
}): Promise<boolean> {
  if (!resend) return false;
  const manageUrl = `${appUrl}/manage/${params.managementToken}`;
  const startFormatted = formatInTz(params.startTime, params.clientTimezone || "UTC");
  const html = await render(
    React.createElement(Reminder1h, {
      clientName: params.clientName,
      teacherName: params.teacherName,
      startTimeFormatted: startFormatted,
      durationMinutes: params.durationMinutes,
      meetLink: params.meetLink,
      manageUrl,
      appUrl,
    })
  );
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Starting soon: lesson with ${params.teacherName}`,
    html,
  });
  if (error) {
    console.error("[email] Reminder 1h failed to", params.to, JSON.stringify(error));
    return false;
  }
  return true;
}

export async function sendPostSessionEmail(params: {
  to: string;
  clientName: string;
  teacherName: string;
  clientTimezone: string;
  startTime: string;
  durationMinutes: number;
  message: string | null;
  paymentLink: string | null;
}): Promise<boolean> {
  if (!resend) return false;
  const startFormatted = formatInTz(params.startTime, params.clientTimezone || "UTC");
  const html = await render(
    React.createElement(PostSession, {
      clientName: params.clientName,
      teacherName: params.teacherName,
      startTimeFormatted: startFormatted,
      durationMinutes: params.durationMinutes,
      message: params.message,
      paymentLink: params.paymentLink,
      appUrl,
    })
  );
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Thanks for your lesson with ${params.teacherName}`,
    html,
  });
  if (error) {
    console.error("[email] Post-session failed to", params.to, JSON.stringify(error));
    return false;
  }
  return true;
}
