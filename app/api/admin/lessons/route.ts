import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lessonTypes = await prisma.lessonType.findMany({
    where: { teacherId: teacher.id },
    orderBy: { duration: "asc" },
  });
  return NextResponse.json(lessonTypes);
}

export async function PUT(request: Request) {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be an array of { id, price, currency, isActive }" },
      { status: 400 }
    );
  }
  const updated = await prisma.$transaction(
    body.map(
      (row: { id: string; price: number; currency: string; isActive: boolean }) => {
        if (!row.id || typeof row.price !== "number" || typeof row.currency !== "string" || typeof row.isActive !== "boolean") {
          throw new Error("Each row must have id, price (number), currency (string), isActive (boolean)");
        }
        return prisma.lessonType.updateMany({
          where: { id: row.id, teacherId: teacher.id },
          data: { price: row.price, currency: row.currency.trim() || "EUR", isActive: row.isActive },
        });
      }
    )
  );
  const lessonTypes = await prisma.lessonType.findMany({
    where: { teacherId: teacher.id },
    orderBy: { duration: "asc" },
  });
  return NextResponse.json(lessonTypes);
}
