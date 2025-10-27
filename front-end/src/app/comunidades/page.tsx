"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

type Community = {
  id: string;
  name: string;
  topic: string;
  members: number;
  description: string;
  imageUrl?: string;
};

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      const baseUrl = "http://127.0.0.1:5000";
      try {
        const res = await fetch(`${baseUrl}/api/communities/`);
        if (!res.ok) throw new Error("Error al cargar las comunidades");
        const data: Community[] = await res.json();
        setCommunities(data);
      } catch (err) {
        console.error(err);
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  if (loading) return <p className="text-center mt-20">Cargando comunidades...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-extrabold text-gray-800 mb-10 text-center"
        >
          🌐 Todas las comunidades
        </motion.h1>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          {communities.map((c) => (
            <motion.div
              key={c.id}
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            >
              <Link href={`/c/${c.id}`} className="group block bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-200 hover:border-blue-400">
                <div className="relative h-44 w-full overflow-hidden">
                  {c.imageUrl && (
                    <Image
                      src={c.imageUrl}
                      alt={c.name}
                      fill
                      unoptimized
                      className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <h2 className="absolute bottom-3 left-4 text-lg font-semibold text-white drop-shadow-lg">
                    {c.name}
                  </h2>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {c.topic} · {c.members.toLocaleString()} miembros
                  </p>
                  <p className="text-gray-700 text-sm line-clamp-2 leading-snug">{c.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
