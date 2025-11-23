"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SearchItem =
  | { kind: "community"; id: number; name: string; slug?: string }
  | { kind: "user"; id: number; username: string; name?: string | null };

type SearchResponse = {
  communities: Array<{ id: number; name: string; slug?: string }>;
  users: Array<{ id: number; username: string; name?: string | null }>;
};

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [active, setActive] = useState<number>(-1);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Teclat ↑ ↓ Enter Esc
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < items.length) goTo(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  // Anar a la pàgina de l'element
  const goTo = (it: SearchItem) => {
    setOpen(false);
    setActive(-1);
    if (it.kind === "community") router.push(`/c/${it.slug ?? it.id}`);
    else router.push(`/usuario/${it.id}`);
  };

  // Fetch amb debounce
  useEffect(() => {
    if (!q.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    setActive(-1);

    const handle = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
        const res = await fetch(
          `${API_BASE}/api/search?q=${encodeURIComponent(q)}&limit=5`,
          { signal: ac.signal }
        );
        if (!res.ok) throw new Error("Search error");
        const data: SearchResponse = await res.json();

        const next: SearchItem[] = [
          ...data.communities.map((c) => ({ kind: "community", ...c } as SearchItem)),
          ...data.users.map((u) => ({ kind: "user", ...u } as SearchItem)),
        ];
        setItems(next);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(q.trim().length > 0)}
          onKeyDown={onKeyDown}
          placeholder="Busca comunidades o perfiles..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-gray-100 border border-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
                     placeholder:text-gray-400 transition-all"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-suggestions"
          role="combobox"
        />
      </div>

      {open && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 mt-2 w-[28rem] max-w-[90vw] bg-white dark:bg-slate-800 border 
                     border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
        >
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Buscando…</div>
          )}

          {!loading && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">Sin resultados</div>
          )}

          <ul>
            {items.map((it, i) => {
              const isActive = i === active;
              const icon = it.kind === "community" ? "🏘️" : "👤";
              const label =
                it.kind === "community"
                  ? it.name
                  : it.name || it.username;
              const href = it.kind === "community" ? `/c/${it.slug ?? it.id}` : `/usuario/${it.id}`;

              return (
                <li key={i} role="option" aria-selected={isActive}>
                  <Link
                    href={href}
                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer text-sm transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-slate-700"
                        : "hover:bg-blue-50 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => goTo(it)}
                  >
                    <span className="text-base">{icon}</span>
                    <span className="truncate">{label}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {it.kind === "community" ? "Comunidad" : "Usuario"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
