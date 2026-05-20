/* GET /api/worldstate?lang=ru — live Warframe worldstate, server-cached. */

import type { NextRequest } from "next/server";
import { getWorldstate } from "@/lib/warframe";
import { ok, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ru";
    const { data, source, ageMs } = await getWorldstate(lang);
    return ok({ worldstate: data, source, ageMs });
  } catch (err) {
    return serverError(err);
  }
}
