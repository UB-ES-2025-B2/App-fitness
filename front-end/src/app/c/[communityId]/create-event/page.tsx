"use client";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { getCroppedImage } from "../../../components/GetCroppedImage";

export default function CreateEventPage({ params }: { params: { communityId: string } }) {
  const { communityId } = params;
  const router = useRouter();
  const userId = localStorage.getItem("ubfitness_user_id");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [file, setFile] = useState<File | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Evitar múltiples envíos
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let imageUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("image", file);

        const uploadRes = await fetch(`${API_BASE}/api/upload/`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Error en la pujada de la imatge");

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
        console.log("✅ Imatge pujada:", imageUrl);
      }

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

  if (cropMode && preview) {
      return (
        <div className="fixed inset-0 z-[70] bg-black/70 flex flex-col items-center justify-center">
          <div className="relative w-[90vw] h-[70vh] bg-gray-900 rounded-xl overflow-hidden">
            <Cropper
              image={preview}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) =>
                setCroppedAreaPixels(croppedPixels)
              }
            />
          </div>
  
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setCropMode(false)}
              className="bg-gray-300 dark:bg-slate-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-600 transition"
            >
              Cancel┬Àlar
            </button>
            <button
              onClick={async () => {
                if (preview && croppedAreaPixels) {
                  const croppedFile = await getCroppedImage(
                    preview,
                    crop,
                    zoom,
                    1,
                    croppedAreaPixels
                  );
                  setFile(croppedFile);
                  const newPreview = URL.createObjectURL(croppedFile);
                  setPreview(newPreview);
                  setCropMode(false);
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Confirmar retall
            </button>
          </div>
        </div>
      );
    }

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

        <div className="flex flex-col items-center justify-center mb-3">
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-300 dark:border-slate-600 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            📸 Selecciona una imatge
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f) {
                const previewUrl = URL.createObjectURL(f);
                setPreview(previewUrl);
                setCropMode(true);
              }
            }}
            className="hidden"
          />
          {file && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{file.name}</p>}
        </div>

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
