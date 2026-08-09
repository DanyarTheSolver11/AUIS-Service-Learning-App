import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  studentId: z
    .string()
    .trim()
    .min(3, "That doesn't look like a valid student ID.")
    .max(20),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const userId = (session.user as any).id as string;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { studentId: parsed.data.studentId },
  });

  return NextResponse.json({ user });
}
