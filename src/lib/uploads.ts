/* File upload storage helper. Binary data is written to UPLOAD_DIR
   (a local folder, or a mounted Railway Volume in production);
   metadata is persisted in Postgres via Prisma. */

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "./env";

const UPLOAD_DIR = path.resolve(process.cwd(), env.UPLOAD_DIR);

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "application/json",
]);

export function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function generateStoredName(originalName: string): string {
  const ext = path.extname(originalName).slice(0, 12);
  const id = crypto.randomBytes(16).toString("hex");
  return `${id}${ext}`;
}

export async function writeFile(storedName: string, data: Buffer): Promise<void> {
  await ensureUploadDir();
  const dest = path.join(UPLOAD_DIR, path.basename(storedName));
  await fs.writeFile(dest, data);
}

export async function readFile(storedName: string): Promise<Buffer> {
  const target = path.join(UPLOAD_DIR, path.basename(storedName));
  return fs.readFile(target);
}

export async function deleteFile(storedName: string): Promise<void> {
  const target = path.join(UPLOAD_DIR, path.basename(storedName));
  await fs.rm(target, { force: true });
}
