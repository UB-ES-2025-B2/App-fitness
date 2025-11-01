"use client";

import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";
import Image from "next/image";

// Tipos
type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  comments: number;
  date: string;
};

type Community = {
  id: string;
  name: string;
  topic: string;
  members: number;
  description: string;
  coverImage?: string;
  themeColor?: string;
  posts: Post[];
};
type Props = {
  params: Promise<{ communityId: string }>;
};

export default function CommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = React.use(params);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/communities/${communityId}`);
        if (!res.ok) throw new Error("Error al obtener la comunidad");

        const data = await res.json();
        setCommunity(data);
      } catch (error) {
        console.error("❌ Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Cargando comunidad...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>No se encontró la comunidad.</p>
      </div>
    );
  }

  // Si el backend no envía themeColor, ponemos un color por defecto
  const themeColor = community.themeColor || "#1a237e";

  const headerStyle = {
    backgroundColor: themeColor,
  };

  const buttonStyle = {
    backgroundColor: themeColor,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Encabezado */}
      <div className="relative h-48 md:h-64" style={headerStyle}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
        <div className="container mx-auto px-4 h-full flex items-end pb-6 relative z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{community.name}</h1>
            <p className="text-gray-200 mt-2">
              {community.topic} · {community.members.toLocaleString()} miembros
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-3">Sobre la comunidad</h2>
              <p className="text-gray-300">{community.description}</p>

              <button
                className="mt-4 w-full py-2 px-4 rounded-md text-white font-medium"
                style={buttonStyle}
              >
                Unirse a la comunidad
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Reglas</h2>
              <ul className="space-y-2 text-gray-300">
                <li>1. Respeta a todos los miembros</li>
                <li>2. No spam ni publicidad no autorizada</li>
                <li>3. Contenido relevante al tema de la comunidad</li>
                <li>4. No compartir información personal</li>
              </ul>
            </div>
          </div>

          {/* Posts */}
          <div className="lg:col-span-2">
            {community.posts && community.posts.length > 0 ? (
              <div className="space-y-4">
                {community.posts.map((post) => (
                  <div key={post.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium">{post.title}</h3>
                        <p className="text-sm text-gray-400">
                          Publicado por {post.author} ·{" "}
                          {new Date(post.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <button className="flex items-center space-x-1 hover:text-white">
                        <span>👍</span>
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-white">
                        <span>💬</span>
                        <span>{post.comments} comentarios</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-white">
                        <span>↗️</span>
                        <span>Compartir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4 text-gray-400">
                Aún no hay publicaciones.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
