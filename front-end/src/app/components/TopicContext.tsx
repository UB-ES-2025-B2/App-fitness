"use client";
import { createContext, useContext, useState } from "react";

export type Topic = "Todos" | "Fútbol" | "Básquet" | "Montaña";

type Ctx = { topic: Topic; setTopic: (t: Topic) => void };
const TopicContext = createContext<Ctx>({ topic: "Todos", setTopic: () => {} });

export const TopicProvider = ({ children }: { children: React.ReactNode }) => {
  const [topic, setTopic] = useState<Topic>("Todos");
  return <TopicContext.Provider value={{ topic, setTopic }}>{children}</TopicContext.Provider>;
};

export const useTopic = () => useContext(TopicContext);
