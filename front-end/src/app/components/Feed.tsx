// src/components/Feed.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Topic, useTopic } from "./TopicContext";

type Post = {
  id: number;
  user: string;
  topic: string;
  text: string;
  image?: string;
};

const TOPICS: Topic[] = ["Todos", "Fútbol", "Básquet", "Montaña"];

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true); // <- controla si hay más contenido
  const { topic, setTopic } = useTopic();

  useEffect(() => {
    // Simulamos carga de publicaciones (mock)
    const timer = setTimeout(() => {
      setPosts([
        {
          id: 1,
          user: "LauraFit",
          topic: "Montaña",
          text: "Ruta increíble hoy 🌄",
          image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        },
        {
          id: 2,
          user: "MaxRunner",
          topic: "Fútbol",
          text: "Entrenamiento de velocidad 💨",
          image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1",
        },
      ]);
      setLoading(false);
      setHasMore(false); // <- en este mock no hay más páginas
    }, 1500);

    // Suscripción a nuevos posts
    const onNewPost = (e: Event) => {
      const detail = (e as CustomEvent<any>).detail;
      setPosts((prev) => [detail, ...prev]);
      // Si más adelante se implementa paginación, aquí no se toca hasMore.
    };
    window.addEventListener("new-post", onNewPost as EventListener);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("new-post", onNewPost as EventListener);
    };
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando publicaciones...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (posts.length === 0)
    return <p className="text-center mt-10 text-gray-600">No hay contenido que mostrar.</p>;

  return (
    <section className="w-full py-0">

      {/* Barra superior con desplegable */}
      <div className="mb-4 flex items-center justify-between">
        <TopicDropdown
          topic={topic}
          setTopic={setTopic}
          topics={TOPICS}
        />
      </div>

      {posts.map((post) => (
        <article key={post.id} className="bg-white shadow-md rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-blue-600">{post.user}</h2>
            <span className="text-sm text-gray-500">{post.topic}</span>
          </div>
          <p className="mt-2 text-gray-700">{post.text}</p>
          {post.image && (
            <img
              src={post.image}
              alt={post.topic}
              className="mt-3 rounded-xl w-full object-cover h-56"
            />
          )}
        </article>
      ))}

      {/* Mensaje de fin del feed */}
      {!hasMore && (
        <div className="mt-6 mb-2 text-center text-sm text-gray-500" role="status" aria-live="polite">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block h-[1px] w-10 bg-gray-200" />
            <span>No hay más publicaciones</span>
            <span className="inline-block h-[1px] w-10 bg-gray-200" />
          </div>
        </div>
      )}
    </section>
  );

  /** Desplegable accesible de selección de temática */
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

  // Cerrar al hacer click fuera
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
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-white shadow-sm hover:bg-gray-50"
      >
        <span className="text-sm">Temática:</span>
        <span className="text-sm font-medium text-blue-700">{topic}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Seleccionar temática"
          className="absolute z-40 mt-2 w-56 bg-white border rounded-xl shadow-lg p-1"
        >
          {topics.map((t) => {
            const active = t === topic;
            return (
              <li key={t}>
                <button
                  role="option"
                  aria-selected={active}
                  onClick={() => onSelect(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-50 ${
                    active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
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

}

