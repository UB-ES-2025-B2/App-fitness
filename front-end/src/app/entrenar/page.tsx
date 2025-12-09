"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dumbbell,
    Pause,
    Play,
    Plus,
    ChevronDown,
    LogOut,
    Trash2,
    CheckCircle,
} from "lucide-react";

type Serie = {
  reps: string;
  weight: string;
};

type TrainingExercise = {
  muscle: string | null;
  name: string;
  series: Serie[];
};


// ----------------------------
// EJERCICIOS REALES POR GRUPO
// ----------------------------
const EXERCISES: Record<string, string[]> = {
    Pecho: [
        "Press banca con barra",
        "Press inclinado con mancuernas",
        "Aperturas con mancuernas",
        "Fondos en paralelas",
    ],
    Espalda: [
        "Dominadas",
        "Remo con barra",
        "Jalón al pecho",
        "Remo sentado en polea",
    ],
    Piernas: [
        "Sentadilla",
        "Prensa",
        "Peso muerto rumano",
        "Extensiones de cuádriceps",
    ],
    Brazos: [
        "Curl bíceps barra",
        "Curl martillo",
        "Press francés",
        "Extensiones polea alta",
    ],
};
const MUSCLE_IMAGES: Record<string, string> = {
    Pecho: "images/muscles/pecho.png",
    Espalda: "images/muscles/espalda.png",
    Piernas: "images/muscles/piernas.png",
    Brazos: "images/muscles/brazos.png",
};

const MOTIVATION = [
    "¡Vamos! Hoy construyes tu mejor versión 💪",
    "Cada serie suma. A por ello 🔥",
    "La disciplina gana al talento ✨",
    "Respira, empuja y progresa 🚀",
];




