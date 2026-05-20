"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type FileRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/upload", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setFiles(json.data.files);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка загрузки");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function remove(id: string) {
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      await refresh();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Файлы"
        subtitle="Загрузка и хранение пользовательских файлов"
        right={
          <label className="btn cursor-pointer">
            {busy ? "Загрузка…" : "Загрузить файл"}
            <input type="file" className="hidden" onChange={upload} disabled={busy} />
          </label>
        }
      />

      {error && (
        <div className="panel mb-6 border-neon-red/40 p-4 text-sm text-neon-red">{error}</div>
      )}

      {files.length === 0 ? (
        <p className="text-sm text-text-2">Файлов пока нет. Загрузите первый.</p>
      ) : (
        <div className="panel divide-y divide-border">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-4 p-3">
              <div className="min-w-0">
                <a
                  href={`/api/files/${f.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-text-0 hover:text-gold"
                >
                  {f.originalName}
                </a>
                <span className="font-mono text-[0.65rem] text-text-2">
                  {f.mimeType} · {formatSize(f.size)}
                </span>
              </div>
              <button
                onClick={() => remove(f.id)}
                className="shrink-0 rounded border border-border px-2 py-1 font-mono text-xs text-neon-red hover:border-neon-red"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
