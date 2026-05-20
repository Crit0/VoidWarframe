/* GET /api/items?lang=ru — Warframe items dictionary, server-cached. */

import type { NextRequest } from "next/server";
import { getItems } from "@/lib/warframe";
import { ok, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ru";
    const { data, source, ageMs } = await getItems(lang);
    return ok({ items: data, count: data.length, source, ageMs });
  } catch (err) {
    return serverError(err);
  }
}
