"use client";
import Link from "next/link";
import { useTopic, Topic } from "./TopicContext";

const TOPICS: Topic[] = ["Todos", "Fútbol", "Básquet", "Montaña"];

export default function Header() {
  const { topic } = useTopic();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <nav className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
        {/* 🔹 Logo */}
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="text-2xl font-extrabold text-blue-600 tracking-tight hover:text-blue-700 transition-colors"
        >
          UB<span className="text-gray-800"> Fitness</span>
        </Link>

        {/* 🔹 Barra de búsqueda */}
        <form
          role="search"
          className="hidden sm:block flex-1 max-w-md mx-6 fade-in"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Cerca persones, comunitats o posts..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-gray-100 border border-gray-200 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
                         placeholder:text-gray-400 transition-all"
            />
          </div>
        </form>

        {/* 🔹 Icono de perfil */}
        <Link
          href="/perfil"
          aria-label="Ver perfil"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 
                     flex items-center justify-center shadow-sm hover:shadow-md transition 
                     hover:scale-105 active:scale-95 ring-1 ring-blue-300/40"
        >
          <span className="text-blue-700 font-semibold">N</span>
        </Link>
      </nav>
    </header>
  );
}
