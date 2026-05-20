/* GET /api/arcanes?lang=ru — Warframe arcanes catalogue, server-cached. */

import type { NextRequest } from "next/server";
import { getArcanes } from "@/lib/warframe";
import { ok, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ru";
    const { data, source, ageMs } = await getArcanes(lang);
    return ok({ arcanes: data, count: data.length, source, ageMs });
  } catch (err) {
    return serverError(err);
  }
}
