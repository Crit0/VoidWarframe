/* Helpers for consistent JSON API responses across all route handlers. */

import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[api] unhandled error:", message);
  return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
}

/** Upstream (external API) failure — 502, with the cause surfaced to the client. */
export function upstreamError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn("[api] upstream error:", message);
  return NextResponse.json(
    { ok: false, error: "Внешний Warframe API временно недоступен", detail: message },
    { status: 502 },
  );
}
