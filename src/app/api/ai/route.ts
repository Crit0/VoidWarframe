/* POST /api/ai — send a chat conversation to the configured AI provider.
   Body: { messages: [{ role: "user"|"assistant", content: string }],
           conversationId?: string }
   When conversationId is provided, the exchange is persisted. */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { chat, isAiEnabled, AiDisabledError } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { ok, fail, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
  conversationId: z.string().cuid().optional(),
});

export async function GET() {
  return ok({ enabled: isAiEnabled() });
}

export async function POST(req: NextRequest) {
  try {
    if (!isAiEnabled()) {
      return fail("AI provider is not configured on this deployment", 503);
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail("Invalid request body", 422, { issues: parsed.error.flatten() });
    }

    const { messages, conversationId } = parsed.data;
    const reply = await chat(messages);

    // Persist exchange when a conversation is tracked (best-effort).
    if (conversationId) {
      try {
        const last = messages[messages.length - 1];
        await prisma.aiMessage.createMany({
          data: [
            { conversationId, role: "USER", content: last.content },
            { conversationId, role: "ASSISTANT", content: reply },
          ],
        });
      } catch {
        /* persistence is best-effort */
      }
    }

    return ok({ reply });
  } catch (err) {
    if (err instanceof AiDisabledError) return fail(err.message, 503);
    return serverError(err);
  }
}
