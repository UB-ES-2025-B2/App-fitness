"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Topic, useTopic } from "./TopicContext";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const TOPICS: Topic[] = ["Todos", "Fútbol", "Básquet", "Montaña"];

type Post = {
  id: number;
  user: string;
  userId?: number;
  topic: string;
  text: string;
  image?: string;
  likeCount?: number;
  likedByMe?: boolean;
  date?: string;
};

type BackendPost = {
  id: number;
  text: string;
  topic?: string | null;
  image?: string | null;
  date?: string | null;
  created_at?: string | null;
  timestamp?: string | null;
  user?: { id: number; username: string; name?: string | null } | null;
  likes?: number;
  liked?: boolean;
  likedByMe?: boolean;
};

function normalizePost(p: BackendPost): Post {
  // Pot venir com string o com objecte
  const userName =
    typeof p.user === "string"
      ? p.user
      : p.user?.name || p.user?.username || "Usuari";

  const userId =
    typeof p.user === "object" && p.user?.id ? p.user.id : undefined;

  // Obtenemos la mejor fecha disponible
  const bestDate =
    p.date ||
    p.created_at ||
    p.timestamp ||
    new Date().toISOString(); // fallback seguro

  return {
    id: p.id,
    text: p.text,
    topic: p.topic ?? "General",
    image: p.image ?? undefined,
    user: userName,
    userId,
    likeCount: p.likes ?? 0,
    likedByMe: p.likedByMe ?? p.liked ?? false,
    date: bestDate,
  };
}


export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { topic, setTopic } = useTopic();

  
  const [sortOrder, setSortOrder] = useState("DESC");
  

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/`);
        if (!res.ok) throw new Error("Error cargando posts");
        const data: BackendPost[] = await res.json();
        setPosts(data.map(normalizePost));
      } catch (err) {
        console.error(err);
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

  const handleToggleLike = async (postId: number) => {
    setPosts((prev) => {
      const post = prev.find((p) => p.id === postId);
      const liked = post?.likedByMe ?? false;
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
          const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
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
            prev2.map((p) =>
              p.id === postId
                ? { ...p, likedByMe: data.liked, likeCount: data.likes }
                : p
            )
          );
        } catch (err) {
          console.error("Error toggling like", err);
        }
      })();

      return prev;
    });
  };

  // ------------------------------
  // Loading
  // ------------------------------
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

  // ------------------------------
  // Error
  // ------------------------------
  if (error)
    return <p className="text-center text-red-500 mt-10">{error}</p>;

  // ------------------------------
  // Visible posts (filtered)
  // ------------------------------

  const visible = posts
    .filter((p) => topic === "Todos" || p.topic === topic)
    .sort((a, b) => {
      const da = new Date(a.date ?? "").getTime();
      const db = new Date(b.date ?? "").getTime();
      return sortOrder === "DESC" ? db - da : da - db;
    });

  // ------------------------------
  // No content
  // ------------------------------
  if (visible.length === 0)
    return <p className="text-center mt-10 text-gray-500">No hi ha contingut per mostrar.</p>;

  // ------------------------------
  // View
  // ------------------------------
  return (
    <section className="w-full py-4 fade-in">
        <div className="mb-4 flex items-center justify-between gap-4">

        {/* Temática */}
        <div>
          <TopicDropdown topic={topic} setTopic={setTopic} topics={TOPICS} />
        </div>

        {/* Ordenar */}
        <div className="flex-1 flex justify-end">
          <FeedFilters sortOrder={sortOrder} setSortOrder={setSortOrder} />
        </div>

      </div>


      <div className="space-y-6 mt-4">
        {visible.map((post) => (
          <article
            key={post.id}
            className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              {post.userId ? (
                <Link 
                  href={`/usuario/${post.userId}`}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {post.user}
                </Link>
              ) : (
                <h2 className="font-semibold text-blue-600 dark:text-blue-400">{post.user}</h2>
              )}
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {post.topic}
              </span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{post.text}</p>

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
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <span>{post.likedByMe ? "💖" : "🤍"}</span>
                <span>{post.likeCount ?? 0} Me gusta</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   TOPIC DROPDOWN
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
        <span>Temàtica:</span>
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
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
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

/* ---------------------------------------------------------------
   FEED FILTERS - DROPDOWN MODERN
----------------------------------------------------------------*/
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
        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
        onClick={() => setOpen(!open)}
      >
        Ordenar:
        <span className="font-medium text-blue-600 dark:text-blue-400">
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
            className={`w-full text-left px-4 py-2 text-sm transition ${
              sortOrder === "DESC"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            Más reciente
          </button>

          <button
            onClick={() => selectOrder("ASC")}
            className={`w-full text-left px-4 py-2 text-sm transition ${
              sortOrder === "ASC"
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