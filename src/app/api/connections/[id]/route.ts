import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status);
  if (!["connected", "not_connected"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const connection = await prisma.connection.update({ where: { id }, data: { status } });
  return NextResponse.json({ connection });
}
