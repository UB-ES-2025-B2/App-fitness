"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../lib/api";
import { PostComposer } from "./AddPostButton";

type CityInfo = {
  id: number;
  name: string;
  country?: string | null;
  slug?: string | null;
};

type CityActivity = {
  id: number;
  name: string;
  description?: string | null;
  type?: string | null;
  distance_km?: number | null;
  difficulty?: string | null;
  completed: boolean;
};

type CityProgressStats = {
  total_activities_defined: number;
  distinct_activities_completed: number;
  total_completions: number;
  total_distance_km: number;
  total_duration_sec: number;
  progress_percentage: number;
};

type CityProgressResponse = {
  city: CityInfo;
  stats: CityProgressStats;
  activities: CityActivity[];
};

type Props = {
  cityId: number;
  compact?: boolean; // para variar la densidad en home/perfil/página propia
};

export default function CityProgressPanel({ cityId, compact }: Props) {
  const [data, setData] = useState<CityProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para completar actividad + recarga
  const [activityToComplete, setActivityToComplete] =
    useState<CityActivity | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/api/cities/${cityId}/progress`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "No se pudo cargar el progreso");
        }
        const json = (await res.json()) as CityProgressResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cityId, reloadTick]); // recargamos al cambiar reloadTick

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = data?.stats.progress_percentage ?? 0;
  const dashOffset = circumference - (progress / 100) * circumference;

  const title = data ? `Progreso en ${data.city.name}` : "Progreso";

  function onMarkAsDone(activity: CityActivity) {
    setActivityToComplete(activity);
    setShowComposer(true);
  }

  return (
    <section
      className={
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-lg " +
        (compact ? "p-4" : "p-5 md:p-6")
      }
    >
      {/* Halo decorativo */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />

      <header className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
            Mapa de progreso
          </h2>
          <p className="text-lg md:text-xl font-bold">{title}</p>
        </div>
        {/* donut de progreso */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-16 h-16 md:w-20 md:h-20 -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              className="text-white/15"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
            />
            <circle
              className="transition-[stroke-dashoffset] duration-700 ease-out"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className="absolute text-xs md:text-sm font-semibold">
            {progress}%
          </span>
        </div>
      </header>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-3 w-1/2 bg-white/30 rounded-full" />
          <div className="h-2 w-2/3 bg-white/20 rounded-full" />
          <div className="h-2 w-3/4 bg-white/10 rounded-full" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm bg-red-500/40 border border-red-200/60 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {!loading && data && (
        <>
          {/* Stats principales */}
          <div
            className={
              "mt-2 grid gap-2 " +
              (compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4")
            }
          >
            <StatPill
              label="Actividades"
              value={`${data.stats.distinct_activities_completed}/${data.stats.total_activities_defined}`}
            />
            <StatPill
              label="Km totales"
              value={data.stats.total_distance_km.toFixed(1)}
            />
            {!compact && (
              <>
                <StatPill
                  label="Completaciones"
                  value={data.stats.total_completions}
                />
                <StatPill
                  label="Tiempo"
                  value={formatSeconds(data.stats.total_duration_sec)}
                />
              </>
            )}
          </div>

          {/* Lista de actividades */}
          <div
            className={
              "mt-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 " +
              (compact ? "p-3" : "p-4")
            }
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white/80">
                Actividades de la ciudad
              </p>
              <p className="text-[11px] text-white/70">
                {data.stats.distinct_activities_completed} completadas
              </p>
            </div>

            {data.activities.length === 0 ? (
              <p className="text-xs text-white/70">
                Todavía no hay actividades definidas en esta ciudad.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {data.activities.map((act) => (
                  <li
                    key={act.id}
                    className={
                      "group rounded-xl px-3 py-1.5 text-xs transition-all " +
                      (act.completed
                        ? "bg-emerald-400/25 border border-emerald-300/50 hover:shadow-md"
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-[1px] hover:shadow-md")
                    }
                  >
                    {/* Cabecera siempre visible */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {act.name}
                        </span>
                        <span className="text-[11px] text-white/80 truncate">
                          {act.distance_km
                            ? `${act.distance_km.toFixed(1)} km`
                            : "Distancia variable"}
                          {act.difficulty ? ` • ${act.difficulty}` : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className={
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide " +
                            (act.completed
                              ? "bg-emerald-500 text-white"
                              : "bg-white/15 text-white/90")
                          }
                        >
                          {act.completed ? "Completada" : "Pendiente"}
                        </span>

                        {!act.completed && (
                          <button
                            type="button"
                            onClick={() => onMarkAsDone(act)}
                            className="ml-1 text-lg hover:scale-110 transition-transform"
                            title="Marcar actividad como hecha (sube una foto)"
                          >
                            📸
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Detalles desplegables */}
                    <div
                      className="
                        mt-1
                        max-h-0 group-hover:max-h-32
                        opacity-0 group-hover:opacity-100
                        overflow-hidden
                        transition-all duration-300
                        text-[11px] text-white/90
                      "
                    >
                      {act.description && (
                        <p className="mt-1 leading-snug">
                          {act.description}
                        </p>
                      )}

                      <div className="mt-1 space-y-0.5">
                        {act.type && (
                          <p>
                            <span className="font-semibold">Tipo:</span>{" "}
                            {act.type}
                          </p>
                        )}
                        {act.distance_km != null && (
                          <p>
                            <span className="font-semibold">Distancia:</span>{" "}
                            {act.distance_km.toFixed(1)} km
                          </p>
                        )}
                        {act.difficulty && (
                          <p>
                            <span className="font-semibold">Dificultad:</span>{" "}
                            {act.difficulty}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Composer para marcar actividad como hecha */}
      {showComposer && activityToComplete && (
        <PostComposer
          defaultTopic="Montaña" // o lo que quieras por defecto
          forcedImage={true}
          defaultText={`¡Acabo de completar la actividad ${activityToComplete.name}!`}
          onClose={() => {
            setShowComposer(false);
            setActivityToComplete(null);
          }}
          onPostCreated={async () => {
            // marcar la actividad como completada en backend
            const res = await authFetch(
              `/api/activities/${activityToComplete.id}/complete`,
              {
                method: "POST",
              }
            );

            if (!res.ok) {
              const txt = await res.text();
              console.error(
                "Error marcando la actividad como completada:",
                txt
              );
              alert(
                "Se creó el post pero no se pudo marcar la actividad como completada."
              );
              return;
            }

            // refrescar datos del panel
            setReloadTick((x) => x + 1);

            // cerrar composer
            setShowComposer(false);
            setActivityToComplete(null);
          }}
        />
      )}
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 text-xs shadow-sm">
      <div className="text-[11px] text-white/70">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min`;
  return `${total}s`;
}
