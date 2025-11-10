"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token");
  const [msg, setMsg] = useState("Verificando...");

  useEffect(() => {
    if (!token) {
      setMsg("Token ausente.");
      return;
    }

    const run = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE!;
        const res = await fetch(`${base}/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo verificar");
        if (data?.access_token) {
          localStorage.setItem(
            "ubfitness_tokens",
            JSON.stringify({
              access_token: data.access_token,
              refresh_token: data.refresh_token || null,
            })
          );
        }
        if (data?.user) {
          try {
            localStorage.setItem("ubfitness_user", JSON.stringify(data.user));
          } catch {
          }
        }
        setMsg("Correo verificado. Redirigiendo...");
        router.replace("/home");
        } catch (e) {
          if (e instanceof Error) {
            setMsg(e.message || "Error al verificar el correo");
          } else {
            setMsg("Error al verificar el correo");
          }
        }
    };

    run();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-700">{msg}</p>
    </div>
  );
}
