"use client";

import { useTopic } from "./TopicContext";
import Link from "next/link";

type Community = {
  id: string;
  name: string;
  topic: "Fútbol" | "Básquet" | "Montaña";
  members: number;
};

const COMMUNITIES: Community[] = [
  { id: "fcb-futbol", name: "Fútbol Barcelona", topic: "Fútbol", members: 1240 },
  { id: "street-hoops", name: "Street Hoops BCN", topic: "Básquet", members: 860 },
  { id: "pirineos", name: "Pirineos Trail", topic: "Montaña", members: 540 },
];

export default function FollowedCommunities() {
  const { setTopic } = useTopic();

  return (
    <aside className="hidden lg:block">
      <div className="lg:sticky lg:top-24">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Mis comunidades
          </h3>

          <ul className="space-y-2">
            {COMMUNITIES.map((c) => (
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
