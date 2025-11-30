"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "../../lib/api";

type CityInfo = {
  id: number;
  name: string;
};

type CityActivity = {
  id: number;
  name: string;
  description?: string | null;
  distance_km?: number | null;
  difficulty?: string | null;
  completed: boolean;
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

  const [data, setData] = useState<CityProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cityId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
        const res = await authFetch(`${base}/api/cities/${cityId}/progress`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "No se pudo cargar la ciudad");
        }
        const json = (await res.json()) as CityProgressResponse;
        setData(json);
      } catch (e) {
        console.error(e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [cityId]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-10">
        <p>Cargando actividades de la ciudad…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-10">
        <p className="text-red-600 text-sm">
          {error || "No se pudo cargar la ciudad."}
        </p>
      </main>
    );
  }

  const { city, activities, stats } = data;

  return (
    <main className="max-w-4xl mx-auto pt-24 px-4 pb-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Actividades en {city.name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Progreso: {stats.progress_percentage}% ·{" "}
            {stats.distinct_activities_completed}/
            {stats.total_activities_defined} actividades completadas
          </p>
        </div>
      </header>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-600">
          Esta ciudad aún no tiene actividades definidas.
        </p>
      ) : (
        <ul className="space-y-4">
          {activities.map((act) => (
            <li
              key={act.id}
              className="
                group relative p-4 rounded-2xl border shadow-sm 
                bg-white transition-all duration-300
                hover:shadow-lg hover:-translate-y-1
              "
            >
              {/* Cabecera de la actividad (siempre visible) */}
              <div className="flex items-center justify-between">
                <div className="font-semibold text-blue-600 text-sm">
                  {act.name}
                </div>
                <span
                  className={
                    "text-[11px] px-2 py-0.5 rounded-full font-semibold " +
                    (act.completed
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-500 border border-gray-200")
                  }
                >
                  {act.completed ? "Completada" : "Pendiente"}
                </span>
              </div>

              {/* Panel de detalles que se muestra al pasar el ratón (hover),
                  igual idea que el panel de comunidades */}
              <div
                className="
                  mt-1
                  max-h-0 group-hover:max-h-40
                  opacity-0 group-hover:opacity-100
                  overflow-hidden
                  transition-all duration-300
                  text-xs text-gray-600
                "
              >
                {act.description && (
                  <p className="mt-2">{act.description}</p>
                )}

                <div className="mt-2 space-y-1">
                  {act.distance_km != null && (
                    <p>Distancia: {act.distance_km.toFixed(1)} km</p>
                  )}
                  {act.difficulty && <p>Dificultad: {act.difficulty}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
