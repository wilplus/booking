import { NextResponse } from "next/server";
import { getAdminTeacher } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await getAdminTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.dateOverride.deleteMany({
    where: { id, teacherId: teacher.id },
  });
  return NextResponse.json({ ok: true });
}
