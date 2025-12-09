"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Topic, useTopic } from "./TopicContext";
import { motion } from "framer-motion";
import Image from 'next/image';
import ReportForm from "./ReportForm";
import TrainingSession from "./TrainingSession";
import { Dumbbell } from "lucide-react"; // Asegúrate de tener lucide-react o usa un SVG

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const TOPICS: Topic[] = ["Todos", "Fútbol", "Básquet", "Montaña"];

type PostBase = {
  id: number;
  topic: string;
  text: string;
  image?: string;
  likeCount?: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  date?: string;
  repostCount?: number;
};

type OriginalContent = PostBase & {
  user: string;
  userId?: number;
  avatar?: string | null;
  type?: 'original' | 'repost';
};

type Post = OriginalContent & {
  type: 'original' | 'repost';
  repostedBy?: string;
  repostedById?: number;
  repostComment?: string;
  originalPost?: OriginalContent;
};

type BackendPost = {
  id: number;
  text: string;
  topic?: string | null;
  image?: string | null;
  date?: string | null;
  created_at?: string | null;
  timestamp?: string | null;
  user?: {
    id: number;
    username: string;
    name?: string | null;
    avatar_url?: string | null;
  } | null;
  likes?: number;
  liked?: boolean;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  reposts?: number;

  type?: 'original' | 'repost';
  comment_text?: string | null;
  reposted_by?: { id: number; username: string; name?: string | null } | null;
  original_content?: BackendPost;
};

