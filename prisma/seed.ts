import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const site = await prisma.site.upsert({
    where: { domain: "arked.dk" },
    update: {},
    create: {
      domain: "arked.dk",
      businessName: "Arked",
      businessSummary:
        "Manchester-based architecture studio specialising in residential extensions, kitchen redesigns, and loft conversions across Greater Manchester and Salford.",
      idealCustomer:
        "Homeowners in Greater Manchester planning a £40k+ renovation who want a thoughtful, design-led architect rather than a budget contractor.",
      productsList:
        "Residential extensions, kitchen redesigns, loft conversions, planning applications, listed-building consents, and full project management.",
      advantages:
        "RIBA-chartered, 12-year track record, in-house planning specialists, and a portfolio of over 200 completed Manchester projects.",
      sitemapUrl: "https://arked.dk/sitemap.xml",
      pagesCount: 351,
    },
  });

  await prisma.connection.createMany({
    data: [
      { siteId: site.id, kind: "sitemap", category: "source", status: "connected", config: JSON.stringify({ url: site.sitemapUrl }) },
      { siteId: site.id, kind: "business_data", category: "source", status: "connected" },
      { siteId: site.id, kind: "google_search_console", category: "source", status: "not_connected" },
      { siteId: site.id, kind: "google_ads", category: "source", status: "not_connected" },
      { siteId: site.id, kind: "ahrefs", category: "source", status: "not_connected" },
      { siteId: site.id, kind: "cms", category: "destination", status: "not_connected" },
      { siteId: site.id, kind: "google_ads_publish", category: "destination", status: "not_connected" },
      { siteId: site.id, kind: "backlink_club", category: "destination", status: "not_connected" },
    ],
  });

  const items = [
    { pageType: "Article", keyword: "architect fees", title: "Architect Fees Explained for Homeowners", status: "planned", customTags: "Need interview" },
    { pageType: "Article", keyword: "extension costs", title: "How much does a home extension cost in the UK?", status: "planned" },
    { pageType: "Article", keyword: "house extension ideas", title: "9 House Extension Ideas That Add Space", status: "generating" },
    { pageType: "Services", keyword: "extension architect manchester", title: "House Extension Architects in Manchester", status: "for_review" },
    { pageType: "LLM", keyword: "best architects manchester salford didsbury", title: "Best Architects in Manchester, Salford & Didsbury (2026)", status: "published", seoScore: 91 },
    { pageType: "Article", keyword: "kitchen extension cost manchester", title: "Kitchen Extension Costs in Manchester", status: "published", seoScore: 88, customTags: "Approved by Ida" },
    { pageType: "Services", keyword: "architect drawings manchester", title: "Architect Drawings in Manchester", status: "published", seoScore: 86 },
    { pageType: "Services", keyword: "loft conversion architect", title: "Loft Conversion Architects for Family Homes", status: "published", seoScore: 84 },
  ];

  for (const item of items) {
    await prisma.contentItem.create({ data: { ...item, siteId: site.id } });
  }

  console.log("Seeded site:", site.domain);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
