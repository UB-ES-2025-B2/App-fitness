"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ProfileAvatar from "../components/ProfileAvatar";
import UserListModal from "../components/UserListModal";

import { useRouter } from "next/navigation";
import { authFetch, getTokens, clearTokens } from "../lib/api";

import LogoutButton from "../components/LogOutButton";
import CityProgressPanel from "../components/CityProgressPanel";

type ApiUser = {
  id: number;
  name?: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  ocultar_info?: boolean;
  preferences?: Array<"Fútbol" | "Básquet" | "Montaña"> | string[];
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
  return res.json();
}

type BackendPost = {
  id: number;
  text: string;
  topic?: string | null;
  date?: string | null;
  created_at?: string | null;
  image?: string | null;
  image_url?: string | null;
  user?: {
    id: number;
    username: string;
    name?: string | null;
  } | null;

  timestamp?: string | null;

  type?: 'original' | 'repost';
  likes?: number;
  liked?: boolean;
  likedByMe?: boolean;
  reposts?: number;
  comment_text?: string | null;
  reposted_by?: { id: number; username: string; name?: string | null } | null;
  original_content?: BackendPost;
};

type PostBase = {
  id: number;
  topic: string;
  text: string;
  image?: string;
  likeCount?: number;
  likedByMe?: boolean;
  date?: string;
  repostCount?: number;
};

type OriginalContent = PostBase & {
  user: string;
  userId?: number;
};

