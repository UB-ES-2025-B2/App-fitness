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

    // Limpia objectURLs cuando cambie
    useEffect(() => {
        return () => {
        if (value?.startsWith("blob:")) URL.revokeObjectURL(value);
        };
    }, [value]);

    const handleFile = (file: File) => {
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

        const url = URL.createObjectURL(file);
        onChange(url);
    };

    return (
        <div className="relative group">
        {/* Botón/área clicable para abrir el file input */}
        <label
            htmlFor={inputId}
            role="button"
            tabIndex={0}
            aria-label="Cambiar foto de perfil"
            onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                (document.getElementById(inputId) as HTMLInputElement)?.click();
            }
            }}
            className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700 cursor-pointer ring-0 focus:outline-none focus:ring-2 focus:ring-blue-400 overflow-hidden"
            title="Cambiar foto de perfil"
        >
            {value ? (
            // Imagen actual
            <Image src={value} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
            // Fallback con inicial si no hay imagen (la letra la pones fuera si quieres)
            <span>👤</span>
            )}

            {/* Overlay al hacer hover */}
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-white">
            Cambiar
            </span>
        </label>

        {/* File input oculto */}
        <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            }}
        />

        {/* Error simple */}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}