"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ReportFormProps {
    targetId: number; 
    targetType: 'post' | 'user'; // Indica si es un post o un usuario
    isOpen: boolean; 
    onClose: () => void; 
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Opciones de categorías de denuncia
const REPORT_CATEGORIES = [
    "Contenido Inadecuado", 
    "Spam o Engaño", 
    "Acoso / Odio", 
    "Información Errónea", 
    "Otros"
];

export default function ReportForm({ targetId, targetType, isOpen, onClose }: ReportFormProps) {
    const [category, setCategory] = useState(REPORT_CATEGORIES[0]); 
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setFeedback(null);

        const raw = localStorage.getItem("ubfitness_tokens");
        let accessToken: string | null = null;
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                accessToken = parsed.access_token;
            } catch (e) {
                console.error("Invalid ubfitness_tokens in localStorage", e);
            }
        }
        
        if (!accessToken) {
            alert("Debes estar conectado para enviar una denuncia.");
            setSending(false);
            return;
        }

        try {
            // Construye la URL de la API dinámicamente
            const endpoint = targetType === 'post' 
                ? `${API_BASE}/api/posts/${targetId}/report`
                : `${API_BASE}/api/users/${targetId}/report`; 
            
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ 
                    category: category, 
                    comment: comment.trim() 
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Error ${res.status}: ${text}`);
            }

            setFeedback('success');
            setComment(''); 
            setTimeout(onClose, 2000); 

        } catch (err) {
            console.error("Error enviando denuncia", err);
            setFeedback('error');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    const targetName = targetType === 'post' ? 'Publicación' : 'Perfil';
    const reportText = `Si us plau, especifica per què vols denunciar esta ${targetType} (ID: ${targetId}).`;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose} 
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-red-600 dark:text-red-400">🚨 Denunciar {targetName}</h3>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        {feedback === 'success' ? (
                            <div className="text-center py-8 text-green-600 dark:text-green-400">
                                <p className="font-semibold text-lg">✅ ¡Denuncia enviada correctamente!</p>
                                <p className="text-sm">Gracias por ayudarnos a mantener la comunidad segura.</p>
                            </div>
                        ) : feedback === 'error' ? (
                            <div className="text-center py-4 text-red-600 dark:text-red-400">
                                <p className="font-semibold text-lg">❌ Error en el envío.</p>
                                <p className="text-sm">Inténtalo de nuevo más tarde o contacta con soporte.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className='mb-4'>
                                    <label htmlFor="report-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Categoría de la denuncia (Obligatorio)
                                    </label>
                                    <select
                                        id="report-category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                        className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-red-500 focus:border-red-500 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-100"
                                    >
                                        {REPORT_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <label htmlFor="report-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Comentario adicional (Opcional)
                                </label>
                                <textarea
                                    id="report-comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={`Introduce detalles adicionales sobre la denuncia de ${targetType}...`}
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-100"
                                />

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className={`w-full mt-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                                        sending 
                                            ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                >
                                    {sending ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Enviando...
                                        </>
                                    ) : (
                                        `Denunciar ${targetName}`
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}