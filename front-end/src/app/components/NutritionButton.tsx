"use client";

import Image from "next/image";
import Link from "next/link";

export default function NutritionButton() {
  return (
    <Link
      href="/nutricion"
      aria-label="Ir a la pestaña de Nutrición"
      className="fixed bottom-24 right-6 z-[55] rounded-full bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <Image
        src="/images/GoToNutrition.png"
        alt="Ir a Nutrición"
        width={64}
        height={64}
        className="rounded-full"
        priority
      />
    </Link>
  );
}
