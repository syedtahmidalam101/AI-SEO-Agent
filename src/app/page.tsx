import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function Home() {
  const site = await prisma.site.findFirst({ orderBy: { createdAt: "desc" } });
  if (site) redirect("/content");
  redirect("/onboarding");
}
