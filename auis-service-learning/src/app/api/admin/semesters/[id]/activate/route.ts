import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$transaction([
    prisma.semester.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.semester.update({ where: { id: params.id }, data: { isActive: true } }),
  ]);

  return NextResponse.json({ success: true });
}
