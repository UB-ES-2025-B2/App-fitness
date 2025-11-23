"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Topic, useTopic } from "./TopicContext";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Post = {
  id: number;
  user: string;
  userId?: number;
  topic: string;
  text: string;
  image?: string;
};

type BackendPost = {
  id: number;
  text: string;
  topic?: string | null;
  image?: string | null;
  date?: string | null;
  user?: { id: number; username: string; name?: string | null } | null;
};

const TOPICS: Topic[] = ["Todos", "Fútbol", "Básquet", "Montaña"];

function normalizePost(p: BackendPost): Post {
  // Pot venir com string o com objecte
  const userName =
    typeof p.user === "string"
      ? p.user
      : p.user?.name || p.user?.username || "Usuari";

  const userId = typeof p.user === "object" && p.user?.id ? p.user.id : undefined;

  return {
    id: p.id,
    text: p.text,
    topic: (p.topic ?? "General") as string,
    image: p.image ?? undefined,
    user: userName,
    userId,
  };
}


export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { topic, setTopic } = useTopic();

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

  if (loading) return <p className="text-center mt-10">Carregant publicacions...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (posts.length === 0)
    return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">No hi ha contingut per mostrar.</p>;

  const visible = posts.filter((p) => topic === "Todos" || p.topic === topic);

  return (
    <section className="w-full py-4 fade-in">
      <div className="mb-4 flex items-center justify-between">
        <TopicDropdown topic={topic} setTopic={setTopic} topics={TOPICS} />
      </div>

      <div className="space-y-6">
        {visible.map((post) => (
          <article
            key={post.id}
            className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700
                       rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300"
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
          </article>
        ))}
      </div>
    </section>
  );
}

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
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-slate-600 
                   bg-white dark:bg-slate-700/60 shadow-sm hover:bg-blue-50 dark:hover:bg-slate-600 
                   text-sm transition-all"
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
          className="absolute z-40 mt-2 w-56 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 
                     rounded-xl shadow-xl p-1 backdrop-blur-sm"
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
