import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  deadline: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const semester = await prisma.semester.update({
    where: { id: params.id },
    data: {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });

  return NextResponse.json({ semester });
}

// A semester with no logged entries can be removed outright (e.g. a
// mis-created draft). One with entries should be deactivated instead,
// never deleted, to preserve the historical record.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const count = await prisma.volunteerEntry.count({ where: { semesterId: params.id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "This semester has entries logged against it and can't be deleted. Deactivate it instead." },
      { status: 409 }
    );
  }
  await prisma.semester.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
