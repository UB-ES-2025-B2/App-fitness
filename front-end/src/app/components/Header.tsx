"use client";
import Link from "next/link";
import { useTopic, Topic } from "./TopicContext";
import SearchBox from "./SearchBox";

const TOPICS: Topic[] = ["Todos", "Fútbol", "Básquet", "Montaña"];

export default function Header() {
  const { topic } = useTopic();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <nav className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="text-2xl font-extrabold text-blue-600 tracking-tight hover:text-blue-700 transition-colors"
        >
          UB<span className="text-gray-800"> Fitness</span>
        </Link>

        {/* Buscador */}
        <div className="hidden sm:block flex-1 max-w-md mx-2">
          <SearchBox />
        </div>

        {/* Icono de perfil */}
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
