"use client";

import { useParams } from "next/navigation";
import CityProgressPanel from "../../components/CityProgressPanel";

export default function CityPage() {
  const params = useParams();
  const cityId = Number(params?.id);

  if (!cityId || Number.isNaN(cityId)) {
    return (
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-10">
        <p className="text-red-500 text-sm">Ciudad no válida.</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-0 pt-24 pb-10">
      {/* HEADER BONITO */}
      <header className="mb-8 flex flex-col gap-2">
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
              Revisa tu avance en las actividades de esta ciudad.
            </p>
          </div>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-700/70 
                        bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 shadow-sm">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 mr-1" />
          <span>Panel interactivo</span>
          <span className="h-3 w-px bg-slate-700 mx-1" />
          <span>Filtra por dificultad, tipo y estado de las actividades.</span>
        </div>
      </header>

      {/* Panel degradado que ya muestra “Progreso en Barcelona/Girona…” */}
      <CityProgressPanel cityId={cityId} compact={false} />
    </main>
  );
}
