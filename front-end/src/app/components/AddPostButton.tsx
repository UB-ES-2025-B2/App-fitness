"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTopic, Topic } from "./TopicContext";

type NewPostPayload = {
  id: number;
  user: string;
  topic: string;
  text: string;
  image?: string;
};

export default function AddPostButton() {
  const [open, setOpen] = useState(false);
  const { topic } = useTopic();

  return (
    <>
      {/* Botón flotante */}
      <button
        aria-label="Añadir publicación"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg bg-white p-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <Image
          src="/images/AddContent.png"
          alt="Añadir"
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

function Composer({ defaultTopic, onClose }: { defaultTopic: Topic | string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [topic, setTopic] = useState<string>(defaultTopic || "Todos");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = () => {
    const payload: NewPostPayload = {
      id: Date.now(),
      user: "NuevoUsuario",
      topic,
      text,
      // Nota: en real, deberías subir el archivo y guardar su URL.
      image: preview ?? undefined,
    };

    // Avisamos al feed (event bus simple)
    window.dispatchEvent(new CustomEvent("new-post", { detail: payload }));
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Crear publicación</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <label className="block text-sm text-gray-600 mb-1">Temática</label>
        <select
          className="w-full border rounded-lg px-3 py-2 mb-3"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {["Todos", "Fútbol", "Básquet", "Montaña"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label className="block text-sm text-gray-600 mb-1">Texto</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 h-24 mb-3 resize-none"
          placeholder="¿Qué has hecho hoy?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <label className="block text-sm text-gray-600 mb-1">Imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mb-3"
        />

        {preview && (
          <img src={preview} alt="Previsualización" className="rounded-xl w-full h-40 object-cover mb-3" />
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
