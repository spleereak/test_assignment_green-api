import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_HOST = /(^|\.)green-api\.com$|(^|\.)greenapi\.com$/i;

function greenApiDevProxy(): Plugin {
  return {
    name: "green-api-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/green-api", (req, res, next) => {
        void forward(req, res).catch((error: unknown) => {
          if (res.headersSent) {
            next(error instanceof Error ? error : new Error("proxy failure"));
            return;
          }
          sendJson(res, 502, describeProxyError(error));
        });
      });
    },
  };
}

async function forward(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const header = req.headers["x-api-base"];
  const apiBase = Array.isArray(header) ? header[0] : header;
  if (!apiBase) {
    sendJson(res, 400, "Не указан хост API");
    return;
  }

  let target: URL;
  try {
    const base = new URL(apiBase);
    if (base.protocol !== "https:" || !ALLOWED_HOST.test(base.hostname)) {
      throw new Error("rejected host");
    }
    target = new URL(req.url ?? "/", base.origin);
  } catch {
    sendJson(res, 400, "Некорректный адрес GREEN-API");
    return;
  }

  const method = req.method ?? "GET";
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);
  const headers = new Headers();
  const contentType = req.headers["content-type"];
  if (typeof contentType === "string" && method !== "GET" && method !== "HEAD") {
    headers.set("content-type", contentType);
  }

  const upstream = await fetch(target, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" || body.length === 0 ? undefined : new Uint8Array(body),
    signal: AbortSignal.timeout(75_000),
  });

  const payload = Buffer.from(await upstream.arrayBuffer());
  res.statusCode = upstream.status;
  const responseType = upstream.headers.get("content-type");
  if (responseType) {
    res.setHeader("content-type", responseType);
  }
  res.end(payload);
}

function describeProxyError(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause;
    if (cause instanceof Error && cause.message) {
      return `${error.message}: ${cause.message}`;
    }
    return error.message;
  }
  return "proxy failure";
}

function sendJson(res: ServerResponse, status: number, message: string): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ message }));
}

export default defineConfig({
  plugins: [react(), tailwindcss(), greenApiDevProxy()],
  resolve: {
    alias: { "@": path.resolve(root, "src") },
  },
  server: {
    port: 5173,
  },
});
