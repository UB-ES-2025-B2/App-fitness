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
    <main className="max-w-4xl mx-auto px-4 lg:px-0 pt-24 pb-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        Progreso por ciudad
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        Aquí puedes ver tu progreso en todas las ciudades disponibles.
      </p>

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
