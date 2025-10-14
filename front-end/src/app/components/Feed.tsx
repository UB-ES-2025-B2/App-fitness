// src/components/Feed.tsx
"use client";

import { useEffect, useState } from "react";

type Post = {
  id: number;
  user: string;
  topic: string;
  text: string;
  image?: string;
};

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulamos carga de publicaciones (mock)
    setTimeout(() => {
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
    }, 1500);
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando publicaciones...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (posts.length === 0)
    return <p className="text-center mt-10 text-gray-600">No hay contenido que mostrar.</p>;

  return (
    <section className="max-w-2xl mx-auto py-6">
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
    </section>
  );
}
