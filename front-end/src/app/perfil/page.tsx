// src/app/perfil/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import ProfileAvatar from "../components/ProfileAvatar";

import { useRouter } from "next/navigation";
import { authFetch, getTokens, clearTokens } from "../lib/api";

import LogoutButton from "../components/LogOutButton";

type ApiUser = {
  id: number;
  name?: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  ocultar_info?: boolean;
  preferences?: Array<"Fútbol" | "Básquet" | "Montaña"> | string[]; // por si back devuelve otros ids
};

async function fetchMe(): Promise<ApiUser | null> {
  const res = await authFetch("/auth/me");
  if (!res.ok) return null;
  return res.json();
}

async function updateMe(patch: Partial<{
  name: string;
  username: string;
  avatar_url: string | null;
  preferences: string[];
  ocultar_info: boolean;
}>) {
  const res = await authFetch("/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "No se pudo guardar el perfil");
  }
  return res.json();
}
async function fetchMyLikedPosts(): Promise<Post[]> {
  const res = await authFetch("/api/posts/me/likes");
  if (!res.ok) {
    console.error("No se pudieron cargar los posts con like");
    return [];
  }

  const data = await res.json();

  return data.map((p: any) => ({
    id: p.id,
    text: p.text,
    topic: p.topic ?? "General",
    date: p.date ?? p.created_at ?? "",
    image: p.image ?? p.image_url ?? undefined,
  })) as Post[];
}

type Post = { id: number; text: string; image?: string; topic: string; date: string };
type User = { id: string; name: string; username: string };
type Community = { id: string; name: string; topic: string };

const MY_POSTS: Post[] = [
  { id: 101, text: "Series de cuestas esta mañana 💪", topic: "Montaña", date: "2025-10-10", image: './images/MontanaCuesta.png' },
  { id: 102, text: "Partidillo con amigos ⚽️", topic: "Fútbol", date: "2025-10-07", image: './images/pachanga.png' },
];

const MY_FOLLOWERS: User[] = [
  { id: "u1", name: "LauraFit", username: "laura.fit" },
  { id: "u2", name: "MaxRunner", username: "max.runner" },
];

const MY_FOLLOWING_USERS: User[] = [
  { id: "u3", name: "Álex", username: "alex.bcn" },
  { id: "u4", name: "Sofía", username: "sofi.trail" },
];

const MY_FOLLOWING_COMMUNITIES: Community[] = [
  { id: "pirineos", name: "Pirineos Trail", topic: "Montaña" },
  { id: "street-hoops", name: "Street Hoops BCN", topic: "Básquet" },
];

type Profile = {
  nombre: string;
  apellido1: string;
  apellido2: string;
  username: string;
  fechaNacimiento: string; // ISO yyyy-mm-dd
  lugarNacimiento: string;
  direccion: string;
  temas: Array<"Fútbol" | "Básquet" | "Montaña">;
  ocultarInfo: boolean; // true = ocultar (activada por defecto)
  avatarUrl?: string;
};

