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
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
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
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Mis comunidades
          </h3>

          <ul className="space-y-2">
            {communities.map((c) => (
              <li key={c.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/c/${c.id}`}
                      className="block text-sm font-medium text-blue-600 truncate hover:underline"
                      title={c.name}
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {c.topic} · {c.members.toLocaleString()} miembros
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <Link
              href="/comunidades"
              className="text-xs text-gray-600 hover:text-blue-700"
            >
              Ver todas →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
