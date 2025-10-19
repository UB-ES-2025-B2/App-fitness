"use client";

import { useState } from "react";
import Image from "next/image";

const weeklyMenu = {
  lunes: { desayuno: "Avena con frutas y nueces", almuerzo: "Ensalada de quinoa con verduras", cena: "Pechuga de pollo a la plancha con verduras asadas", snack: "Yogur griego con miel" },
  martes: { desayuno: "Tostadas integrales con aguacate y huevo", almuerzo: "Sopa de verduras con pollo", cena: "Salmón al horno con espárragos", snack: "Puñado de frutos secos" },
  miercoles: { desayuno: "Batido verde con espinacas, plátano y leche de almendras", almuerzo: "Bowl de arroz integral con garbanzos y vegetales", cena: "Tortilla de claras con espinacas y champiñones", snack: "Manzana con mantequilla de almendras" },
  jueves: { desayuno: "Yogur con granola casera y frutas del bosque", almuerzo: "Ensalada de atún con huevo y verduras", cena: "Wok de verduras con tofu", snack: "Batido de proteínas" },
  viernes: { desayuno: "Pancakes de avena con plátano", almuerzo: "Wrap de pollo con vegetales", cena: "Pescado blanco al papillote con verduras", snack: "Palitos de zanahoria con hummus" },
  sabado: { desayuno: "Huevos revueltos con espinacas y tostadas integrales", almuerzo: "Lentejas con verduras", cena: "Pavo a la plancha con puré de calabaza", snack: "Yogur con frutas" },
  domingo: { desayuno: "Tostadas con queso fresco y tomate", almuerzo: "Pasta integral con salsa de tomate casera y albóndigas de pavo", cena: "Crema de calabacín", snack: "Gelatina sin azúcar con frutas" }
};

export default function NutricionPage() {
  const [selectedDay, setSelectedDay] = useState<keyof typeof weeklyMenu>("lunes");

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Plan Semanal de Nutrición</h1>

        {/* GRID: sidebar izquierda fija + contenido derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar fija (izquierda) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-blue-700 mb-4">Consejos Nutricionales</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Bebe al menos 2 litros de agua al día</li>
                  <li>Incluye proteínas en cada comida principal</li>
                  <li>Consume 5 porciones de frutas y verduras</li>
                  <li>Limita procesados y azúcares</li>
                  <li>Prioriza grasas saludables (aguacate, frutos secos, AOVE)</li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Contenido principal (derecha) */}
          <section className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                Una alimentación equilibrada es fundamental para mantener un estilo de vida saludable.
                Este plan semanal te ofrece opciones nutritivas y deliciosas para cada día.
              </p>
              <div className="flex justify-center">
                <Image
                  src="/images/Fit_food.png"
                  alt="Comida saludable"
                  width={640}
                  height={360}
                  className="rounded-lg h-auto w-full max-w-[640px]"
                  priority
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(weeklyMenu).map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day as keyof typeof weeklyMenu)}
                    className={`px-4 py-2 rounded-full ${
                      selectedDay === day
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </button>
                ))}
              </div>

              <h2 className="text-2xl font-semibold text-blue-700 mb-4 capitalize">{selectedDay}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(weeklyMenu[selectedDay]).map(([meal, food]) => (
                  <div key={meal} className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800 capitalize mb-2">{meal}</h3>
                    <p className="text-gray-700">{food}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
