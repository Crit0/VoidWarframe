/* POST /api/upload — multipart/form-data file upload (field name "file").
   Stores the binary in UPLOAD_DIR and metadata in Postgres.
   GET /api/upload — list recent uploads. */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  isAllowedMime,
  generateStoredName,
  writeFile,
} from "@/lib/uploads";
import { ok, fail, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const files = await prisma.fileUpload.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok({ files });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return fail("Expected multipart/form-data", 415);

    const file = form.get("file");
    if (!(file instanceof File)) return fail("Missing 'file' field", 422);

    if (file.size === 0) return fail("Empty file", 422);
    if (file.size > env.UPLOAD_MAX_BYTES) {
      return fail(`File too large (max ${env.UPLOAD_MAX_BYTES} bytes)`, 413);
    }
    if (!isAllowedMime(file.type)) {
      return fail(`Unsupported file type: ${file.type || "unknown"}`, 415);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedName = generateStoredName(file.name);
    await writeFile(storedName, buffer);

    const record = await prisma.fileUpload.create({
      data: {
        filename: storedName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    return ok({ file: record }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
