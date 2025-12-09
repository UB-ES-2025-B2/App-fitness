"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, CheckCircle, Dumbbell, Timer, Trophy } from "lucide-react";

// Datos Mock (esto podría venir de tu API/BD en el futuro)
const MUSCLE_GROUPS = {
  pecho: ["Press de Banca", "Aperturas", "Flexiones", "Press Inclinado"],
  espalda: ["Dominadas", "Remo con Barra", "Jalón al Pecho", "Peso Muerto"],
  piernas: ["Sentadilla", "Prensa", "Zancadas", "Extensiones"],
  brazos: ["Curl de Bíceps", "Fondos de Tríceps", "Curl Martillo", "Press Francés"],
  hombros: ["Press Militar", "Elevaciones Laterales", "Pájaros"],
};

export default function TrainingSession({ onClose }: { onClose: () => void }) {
  // Estados de la sesión
  const [step, setStep] = useState<"setup" | "active" | "summary">("setup");
  
  // Configuración
  const [selectedMuscle, setSelectedMuscle] = useState<keyof typeof MUSCLE_GROUPS | "">("");
  const [numExercises, setNumExercises] = useState(3);
  
  // Estado Activo
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [exercises, setExercises] = useState<{ name: string; sets: { reps: string; weight: string; done: boolean }[] }[]>([]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "active" && !isPaused) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, isPaused]);

  // Formato de tiempo (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const startTraining = () => {
    if (!selectedMuscle) return;
    
    // Generar estructura inicial de ejercicios
    const availableExercises = MUSCLE_GROUPS[selectedMuscle];
    const initialExercises = Array.from({ length: numExercises }).map((_, i) => ({
      name: availableExercises[i % availableExercises.length] || "Ejercicio Extra",
      sets: [{ reps: "", weight: "", done: false }, { reps: "", weight: "", done: false }, { reps: "", weight: "", done: false }],
    }));
    
    setExercises(initialExercises);
    setStep("active");
  };

  const toggleSet = (exIndex: number, setIndex: number) => {
    const newEx = [...exercises];
    newEx[exIndex].sets[setIndex].done = !newEx[exIndex].sets[setIndex].done;
    setExercises(newEx);
  };

  const updateSet = (exIndex: number, setIndex: number, field: "reps" | "weight", value: string) => {
    const newEx = [...exercises];
    newEx[exIndex].sets[setIndex][field] = value;
    setExercises(newEx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[60] bg-gray-100 dark:bg-slate-900 flex flex-col overflow-hidden"
    >
      {/* --- HEADER SUPERIOR --- */}
      <div className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            {step === "active" ? <Timer size={20} className={isPaused ? "animate-pulse" : ""} /> : <Dumbbell size={20} />}
          </div>
          <div>
            <h2 className="font-bold text-gray-800 dark:text-white leading-tight">
              {step === "setup" ? "Configurar Sesión" : step === "active" ? "Entrenando" : "¡Sesión Finalizada!"}
            </h2>
            {step === "active" && (
              <p className="text-xl font-mono font-bold text-blue-600 leading-none mt-1">
                {formatTime(timer)}
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 transition">
          <X size={20} />
        </button>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <AnimatePresence mode="wait">
          
          {/* FASE 1: CONFIGURACIÓN */}
          {step === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto space-y-6"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Hora de moverse! 🔥</h3>
                <p className="text-gray-500 dark:text-gray-400">Personaliza tu rutina de hoy en segundos.</p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Grupo Muscular</span>
                  <select
                    value={selectedMuscle}
                    onChange={(e) => setSelectedMuscle(e.target.value as any)}
                    className="mt-2 w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  >
                    <option value="" disabled>Selecciona un grupo...</option>
                    {Object.keys(MUSCLE_GROUPS).map((m) => (
                      <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Nº de Ejercicios</span>
                  <select
                    value={numExercises}
                    onChange={(e) => setNumExercises(Number(e.target.value))}
                    className="mt-2 w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} Ejercicios</option>
                    ))}
                  </select>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!selectedMuscle}
                onClick={startTraining}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all mt-8"
              >
                Comenzar Entrenamiento
              </motion.button>
            </motion.div>
          )}

          {/* FASE 2: ENTRENANDO */}
          {step === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {exercises.map((ex, i) => (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
                >
                  <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white">{ex.name}</h3>
                    <span className="text-xs font-medium text-gray-500 bg-white dark:bg-slate-600 px-2 py-1 rounded-md border">Ejercicio {i + 1}</span>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-10 gap-2 mb-2 text-xs font-semibold text-gray-400 text-center uppercase tracking-wider">
                      <div className="col-span-2">Set</div>
                      <div className="col-span-3">KG</div>
                      <div className="col-span-3">Reps</div>
                      <div className="col-span-2">✓</div>
                    </div>
                    {ex.sets.map((set, j) => (
                      <div key={j} className={`grid grid-cols-10 gap-2 items-center ${set.done ? "opacity-50 transition-opacity" : ""}`}>
                        <div className="col-span-2 text-center text-sm font-medium text-gray-500 bg-gray-100 dark:bg-slate-700 py-2 rounded-lg">{j + 1}</div>
                        <input 
                          type="number" placeholder="0" 
                          value={set.weight}
                          onChange={(e) => updateSet(i, j, "weight", e.target.value)}
                          className="col-span-3 text-center bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                        <input 
                          type="number" placeholder="0"
                          value={set.reps}
                          onChange={(e) => updateSet(i, j, "reps", e.target.value)}
                          className="col-span-3 text-center bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                        <button
                          onClick={() => toggleSet(i, j)}
                          className={`col-span-2 flex items-center justify-center py-2 rounded-lg transition-colors ${
                            set.done ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-400 hover:bg-gray-300"
                          }`}
                        >
                          <CheckCircle size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* FASE 3: RESUMEN */}
          {step === "summary" && (
            <motion.div
              key="summary"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto"
            >
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-4xl animate-bounce">
                🏆
              </div>
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2">¡Entrenamiento Completado!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">Has entrenado duro hoy.</p>

              <div className="bg-white dark:bg-slate-800 w-full rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-bold">Tiempo Total</p>
                    <p className="text-xl font-bold text-blue-600">{formatTime(timer)}</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-bold">Ejercicios</p>
                    <p className="text-xl font-bold text-emerald-600">{exercises.length}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
              >
                Volver al Feed
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- FOOTER DE CONTROLES (SOLO EN ACTIVE) --- */}
      {step === "active" && (
        <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200 dark:border-slate-700 p-4 pb-6 z-20">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                isPaused ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              }`}
            >
              {isPaused ? <><Play size={18} /> Reanudar</> : <><Pause size={18} /> Pausar</>}
            </button>
            <button
              onClick={() => setStep("summary")}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
            >
              Terminar Sesión
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}