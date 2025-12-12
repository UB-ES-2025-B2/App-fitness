"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeJson(text: string) {
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

export default function VerifyEmailClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token");

  const [msg, setMsg] = useState("Verificando...");
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setMsg("Token ausente.");
      setError("Falta el token de verificación en la URL.");
      return;
    }
    if (ranRef.current) return; // evita doble ejecución en dev/StrictMode
    ranRef.current = true;

    const run = async () => {
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
        const url = `${base}/auth/verify-email?token=${encodeURIComponent(token)}`;

        const res = await fetch(url, { method: "GET" });

        const text = await res.text();
        const data = safeJson(text);

        if (!res.ok) {
          const backendMsg = data?.error || text || "No se pudo verificar el correo.";
          throw new Error(backendMsg);
        }

        // backend OK
        const access = data?.access_token;
        const refresh = data?.refresh_token;

        if (!access) throw new Error("Respuesta inválida: falta access_token");

        localStorage.setItem(
          "ubfitness_tokens",
          JSON.stringify({ access_token: access, refresh_token: refresh || null })
        );

        if (data?.user) {
          localStorage.setItem("ubfitness_user", JSON.stringify(data.user));
          window.dispatchEvent(new Event("user-updated"));
        }

        setMsg("Correo verificado ✅ Redirigiendo...");
        router.replace("/"); // <-- cámbialo si tu home real es /home
      } catch (e) {
        const m = e instanceof Error ? e.message : "Error al verificar el correo";
        setMsg("No se pudo verificar.");
        setError(m);
      }
    };

    run();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border rounded-2xl p-6 shadow">
        <p className="text-gray-800">{msg}</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {error && (
          <button
            className="mt-4 w-full bg-blue-600 text-white rounded-lg py-2"
            onClick={() => router.replace("/login")}
          >
            Ir a login
          </button>
        )}
      </div>
    </div>
  );
}
