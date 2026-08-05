import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendStatusUpdateEmail } from "@/lib/email";

// GET is used by the /approve/[token] page to render the entry details
// to the supervisor before they decide. Deliberately returns only the
// fields a supervisor needs to see — no student ID, no other entries.
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const entry = await prisma.volunteerEntry.findUnique({
    where: { approvalToken: params.token },
    include: { student: { select: { name: true, email: true } } },
  });
  if (!entry) return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });

  return NextResponse.json({
    entry: {
      id: entry.id,
      date: entry.date,
      department: entry.department,
      action: entry.action,
      hours: entry.hours,
      status: entry.status,
      studentName: entry.student.name ?? entry.student.email,
      supervisorName: entry.supervisorName,
    },
  });
}

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const entry = await prisma.volunteerEntry.findUnique({
    where: { approvalToken: params.token },
    include: { student: { select: { name: true, email: true } } },
  });
  if (!entry) return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });

  if (entry.status !== "PENDING") {
    return NextResponse.json(
      { error: `This entry was already marked ${entry.status.toLowerCase()}. If that's wrong, contact Student Services.` },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.volunteerEntry.update({
    where: { id: entry.id },
    data: {
      status: parsed.data.decision,
      approvedAt: parsed.data.decision === "APPROVED" ? new Date() : null,
      rejectedReason: parsed.data.decision === "REJECTED" ? parsed.data.reason ?? null : null,
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
    console.error("Failed to notify student:", err);
  }

  return NextResponse.json({ success: true, status: updated.status });
}
