"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTopic, Topic } from "./TopicContext";
import Cropper from "react-easy-crop";
import { getCroppedImage } from "../components/GetCroppedImage";
import { Area } from "react-easy-crop";
import { authFetch, getTokens } from "../lib/api";

type NewPostPayload = {
  id: number;
  user: string;
  topic: string;
  text: string;
  image?: string;
};
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function AddPostButton() {
  const [open, setOpen] = useState(false);
  const { topic } = useTopic();

  return (
    <>
      {/* Botó flotant */}
      <button
        aria-label="Afegir publicació"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg bg-white dark:bg-slate-800 p-0 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-105 transition-transform"
      >
        <Image
          src="/images/AddContent.png"
          alt="Afegir"
          width={64}
          height={64}
          className="rounded-full"
          priority
        />
      </button>

      {open && <Composer defaultTopic={topic} onClose={() => setOpen(false)} />}
    </>
  );
}

function Composer({
  defaultTopic,
  onClose,
}: {
  defaultTopic: Topic | string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [topic, setTopic] = useState<string>(defaultTopic || "Todos");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Crop states
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const submit = async () => {
    setUploading(true);
    let imageUrl: string | undefined;

    try {
      const tokens = getTokens(); // debería devolver { access_token, refresh_token } o similar
      const access = tokens?.access_token;
      if (!access) throw new Error("No estás autenticado");

      // Subida
      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        const uploadRes = await fetch(`${API_BASE}/api/upload/`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const txt = await uploadRes.text();
          throw new Error(`Upload failed ${uploadRes.status} → ${txt}`);
        }
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      // Crear el post
      const postRes = await authFetch(`/api/posts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, text, image_url: imageUrl }),
      });
      
      if (!postRes.ok) throw new Error("Error al crear el post");

      const newPost = await postRes.json();

      const normalizedPost = {
        id: newPost.id,
        text: newPost.text,
        topic: newPost.topic,
        image: newPost.image,
        user:
          typeof newPost.user === "string"
            ? newPost.user
            : newPost.user?.name || newPost.user?.username || "Usuari",
      };

      window.dispatchEvent(new CustomEvent("new-post", { detail: normalizedPost }));
      onClose();
    } catch (err) {
      console.error("❌ Error creant el post:", err);
      alert("Hi ha hagut un error en crear el post o pujar la imatge.");
    } finally {
      setUploading(false);
    }
  };

  // Mode retall amb Cropper
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
            Cancel·lar
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

  // Interfície principal (composer)
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 shadow-xl border border-gray-200 dark:border-slate-700 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Crear publicació</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition"
          >
            ✕
          </button>
        </div>

        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Temàtica
        </label>
        <select
          className="w-full border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-blue-400"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {["Todos", "Fútbol", "Básquet", "Montaña"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Text
        </label>
        <textarea
          className="w-full border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 h-24 mb-3 resize-none focus:ring-2 focus:ring-blue-400"
          placeholder="Què has fet avui?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Imatge
        </label>
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
              if (f) setCropMode(true);
            }}
            className="hidden"
          />
          {file && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{file.name}</p>}
        </div>

        {preview && (
          <div className="relative w-full h-56 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
            <img
              src={preview}
              alt="Previsualització"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            Cancel·lar
          </button>
          <button
            onClick={submit}
            disabled={!text.trim() || uploading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition"
          >
            {uploading ? "Pujant..." : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
