import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const semesters = await prisma.semester.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { entries: true } } },
  });
  return NextResponse.json({ semesters });
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.string(),
  endDate: z.string(),
  deadline: z.string(),
  activate: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const deadline = new Date(data.deadline);
  if (endDate <= startDate) {
    return NextResponse.json({ error: "End date must be after the start date." }, { status: 400 });
  }

  const existing = await prisma.semester.findUnique({ where: { name: data.name } });
  if (existing) {
    return NextResponse.json({ error: "A semester with that name already exists." }, { status: 409 });
  }

  // Creating a semester as "active" atomically deactivates every other one,
  // so students never see two overlapping windows at once.
  const semester = await prisma.$transaction(async (tx) => {
    if (data.activate) {
      await tx.semester.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }
    return tx.semester.create({
      data: { name: data.name, startDate, endDate, deadline, isActive: !!data.activate },
    });
  });

  return NextResponse.json({ semester }, { status: 201 });
}
