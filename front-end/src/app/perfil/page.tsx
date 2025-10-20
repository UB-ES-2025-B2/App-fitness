// src/app/perfil/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import ProfileAvatar from "../components/ProfileAvatar";



type Post = { id: number; text: string; image?: string; topic: string; date: string };
type User = { id: string; name: string; username: string };
type Community = { id: string; name: string; topic: string };

const MY_POSTS: Post[] = [
  { id: 101, text: "Series de cuestas esta mañana 💪", topic: "Montaña", date: "2025-10-10", image: "https://images.unsplash.com/photo-1520975922284-9e0e4a9f08fd" },
  { id: 102, text: "Partidillo con amigos ⚽️", topic: "Fútbol", date: "2025-10-07" },
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
  nombre: "Nuria",
  apellido1: "García",
  apellido2: "López",
  username: "nuria.fit",
  fechaNacimiento: "1998-05-20",
  lugarNacimiento: "Barcelona",
  direccion: "C/ Ejemplo 123, Barcelona",
  temas: ["Fútbol", "Montaña"],
  ocultarInfo: true, // activado por defecto
  avatarUrl: undefined, // vacío al inicio
};

export default function ProfilePage() {
  const [tab, setTab] = useState<"posts" | "followers" | "following">("posts");
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-0 py-6">
      {/* Header perfil */}
      <section className="bg-white rounded-2xl shadow-md p-5 mb-6 relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* AVATAR CLICABLE */}
            <ProfileAvatar
              value={profile.avatarUrl}
              onChange={(url) => setProfile((p) => ({ ...p, avatarUrl: url }))}
            />

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
          <Stat label="Publicaciones" value={MY_POSTS.length} />
          <Stat label="Seguidores" value={MY_FOLLOWERS.length} />
          <Stat label="Seguidos" value={MY_FOLLOWING_USERS.length + MY_FOLLOWING_COMMUNITIES.length} />
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

  // Cierra al clicar fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!panelRef.current) return;
      if (open && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const toggleTema = (tema: "Fútbol" | "Básquet" | "Montaña") => {
    setForm((f) => {
      const has = f.temas.includes(tema);
      return { ...f, temas: has ? f.temas.filter((t) => t !== tema) : [...f.temas, tema] };
    });
  };

  const save = () => {
    onSave(form);
    setOpen(false);
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
            <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">
              Cancelar
            </button>
            <button
              onClick={save}
              className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Guardar
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
