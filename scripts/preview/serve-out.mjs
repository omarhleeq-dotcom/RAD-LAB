// Minimal local stand-in for Cloudflare Pages: serves the static export in `out/` with the same clean-URL,
// `_redirects`, `_headers` and 404.html behaviour, so the preview can be tested before the owner connects the repo.
// Not a production server and not a project dependency. Cloudflare's real behaviour may differ in details.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg",
  ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2",
};

const splat = (pattern) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);

function parseHeaders(text) {
  const rules = [];
  let cur = null;
  for (const raw of text.split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) { cur = { re: splat(raw.trim()), headers: [] }; rules.push(cur); }
    else if (cur) { const i = raw.indexOf(":"); cur.headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]); }
  }
  return rules;
}

function parseRedirects(text) {
  return text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => {
    const [from, to, code] = l.split(/\s+/);
    return { re: splat(from), to, code: Number(code ?? 302) };
  });
}

export function startServer(root = "out", port = 0) {
  const headerRules = existsSync(join(root, "_headers")) ? parseHeaders(readFileSync(join(root, "_headers"), "utf8")) : [];
  const redirects = existsSync(join(root, "_redirects")) ? parseRedirects(readFileSync(join(root, "_redirects"), "utf8")) : [];
  const isFile = (p) => existsSync(p) && statSync(p).isFile();
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const send = (status, body, extra = {}) => {
      const h = { ...extra };
      for (const r of headerRules) if (r.re.test(path)) for (const [k, v] of r.headers) h[k] = v;
      res.writeHead(status, h);
      res.end(body);
    };
    const rd = redirects.find((r) => r.re.test(path));
    if (rd) return send(rd.code, "", { Location: rd.to });
    const safe = normalize(path).replace(/^(\.\.[/\\])+/, "");
    const candidates = [join(root, safe), join(root, `${safe}.html`), join(root, safe, "index.html")];
    const file = candidates.find(isFile);
    if (file) return send(200, readFileSync(file), { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    const nf = join(root, "404.html");
    return send(404, isFile(nf) ? readFileSync(nf) : "Not found", { "Content-Type": "text/html; charset=utf-8" });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { port } = await startServer(process.argv[2] ?? "out", Number(process.env.PORT ?? 3200));
  console.log(`serving ${process.argv[2] ?? "out"} on http://127.0.0.1:${port}`);
}
