"use client";

import Link from "next/link";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            App Fitness
          </Link>
          <div className="flex space-x-4">
            <Link href="/comunidades" className="hover:text-gray-300">
              Comunidades
            </Link>
            <Link href="/nutricion" className="hover:text-gray-300">
              Nutrición
            </Link>
            <Link href="/perfil" className="hover:text-gray-300">
              Mi Perfil
            </Link>
            <Link href="/login" className="hover:text-gray-300">
              Login
            </Link>
            <Link href="/registration" className="hover:text-gray-300">
              Registracion
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}