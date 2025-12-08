"use client";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export default function NutritionChat() {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Persist panel open state and messages during the session
  useEffect(() => {
    const savedOpen = sessionStorage.getItem("nutritionChatOpen");
    if (savedOpen) setOpen(savedOpen === "true");
    const savedMessages = sessionStorage.getItem("nutritionChatMessages");
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    const toggleHandler = () => setOpen((prev) => !prev);
    window.addEventListener("open-nutri-chat", openHandler as EventListener);
    window.addEventListener("close-nutri-chat", closeHandler as EventListener);
    window.addEventListener("toggle-nutri-chat", toggleHandler as EventListener);
    return () => {
      window.removeEventListener("open-nutri-chat", openHandler as EventListener);
      window.removeEventListener("close-nutri-chat", closeHandler as EventListener);
      window.removeEventListener("toggle-nutri-chat", toggleHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("nutritionChatOpen", String(open));
  }, [open]);

  useEffect(() => {
    sessionStorage.setItem("nutritionChatMessages", JSON.stringify(messages));
    // scroll to bottom on new message
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const webhook = process.env.NEXT_PUBLIC_NUTRITION_WEBHOOK_URL;
    try {
      let assistantText = "";
      if (webhook) {
        const res = await fetch(webhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
          },
          body: JSON.stringify({ message: text }),
        });
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          // Debug payload in dev
          if (process.env.NODE_ENV !== "production") {
            console.debug("[NutrIA webhook JSON]", data);
          }
          // Handle array-wrapped payloads from n8n
          const normalized = Array.isArray(data) ? data[0] : data;
          assistantText =
            normalized?.output ??
            normalized?.reply ??
            normalized?.message ??
            normalized?.data?.answer ??
            normalized?.data?.reply ??
            normalized?.result ??
            (typeof normalized === "string" ? normalized : JSON.stringify(normalized));
        } else {
          const bodyText = await res.text();
          if (process.env.NODE_ENV !== "production") {
            console.debug("[NutrIA webhook text]", bodyText);
          }
          // If text looks like JSON array/object, try to parse and extract `output`
          let parsed: unknown = null;
          try {
            parsed = JSON.parse(bodyText);
          } catch {
            parsed = null;
          }
          if (parsed !== null) {
            const normalized = Array.isArray(parsed) ? parsed[0] : parsed;
            if (typeof normalized === "object" && normalized !== null) {
              const obj = normalized as Record<string, unknown>;
              const pick = (key: string) => (typeof obj[key] === "string" ? (obj[key] as string) : undefined);
              assistantText =
                pick("output") ??
                pick("reply") ??
                pick("message") ??
                JSON.stringify(obj);
            } else if (typeof normalized === "string") {
              assistantText = normalized;
            } else {
              assistantText = String(normalized);
            }
          } else {
            assistantText = bodyText;
          }
        }
        if (!res.ok) {
          assistantText = `Error ${res.status}: ${assistantText || "sin detalle"}`;
        }
        if (!assistantText) {
          assistantText = "He recibido tu consulta.";
        }
      } else {
        assistantText = "(Demo) Para respuestas reales, configure NEXT_PUBLIC_NUTRITION_WEBHOOK_URL.";
      }
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Error al contactar el agente. Intenta de nuevo más tarde.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          {/* Modal */}
          <div className="relative w-[95vw] max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <div className="font-semibold text-gray-800">Chat Nutricionista IA</div>
            <button
              aria-label="Cerrar chat"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cerrar
            </button>
          </div>

          <div ref={listRef} className="max-h-[60vh] h-[60vh] overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-gray-500">
                Empieza la conversación con tu duda de nutrición.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={
                    m.role === "user"
                      ? "inline-block rounded-2xl px-3 py-2 bg-emerald-600 text-white whitespace-pre-wrap break-words"
                      : "inline-block rounded-2xl px-3 py-2 bg-gray-100 text-gray-800 whitespace-pre-wrap break-words"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left text-sm text-gray-500">El agente está escribiendo…</div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu mensaje"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
