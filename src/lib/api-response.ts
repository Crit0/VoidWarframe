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
