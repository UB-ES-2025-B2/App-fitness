"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyEmailStartClient({ email }: { email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const resend = async () => {
    setError("");
    setLoading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
      const res = await fetch(`${base}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.text()) || "No se pudo reenviar");
      setSentAt(new Date().toISOString());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo reenviar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-2">Verifica tu correo</h1>
        <p className="mb-4">
          Enviaremos un enlace de verificación a <b>{email || "(sin email)"}</b>.
        </p>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={resend}
            disabled={loading || !email}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Enviar/reenviar correo"}
          </button>

          <a
            href="https://mail.google.com/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 border rounded"
          >
            Abrir Gmail
          </a>

          <button
            onClick={() => router.replace("/login")}
            className="px-4 py-2 border rounded"
          >
            Volver a login
          </button>
        </div>

        {sentAt && (
          <p className="text-sm mt-3">
            Correo enviado: {new Date(sentAt).toLocaleString()}
          </p>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <p className="text-sm text-gray-500 mt-4">
          Revisa spam/promociones si no aparece en la bandeja de entrada.
        </p>
      </div>
    </main>
  );
}
