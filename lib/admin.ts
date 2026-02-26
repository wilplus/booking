import { getServerSession } from "next-auth";
import type { Teacher } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAdminTeacher(): Promise<Teacher | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!email || !adminEmail || email !== adminEmail) return null;
  const teacher = await prisma.teacher.findUnique({
    where: { email },
  });
  return teacher;
}
