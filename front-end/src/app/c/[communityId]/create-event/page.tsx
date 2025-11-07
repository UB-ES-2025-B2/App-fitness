"use client";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEventPage({ params }: { params: { communityId: string } }) {
  const { communityId } = params;
  const router = useRouter();
  const userId = localStorage.getItem("ubfitness_user_id");
  console.log("userId", userId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // ← NUEVO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Evitar múltiples envíos
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const body = {
        title,
        description,
        community_id: Number(communityId),
        created_by: userId,
        location,
        start_date: startDate,
        end_date: endDate,
        image_url: imageUrl,
      };

      const res = await fetch(`${API_BASE}/api/events/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push(`/c/${communityId}`);
      } else {
        const error = await res.json();
        alert(`❌ Error al crear el evento: ${error.error || "Desconocido"}`);
      }
    } catch (err) {
      console.error("❌ Error al crear el evento:", err);
      alert("Error inesperado al crear el evento");
    } finally {
      setIsSubmitting(false); // ← reactivamos el botón
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg w-full max-w-lg space-y-4 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center mb-4">Crear nuevo evento</h1>

        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
          rows={3}
        />

        <input
          type="text"
          placeholder="Ubicación"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        />

        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <input
          type="text"
          placeholder="URL de imagen (opcional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded text-white font-semibold ${
            isSubmitting
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Creando..." : "Crear evento"}
        </button>
      </form>
    </div>
  );
}
