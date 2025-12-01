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

type DifficultyFilter = "ALL" | "easy" | "medium" | "hard";
type TypeFilter = "ALL" | "Fútbol" | "Básquet" | "Montaña";
type CompletionFilter = "ALL" | "DONE" | "PENDING";

export default function CityProgressPanel({ cityId, compact }: Props) {
  const [data, setData] = useState<CityProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // completar actividad + recarga
  const [activityToComplete, setActivityToComplete] =
    useState<CityActivity | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  // filtros
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("ALL");

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
  }, [cityId, reloadTick]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = data?.stats.progress_percentage ?? 0;
  const dashOffset = circumference - (progress / 100) * circumference;

  const title = data ? `Progreso en ${data.city.name}` : "Progreso";

  function onMarkAsDone(activity: CityActivity) {
    setActivityToComplete(activity);
    setShowComposer(true);
  }

  // aplica filtros sobre actividades
  const filteredActivities =
    data?.activities.filter((act) => {
      // filtro estado
      if (completionFilter === "DONE" && !act.completed) return false;
      if (completionFilter === "PENDING" && act.completed) return false;

      // filtro dificultad
      if (difficultyFilter !== "ALL") {
        const d = (act.difficulty || "").toLowerCase();
        if (d !== difficultyFilter) return false;
      }

      // filtro tipo
      if (typeFilter !== "ALL") {
        const t = (act.type || "").toLowerCase();
        if (t !== typeFilter.toLowerCase()) return false;
      }

      return true;
    }) ?? [];

  const hasFiltersApplied =
    difficultyFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    completionFilter !== "ALL";

  return (
    <section
      className={
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-lg " +
        (compact ? "p-4" : "p-5 md:p-6")
      }
    >
      {/* halos decorativos */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />

      <header className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
            Mapa de progreso
          </h2>
          <p className="text-lg md:text-xl font-bold">{title}</p>
        </div>
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

          {/* FILTROS – solo cuando NO es compacto */}
          {!compact && (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              {/* dificultad */}
              <div className="flex items-center gap-1">
                <span className="text-white/70 mr-1">Dificultad:</span>
                {(["ALL", "easy", "medium", "hard"] as DifficultyFilter[]).map(
                  (d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficultyFilter(d)}
                      className={
                        "px-2 py-1 rounded-full border transition " +
                        (difficultyFilter === d
                          ? "bg-sky-300 text-slate-900 border-sky-100 shadow"
                          : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20")
                      }
                    >
                      {d === "ALL"
                        ? "Todas"
                        : d === "easy"
                        ? "Fácil"
                        : d === "medium"
                        ? "Media"
                        : "Difícil"}
                    </button>
                  )
                )}
              </div>

              {/* tipo */}
              <div className="flex items-center gap-1">
                <span className="text-white/70 mr-1">Tipo:</span>
                {(["ALL", "Fútbol", "Básquet", "Montaña"] as TypeFilter[]).map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={
                        "px-2 py-1 rounded-full border transition " +
                        (typeFilter === t
                          ? "bg-sky-300 text-slate-900 border-sky-100 shadow"
                          : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20")
                      }
                    >
                      {t === "ALL" ? "Todos" : t}
                    </button>
                  )
                )}
              </div>

              {/* estado */}
              <div className="flex items-center gap-1">
                <span className="text-white/70 mr-1">Estado:</span>
                {(
                  ["ALL", "DONE", "PENDING"] as CompletionFilter[]
                ).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCompletionFilter(c)}
                    className={
                      "px-2 py-1 rounded-full border transition " +
                      (completionFilter === c
                        ? "bg-sky-300 text-slate-900 border-sky-100 shadow"
                        : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20")  
                    }
                  >
                    {c === "ALL"
                      ? "Todas"
                      : c === "DONE"
                      ? "Completadas"
                      : "Pendientes"}
                  </button>
                ))}
              </div>

              {hasFiltersApplied && (
                <button
                  type="button"
                  onClick={() => {
                    setDifficultyFilter("ALL");
                    setTypeFilter("ALL");
                    setCompletionFilter("ALL");
                  }}
                  className="ml-auto px-2 py-1 rounded-full bg-white/10 border border-white/30 text-white/80 hover:bg-white/20"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

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
            ) : filteredActivities.length === 0 ? (
              <p className="text-xs text-white/80">
                No hay actividades que cumplan los filtros actuales.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {filteredActivities.map((act) => (
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
          defaultTopic="Montaña"
          forcedImage={true}
          defaultText={`¡Acabo de completar la actividad ${activityToComplete.name}!`}
          onClose={() => {
            setShowComposer(false);
            setActivityToComplete(null);
          }}
          onPostCreated={async () => {
            const res = await authFetch(
              `/api/activities/${activityToComplete.id}/complete`,
              { method: "POST" }
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

            setReloadTick((x) => x + 1);
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
