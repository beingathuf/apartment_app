// src/api.ts
type FetchOptions = RequestInit & { headers?: Record<string, string> };

// Update this to match the backend port you're running on (3000 by default)
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3000/api";

function token(): string | null {
  return localStorage.getItem("token");
}

async function request(path: string, opts: FetchOptions = {}) {
  const headers: Record<string, string> = Object.assign(
    { "Content-Type": "application/json" },
    opts.headers || {}
  );

  const t = token();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const full = API_BASE + path;
  // helpful debug
  // console.debug(`[api] ${opts.method || "GET"} ${full}`, opts.body ? JSON.parse(String(opts.body)) : undefined);

  const res = await fetch(full, Object.assign({}, opts, { headers }));

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = text;
  }

  if (!res.ok) {
    const errMsg =
      (json && (json.error || json.message || (typeof json === "string" && json))) ||
      res.statusText ||
      "request failed";
    // include status for easier debugging
    const err = new Error(`${errMsg} (status ${res.status})`);
    (err as any).status = res.status;
    throw err;
  }
  return json;
}

export default {
  request,
  get: (p: string) => request(p, { method: "GET" }),
  post: (p: string, body?: any) =>
    request(p, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: (p: string, body?: any) =>
    request(p, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  del: (p: string) => request(p, { method: "DELETE" }),
  patch: (p: string, body?: any) => 
    request(p, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
};
