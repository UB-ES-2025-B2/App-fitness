"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function NutritionButton() {
  const [isLogged, setIsLogged] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkLogin = () => {
      const raw = localStorage.getItem("ubfitness_tokens");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setIsLogged(!!parsed.access_token);
        } catch {
          setIsLogged(false);
        }
      } else {
        setIsLogged(false);
      }
    };

    checkLogin();
    window.addEventListener("user-updated", checkLogin);

    return () => window.removeEventListener("user-updated", checkLogin);
  }, []);

  const hiddenOn = [
    "/login",
    "/registration",
    "/verify-email",
    "/verify-email-start",
  ];

  if (!isLogged || hiddenOn.includes(pathname)) {
    return null;
  }

  const openChat = () => {
    window.dispatchEvent(new Event("toggle-nutri-chat"));
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
