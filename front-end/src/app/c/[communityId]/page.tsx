"use client";

import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
// Tipos
type Event = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  imageUrl?: string;
  participants: number[];
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


export default function CommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = React.use(params);
  const userId = localStorage.getItem("ubfitness_user_id");
  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [joinedStatus, setJoinedStatus] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);


const formatDate = (iso: string) => {
  if (!iso) return "Fecha inválida";

  // Forzar formato ISO completo con zona UTC
  const fixedIso = iso.endsWith("Z") ? iso : `${iso}Z`;
  const d = new Date(fixedIso);

  if (isNaN(d.getTime())) return "Fecha inválida";

  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};



  useEffect(() => {
    const fetchData = async () => {
      try {
      const res = await fetch(`${API_BASE}/api/communities/${communityId}/full/${userId}`);
      if (!res.ok) throw new Error("Error al obtener los datos completos de la comunidad");

      type FullCommunityResponse = {
        community: Community;
        events: (Event & { is_joined: boolean })[];
        is_admin: boolean;
        is_member: boolean;
      };

      const data: FullCommunityResponse = await res.json();

      setCommunity(data.community);
      setEvents(data.events);
      setIsAdmin(data.is_admin);
      setIsMember(data.is_member);

      const statusMap: Record<number, boolean> = {};
      data.events.forEach((ev) => {
        statusMap[ev.id] = ev.is_joined;
      });
      setJoinedStatus(statusMap);

    } catch (err) {
      console.error("❌ Error cargando comunidad:", err);
    } finally {
      setLoading(false);
    }
    };

    fetchData();
  }, [communityId]);

  // Funció per apuntar-se o desapuntar-se
  const toggleJoinEvent = async (eventId: number) => {
    setJoining(eventId);
    const isJoined = joinedStatus[eventId];
    const endpoint = isJoined ? "leave" : "join";

    try {
      await fetch(`${API_BASE}/api/events/${eventId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      // Tornar a comprovar si està apuntat
      const res = await fetch(`${API_BASE}/api/events/${eventId}/is_joined/${userId}`);
      const json = await res.json();

      setJoinedStatus((prev) => ({
        ...prev,
        [eventId]: json.is_joined,
      }));
    } catch (error) {
      console.error("❌ Error actualitzant participació:", error);
    } finally {
      setJoining(null);
    }
  };
  const toggleCommunityMembership = async () => {
    const endpoint = isMember ? "leave" : "join";

    try {
      const res = await fetch(`${API_BASE}/api/communities/${communityId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!res.ok) throw new Error("Error al actualizar la membresía");

      setIsMember((prev) => !prev);
    } catch (err) {
      console.error("❌ Error al cambiar membresía:", err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Cargando comunidad...</p>
      </div>
    );

  if (!community)
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>No se encontró la comunidad.</p>
      </div>
    );

  const themeColor = community.themeColor || "#1a237e";
  const headerStyle = { backgroundColor: themeColor };
  const buttonStyle = { backgroundColor: themeColor };
  
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
                onClick={toggleCommunityMembership}
                className="mt-4 w-full py-2 px-4 rounded-md text-white font-medium"
                style={buttonStyle}
              >
                {isMember ? "Salir de la comunidad" : "Unirse a la comunidad"}
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Eventos de la comunidad</h2>

              {isAdmin && (
                <Link
                  href={`/c/${communityId}/create-event`}
                  className="px-4 py-2 rounded-md text-white font-medium"
                  style={buttonStyle}
                >
                  ➕ Crear evento
                </Link>
              )}
            </div>
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

          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Eventos */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-2xl font-bold mb-4">Eventos de la comunidad</h2>
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col md:flex-row md:items-center gap-4"
                    >
                      {event.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.imageUrl} alt={event.title} className="w-full md:w-48 h-32 object-cover rounded-lg"/>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <p className="text-gray-400 text-sm">
                          📍 {event.location || "Ubicación por definir"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          🗓️ {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </p>
                        <p className="text-gray-300 mt-2">{event.description}</p>

                        {isMember ? (
                          <button
                            onClick={() => toggleJoinEvent(event.id)}
                            disabled={joining === event.id}
                            className="mt-3 px-4 py-2 rounded-md text-white font-medium"
                            style={buttonStyle}
                          >
                            {joining === event.id
                              ? "Actualizando..."
                              : joinedStatus[event.id]
                              ? "Desapuntarse del evento"
                              : "Apuntarse al evento"}
                          </button>
                        ) : (
                          <p className="mt-3 text-yellow-400 font-medium">
                            ⚠️ Para apuntarte a los eventos primero debes ser miembro de la comunidad.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Aún no hay eventos programados.</p>
              )}
            </div>

            {/* Posts */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-2xl font-bold mb-4">Publicaciones</h2>
              {community.posts && community.posts.length > 0 ? (
                <div className="space-y-4">
                  {community.posts.map((post) => (
                    <div key={post.id} className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium">{post.title}</h3>
                      <p className="text-sm text-gray-400">
                        Publicado por {post.author} ·{" "}
                        {new Date(post.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-300 mt-2">{post.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Aún no hay publicaciones.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
