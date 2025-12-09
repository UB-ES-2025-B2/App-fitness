import { useEffect, useState } from "react";
import Image from 'next/image';

export default function ProfileAvatar({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const inputId = "avatar-input";
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false); // 1. Nuevo estado de carga

  // Limpia objectURLs cuando cambie (solo si son locales)
  useEffect(() => {
    return () => {
      if (value?.startsWith("blob:")) URL.revokeObjectURL(value);
    };
  }, [value]);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file) return;

    // Validaciones simples
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Formato no válido. Usa PNG, JPG o WEBP.");
      return;
    }
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`La imagen supera ${maxMB} MB.`);
      return;
    }

    // 2. Lógica de subida al Backend
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append("image", file); // "image" debe coincidir con lo que espera upload.py

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
      
      const res = await fetch(`${baseUrl}/api/upload/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await res.json();
      
      // 3. Pasamos la URL real de Cloudinary al padre
      onChange(data.url); 

    } catch (err) {
      console.error(err);
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <label
        htmlFor={inputId}
        role="button"
        tabIndex={0}
        aria-label="Cambiar foto de perfil"
        className={`w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold 
        text-gray-700 cursor-pointer ring-0 focus:outline-none focus:ring-2 focus:ring-blue-400 overflow-hidden relative
        ${uploading ? "opacity-50 cursor-wait" : ""}`} // Feedback visual si carga
        title="Cambiar foto de perfil"
      >
        {value ? (
          <Image 
            src={value} 
            alt="Foto de perfil" 
            fill 
            sizes="64px" 
            className="object-cover rounded-full" 
          />
        ) : (
          <span>👤</span>
        )}

        {/* Overlay de carga o hover */}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-white z-10">
          {uploading ? "..." : "Cambiar"}
        </span>
      </label>

      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={uploading} // Deshabilitar mientras sube
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {error && <p className="mt-1 text-xs text-red-600 w-32 leading-tight">{error}</p>}
    </div>
  );
}