"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function NutritionButton() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    // Comprova tokens en localStorage
    const raw = localStorage.getItem("ubfitness_tokens");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.access_token) setIsLogged(true);
      } catch {
        setIsLogged(false);
      }
    }
  }, []);

  // ❌ Si NO està loguejat → no es mostra el botó
  if (!isLogged) return null;

  return (
    <Link
      href="/nutricion"
      aria-label="Ir a la pestaña de Nutrición"
      className="fixed bottom-24 right-6 z-[55] rounded-full bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <Image
        src="/images/GoToNutrition.png"
        alt="Ir a Nutrición"
        width={64}
        height={64}
        className="rounded-full"
        priority
      />
    </Link>
  );
}