function normalizePost(p: BackendPost): Post {
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
  const avatar =
    typeof sourcePost.user === "object"
      ? sourcePost.user?.avatar_url || null
      : null;


  const bestDate =
    sourcePost.date ||
    sourcePost.created_at ||
    sourcePost.timestamp ||
    new Date().toISOString();

  const originalData: OriginalContent = {
    id: sourcePost.id,
    text: sourcePost.text,
    topic: sourcePost.topic ?? "General",
    image: sourcePost.image ?? undefined,
    user: userName,
    userId,
    avatar,
    likeCount: sourcePost.likes ?? 0,
    likedByMe: sourcePost.likedByMe ?? sourcePost.liked ?? false,
    bookmarkedByMe: sourcePost.bookmarkedByMe ?? false,
    date: bestDate,
    repostCount: sourcePost.reposts ?? 0,
  };

  if (isRepost) {
    const reposterName = p.reposted_by?.name || p.reposted_by?.username || "Usuari Desconegut";
    const reposterId = p.reposted_by?.id;
    const repostComment = p.comment_text ?? undefined;

    return {
      ...originalData,
      type: 'repost',
      repostedBy: reposterName,
      repostedById: reposterId,
      repostComment: repostComment,
      originalPost: originalData,
      date: p.created_at || p.date || bestDate,
    } as Post;
  }

  return { ...originalData, type: 'original' } as Post;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { topic, setTopic } = useTopic();

  const [sortOrder, setSortOrder] = useState("DESC");
  const [reportPostId, setReportPostId] = useState<number | null>(null); // ID del post a denunciar
  const isReportModalOpen = reportPostId !== null;

  const handleOpenReport = (postId: number) => {
    setReportPostId(postId);
  };

  const handleCloseReport = () => {
    setReportPostId(null);
  };


  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // 1. Leer token de localStorage (igual que haces en like/bookmark)
        const raw = localStorage.getItem("ubfitness_tokens");
        let accessToken: string | null = null;

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            accessToken = parsed.access_token;
          } catch (e) {
            console.error("Invalid ubfitness_tokens in localStorage", e);
          }
        }

        // 2. Construir headers (con o sin Authorization)
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        // 3. Hacer el fetch con headers
        const res = await fetch(`${API_BASE}/api/posts/`, {
          headers,
        });

        if (!res.ok) throw new Error("Error cargando posts");
        const data: BackendPost[] = await res.json();
        setPosts(data.map(normalizePost));
      } catch (err) {
        console.error(err);
        setError("No s'han pogut carregar les publicacions. Intenta-ho més tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    const onNewPost = (e: Event) => {
      const detail = (e as CustomEvent<Post>).detail;
      setPosts((prev) => [detail, ...prev]);
    };

    window.addEventListener("new-post", onNewPost as EventListener);
    return () => window.removeEventListener("new-post", onNewPost as EventListener);
  }, []);


  const handleRepost = async (postId: number) => {
    const raw = localStorage.getItem("ubfitness_tokens");
    let accessToken: string | null = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        accessToken = parsed.access_token;
      } catch (e) {
        console.error("Invalid ubfitness_tokens in localStorage", e);
      }
    }

    if (!accessToken) {
      alert("Has d'iniciar sessió per repostejar.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/repost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (res.status === 201) {
        alert("Repost creat amb èxit!");
        window.location.reload();
      } else if (res.status === 200) {
        alert("Ja has reposteat aquest post.");
      }
      else {
        const errorData = await res.json();
        alert(`Error al fer Repost: ${errorData.error || 'Petició fallida'}`);
        console.error("Error al fer Repost:", res.status, errorData);
      }
    } catch (err) {
      console.error("Error durant la petició de Repost:", err);
      alert("Error de xarxa en fer Repost.");
    }
  };

  const handleToggleLike = async (postId: number) => {
    setPosts((prev) => {
      const targetPost = prev.find((p) => p.id === postId);
      const postToLike = targetPost?.type === 'repost' ? targetPost.originalPost : targetPost;

      const liked = postToLike?.likedByMe ?? false;
      const method = liked ? "DELETE" : "POST";

      (async () => {
        const raw = localStorage.getItem("ubfitness_tokens");
        let accessToken: string | null = null;

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            accessToken = parsed.access_token;
          } catch (e) {
            console.error("Invalid ubfitness_tokens in localStorage", e);
          }
        }

        try {
          const res = await fetch(`${API_BASE}/api/posts/${postToLike?.id}/like`, {
            method,
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("Error toggling like", res.status, text);
            return;
          }

          const data = await res.json();

          setPosts((prev2) =>
            prev2.map((p) => {
              const isTargetOriginal = p.id === postToLike?.id && p.type === 'original';
              const isTargetRepost = p.type === 'repost' && p.originalPost?.id === postToLike?.id;

              if (isTargetOriginal) {
                return { ...p, likedByMe: data.liked, likeCount: data.likes };
              } else if (isTargetRepost) {
                return {
                  ...p,
                  originalPost: {
                    ...p.originalPost!,
                    likedByMe: data.liked,
                    likeCount: data.likes
                  }
                };
              }
              return p;
            })
          );
        } catch (err) {
          console.error("Error toggling like", err);
        }
      })();

      return prev;
    });
  };

  const handleBookmarkPost = async (postId: number) => {
    setPosts((prev) => {
      const targetPost = prev.find((p) => p.id === postId);
      const postToBookmark =
        targetPost?.type === "repost" ? targetPost.originalPost : targetPost;

      const bookmarked = postToBookmark?.bookmarkedByMe ?? false;
      const method = bookmarked ? "DELETE" : "POST";

      (async () => {
        // get access token
        const raw = localStorage.getItem("ubfitness_tokens");
        let accessToken: string | null = null;

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            accessToken = parsed.access_token;
          } catch (err) {
            console.error("Invalid ubfitness_tokens in localStorage", err);
          }
        }

        try {
          const res = await fetch(
            `${API_BASE}/api/posts/${postToBookmark?.id}/bookmark`,
            {
              method,
              headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
              },
            }
          );

          if (!res.ok) {
            const text = await res.text();
            console.error("Error toggling bookmark", res.status, text);
            return;
          }

          const data = await res.json();

          setPosts((prev2) =>
            prev2.map((p) => {
              const isTargetOriginal =
                p.id === postToBookmark?.id && p.type === "original";
              const isTargetRepost =
                p.type === "repost" &&
                p.originalPost?.id === postToBookmark?.id;

              if (isTargetOriginal) {
                return {
                  ...p,
                  bookmarkedByMe: data.bookmarked,
                };
              }

              if (isTargetRepost) {
                return {
                  ...p,
                  originalPost: {
                    ...p.originalPost!,
                    bookmarkedByMe: data.bookmarked,
                  },
                };
              }

              return p;
            })
          );
        } catch (err) {
          console.error("Error toggling bookmark", err);
        }
      })();

      return prev;
    });
  };


  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <motion.div
          className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="mt-4 text-gray-600 dark:text-gray-300 text-lg"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Carregant publicacions...
        </motion.p>
      </div>
    );

  if (error)
    return <p className="text-center text-red-500 mt-10">{error}</p>;

  const visible = posts
    .filter((p) => topic === "Todos" || p.topic === topic)
    .sort((a, b) => {
      const da = new Date(a.date ?? "").getTime();
      const db = new Date(b.date ?? "").getTime();
      return sortOrder === "DESC" ? db - da : da - db;
    });

  if (visible.length === 0)
    return <p className="text-center mt-10 text-gray-500">No hi ha contingut per mostrar.</p>;

  return (
    <section className="w-full py-4 fade-in">
      <div className="mb-4 flex items-center justify-between gap-4">

        <div>
          <TopicDropdown topic={topic} setTopic={setTopic} topics={TOPICS} />
        </div>

        <div className="flex-1 flex justify-end">
          <FeedFilters sortOrder={sortOrder} setSortOrder={setSortOrder} />
        </div>

      </div>


      <div className="space-y-6 mt-4">
        {visible.map((post) => (
          <article
            key={post.id + post.type + (post.repostedById || 0)}
            className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300"
          >
            {post.type === 'repost' && (
              <div className="mb-3 text-sm flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-blue-500"
                >
                  <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.355 4.5 4.5 0 0 0 4.5 0 7.5 7.5 0 0 1-12.548 3.355Z" clipRule="evenodd" />
                  <path d="M18.75 12a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H18.75Z" />
                  <path fillRule="evenodd" d="M4.5 12.75a7.5 7.5 0 0 1 12.548-3.355 4.5 4.5 0 0 0 4.5 0 7.5 7.5 0 0 1-12.548 3.355ZM18.75 15a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H18.75Z" clipRule="evenodd" />
                </svg>

                <p>
                  Recompartido por{' '}
                  <Link
                    href={`/usuario/${post.repostedById}`}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {post.repostedBy}
                  </Link>
                </p>
              </div>
            )}

            {post.type === 'repost' && post.repostComment && (
              <p className="mb-4 italic text-gray-600 dark:text-gray-400 border-l-4 border-blue-500 pl-3">
                `{post.repostComment}`
              </p>
            )}

            <PostContent
              post={post.type === 'repost' ? post.originalPost! : post}
              handleToggleLike={handleToggleLike}
              handleRepost={handleRepost}
              handleOpenReport={handleOpenReport}
              handleBookmarkPost={handleBookmarkPost}
            />
          </article>
        ))}
      </div>

      {isReportModalOpen && reportPostId !== null && (
        <ReportForm
          targetId={reportPostId}
          targetType="post"
          isOpen={isReportModalOpen}
          onClose={handleCloseReport}
        />
      )}
    </section>
  );
}

