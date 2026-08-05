import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApprovalToken } from "@/lib/tokens";
import { sendApprovalRequestEmail } from "@/lib/email";

const updateSchema = z.object({
  date: z.string().optional(),
  department: z.string().min(1).max(200).optional(),
  action: z.string().min(1).max(1000).optional(),
  hours: z.number().positive().max(24).optional(),
  supervisorName: z.string().min(1).max(200).optional(),
  supervisorEmail: z.string().email().optional(),
});

async function assertOwnedPendingEntry(entryId: string, userId: string) {
  const entry = await prisma.volunteerEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.studentId !== userId) return null;
  return entry;
}

// Students can only edit/delete entries that haven't been approved or
// rejected yet — once a supervisor has acted, the record is locked to
// keep the audit trail honest for the awards ceremony.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const entry = await assertOwnedPendingEntry(params.id, userId);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.status !== "PENDING") {
    return NextResponse.json({ error: "This entry has already been reviewed and can't be edited." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const supervisorChanged =
    (data.supervisorEmail && data.supervisorEmail !== entry.supervisorEmail) ||
    (data.supervisorName && data.supervisorName !== entry.supervisorName);

  const newToken = supervisorChanged ? generateApprovalToken() : entry.approvalToken;

  const updated = await prisma.volunteerEntry.update({
    where: { id: entry.id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      approvalToken: newToken,
    },
  });

  if (supervisorChanged) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    try {
      await sendApprovalRequestEmail({
        supervisorEmail: updated.supervisorEmail,
        supervisorName: updated.supervisorName,
        studentName: user?.name ?? user?.email ?? "A student",
        department: updated.department,
        action: updated.action,
        hours: updated.hours,
        date: updated.date.toDateString(),
        approvalToken: newToken,
      });
    } catch (err) {
      console.error("Failed to send approval email:", err);
    }
  }

  return NextResponse.json({ entry: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const entry = await assertOwnedPendingEntry(params.id, userId);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.status !== "PENDING") {
    return NextResponse.json({ error: "Approved or rejected entries can't be deleted." }, { status: 403 });
  }

  await prisma.volunteerEntry.delete({ where: { id: entry.id } });
  return NextResponse.json({ success: true });
}
