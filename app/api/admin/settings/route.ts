import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    bufferMinutes: teacher.bufferMinutes,
    minNoticeHours: teacher.minNoticeHours,
    maxAdvanceBookingDays: teacher.maxAdvanceBookingDays,
    stripePaymentLink: teacher.stripePaymentLink ?? "",
    postSessionMessage: teacher.postSessionMessage ?? "",
    googleCalendarId: teacher.googleCalendarId ?? null,
    name: teacher.name,
    bio: teacher.bio ?? "",
    photoUrl: teacher.photoUrl ?? "",
  });
}

export async function PUT(request: Request) {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const bufferMinutes = typeof body.bufferMinutes === "number" ? body.bufferMinutes : undefined;
  const minNoticeHours = typeof body.minNoticeHours === "number" ? body.minNoticeHours : undefined;
  const maxAdvanceBookingDays = typeof body.maxAdvanceBookingDays === "number" ? body.maxAdvanceBookingDays : undefined;
  const stripePaymentLink = typeof body.stripePaymentLink === "string" ? body.stripePaymentLink.trim() : undefined;
  const postSessionMessage = typeof body.postSessionMessage === "string" ? body.postSessionMessage.trim() : undefined;
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl.trim() : undefined;

  const data: Record<string, unknown> = {};
  if (bufferMinutes !== undefined && bufferMinutes >= 0) data.bufferMinutes = bufferMinutes;
  if (minNoticeHours !== undefined && minNoticeHours >= 0) data.minNoticeHours = minNoticeHours;
  if (maxAdvanceBookingDays !== undefined && maxAdvanceBookingDays >= 0) data.maxAdvanceBookingDays = maxAdvanceBookingDays;
  if (stripePaymentLink !== undefined) data.stripePaymentLink = stripePaymentLink || null;
  if (postSessionMessage !== undefined) data.postSessionMessage = postSessionMessage || null;
  if (name !== undefined) data.name = name;
  if (bio !== undefined) data.bio = bio || null;
  if (photoUrl !== undefined) data.photoUrl = photoUrl || null;

  const updated = await prisma.teacher.update({
    where: { id: teacher.id },
    data,
  });

  return NextResponse.json({
    bufferMinutes: updated.bufferMinutes,
    minNoticeHours: updated.minNoticeHours,
    maxAdvanceBookingDays: updated.maxAdvanceBookingDays,
    stripePaymentLink: updated.stripePaymentLink ?? "",
    postSessionMessage: updated.postSessionMessage ?? "",
    googleCalendarId: updated.googleCalendarId ?? null,
    name: updated.name,
    bio: updated.bio ?? "",
    photoUrl: updated.photoUrl ?? "",
  });
}