function PostContent({
  post,
  handleToggleLike,
  handleRepost,
  handleOpenReport,
  handleBookmarkPost,
}: {
  post: OriginalContent;
  handleToggleLike: (id: number) => void;
  handleRepost: (id: number) => void;
  handleOpenReport: (id: number) => void;
  handleBookmarkPost: (id: number) => void;

}) {
  return (
    <div
      className={
        post.type === "repost"
          ? "border border-gray-200 dark:border-slate-700 p-4 rounded-xl"
          : ""
      }
    >
      {/* --- CABECERA DEL POST --- */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* FOTO DE PERFIL */}
          <Link href={`/usuario/${post.userId ?? ""}`}>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700/40 flex items-center justify-center text-white text-lg font-semibold shadow-md hover:scale-105 transition-transform">
              {post.avatar ? (
                <Image
                  src={post.avatar}
                  alt="Avatar usuario"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <span>{post.user.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </Link>

          {/* NOMBRE */}
          {post.userId ? (
            <Link
              href={`/usuario/${post.userId}`}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {post.user}
            </Link>
          ) : (
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {post.user}
            </span>
          )}
        </div>

        {/* TEMA */}
        <span className="text-xs font-medium text-gray-400 dark:text-gray-400 uppercase tracking-wide">
          {post.topic}
        </span>
      </div>

      {/* TEXTO */}
      <p className="text-gray-200 leading-relaxed">{post.text}</p>

      {/* IMAGEN */}
      {post.image && (
        <div className="mt-3 overflow-hidden rounded-xl">
          <img
            src={post.image}
            alt={post.topic}
            className="w-full h-64 object-cover transform hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      )}


      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => handleToggleLike(post.id)}
          className="flex items-center gap-1 text-sm 
        text-gray-600 dark:text-gray-300 
        hover:text-blue-500 dark:hover:text-blue-400
        transition-all duration-200 
        hover:scale-105 active:scale-95"
        >
          <span>{post.likedByMe ? "💖" : "🤍"}</span>
          <span>{post.likeCount ?? 0} Me gusta</span>
        </button>

        <button
          onClick={() => handleRepost(post.id)}
          className="flex items-center gap-1 text-sm 
        text-gray-600 dark:text-gray-300 
        hover:text-green-500 dark:hover:text-green-400
        transition-all duration-200 
        hover:scale-105 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 12.5a.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-4h-2a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5h2V4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2v4a.5.5 0 0 1-.5.5z" />
            <path fill="none" d="M0 0h24v24H0z" />
          </svg>

          <span>Repost</span>
        </button>

        <button
          onClick={() => handleBookmarkPost(post.id)}
          className="flex items-center gap-1 text-sm 
        text-gray-600 dark:text-gray-300 
        hover:text-amber-500 dark:hover:text-amber-400
        transition-all duration-200 
        hover:scale-105 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill={post.bookmarkedByMe ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-7-4-7 4V4z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span>{post.bookmarkedByMe ? "Guardado" : "Guardar"}</span>
        </button>


        {post.repostCount !== undefined && post.repostCount >= 0 && (
          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            🔁 {post.repostCount} Reposts
          </span>
        )}
        <button
          onClick={() => handleOpenReport(post.id)}
          className="flex items-center gap-1 text-xs 
        text-red-500 dark:text-red-400 
        hover:text-red-300 dark:hover:text-red-200
        transition-all duration-200 
        hover:scale-105 active:scale-95 ml-auto"
        ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Denunciar
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
    TOPIC DROPDOWN & FEED FILTERS
----------------------------------------------------------------*/
function TopicDropdown({
  topic,
  setTopic,
  topics,
}: {
  topic: Topic;
  setTopic: (t: Topic) => void;
  topics: Topic[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (open && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const onSelect = (t: Topic) => {
    setTopic(t);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 shadow-sm hover:bg-blue-50 dark:hover:bg-slate-600 text-sm transition-all"
      >
        <span>Temática:</span>
        <span className="font-medium text-blue-700 dark:text-blue-400">{topic}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Seleccionar temàtica"
          className="absolute z-40 mt-2 w-56 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl p-1 backdrop-blur-sm"
        >
          {topics.map((t) => {
            const active = t === topic;
            return (
              <li key={t}>
                <button
                  role="option"
                  aria-selected={active}
                  onClick={() => onSelect(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${active
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                    : "hover:bg-blue-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200"
                    }`}
                >
                  {t}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FeedFilters({
  sortOrder,
  setSortOrder,
}: {
  sortOrder: string;
  setSortOrder: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectOrder = (order: "ASC" | "DESC") => {
    setSortOrder(order);
    setOpen(false);
  };

  return (
    <div className="relative w-full flex justify-end" ref={ref}>
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
             border border-gray-300 dark:border-slate-600 
             bg-white dark:bg-slate-700/60 
             shadow-sm hover:bg-blue-50 dark:hover:bg-slate-600 
             text-sm transition-all"
      >
        <span>Ordenar:</span>
        <span className="font-medium text-blue-700 dark:text-blue-400">
          {sortOrder === "DESC" ? "Más reciente" : "Más antiguo"}
        </span>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className={`transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
          <button
            onClick={() => selectOrder("DESC")}
            className={`w-full text-left px-4 py-2 text-sm transition ${sortOrder === "DESC"
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              : "hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
          >
            Más reciente
          </button>

          <button
            onClick={() => selectOrder("ASC")}
            className={`w-full text-left px-4 py-2 text-sm transition ${sortOrder === "ASC"
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              : "hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
          >
            Más antiguo
          </button>
        </div>
      )}
    </div>
  );
}