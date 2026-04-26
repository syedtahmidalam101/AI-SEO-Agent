import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const site = await prisma.site.findFirst({ orderBy: { createdAt: "desc" } });
  const h = await headers();
  const pathname = h.get("x-invoke-path") || h.get("x-pathname") || "";

  return (
    <div className="flex min-h-screen">
      <Sidebar siteName={site?.businessName || site?.domain} current={pathname} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
