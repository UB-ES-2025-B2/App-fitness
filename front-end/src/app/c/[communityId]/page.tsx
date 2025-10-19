"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Define community type
type Community = {
  id: string;
  name: string;
  topic: "Fútbol" | "Básquet" | "Montaña";
  members: number;
  description: string;
  coverImage: string;
  themeColor: string;
  posts: Post[];
};

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  comments: number;
  date: string;
};

// Community data with dark themes
const COMMUNITIES_DATA: Record<string, Community> = {
  "fcb-futbol": {
    id: "fcb-futbol",
    name: "Fútbol Barcelona",
    topic: "Fútbol",
    members: 1240,
    description: "Comunidad para aficionados del fútbol en Barcelona. Compartimos eventos, partidos amistosos y consejos de entrenamiento.",
    coverImage: "/images/football-cover.jpg",
    themeColor: "#1a237e", // Dark blue
    posts: [
      {
        id: "post1",
        title: "Partido amistoso este sábado",
        content: "Organizamos un partido amistoso en el campo municipal. ¡Todos están invitados!",
        author: "Carlos Martínez",
        likes: 24,
        comments: 8,
        date: "2023-11-15"
      },
      {
        id: "post2",
        title: "Técnicas de entrenamiento para mejorar la resistencia",
        content: "Compartimos algunas técnicas efectivas para mejorar la resistencia en el campo.",
        author: "Laura Gómez",
        likes: 32,
        comments: 5,
        date: "2023-11-12"
      }
    ]
  },
  "street-hoops": {
    id: "street-hoops",
    name: "Street Hoops BCN",
    topic: "Básquet",
    members: 860,
    description: "Comunidad de baloncesto callejero en Barcelona. Organizamos torneos, compartimos técnicas y nos reunimos para jugar.",
    coverImage: "/images/basketball-cover.jpg",
    themeColor: "#4a148c", // Dark purple
    posts: [
      {
        id: "post1",
        title: "Torneo 3x3 en Plaza Catalunya",
        content: "Este domingo organizamos un torneo 3x3. Inscripciones abiertas hasta el viernes.",
        author: "Miguel Torres",
        likes: 45,
        comments: 12,
        date: "2023-11-14"
      },
      {
        id: "post2",
        title: "Mejora tu tiro de tres puntos",
        content: "Consejos prácticos para mejorar la precisión en los tiros de larga distancia.",
        author: "Ana Ruiz",
        likes: 28,
        comments: 7,
        date: "2023-11-10"
      }
    ]
  },
  "pirineos": {
    id: "pirineos",
    name: "Pirineos Trail",
    topic: "Montaña",
    members: 540,
    description: "Grupo de entusiastas del senderismo y trail running en los Pirineos. Compartimos rutas, consejos de equipamiento y organizamos salidas grupales.",
    coverImage: "/images/mountain-cover.jpg",
    themeColor: "#1b5e20", // Dark green
    posts: [
      {
        id: "post1",
        title: "Ruta por el Valle de Núria",
        content: "Este fin de semana haremos una ruta por el Valle de Núria. Nivel medio-alto, 15km.",
        author: "Marta Sánchez",
        likes: 36,
        comments: 14,
        date: "2023-11-16"
      },
      {
        id: "post2",
        title: "Equipamiento esencial para rutas de invierno",
        content: "Lista de equipamiento imprescindible para hacer rutas seguras durante el invierno.",
        author: "Javier López",
        likes: 42,
        comments: 9,
        date: "2023-11-11"
      }
    ]
  }
};

export default function CommunityPage({ params }: { params: { communityId: string } }) {
  const [community, setCommunity] = useState<Community | null>(null);
  
  useEffect(() => {
    // In a real app, you would fetch this data from an API
    const communityData = COMMUNITIES_DATA[params.communityId];
    if (communityData) {
      setCommunity(communityData);
    }
  }, [params.communityId]);

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Cargando comunidad...</p>
      </div>
    );
  }

  // Generate dynamic styles based on the community theme color
  const headerStyle = {
    backgroundColor: community.themeColor,
  };

  const buttonStyle = {
    backgroundColor: community.themeColor,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Community Header */}
      <div className="relative h-48 md:h-64" style={headerStyle}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
        <div className="container mx-auto px-4 h-full flex items-end pb-6 relative z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{community.name}</h1>
            <p className="text-gray-200 mt-2">{community.topic} · {community.members.toLocaleString()} miembros</p>
          </div>
        </div>
      </div>

      {/* Community Content */}
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
          
          {/* Main Content - Posts */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-3">Crear publicación</h2>
              <textarea 
                className="w-full bg-gray-700 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ outlineColor: community.themeColor }}
                placeholder="¿Qué quieres compartir con la comunidad?"
                rows={3}
              ></textarea>
              <div className="mt-3 flex justify-end">
                <button 
                  className="py-2 px-4 rounded-md text-white font-medium"
                  style={buttonStyle}
                >
                  Publicar
                </button>
              </div>
            </div>
            
            {/* Posts */}
            <div className="space-y-4">
              {community.posts.map(post => (
                <div key={post.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-medium">{post.title}</h3>
                      <p className="text-sm text-gray-400">Publicado por {post.author} · {new Date(post.date).toLocaleDateString()}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}