# AI SEO Agent

An autonomous SEO platform that scans your site, learns your business, plans content, and generates SEO-optimized articles. Inspired by seo.ai and Writesonic SEO Agent.

## Features

- **Conversational onboarding** — chat-style agent ("Mark") scans your sitemap and learns your business
- **Connections grid** — Data sources (Sitemap, GSC, Ads, Ahrefs) → AI Agent → Output destinations (CMS, Backlink Club)
- **Content plan** — pipeline table of planned, generating, in-review, and published articles
- **Article generator** — long-form, EEAT-aware content via Claude Opus 4.7 with prompt caching
- **On-page audit** — fetches a URL and scores title, meta, headings, word count, internal links

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind
- SQLite via Prisma (zero-config local dev)
- Anthropic SDK with `claude-opus-4-7`, adaptive thinking, and prompt caching

## Quick start

```bash
cp .env.example .env       # add your ANTHROPIC_API_KEY
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000 — you'll land on the onboarding chat.

## Project layout

```
src/
  app/
    (dashboard)/onboarding   # chat-style site scan + business summary
    (dashboard)/connections  # data sources / agent / output destinations
    (dashboard)/content      # content plan table + article view
    (dashboard)/audit        # on-page SEO scorer
    api/
      sites                  # add / fetch a site (parses sitemap.xml)
      agent/onboard          # Claude streaming chat for onboarding
      agent/keywords         # keyword research (structured outputs)
      agent/generate         # article generator with prompt caching
      audit                  # on-page SEO scorer
  lib/
    anthropic.ts             # Anthropic client + cached system prompts
    seo-scorer.ts            # heuristic on-page SEO scoring
    sitemap.ts               # fetch + parse /sitemap.xml
    db.ts                    # Prisma client singleton
prisma/
  schema.prisma              # Site, Connection, ContentItem, AgentRun
  seed.ts                    # demo data
```

## How it works

1. **Add your site** — the agent fetches `/sitemap.xml`, counts pages, and writes a Site row.
2. **Onboarding chat** — Claude streams a guided conversation: identifies business name, ICP, products/services, and competitive advantages.
3. **Connections** — toggle data sources and output destinations. Sitemap is auto-connected; GSC/Ads/Ahrefs/CMS are stubs ready for OAuth.
4. **Content plan** — the agent proposes keywords + titles. You approve, the article generator writes it, and an SEO score is computed.
5. **Audit** — paste any URL; the scorer rates title length, meta description, H1, word count, image alt coverage, and internal link density.

## Notes on Claude usage

- Default model: `claude-opus-4-7` (the most capable Claude model — see `src/lib/anthropic.ts`).
- The article system prompt and brand-voice context are served via prompt caching (`cache_control: ephemeral`) — repeated generations for the same site reuse the prefix at ~10% cost.
- Adaptive thinking is enabled for the article generator; effort is `high` to favor quality.

External integrations (SerpAPI, GSC, Ahrefs, Webflow/WordPress publishing) are stubbed in this MVP — the agent contracts and DB models are in place to wire real APIs in.
