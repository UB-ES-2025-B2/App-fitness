// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ubfitness_tokens");
      const tokens = raw && JSON.parse(raw);
      if (tokens?.access_token) {
        router.replace("/home");   // logueado → feed
      } else {
        router.replace("/login");    // no logueado → login
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return <div className="p-6">Cargando…</div>;
}

