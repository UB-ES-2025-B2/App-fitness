"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const TOPICS = [
  { id: "futbol", label: "Fútbol" },
  { id: "basket", label: "Baloncesto" },
  { id: "montana", label: "Montaña" },
];

  type RegisterForm = {
  username: string;
  name: string;
  email: string;
  password: string;
  password2: string;
  avatar_url: string;
  bio: string;
  ocultar_info: boolean;
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    password2: "",
    avatar_url: "",
    bio: "",
    ocultar_info: true,
  });
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange =
  <K extends keyof RegisterForm>(k: K) =>
  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

    setForm((f) => ({ ...f, [k]: value as RegisterForm[K] }));
  };

  const toggleTopic = (id: string) =>
    setTopics((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.name || !form.email || !form.password) {
      setError("Completa usuario, nombre, email y contraseña.");
      return;
    }
    if (form.password !== form.password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    console.log(form)

    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE!;
      const res = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          name: form.name,
          email: form.email,
          password: form.password, 
          avatar_url: form.avatar_url || null,
          bio: form.bio || null,
          ocultar_info: !!form.ocultar_info,
          topics, 
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al registrarse");
      }

      const data = await res.json();
      localStorage.setItem("ubfitness_tokens", JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      }));
      router.push("/perfil");

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Crear cuenta</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4">
            <div className="sticky top-6">
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-blue-700 mb-4">Consejos de registro</h2>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>
                      El <strong>usuario</strong> debe ser único (p. ej. <em>edu_ramos</em>).
                    </li>
                    <li>Usa una <strong>contraseña</strong> de al menos 6 caracteres.</li>
                    <li>Tu <strong>bio</strong> es opcional y puedes ocultar tu info.</li>
                    <li>Elige tus <strong>temáticas</strong> favoritas para personalizar el feed.</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                  <p className="text-gray-700 mb-3">
                    Únete a <strong>UB Fitness</strong> y conecta con comunidades por temáticas deportivas.
                    Personaliza tu perfil y descubre contenido de interés.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Usuario</label>
                    <input
                      value={form.username}
                      onChange={onChange("username")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="ej. edu_ramos"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      value={form.name}
                      onChange={onChange("name")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={onChange("email")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="tuemail@ejemplo.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={onChange("password")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Confirmar contraseña</label>
                    <input
                      type="password"
                      value={form.password2}
                      onChange={onChange("password2")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Avatar URL (opcional)</label>
                    <input
                      value={form.avatar_url}
                      onChange={onChange("avatar_url")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Bio (opcional)</label>
                    <textarea
                      value={form.bio}
                      onChange={onChange("bio")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Cuéntanos sobre ti..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="ocultar_info"
                      type="checkbox"
                      checked={form.ocultar_info}
                      onChange={onChange("ocultar_info")}
                      className="h-4 w-4"
                    />
                    <label htmlFor="ocultar_info" className="text-sm text-gray-700">
                      Ocultar mi información (privado por defecto)
                    </label>
                  </div>

                  <div>
                    <p className="block text-sm font-medium mb-2">Temáticas preferidas</p>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((t) => {
                        const active = topics.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTopic(t.id)}
                            className={`px-3 py-1 rounded-full border text-sm transition
                              ${active ? "bg-blue-600 text-white border-blue-600" : "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300"}`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    {loading ? "Creando cuenta..." : "Registrarse"}
                  </button>

                  <p className="text-center text-sm text-gray-600 mt-3">
                    ¿Ya tienes cuenta?{" "}
                    <a href="/login" className="text-blue-600 hover:underline">
                      Inicia sesión
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
