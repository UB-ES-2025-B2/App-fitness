import Link from "next/link";

// Tipo de comunidad (igual que antes)
type Community = {
  id: string;
  name: string;
  topic: "Fútbol" | "Básquet" | "Montaña" | string; // por si viene otro
  members: number;
};

// Petición al backend Flask
async function getCommunities(): Promise<Community[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const res = await fetch(`${base}/api/communities/`, {
    // Importante: desactivar la caché del servidor
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("❌ Error al obtener comunidades");
    return [];
  }

  return res.json();
}

export default async function FollowedCommunities() {
  const communities = await getCommunities();

  
  return (
    <aside className="hidden lg:block">
      <div className="lg:sticky lg:top-24">

        {/* PANEL ANIMADO VERTICAL */}
        <div
          className="
            relative group
            rounded-2xl shadow-xl
            backdrop-blur-md bg-white/80 dark:bg-slate-800/60
            border border-gray-200 dark:border-slate-700
            transition-all duration-300
            w-[260px]
            h-[60px] group-hover:h-[350px]
            overflow-hidden
            mx-auto  /* 💥 LO CENTREM RESPECTE LA COLUMNA */
          "
        >

          {/* ICONO MODO COLAPSADO */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:hidden">
            <span className="text-2xl">👥</span>
          </div>

          {/* CONTINGUT COMPLET */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">

            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Mis comunidades
            </h3>

            <ul className="space-y-2">
              {communities.map((c) => (
                <li key={c.id}>
                  <div>
                    <Link
                      href={`/c/${c.id}`}
                      className="block text-sm font-medium text-blue-600 truncate hover:underline"
                      title={c.name}
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {c.topic} · {c.members.toLocaleString()} miembros
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3">
              <Link
                href="/comunidades"
                className="text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Ver todas →
              </Link>
            </div>

          </div>

        </div>
      </div>
    </aside>
  );
}