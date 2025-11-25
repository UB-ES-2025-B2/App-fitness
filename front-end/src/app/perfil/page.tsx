// src/app/perfil/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import ProfileAvatar from "../components/ProfileAvatar";
import UserListModal from "../components/UserListModal";

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

type UserSummary = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
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
  return res.json(); // { message, user: {...} }
}

type Post = { id: number; text: string; image?: string; topic: string; date: string };
type Community = { id: string; name: string; topic: string };

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

  // Listas de seguidores/seguidos
  const [followersList, setFollowersList] = useState<UserSummary[]>([]);
  const [followingList, setFollowingList] = useState<UserSummary[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">("followers");

  useEffect(() => {
    // si no hay tokens -> a /login
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

      // Mapea lo que venga del back a tu shape local
      setProfile({
        nombre: me.name ?? "",
        apellido1: "",           // aún no viene del back
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

      // Cargar seguidores, seguidos y posts
      try {
        const [followersRes, followingRes, postsRes] = await Promise.all([
          authFetch(`/api/users/${me.id}/followers`),
          authFetch(`/api/users/${me.id}/following`),
          authFetch(`/api/users/${me.id}/posts`)
        ]);

        if (followersRes.ok) {
          const followersData = await followersRes.json();
          setFollowersList(followersData);
        }
        
        if (followingRes.ok) {
          const followingData = await followingRes.json();
          setFollowingList(followingData);
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          // Map backend post format to frontend Post type if needed
          // Backend returns: { id, text, topic, image, date }
          // Frontend expects: { id, text, image?, topic, date }
          // It matches mostly, just need to ensure image is handled
          setPosts(postsData.map((p: any) => ({
            ...p,
            image: p.image || undefined
          })));
        }
      } catch (error) {
        console.error("Error cargando datos del perfil", error);
      }

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
        <div className="mt-4 grid grid-cols-3 divide-x rounded-lg bg-gray-50">
          <Stat label="Publicaciones" value={posts.length} />
          <div 
            className="cursor-pointer hover:bg-gray-100 transition-colors rounded-lg"
            onClick={() => {
              setModalType("followers");
              setModalOpen(true);
            }}
          >
            <Stat label="Seguidores" value={followersList.length} />
          </div>
          <div 
            className="cursor-pointer hover:bg-gray-100 transition-colors rounded-lg"
            onClick={() => {
              setModalType("following");
              setModalOpen(true);
            }}
          >
            <Stat label="Seguidos" value={followingList.length + MY_FOLLOWING_COMMUNITIES.length} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2">
          <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>Publicaciones</TabButton>
          <TabButton active={tab === "followers"} onClick={() => setTab("followers")}>Seguidores</TabButton>
          <TabButton active={tab === "following"} onClick={() => setTab("following")}>Seguidos</TabButton>
        </div>
      </section>

      {/* Contenido de pestañas */}
      <section>
        {tab === "posts" && (
          <div className="space-y-4">
            {posts.map((p) => (
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
            {posts.length === 0 && (
              <p className="text-center text-gray-500">Aún no hay publicaciones.</p>
            )}
          </div>
        )}

        {tab === "followers" && (
          <ListUsers 
            title="Seguidores" 
            users={followersList.map(u => ({ id: String(u.id), name: u.name, username: u.username }))} 
            emptyText="Aún no tienes seguidores." 
          />
        )}

        {tab === "following" && (
          <div className="space-y-6">
            <ListUsers 
              title="Usuarios seguidos" 
              users={followingList.map(u => ({ id: String(u.id), name: u.name, username: u.username }))} 
              emptyText="No sigues a nadie." 
            />
            <ListCommunities title="Comunidades seguidas" communities={MY_FOLLOWING_COMMUNITIES} emptyText="No sigues comunidades." />
          </div>
        )}
      </section>

      <UserListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "followers" ? "Seguidores" : "Seguidos"}
        users={modalType === "followers" ? followersList : followingList}
      />
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