export default function EntrenarPage() {
    const [training, setTraining] = useState<TrainingExercise[]>([]);
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

    const [timer, setTimer] = useState(0);
    const [running, setRunning] = useState(false);

    const [showSummary, setShowSummary] = useState(false);
    const [motivationKey, setMotivationKey] = useState(0);

    // Mensaje motivacional dinámico
    const [motivationalTextState, setMotivationalTextState] = useState(
        MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)]
    );


    // TIMER REAL
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (running) {
            interval = setInterval(() => setTimer((t) => t + 1), 1000);
        }

        return () => {
            if (interval !== null) {
                clearInterval(interval);
            }
        };
    }, [running]);

    useEffect(() => {
        const interval = setInterval(() => {
            const randomMessage = MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)];
            setMotivationalTextState(randomMessage);
            setMotivationKey((k) => k + 1);
        }, 10000); // 30 segundos

        return () => clearInterval(interval);
    }, []);


    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const ss = s % 60;
        return `${m}:${ss < 10 ? "0" : ""}${ss}`;
    };

    // Añadir ejercicio a la sesión
    const addExercise = () => {
        if (!selectedExercise) return;
        setTraining((prev) => [
            ...prev,
            {
                muscle: selectedMuscle,
                name: selectedExercise,
                series: [],
            },
        ]);

        setSelectedExercise(null);
        setSelectedMuscle(null);
    };

    const addSerie = (i: number) => {
        setTraining((prev) =>
            prev.map((e, idx) =>
                idx === i
                    ? {
                        ...e,
                        series: [...e.series, { reps: "", weight: "" }],
                    }
                    : e
            )
        );
    };

    const updateSerie = (
        i: number,
        s: number,
        field: "reps" | "weight",
        value: string
    ) => {
        setTraining((prev) =>
            prev.map((e, ei) =>
                ei === i
                    ? {
                        ...e,
                        series: e.series.map((serie: Serie, si: number) =>
                            si === s ? { ...serie, [field]: value } : serie
                        ),
                    }
                    : e
            )
        );
    };


    const deleteExercise = (i: number) => {
        setTraining((prev) => prev.filter((_, idx) => idx !== i));
    };

    // FINALIZAR → CALCULAR RESUMEN REAL
    const finishWorkout = () => {
        setRunning(false);
        setShowSummary(true);
    };

    const totalSeries = training.reduce(
        (sum, ex) => sum + ex.series.length,
        0
    );

    const totalReps = training.reduce(
        (sum, ex) =>
            sum +
            ex.series.reduce(
                (s: number, serie: Serie) => s + Number(serie.reps || 0),
                0
            ),
        0
    );

    const totalWeight = training.reduce(
        (sum, ex) =>
            sum +
            ex.series.reduce(
                (s: number, serie: Serie) =>
                    s + Number(serie.reps || 0) * Number(serie.weight || 0),
                0
            ),
        0
    );

    return (
        <main className="min-h-screen p-6 text-white">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <Link
                    href="/"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition flex items-center gap-2 shadow-lg !text-white"

                >
                    <LogOut size={18} />
                    Salir
                </Link>

                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Dumbbell className="text-blue-400" />
                    Entrenamiento
                </h1>
            </div>

            {/* TIMER */}
            <div className="w-full text-center mb-8">
                <motion.div
                    className="text-6xl font-bold mb-3"
                    animate={{ scale: running ? 1 : 0.95 }}
                >
                    {formatTime(timer)}
                </motion.div>

                <motion.p
                    key={motivationKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-lg opacity-80 mb-4"
                >
                    {motivationalTextState}
                </motion.p>

                <button
                    onClick={() => setRunning((v) => !v)}
                    className="px-6 py-3 rounded-full bg-gradient-to-r 
                     from-blue-600 to-blue-400 font-semibold shadow-lg 
                     hover:scale-105 active:scale-95 transition flex 
                     items-center gap-2 mx-auto"
                >
                    {running ? <Pause /> : <Play />}
                    {running ? "Pausar" : "Iniciar"}
                </button>
            </div>

            {/* BLOQUE HORIZONTAL (SELECTORES + IMAGEN) */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 items-start">

                {/* COLUMNA IZQUIERDA — SELECTORES */}
                <div>
                    {/* SELECCION MUSCULAR */}
                    <label className="text-xl font-semibold">Grupo muscular</label>
                    <select
                        value={selectedMuscle || ""}
                        onChange={(e) => setSelectedMuscle(e.target.value)}
                        className="w-full mt-2 p-3 bg-slate-800 rounded-xl border border-slate-700"
                    >
                        <option value="">Selecciona un grupo</option>
                        {Object.keys(EXERCISES).map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>

                    {/* SELECCION EJERCICIO */}
                    {selectedMuscle && (
                        <>
                            <label className="text-xl font-semibold mt-6 block">Ejercicio</label>

                            <select
                                value={selectedExercise || ""}
                                onChange={(e) => setSelectedExercise(e.target.value)}
                                className="w-full mt-2 p-3 bg-slate-800 rounded-xl border border-slate-700"
                            >
                                <option value="">Selecciona un ejercicio</option>
                                {EXERCISES[selectedMuscle].map((ex) => (
                                    <option key={ex} value={ex}>
                                        {ex}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={addExercise}
                                className="mt-4 w-full flex items-center justify-center gap-2 
                     px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 
                     hover:scale-[1.02] active:scale-95 transition shadow-lg"
                            >
                                <Plus size={18} />
                                Añadir ejercicio
                            </button>
                        </>
                    )}
                </div>

                {/* COLUMNA DERECHA — IMAGEN DEL GRUPO MUSCULAR */}
                <div className="flex justify-center">
                    {selectedMuscle ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-lg flex flex-col items-center"
                        >
                            <h3 className="text-xl font-bold mb-3">{selectedMuscle}</h3>

                            <img
                                src={MUSCLE_IMAGES[selectedMuscle]}
                                alt={selectedMuscle}
                                className="w-64 h-auto drop-shadow-xl select-none"
                            />
                        </motion.div>
                    ) : (
                        <div className="opacity-40 text-center text-lg h-30 flex items-center justify-center">
                            Selecciona un grupo para ver los músculos trabajados
                        </div>
                    )}
                </div>
            </div>



            {/* LISTA DE EJERCICIOS */}
            <div className="space-y-6 max-w-xl mx-auto">
                {training.map((ex, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-lg"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xl font-bold">{ex.name}</h2>
                            <button onClick={() => deleteExercise(i)}>
                                <Trash2 className="text-red-400 hover:text-red-300" />
                            </button>
                        </div>

                        {ex.series.map((serie: Serie, s: number) => (
                            <div key={s} className="flex gap-3 mb-3">
                                <input
                                    type="number"
                                    placeholder="Reps"
                                    value={serie.reps}
                                    onChange={(e) => updateSerie(i, s, "reps", e.target.value)}
                                    className="flex-1 p-3 rounded-xl bg-slate-700 border border-slate-600"
                                />
                                <input
                                    type="number"
                                    placeholder="Peso (kg)"
                                    value={serie.weight}
                                    onChange={(e) => updateSerie(i, s, "weight", e.target.value)}
                                    className="flex-1 p-3 rounded-xl bg-slate-700 border border-slate-600"
                                />
                            </div>
                        ))}

                        <button
                            onClick={() => addSerie(i)}
                            className="w-full mt-2 py-2 rounded-xl bg-slate-700 border border-slate-600 hover:bg-slate-600 transition"
                        >
                            Añadir serie
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* BOTÓN FINALIZAR */}
            {training.length > 0 && (
                <button
                    onClick={finishWorkout}
                    className="mt-10 mx-auto flex items-center gap-2 px-6 py-3 
                     rounded-full bg-green-600 hover:bg-green-500 transition 
                     text-white font-semibold shadow-lg"
                >
                    <CheckCircle />
                    Finalizar entrenamiento
                </button>
            )}

            {/* RESUMEN FINAL*/}
            <AnimatePresence>
                {showSummary && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-slate-900 p-6 rounded-2xl max-w-md w-full text-center border border-slate-700 shadow-xl"
                        >
                            <h2 className="text-3xl font-bold mb-4">🏆 ¡Entrenamiento completado!</h2>

                            <p className="text-lg opacity-80 mb-3">Tiempo total: {formatTime(timer)}</p>
                            <p className="text-lg opacity-80 mb-3">Ejercicios: {training.length}</p>
                            <p className="text-lg opacity-80 mb-3">Series totales: {totalSeries}</p>
                            <p className="text-lg opacity-80 mb-3">Reps totales: {totalReps}</p>
                            <p className="text-lg opacity-80 mb-3">
                                Peso levantado: <strong>{totalWeight} kg</strong>
                            </p>

                            <Link
                                href="/"
                                className="mt-4 inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition !text-white"

                            >
                                Volver al inicio
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
