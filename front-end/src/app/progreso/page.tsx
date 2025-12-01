"use client";

import { useEffect, useState } from "react";
import CityProgressPanel from "../components/CityProgressPanel";
import { authFetch } from "../lib/api";

type City = {
  id: number;
  name: string;
  country?: string | null;
  slug?: string | null;
};

export default function ProgresoPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCities() {
      try {
        setLoading(true);
        const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

        // usamos /api/cities/ (todas las ciudades)
        const res = await authFetch(`${base}/api/cities/`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "No se pudieron cargar las ciudades.");
        }

        const data = (await res.json()) as City[];
        setCities(data);
      } catch (e) {
        console.error(e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadCities();
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-0 pt-24 pb-10">
      <header className="mb-8 flex flex-col gap-2">
        {/* Línea superior con icono + título grande */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl 
                          bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
            <span className="text-xl">🗺️</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight
                          bg-gradient-to-r from-white via-blue-100 to-sky-200
                          bg-clip-text text-transparent">
              Progreso por ciudad
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1">
              Sigue tus rutas y actividades completadas en cada ciudad. Cuando completes una actividad pulsa en la cámara y muestra tu energía al mundo!
            </p>
          </div>
        </div>

        {/* Línea inferior: mini resumen / badge */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-700/70 
                        bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 shadow-sm">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 mr-1" />
          <span>Panel interactivo</span>
          <span className="h-3 w-px bg-slate-700 mx-1" />
          <span>Filtra por dificultad, tipo y estado de las actividades.</span>
        </div>
      </header>

      {loading && <p>Cargando ciudades…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-6">
        {!loading && cities.length === 0 && (
          <p className="text-sm text-gray-600">
            No hay ciudades definidas en el sistema.
          </p>
        )}

        {cities.map((city) => (
          <CityProgressPanel key={city.id} cityId={city.id} compact={false} />
        ))}
      </div>
    </main>
  );
}
