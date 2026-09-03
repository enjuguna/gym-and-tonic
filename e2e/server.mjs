import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = normalize(join(process.cwd(), "dist"));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".webmanifest": "application/manifest+json" };
createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
  const candidate = normalize(join(root, pathname === "/" ? "index.html" : pathname));
  const file = candidate.endsWith("/") || !extname(candidate) ? join(candidate, "index.html") : candidate;
  if (!file.startsWith(root)) { response.writeHead(403); response.end(); return; }
  try { const content = await readFile(file); response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }); response.end(content); }
  catch { response.writeHead(404); response.end("Not found"); }
}).listen(4322, "127.0.0.1");
