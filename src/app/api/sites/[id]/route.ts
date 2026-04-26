import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const site = await prisma.site.update({
    where: { id },
    data: {
      businessName: body.businessName ?? undefined,
      businessSummary: body.businessSummary ?? undefined,
      idealCustomer: body.idealCustomer ?? undefined,
      productsList: body.productsList ?? undefined,
      advantages: body.advantages ?? undefined,
    },
  });
  return NextResponse.json({ site });
}
