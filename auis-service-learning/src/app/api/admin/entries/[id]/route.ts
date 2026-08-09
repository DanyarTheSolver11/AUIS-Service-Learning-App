import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { sendStatusUpdateEmail } from "@/lib/email";

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

const editSchema = z.object({
  date: z.string().optional(),
  department: z.string().min(1).max(200).optional(),
  action: z.string().min(1).max(1000).optional(),
  hours: z.number().positive().max(24).optional(),
});

// Two things can happen here, told apart by the request body shape:
// - { decision, reason? } — approve/reject override, for when a
//   supervisor is unreachable. Distinct from the public token-based
//   /api/approve route the supervisor themselves uses.
// - { date?, department?, action?, hours? } — a direct field correction,
//   e.g. fixing a typo an admin noticed. Works regardless of the entry's
//   current status, unlike the student-facing edit route which only
//   allows editing while PENDING.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entry = await prisma.volunteerEntry.findUnique({
    where: { id: params.id },
    include: { student: { select: { name: true, email: true } } },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if ("decision" in body) {
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.volunteerEntry.update({
      where: { id: entry.id },
      data: {
        status: parsed.data.decision,
        approvedAt: parsed.data.decision === "APPROVED" ? new Date() : null,
        rejectedReason:
          parsed.data.decision === "REJECTED"
            ? parsed.data.reason ?? "Reviewed and declined by Student Services."
            : null,
      },
    });

    try {
      await sendStatusUpdateEmail({
        studentEmail: entry.student.email,
        studentName: entry.student.name ?? entry.student.email,
        status: updated.status as "APPROVED" | "REJECTED",
        department: updated.department,
        hours: updated.hours,
        reason: updated.rejectedReason,
      });
    } catch (err) {
      console.error("Failed to notify student of admin override:", err);
    }

    return NextResponse.json({ entry: updated });
  }

  const parsed = editSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const updated = await prisma.volunteerEntry.update({
    where: { id: entry.id },
    data: {
      department: data.department,
      action: data.action,
      hours: data.hours,
      date: data.date ? new Date(data.date) : undefined,
    },
  });

  return NextResponse.json({ entry: updated });
}

// Admin-level delete works on any entry regardless of status or owner —
// the student-facing DELETE route only permits removing your own PENDING
// entries. Use for genuine mistakes (duplicate submissions, wrong entry
// logged against the wrong student, etc).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entry = await prisma.volunteerEntry.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.volunteerEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
