// src/app/components/Header.tsx
"use client";
import Link from "next/link";
import { useTopic, Topic } from "./TopicContext";

const TOPICS: Topic[] = ["Todos", "Fútbol", "Básquet", "Montaña"];

export default function Header() {
  const { topic, setTopic } = useTopic();
    return (
      <header className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
        <nav className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo o título */}
          <h1 className="text-xl font-semibold text-blue-600">UB Fitness</h1>
          <form role="search" className="flex-1 max-w-md ml-auto" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 21l-3.8-3.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Buscar personas, comunidades o posts…"
              className="w-full pl-10 pr-3 py-2 text-sm rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </form>
  
          {/* Icono usuario -> Link a perfil */}
          <Link
            href="/perfil"
            aria-label="Ver perfil"
            className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
          >
            <span className="text-gray-700 font-semibold">N</span>
          </Link>
        </nav>
      </header>
    );
  }
  