const INITIAL_PROFILE: Profile = {
  nombre: "",
  apellido1: "",
  apellido2: "",
  username: "",
  fechaNacimiento: "",
  lugarNacimiento: "",
  direccion: "",
  temas: [],
  ocultarInfo: true,
  avatarUrl: undefined,
};

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"posts" | "followers" | "following">("posts");
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);

  const handleUnlikeFromProfile = async (postId: number) => {
    try {
      // Llamamos al backend para quitar el like
      const res = await authFetch(`/api/posts/${postId}/like`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error al quitar me gusta:", res.status, text);
        alert("No se pudo quitar el 'me gusta'.");
        return;
      }

      // Si salió bien, lo quitamos de la lista local
      setLikedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error al quitar me gusta:", err);
      alert("Error al quitar el 'me gusta'.");
    }
  };

  useEffect(() => {
    if (!getTokens()) {
      router.replace("/login");
      return;
    }
    (async () => {
      const me = await fetchMe();
      if (!me) {
        clearTokens();
        router.replace("/login");
        return;
      }

      setProfile({
        nombre: me.name ?? "",
        apellido1: "",         
        apellido2: "",
        username: me.username ?? "",
        fechaNacimiento: "",
        lugarNacimiento: "",
        direccion: "",
        avatarUrl: me.avatar_url ?? undefined,
        temas: Array.isArray(me.preferences)
          ? (me.preferences as string[]).filter((t) =>
              ["Fútbol", "Básquet", "Montaña"].includes(t)
            ) as Array<"Fútbol" | "Básquet" | "Montaña">
          : [],
        ocultarInfo: typeof me.ocultar_info === "boolean" ? me.ocultar_info : true,
      });
      const liked = await fetchMyLikedPosts();
      setLikedPosts(liked);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <p className="p-6">Cargando perfil…</p>;
  
  const PH = "Aún no almacenado";
  const show = (v?: string) => (v && v.trim() ? v : PH);
  const fullName =
  [profile.nombre, profile.apellido1, profile.apellido2]
    .filter(Boolean)
    .join(" ")
    .trim() || PH;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-0 py-6">
      {/* Header perfil */}
      <section className="bg-white rounded-2xl shadow-md p-5 mb-6 relative">
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* AVATAR CLICABLE */}
            <ProfileAvatar
              value={profile.avatarUrl}
              onChange={async (url) => {
                // Optimista en UI
                setProfile((p) => ({ ...p, avatarUrl: url }));
                try {
                  await updateMe({ avatar_url: url || null });
                } catch (e) {
                  // Revertir si falla
                  setProfile((p) => ({ ...p, avatarUrl: undefined }));
                  alert((e as Error).message);
                }
              }}
            />

            <div className="flex items-center gap-2">
              <LogoutButton /> {/* Botón de cerrar sesión */}
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                {profile.nombre} {profile.apellido1} {profile.apellido2}
              </h2>
              <p className="text-sm text-gray-500">@{profile.username}</p>
            </div>
          </div>

          {/* Botón de configuración */}
          <SettingsDropdown profile={profile} onSave={setProfile} />
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 divide-x rounded-lg bg-gray-50">
          <Stat label="Publicaciones" value={MY_POSTS.length} />
          <Stat label="Seguidores" value={MY_FOLLOWERS.length} />
          <Stat label="Seguidos" value={MY_FOLLOWING_USERS.length + MY_FOLLOWING_COMMUNITIES.length} />
          <Stat label="Me gusta" value={likedPosts.length} />
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2">
          <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>Publicaciones</TabButton>
          <TabButton active={tab === "followers"} onClick={() => setTab("followers")}>Seguidores</TabButton>
          <TabButton active={tab === "following"} onClick={() => setTab("following")}>Seguidos</TabButton>
          <TabButton active={tab === "likes"} onClick={() => setTab("likes")}>Me gusta</TabButton>

        </div>
      </section>

      {/* Contenido de pestañas */}
      <section>
        {tab === "posts" && (
          <div className="space-y-4">
            {MY_POSTS.map((p) => (
              <article key={p.id} className="bg-white rounded-2xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{profile.nombre}</h3>
                  <span className="text-xs text-gray-500">
                    {p.topic} · {new Date(p.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-gray-700">{p.text}</p>
                {p.image && (
                  <img src={p.image} alt={p.topic} className="mt-3 rounded-xl w-full h-56 object-cover" />
                )}
              </article>
            ))}
            {MY_POSTS.length === 0 && (
              <p className="text-center text-gray-500">Aún no hay publicaciones.</p>
            )}
          </div>
        )}

        {tab === "followers" && (
          <ListUsers title="Seguidores" users={MY_FOLLOWERS} emptyText="Aún no tienes seguidores." />
        )}

        {tab === "following" && (
          <div className="space-y-6">
            <ListUsers title="Usuarios seguidos" users={MY_FOLLOWING_USERS} emptyText="No sigues a nadie." />
            <ListCommunities title="Comunidades seguidas" communities={MY_FOLLOWING_COMMUNITIES} emptyText="No sigues comunidades." />
          </div>
        )}
         {tab === "likes" && (
    <div className="space-y-4">
      {likedPosts.map((p) => (
        <article key={p.id} className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{profile.nombre}</h3>
            {p.date && (
              <span className="text-xs text-gray-500">
                {p.topic} · {new Date(p.date).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="mt-2 text-gray-700">{p.text}</p>
          {p.image && (
            <img
              src={p.image}
              alt={p.topic}
              className="mt-3 rounded-xl w-full h-56 object-cover"
            />
          )}
          <div className="mt-3 flex justify-end">
          <button
            onClick={() => handleUnlikeFromProfile(p.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full
                       bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600
                       border border-gray-200"
          >
            <span>💔</span>
            <span>Quitar “me gusta”</span>
          </button>
        </div>
        </article>
      ))}
      {likedPosts.length === 0 && (
        <p className="text-center text-gray-500">
          Todavía no has dado "me gusta" a ninguna publicación.
        </p>
      )}
    </div> )}
      </section>
    </div>
  );
}

function SettingsDropdown({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Profile>(profile);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(profile), [profile]); // si fuera cambia desde fuera, sincroniza

  const toggleTema = (tema: "Fútbol" | "Básquet" | "Montaña") => {
    setForm((f) => {
      const has = f.temas.includes(tema);
      return { ...f, temas: has ? f.temas.filter((t) => t !== tema) : [...f.temas, tema] };
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // Mapeo de tu UI -> API
      await updateMe({
        name: form.nombre,                          // <-- name
        username: form.username,                    // <-- username
        preferences: form.temas,                    // <-- preferences (array de strings)
        ocultar_info: form.ocultarInfo,             // <-- boolean
        // avatar_url ya lo guardamos al vuelo arriba; si quisieras guardarlo aquí:
        // avatar_url: form.avatarUrl || null,
      });
      // Refleja en UI lo guardado
      onSave(form);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        aria-label="Abrir configuración de perfil"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-white border shadow-sm p-1 hover:ring-2 hover:ring-blue-400 transition"
      >
        <Image
          src="/images/ProfileConfig.png"
          alt="Configurar perfil"
          width={36}
          height={36}
          className="rounded-full"
          priority
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white rounded-2xl shadow-xl border p-4 z-[70]"
        >
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Configuración de perfil</h4>

          {/* Orden lógico de campos */}
          <div className="grid grid-cols-1 gap-3">
            {/* Nombre y apellidos */}
            <div className="grid grid-cols-3 gap-2">
              <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              <Input label="Apellido 1" value={form.apellido1} onChange={(v) => setForm({ ...form, apellido1: v })} />
              <Input label="Apellido 2" value={form.apellido2} onChange={(v) => setForm({ ...form, apellido2: v })} />
            </div>

            {/* Username */}
            <Input label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} prefix="@" />

            {/* Fecha y lugar de nacimiento */}
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={(v) => setForm({ ...form, fechaNacimiento: v })} />
              <Input label="Lugar de nacimiento" value={form.lugarNacimiento} onChange={(v) => setForm({ ...form, lugarNacimiento: v })} />
            </div>

            {/* Dirección postal */}
            <Input label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />

            {/* Temáticas (checklist) */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Temáticas</p>
              <div className="flex flex-wrap gap-2">
                {(["Fútbol", "Básquet", "Montaña"] as const).map((t) => (
                  <label key={t} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border">
                    <input
                      type="checkbox"
                      checked={form.temas.includes(t)}
                      onChange={() => toggleTema(t)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Privacidad */}
            <label className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
              <input
                type="checkbox"
                checked={form.ocultarInfo}
                onChange={(e) => setForm({ ...form, ocultarInfo: e.target.checked })}
                className="mt-0.5 accent-blue-600"
              />
              <span className="text-sm text-gray-700">
                Ocultar mi información (nombre, dirección, fecha y lugar de nacimiento).<br />
                <span className="text-xs text-gray-500">Activado por defecto.</span>
              </span>
            </label>
          </div>

          {/* Acciones */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={saving}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-600 mb-1">{label}</span>
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
        {prefix ? <span className="text-gray-400 text-sm">{prefix}</span> : null}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full outline-none text-sm"
        />
      </div>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition
      ${active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
    >
      {children}
    </button>
  );
}

function ListUsers({
  title,
  users,
  emptyText,
}: {
  title: string;
  users: { id: string; name: string; username: string }[];
  emptyText: string;
}) {
  if (users.length === 0) return <p className="text-center text-gray-500">{emptyText}</p>;
  return (
    <div className="bg-white rounded-2xl shadow-md">
      <h4 className="px-4 pt-4 text-sm font-semibold text-gray-700">{title}</h4>
      <ul className="p-4 space-y-3">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                {u.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{u.name}</div>
                <div className="text-xs text-gray-500 truncate">@{u.username}</div>
              </div>
            </div>
            <button className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-700">
              Ver
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListCommunities({
  title,
  communities,
  emptyText,
}: {
  title: string;
  communities: { id: string; name: string; topic: string }[];
  emptyText: string;
}) {
  if (communities.length === 0) return <p className="text-center text-gray-500">{emptyText}</p>;
  return (
    <div className="bg-white rounded-2xl shadow-md">
      <h4 className="px-4 pt-4 text-sm font-semibold text-gray-700">{title}</h4>
      <ul className="p-4 space-y-3">
        {communities.map((c) => (
          <li key={c.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-gray-500">{c.topic}</div>
            </div>
            <button className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-700">
              Ver
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

}