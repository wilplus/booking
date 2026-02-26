import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teacher = await prisma.teacher.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      lessonTypes: {
        where: { isActive: true },
        orderBy: { duration: "asc" },
        select: { id: true, duration: true, price: true, currency: true },
      },
    },
  });
  if (!teacher) {
    return NextResponse.json({ error: "No teacher configured" }, { status: 404 });
  }
  return NextResponse.json({
    id: teacher.id,
    name: teacher.name,
    photoUrl: teacher.photoUrl ?? null,
    bio: teacher.bio ?? null,
    lessonTypes: teacher.lessonTypes,
  });
}
