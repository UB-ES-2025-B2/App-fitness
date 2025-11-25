// src/app/components/LogoutButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearTokens, getTokens } from "../lib/api";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = () => {
    if (loading) return;
    setLoading(true);
    clearTokens(); // Borra los tokens de localStorage
    router.replace("/login");
  };

  const logged = !!getTokens();

  if (!logged) return null;

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  ); // Faltaria afegir que tornes a la pagina de login i esborrar tokens
}
