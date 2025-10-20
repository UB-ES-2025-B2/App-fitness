"use client";

import Image from "next/image";
import Link from "next/link";

export default function LogInButton() {
  return (
    <Link
      href="/login"
      aria-label="Ir a la pestaña de Login"
      className="fixed bottom-44 right-6 z-[55] rounded-full bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <Image
        src="/images/Login.png"
        alt="Ir a Login"
        width={64}
        height={64}
        className="rounded-full"
        priority
      />
    </Link>
  );
}
