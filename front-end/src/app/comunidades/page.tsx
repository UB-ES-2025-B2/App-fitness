"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

// Datos de ejemplo
const COMMUNITIES = [
  {
    id: "fcb-futbol",
    name: "Fútbol Barcelona",
    topic: "Fútbol",
    members: 1240,
    description:
      "Comunidad para aficionados del fútbol en Barcelona. Eventos, partidos y consejos de entrenamiento.",
    coverImage: "/images/msn.jpeg",
  },
  {
    id: "street-hoops",
    name: "Street Hoops BCN",
    topic: "Básquet",
    members: 860,
    description:
      "Comunidad de baloncesto callejero en Barcelona. Torneos, técnicas y juegos en grupo.",
    coverImage: "/images/Basket.jpeg",
  },
  {
    id: "pirineos",
    name: "Pirineos Trail",
    topic: "Montaña",
    members: 540,
    description:
      "Grupo de senderismo y trail en los Pirineos. Rutas, equipamiento y salidas semanales.",
    coverImage: "/images/mountain.jpg",
  },
];

export default function CommunitiesPage() {
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
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {COMMUNITIES.map((c) => (
            <motion.div
              key={c.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Link
                href={`/c/${c.id}`}
                className="group block bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-200 hover:border-blue-400"
              >
                {/* Imagen de portada */}
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={c.coverImage}
                    alt={c.name}
                    fill
                    className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <h2 className="absolute bottom-3 left-4 text-lg font-semibold text-white drop-shadow-lg">
                    {c.name}
                  </h2>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {c.topic} · {c.members.toLocaleString()} miembros
                  </p>
                  <p className="text-gray-700 text-sm line-clamp-2 leading-snug">
                    {c.description}
                  </p>

                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                      Ver comunidad →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