type ApiPost = OriginalContent & {
  type: 'original' | 'repost';
  repostedBy?: string;
  repostedById?: number;
  repostComment?: string;
  originalPost?: OriginalContent;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function normalizeUserPost(p: BackendPost): ApiPost {
  const isRepost = p.type === 'repost';
  let sourcePost = p;

  if (isRepost && p.original_content) {
    sourcePost = p.original_content;
  }

  const userName =
    typeof sourcePost.user === "string"
      ? sourcePost.user
      : sourcePost.user?.name || sourcePost.user?.username || "Usuari";

  const userId =
    typeof sourcePost.user === "object" && sourcePost.user?.id
      ? sourcePost.user.id
      : undefined;

  const bestDate =
    sourcePost.date ||
    sourcePost.created_at ||
    sourcePost.timestamp ||
    new Date().toISOString();

  const originalData: OriginalContent = {
    id: sourcePost.id,
    text: sourcePost.text,
    topic: sourcePost.topic ?? "General",
    image: sourcePost.image ?? sourcePost.image_url ?? undefined,
    user: userName,
    userId,
    likeCount: sourcePost.likes ?? 0,
    likedByMe: sourcePost.likedByMe ?? sourcePost.liked ?? false,
    date: bestDate,
    repostCount: (sourcePost.reposts as number | undefined) ?? 0,
  };

  if (isRepost) {
    const reposterName = p.reposted_by?.name || p.reposted_by?.username || "Tú";
    const reposterId = p.reposted_by?.id;
    const repostComment = p.comment_text ?? undefined;

    return {
      ...originalData,
      type: 'repost',
      repostedBy: reposterName,
      repostedById: reposterId,
      repostComment: repostComment,
      originalPost: originalData,
      date: p.created_at || p.date || originalData.date,
    } as ApiPost;
  }

  return { ...originalData, type: 'original' } as ApiPost;
}

async function fetchUserPosts(userId: number): Promise<ApiPost[]> {
  const res = await authFetch(`${API_BASE}/api/users/${userId}/posts`);
  if (!res.ok) return [];
  const data: BackendPost[] = await res.json();
  return data.map(normalizeUserPost);
}

async function fetchUserBookmarks(userId: number): Promise<ApiPost[]> {
  const res = await authFetch(`${API_BASE}/api/users/${userId}/bookmarks`);
  if (!res.ok) return [];
  const data: BackendPost[] = await res.json();
  return data.map(normalizeUserPost);
}


type Profile = {
  nombre: string;
  apellido1: string;
  apellido2: string;
  username: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  direccion: string;
  temas: Array<"Fútbol" | "Básquet" | "Montaña">;
  ocultarInfo: boolean;
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

type TopicFilter = "ALL" | "Fútbol" | "Básquet" | "Montaña";
type DateFilter = "ALL" | "DAY" | "MONTH" | "YEAR";
type SortOrder = "DESC" | "ASC";
type Tab = "POSTS" | "BOOKMARKS";


export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [loading, setLoading] = useState(true);

  const [followersList, setFollowersList] = useState<UserSummary[]>([]);
  const [followingList, setFollowingList] = useState<UserSummary[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">("followers");

  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [bookmarkedPosts, setBookmarkedPosts] = useState<ApiPost[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("POSTS");

  const [topicFilter, setTopicFilter] = useState<TopicFilter>("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  const [postToDelete, setPostToDelete] = useState<{ id: number; type: 'original' | 'repost'; originalId?: number } | null>(null);

  const askDeletePost = (id: number, type: 'original' | 'repost', originalId?: number) => {
    setPostToDelete({ id, type, originalId });
  };

  const cancelDeletePost = () => {
    setPostToDelete(null);
  };
  const handleUnbookmark = async (post: ApiPost) => {
    const postId = post.type === "repost" && post.originalPost
      ? post.originalPost.id
      : post.id;

    try {
      const res = await authFetch(`${API_BASE}/api/posts/${postId}/bookmark`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error al quitar de guardados:", text);
        alert("No se pudo quitar de guardados");
        return;
      }

      setBookmarkedPosts((prev) =>
        prev.filter((p) => {
          const id = p.type === "repost" && p.originalPost ? p.originalPost.id : p.id;
          return id !== postId;
        })
      );

      setPosts((prev) =>
        prev.map((p) => {
          const isOriginal = p.id === postId && p.type === "original";
          const isRepost = p.type === "repost" && p.originalPost?.id === postId;

          if (isOriginal) {
            return { ...p, bookmarkedByMe: false };
          }
          if (isRepost && p.originalPost) {
            return {
              ...p,
              originalPost: {
                ...p.originalPost,
                bookmarkedByMe: false,
              },
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error("Error de red al quitar de guardados:", err);
      alert("Error de red al quitar de guardados");
    }
  };

  const confirmDeletePost = async () => {
    if (postToDelete === null) return;

    try {
      let endpoint = '';
      let idToDelete = postToDelete.id;

      if (postToDelete.type === 'repost' && postToDelete.originalId) {
        endpoint = `${API_BASE}/api/posts/${postToDelete.originalId}/repost`;
        idToDelete = postToDelete.originalId;
      } else {
        endpoint = `${API_BASE}/api/posts/${postToDelete.id}`;
      }

      const res = await authFetch(endpoint, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error al borrar post:", text);
        alert("No se pudo eliminar la publicación");
        return;
      }

      setPosts((prev) => prev.filter((p) => {
        if (p.type === 'original' && p.id === idToDelete) return false;
        if (p.type === 'repost' && p.originalPost?.id === idToDelete) return false;

        return true;
      }));
      setPostToDelete(null);
    } catch (err) {
      console.error("Error de red al eliminar el post:", err);
      alert("Error de red al eliminar la publicación");
    }
  };


  const visiblePosts = (() => {
    const source = activeTab === "POSTS" ? posts : bookmarkedPosts;

    if (!source || source.length === 0) return [];

    const now = new Date();

    const passesDateFilter = (dateStr: string) => {
      if (dateFilter === "ALL") return true;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;

      if (dateFilter === "DAY") {
        const oneDayMs = 24 * 60 * 60 * 1000;
        return now.getTime() - d.getTime() <= oneDayMs;
      }

      if (dateFilter === "MONTH") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return d >= monthAgo;
      }

      if (dateFilter === "YEAR") {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return d >= yearAgo;
      }

      return true;
    };

    return [...source]
      .filter((p) => {
        const topic = p.topic || "";
        if (topicFilter !== "ALL" && topic !== topicFilter) return false;
        return passesDateFilter(p.date ?? "");
      })
      .sort((a, b) => {
        const da = new Date(a.date ?? "").getTime();
        const db = new Date(b.date ?? "").getTime();
        if (isNaN(da) || isNaN(db)) return 0;
        return sortOrder === "DESC" ? db - da : da - db;
      });
  })();


  useEffect(() => {
    const onNewPost = (e: Event) => {
      const detail = (e as CustomEvent<{
        id: number;
        text: string;
        topic: string;
        image?: string;
      }>).detail;

      const apiPost: ApiPost = {
        id: detail.id,
        text: detail.text,
        topic: detail.topic,
        image: detail.image,
        date: new Date().toISOString(),
        type: 'original',
      } as ApiPost;

      setPosts((prev) => [apiPost, ...prev]);
    };

    window.addEventListener("new-post", onNewPost as EventListener);
    return () => window.removeEventListener("new-post", onNewPost as EventListener);
  }, []);


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

      try {
        const [followersRes, followingRes] = await Promise.all([
          authFetch(`/api/users/${me.id}/followers`),
          authFetch(`/api/users/${me.id}/following`),
        ]);

        if (followersRes.ok) {
          const followersData = await followersRes.json();
          setFollowersList(followersData);
        }

        if (followingRes.ok) {
          const followingData = await followingRes.json();
          setFollowingList(followingData);
        }

        setPostsLoading(true);
        setBookmarksLoading(true);
        try {
          const [userPosts, userBookmarks] = await Promise.all([
            fetchUserPosts(me.id),
            fetchUserBookmarks(me.id),
          ]);
          setPosts(userPosts);
          setBookmarkedPosts(userBookmarks);
        } catch (e) {
          console.error(e);
          setPosts([]);
          setBookmarkedPosts([]);
        } finally {
          setPostsLoading(false);
          setBookmarksLoading(false);
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
      <section className="bg-white rounded-2xl shadow-md p-5 mb-6 relative">

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              value={profile.avatarUrl}
              onChange={async (url) => {
                setProfile((p) => ({ ...p, avatarUrl: url }));
                try {
                  await updateMe({ avatar_url: url || null });
                } catch (e) {
                  setProfile((p) => ({ ...p, avatarUrl: undefined }));
                  alert((e as Error).message);
                }
              }}
            />

            <div className="flex items-center gap-2">
              <LogoutButton />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                {profile.nombre} {profile.apellido1} {profile.apellido2}
              </h2>
              <p className="text-sm text-gray-500">@{profile.username}</p>
            </div>
          </div>

          <SettingsDropdown profile={profile} onSave={setProfile} />
        </div>

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
            <Stat label="Seguidos" value={followingList.length} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setActiveTab("POSTS")}
            className={
              "px-4 py-2 text-sm border-b-2 -mb-[1px] " +
              (activeTab === "POSTS"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800")
            }
          >
            Mis publicaciones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("BOOKMARKS")}
            className={
              "px-4 py-2 text-sm border-b-2 -mb-[1px] " +
              (activeTab === "BOOKMARKS"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800")
            }
          >
            Guardados
          </button>
        </div>
        <div className="space-y-4">
          {visiblePosts.length > 0 && (
            <PostFilters
              topicFilter={topicFilter}
              setTopicFilter={setTopicFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
            />
          )}

          {activeTab === "POSTS" && postsLoading && (
            <p className="text-center text-gray-500">Cargando publicaciones…</p>
          )}
          {activeTab === "BOOKMARKS" && bookmarksLoading && (
            <p className="text-center text-gray-500">Cargando guardados…</p>
          )}

          {activeTab === "POSTS" && !postsLoading && posts.length === 0 && (
            <p className="text-center text-gray-500">Aún no hay publicaciones.</p>
          )}
          {activeTab === "BOOKMARKS" && !bookmarksLoading && bookmarkedPosts.length === 0 && (
            <p className="text-center text-gray-500">Aún no has guardado publicaciones.</p>
          )}

          {!postsLoading && visiblePosts.length > 0 && (
            <>
              {visiblePosts.map((p) => (
                <article
                  key={p.id + p.type + (p.repostedById || 0)}
                  className="bg-white rounded-2xl shadow-md p-4 relative"
                >
                  {activeTab === "POSTS" && (
                    <button
                      type="button"
                      onClick={() => askDeletePost(p.id, p.type, p.originalPost?.id)}
                      className="absolute -top-3 right-3 text-xs px-2 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 shadow"
                    >
                      Eliminar
                    </button>
                  )}
                  {activeTab === "BOOKMARKS" && (
                    <button
                      type="button"
                      onClick={() => handleUnbookmark(p)}
                      className="absolute -top-3 right-3 text-xs px-2 py-1 rounded-full bg-amber-500 text-white hover:bg-amber-600 shadow"
                    >
                      Quitar de guardados
                    </button>
                  )}

                  {postToDelete && postToDelete.id === p.id && (
                    <div className="mt-3 p-3 border border-red-200 bg-red-50 rounded-xl text-sm text-red-800">
                      <p className="mb-2 font-semibold">
                        ¿Seguro que quieres eliminar esta publicación?
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelDeletePost}
                          className="px-3 py-1 rounded-lg text-xs bg-white border border-red-200 hover:bg-red-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={confirmDeletePost}
                          className="px-3 py-1 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}

                  {p.type === 'repost' && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500"><path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.355 4.5 4.5 0 0 0 4.5 0 7.5 7.5 0 0 1-12.548 3.355Z" clipRule="evenodd" /><path d="M18.75 12a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H18.75Z" /><path fillRule="evenodd" d="M4.5 12.75a7.5 7.5 0 0 1 12.548-3.355 4.5 4.5 0 0 0 4.5 0 7.5 7.5 0 0 1-12.548 3.355ZM18.75 15a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H18.75Z" clipRule="evenodd" /></svg>
                      <p>
                        Recompartido por{' '}
                        <span className="font-semibold text-gray-800">
                          {p.repostedBy}
                        </span>
                      </p>
                    </div>
                  )}

                  {p.type === 'repost' && p.repostComment && (
                    <p className="mb-4 italic text-gray-600 border-l-4 border-blue-500 pl-3">
                      `{p.repostComment}`
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {p.type === 'original' ? (profile.nombre || profile.username || "Tú") : (p.originalPost?.user || 'Usuario')}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {p.type === 'original' ? p.topic ?? "General" : p.originalPost?.topic ?? "General"} ·{" "}
                      {new Date(p.date ?? "").toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="mt-2 text-gray-700">{p.type === 'original' ? p.text : p.originalPost?.text}</p>
                  {(p.type === 'original' ? p.image : p.originalPost?.image) && (
                    <img
                      src={p.type === 'original' ? p.image : p.originalPost?.image || ''}
                      alt={p.topic ?? "Post"}
                      className="mt-3 rounded-xl w-full h-56 object-cover"
                    />
                  )}
                </article>
              ))}
              <p className="text-center text-gray-400 text-sm mt-4">
                No hay más publicaciones.
              </p>
            </>
          )}
        </div>
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

  useEffect(() => setForm(profile), [profile]);

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
      await updateMe({
        name: form.nombre,
        username: form.username,
        preferences: form.temas,
        ocultar_info: form.ocultarInfo,
      });
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

          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-3 gap-2">
              <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              <Input label="Apellido 1" value={form.apellido1} onChange={(v) => setForm({ ...form, apellido1: v })} />
              <Input label="Apellido 2" value={form.apellido2} onChange={(v) => setForm({ ...form, apellido2: v })} />
            </div>

            <Input label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} prefix="@" />

            <div className="grid grid-cols-2 gap-2">
              <Input type="date" label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={(v) => setForm({ ...form, fechaNacimiento: v })} />
              <Input label="Lugar de nacimiento" value={form.lugarNacimiento} onChange={(v) => setForm({ ...form, lugarNacimiento: v })} />
            </div>

            <Input label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />

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

function PostFilters({
  topicFilter,
  setTopicFilter,
  dateFilter,
  setDateFilter,
  sortOrder,
  setSortOrder,
}: {
  topicFilter: TopicFilter;
  setTopicFilter: (v: TopicFilter) => void;
  dateFilter: DateFilter;
  setDateFilter: (v: DateFilter) => void;
  sortOrder: SortOrder;
  setSortOrder: (v: SortOrder) => void;
}) {
  const topicButtons: { value: TopicFilter; label: string }[] = [
    { value: "ALL", label: "Todas" },
    { value: "Fútbol", label: "Fútbol" },
    { value: "Básquet", label: "Básquet" },
    { value: "Montaña", label: "Montaña" },
  ];

  const dateButtons: { value: DateFilter; label: string }[] = [
    { value: "ALL", label: "Todo" },
    { value: "DAY", label: "Último día" },
    { value: "MONTH", label: "Último mes" },
    { value: "YEAR", label: "Último año" },
  ];

  return (
    <div className="bg-white border rounded-2xl shadow-sm px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
      </div>

      <div className="flex flex-wrap gap-2">
        {topicButtons.map((btn) => {
          const active = topicFilter === btn.value;
          return (
            <button
              key={btn.value}
              type="button"
              onClick={() => setTopicFilter(btn.value)}
              className={
                "text-xs px-3 py-1.5 rounded-full border transition shadow-sm " +
                (active
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100")
              }
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {dateButtons.map((btn) => {
          const active = dateFilter === btn.value;
          return (
            <button
              key={btn.value}
              type="button"
              onClick={() => setDateFilter(btn.value)}
              className={
                "text-xs px-3 py-1.5 rounded-full border transition " +
                (active
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-md scale-[1.02]"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100")
              }
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">Ordenar por</span>
        <div className="inline-flex rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setSortOrder("DESC")}
            className={
              "text-[11px] px-3 py-1 rounded-full transition " +
              (sortOrder === "DESC"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-800")
            }
          >
            Más recientes
          </button>
          <button
            type="button"
            onClick={() => setSortOrder("ASC")}
            className={
              "text-[11px] px-3 py-1 rounded-full transition " +
              (sortOrder === "ASC"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-800")
            }
          >
            Más antiguos
          </button>
        </div>
      </div>
    </div>
  );
}