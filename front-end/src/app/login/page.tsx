"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5000";

      // 1️⃣ LOGIN
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const txt = await res.text();
        let payload = null;

        try {
          payload = txt ? JSON.parse(txt) : null;
        } catch { }

        if (res.status === 403 && /verificar/i.test(payload?.error ?? "")) {
          setError("Tu correo no está verificado. Redirigiendo para verificar…");
          router.push(`/verify-email-start?email=${encodeURIComponent(email)}`);
          return;
        }

        setError("Correo o contraseña incorrectos");
        return;
      }

      const data = await res.json();
      console.log("Login success:", data);

      // 2️⃣ Guardamos tokens
      const tokens = {
        access_token: data.access_token || null,
        refresh_token: data.refresh_token || null,
      };

      localStorage.setItem("ubfitness_tokens", JSON.stringify(tokens));
      localStorage.setItem("ubfitness_user_id", data.user.id);

      // 3️⃣ AHORA OBTENEMOS EL USUARIO REAL CON EL AVATAR ACTUALIZADO
      const meRes = await fetch(`${base}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`,
        },
      });

      const meUser = await meRes.json();
      console.log("Usuario actualizado desde /auth/me:", meUser);

      // 4️⃣ Guardamos el usuario correcto (incluye avatar_url)
      localStorage.setItem("ubfitness_user", JSON.stringify(meUser));

      
      window.dispatchEvent(new Event("user-updated"));

     
      router.push("/");

    } catch (err) {
      console.error("Error al iniciar sesión:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ha ocurrido un error inesperado");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4">
      {/*  Imagen grande semitransparente detrás del panel */}
      {/* Logo izquierda */}
      {/* Logo izquierda */}
      <img
        src="/images/logo_ub_latex.png"
        alt="UB Logo Izquierda"
        className="absolute left-[10%] top-[58%] -translate-y-1/2 w-[300px] opacity-100 select-none pointer-events-none"
      />

      {/* Logo derecha */}
      <img
        src="/images/logo_ub_latex.png"
        alt="UB Logo Derecha"
        className="absolute right-[10%] top-[58%] -translate-y-1/2 w-[300px] opacity-100 select-none pointer-events-none"
      />



      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200"
      >
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Iniciar sesión
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="tuemail@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0, x: [0, -4, 4, -4, 4, 0] }}
              transition={{ duration: 0.35 }}
              className="text-red-600 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${loading ? "opacity-80 cursor-not-allowed" : ""
              }`}
          >
            {loading ? (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.span
                  className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                />
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Iniciando...
                </motion.span>
              </motion.div>
            ) : (
              <motion.span
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                Entrar
              </motion.span>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          ¿No tienes cuenta?{" "}
          <a href="/registration" className="text-blue-600 hover:underline">
            Regístrate aquí
          </a>
        </p>
      </motion.div>
    </div>
  );
}
