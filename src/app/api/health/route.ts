/* GET /api/health — Railway healthcheck target.
   Returns 200 whenever the server process is alive (liveness probe).
   Database connectivity is reported in the body as informational data,
   so a transient DB hiccup does not flap the deployment. */

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
  return NextResponse.json({
    status: "ok",
    db,
    uptime: Math.round(process.uptime()),
    ts: new Date().toISOString(),
  });
}
