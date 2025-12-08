"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTopic, Topic } from "./TopicContext";
import SearchBox from "./SearchBox";
import { usePathname } from "next/navigation";

type UserHeader = {
  id?: number;
  email?: string;
  name?: string;
  avatar_url?: string;
  avatarUrl?: string;
};

export default function Header() {
  const { topic } = useTopic();
  const pathname = usePathname();

  // Rutas donde NO queremos mostrar el header
  const hiddenOn = ["/login", "/registration", "/verify-email-start", "/verify-email"];
  if (hiddenOn.includes(pathname)) return null;

  const [user, setUser] = useState<UserHeader | null>(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("ubfitness_user");
        if (stored) {
          const parsedUser = JSON.parse(stored);
          console.log("Header cargó usuario:", parsedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error leyendo usuario:", error);
      }
    };

    loadUser();
    window.addEventListener("user-updated", loadUser);

    return () => {
      window.removeEventListener("user-updated", loadUser);
    };
  }, []);

  const avatar = user?.avatar_url || user?.avatarUrl;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-3">

        <Link
          href="/"
          aria-label="Ir al inicio"
          className="text-2xl font-extrabold text-blue-600 tracking-tight hover:text-blue-700 transition-colors"
        >
          UB<span className="text-gray-800"> Fitness</span>
        </Link>

        <div className="hidden sm:block flex-1 max-w-md mx-2">
          <SearchBox />
        </div>

        <Link
          href="/perfil"
          aria-label="Ver perfil"
          className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 
                     flex items-center justify-center shadow-sm hover:shadow-md transition 
                     hover:scale-105 active:scale-95 ring-1 ring-blue-300/40 overflow-hidden"
        >
          {avatar ? (
            <Image src={avatar} alt="Avatar" fill sizes="40px" className="object-cover" />
          ) : (
            <span className="text-blue-700 font-semibold">{initial}</span>
          )}
        </Link>

      </nav>
    </header>
  );
}
