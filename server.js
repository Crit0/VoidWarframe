/* Minimal static file server for Railway / any Node host.
   Zero dependencies. Serves the repo root with sensible caching headers,
   proper MIME types, gzip-friendly responses, and a 404 fallback. */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".mjs":  "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".ttf":  "font/ttf",
  ".txt":  "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function cacheControl(filePath, ext) {
  if (filePath.endsWith("/sw.js") || filePath.endsWith(path.sep + "sw.js")) return "no-cache";
  if (ext === ".html")              return "no-cache";
  if (filePath.includes("/data/") || filePath.includes(path.sep + "data" + path.sep)) {
    return "public, max-age=300, must-revalidate";
  }
  if (ext === ".js" || ext === ".mjs" || ext === ".css") return "public, max-age=60, must-revalidate";
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".svg" || ext === ".ico") {
    return "public, max-age=3600";
  }
  if (ext === ".woff" || ext === ".woff2" || ext === ".ttf") return "public, max-age=604800, immutable";
  return "public, max-age=60";
}

function safeJoin(root, p) {
  const resolved = path.resolve(root, "." + p);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "X-Content-Type-Options": "nosniff", ...headers });
  if (body && typeof body.pipe === "function") body.pipe(res);
  else res.end(body);
}

function notFound(res) {
  const fallback = path.join(ROOT, "404.html");
  fs.stat(fallback, (err, st) => {
    if (err || !st.isFile()) {
      return send(res, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
    }
    send(res, 404, fs.createReadStream(fallback), {
      "Content-Type": MIME[".html"],
      "Cache-Control": "no-cache",
    });
  });
}

const server = http.createServer((req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
    }

    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://x").pathname); }
    catch { return send(res, 400, "Bad Request"); }

    if (pathname.endsWith("/")) pathname += "index.html";
    const filePath = safeJoin(ROOT, pathname);
    if (!filePath) return notFound(res);

    fs.stat(filePath, (err, st) => {
      if (err) return notFound(res);
      if (st.isDirectory()) {
        const idx = path.join(filePath, "index.html");
        return fs.stat(idx, (e2, s2) => {
          if (e2 || !s2.isFile()) return notFound(res);
          serve(req, res, idx, s2);
        });
      }
      if (!st.isFile()) return notFound(res);
      serve(req, res, filePath, st);
    });
  } catch (err) {
    console.error("[server] error:", err && err.stack ? err.stack : err);
    try { send(res, 500, "Internal Server Error"); } catch {}
  }
});

function serve(req, res, filePath, st) {
  const ext = path.extname(filePath).toLowerCase();
  const headers = {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": st.size,
    "Cache-Control": cacheControl(filePath, ext),
    "Last-Modified": st.mtime.toUTCString(),
  };

  const ims = req.headers["if-modified-since"];
  if (ims && new Date(ims).getTime() >= Math.floor(st.mtime.getTime() / 1000) * 1000) {
    return send(res, 304, null, headers);
  }

  if (req.method === "HEAD") return send(res, 200, null, headers);
  send(res, 200, fs.createReadStream(filePath), headers);
}

server.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT}`);
});

function shutdown(sig) {
  console.log(`[server] ${sig} received, closing`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
