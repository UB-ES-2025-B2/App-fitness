"use client";

import { useParams } from "next/navigation";
import CityProgressPanel from "../../components/CityProgressPanel";

export default function CityPage() {
  const params = useParams();
  const cityId = Number(params?.id);

  if (!cityId || Number.isNaN(cityId)) {
    return (
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-10">
        <p className="text-red-500 text-sm">
          Ciudad no válida.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto pt-24 px-4 pb-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Progreso por ciudad
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Aquí puedes ver tu progreso en las actividades de esta ciudad.
        </p>
      </header>

      {/* Mismo panel degradado que en "Todas las ciudades" */}
      <CityProgressPanel cityId={cityId} compact={false} />
    </main>
  );
}
