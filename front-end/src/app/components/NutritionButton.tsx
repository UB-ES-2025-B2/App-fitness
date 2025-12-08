"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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

  const openChat = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("toggle-nutri-chat"));
    }
  };

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label="Abrir chat Nutricionista IA"
      className="fixed bottom-24 right-6 z-[55] rounded-full bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      <Image
        src="/images/GoToNutrition.png"
        alt="Abrir chat Nutricionista IA"
        width={64}
        height={64}
        className="rounded-full"
        priority
      />
    </button>
  );
}
