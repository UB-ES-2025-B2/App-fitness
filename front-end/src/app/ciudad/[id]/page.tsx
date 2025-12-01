"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetch } from "@/app/lib/api";
import CityProgressPanel from "../../components/CityProgressPanel";
import CityActivitiesMap from "../../components/CityActivitiesMap";

type FriendRank = {
  user_id: number;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
  progress_percentage: number;
  distinct_activities_completed: number;
  total_distance_km: number;
  total_completions: number;
};

type CityActivity = {
  id: number;
  name: string;
  description?: string | null;
  distance_km?: number | null;
  difficulty?: string | null;
  completed: boolean;
  lat?: number | null;
  lng?: number | null;
};

type CityInfo = {
  id: number;
  name: string;
};

type CityProgressResponse = {
  city: CityInfo;
  stats: {
    total_activities_defined: number;
    distinct_activities_completed: number;
    total_completions: number;
    total_distance_km: number;
    total_duration_sec: number;
    progress_percentage: number;
  };
  activities: CityActivity[];
};

export default function CityPage() {
  const params = useParams();
  const cityId = Number(params?.id);

  const [friends, setFriends] = useState<FriendRank[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const [activities, setActivities] = useState<CityActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  if (!cityId || Number.isNaN(cityId)) {
    return (
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-10">
        <p className="text-red-500 text-sm">Ciudad no válida.</p>
      </main>
    );
  }

  async function loadFriends() {
    setFriendsLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
      const res = await authFetch(
        `${base}/api/cities/${cityId}/friends-leaderboard`
      );
      if (!res.ok) throw new Error("No se pudo cargar el ranking");
      const json = (await res.json()) as FriendRank[];
      setFriends(json);
    } catch (e) {
      console.error(e);
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  }

  async function loadCityProgress() {
    setActivitiesLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
      const res = await authFetch(`${base}/api/cities/${cityId}/progress`);
      if (!res.ok) throw new Error("No se pudo cargar el progreso");
      const json = (await res.json()) as CityProgressResponse;
      setActivities(json.activities || []);
    } catch (e) {
      console.error(e);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }

  // Cargar ranking + actividades al entrar o cambiar ciudad
  useEffect(() => {
    loadFriends();
    loadCityProgress();
  }, [cityId]);

  // Escuchar el evento global para refrescar el ranking (y si quieres también actividades)
  useEffect(() => {
    function handleCityProgressUpdated(e: Event) {
      const detail = (e as CustomEvent<{ cityId: number }>).detail;
      if (!detail) return;
      if (detail.cityId !== cityId) return;

      // Volvemos a cargar ranking y actividades
      loadFriends();
      loadCityProgress();
    }

    window.addEventListener(
      "city-progress-updated",
      handleCityProgressUpdated as EventListener
    );

    return () => {
      window.removeEventListener(
        "city-progress-updated",
        handleCityProgressUpdated as EventListener
      );
    };
  }, [cityId]);

  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-0 pt-24 pb-10">
      {/* HEADER BONITO */}
      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl 
                        bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg"
          >
            <span className="text-xl">🗺️</span>
          </div>
          <div>
            <h1
              className="text-3xl md:text-4xl font-extrabold tracking-tight
                         bg-gradient-to-r from-white via-blue-100 to-sky-200
                         bg-clip-text text-transparent"
            >
              Progreso por ciudad
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1">
              Revisa tu avance en las actividades de esta ciudad.
            </p>
          </div>
        </div>

        <div
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-700/70 
                      bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 shadow-sm"
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 mr-1" />
          <span>Panel interactivo</span>
          <span className="h-3 w-px bg-slate-700 mx-1" />
          <span>Filtra por dificultad, tipo y estado de las actividades.</span>
        </div>
      </header>

      {/* RANKING ENTRE AMIGOS */}
      <section className="mb-6">
        <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏅</span>
              <h2 className="text-sm font-semibold text-slate-100">
                Ranking con tus amigos
              </h2>
            </div>
            {friendsLoading && (
              <span className="text-[11px] text-slate-400">Cargando…</span>
            )}
          </div>

          {!friendsLoading && friends.length === 0 && (
            <p className="text-xs text-slate-400">
              Todavía no tienes amigos mutuos con progreso en esta ciudad.
            </p>
          )}

          {!friendsLoading && friends.length > 0 && (
            <ul className="space-y-2">
              {friends.map((f, idx) => (
                <li
                  key={f.user_id}
                  className="flex items-center justify-between rounded-xl bg-slate-800/70 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-300 w-5 text-center">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-100">
                        {f.name || f.username}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {f.distinct_activities_completed} actividades ·{" "}
                        {f.total_distance_km.toFixed(1)} km
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-300">
                    {f.progress_percentage}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* MAPA DE ACTIVIDADES */}
      <section className="mb-6">
        {activitiesLoading ? (
          <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 text-xs text-slate-300">
            Cargando mapa de actividades…
          </div>
        ) : (
          <CityActivitiesMap activities={activities} />
        )}
      </section>

      {/* Panel degradado que ya muestra “Progreso en X” */}
      <CityProgressPanel cityId={cityId} compact={false} />
    </main>
  );
}
