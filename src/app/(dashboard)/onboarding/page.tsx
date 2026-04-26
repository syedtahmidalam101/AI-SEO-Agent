import { prisma } from "@/lib/db";
import { OnboardingChat } from "./chat";

export default async function OnboardingPage() {
  const site = await prisma.site.findFirst({ orderBy: { createdAt: "desc" } });
  return <OnboardingChat initialSite={site ? {
    id: site.id,
    domain: site.domain,
    businessName: site.businessName,
    businessSummary: site.businessSummary,
    idealCustomer: site.idealCustomer,
    productsList: site.productsList,
    advantages: site.advantages,
    sitemapUrl: site.sitemapUrl,
    pagesCount: site.pagesCount,
  } : null} />;
}
