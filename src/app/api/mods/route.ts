/* GET /api/mods?lang=ru — Warframe mods catalogue, server-cached. */

import type { NextRequest } from "next/server";
import { getMods } from "@/lib/warframe";
import { ok, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ru";
    const { data, source, ageMs } = await getMods(lang);
    return ok({ mods: data, count: data.length, source, ageMs });
  } catch (err) {
    return serverError(err);
  }
}
