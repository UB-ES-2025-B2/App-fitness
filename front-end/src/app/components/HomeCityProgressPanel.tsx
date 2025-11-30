"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "../lib/api";
import CityProgressPanel from "./CityProgressPanel";

type MyCity = {
  id: number;
  name: string;
  progress_percentage: number;
};

export default function HomeCityProgressPanel() {
  const [cities, setCities] = useState<MyCity[]>([]);
  const [topCity, setTopCity] = useState<MyCity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
        const res = await authFetch(`${base}/api/cities/my`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "No se pudieron cargar tus ciudades");
        }
        const data = (await res.json()) as MyCity[];
        setCities(data);
        if (data.length > 0) {
          const sorted = [...data].sort(
            (a, b) => b.progress_percentage - a.progress_percentage
          );
          setTopCity(sorted[0]);
        } else {
          setTopCity(null);
        }
      } catch (e) {
        console.error(e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white shadow-md p-4 text-sm text-gray-500">
        Cargando tu progreso…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white shadow-md p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!topCity) {
    return (
      <div className="rounded-2xl bg-white shadow-md p-4 text-sm text-gray-600">
        Aún no tienes actividades registradas en ninguna ciudad.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Panel de progreso de la ciudad con más progreso */}
      <CityProgressPanel cityId={topCity.id} compact />

      {/* Botón para ver todas las ciudades */}
      <div className="flex justify-end">
        <Link
          href="/progreso"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Ver todas las ciudades →
        </Link>
      </div>
    </div>
  );
}
