/* GET /api/health — Railway healthcheck target. Reports DB connectivity. */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }
  const healthy = db === "up";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", db, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
