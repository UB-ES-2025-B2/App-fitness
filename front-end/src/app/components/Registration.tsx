"use client";

import Image from "next/image";
import Link from "next/link";

export default function Registration() {
  return (
    <Link
      href="/registration"
      aria-label="Ir a la pestaña de Registracion"
      className="fixed bottom-60 right-6 z-[55] rounded-full bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <Image
        src="/images/Login.png"
        alt="Ir a Registracion"
        width={64}
        height={64}
        className="rounded-full"
        priority
      />
    </Link>
  );
}
