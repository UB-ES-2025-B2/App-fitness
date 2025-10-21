const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5000";

type Tokens = { access_token: string; refresh_token: string };
const TOKENS_KEY = "ubfitness_tokens";

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKENS_KEY);
  return raw ? JSON.parse(raw) as Tokens : null;
}
export function setTokens(t: {access_token:string, refresh_token:string}) {
  localStorage.setItem("ubfitness_tokens", JSON.stringify(t));
}
export function clearTokens() {
  localStorage.removeItem("ubfitness_tokens");
}

async function refreshAccessToken() {
  const toks = getTokens();
  if (!toks) throw new Error("No refresh token");
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: toks.refresh_token }),
  });
  if (!res.ok) throw new Error("Refresh failed");
  const data = await res.json();
  const next = { ...toks, access_token: data.access_token as string };
  setTokens(next);
  return next.access_token;
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");

  const toks = getTokens();
  if (toks?.access_token) headers.set("Authorization", `Bearer ${toks.access_token}`);

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  let res = await fetch(url, { ...init, headers });

  if (res.status === 401 && toks?.refresh_token) {
    try {
      const newAccess = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${newAccess}`);
      res = await fetch(url, { ...init, headers });
    } catch {
      clearTokens();
    }
  }
  return res;
}
