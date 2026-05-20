/* GET    /api/files/:id — stream a stored file by its DB id.
   DELETE /api/files/:id — remove file + metadata. */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile, deleteFile } from "@/lib/uploads";
import { ok, fail, serverError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const record = await prisma.fileUpload.findUnique({ where: { id } });
    if (!record) return fail("File not found", 404);

    const data = await readFile(record.filename).catch(() => null);
    if (!data) return fail("File data missing on disk", 410);

    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": record.mimeType,
        "Content-Length": String(record.size),
        "Content-Disposition": `inline; filename="${encodeURIComponent(record.originalName)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const record = await prisma.fileUpload.findUnique({ where: { id } });
    if (!record) return fail("File not found", 404);

    await deleteFile(record.filename).catch(() => {});
    await prisma.fileUpload.delete({ where: { id } });
    return ok({ deleted: id });
  } catch (err) {
    return serverError(err);
  }
}
