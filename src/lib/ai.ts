/* AI provider abstraction. Supports Anthropic and OpenAI via a single
   `chat()` function. Provider + key + model come from env; when
   AI_PROVIDER=none the feature is disabled and callers get a clear error. */

import { env, aiEnabled } from "./env";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export class AiDisabledError extends Error {
  constructor() {
    super("AI provider is not configured (set AI_PROVIDER and AI_API_KEY)");
    this.name = "AiDisabledError";
  }
}

export function isAiEnabled(): boolean {
  return aiEnabled;
}

const SYSTEM_PROMPT =
  "You are the Voide Warframe assistant. Help players with Warframe builds, " +
  "farming routes, lore and game mechanics. Be concise and accurate.";

async function chatAnthropic(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.AI_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: HTTP ${res.status}`);
  const json = (await res.json()) as { content: { type: string; text?: string }[] };
  return json.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
}

async function chatOpenAI(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: HTTP ${res.status}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0]?.message?.content ?? "";
}

/** Send a conversation to the configured AI provider, return the reply text. */
export async function chat(messages: ChatMessage[]): Promise<string> {
  if (!aiEnabled) throw new AiDisabledError();
  if (env.AI_PROVIDER === "anthropic") return chatAnthropic(messages);
  if (env.AI_PROVIDER === "openai") return chatOpenAI(messages);
  throw new AiDisabledError();
}
