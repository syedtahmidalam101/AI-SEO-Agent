import { prisma } from "@/lib/db";
import { anthropic, MODEL, ONBOARDING_SYSTEM, buildSiteContext } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const body = await req.json();
  const siteId = String(body.siteId ?? "");
  const messages: IncomingMsg[] = Array.isArray(body.messages) ? body.messages : [];

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return new Response("site not found", { status: 404 });

  const ctx = buildSiteContext(site);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiMessages = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const claudeStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: `${ONBOARDING_SYSTEM}\n\nKnown context about this site so far:\n${ctx}`,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: apiMessages,
        });

        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await claudeStream.finalMessage();
        await prisma.agentRun.create({
          data: {
            siteId,
            kind: "onboarding",
            status: "done",
            tokensIn: final.usage.input_tokens,
            tokensOut: final.usage.output_tokens,
            cacheRead: final.usage.cache_read_input_tokens ?? 0,
          },
        });
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[error: ${err instanceof Error ? err.message : String(err)}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
