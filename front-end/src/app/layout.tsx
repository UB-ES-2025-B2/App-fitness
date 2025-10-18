import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { TopicProvider } from "./components/TopicContext";
import AddPostButton from "./components/AddPostButton";
import NutritionButton from "./components/NutritionButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UB Fitness",
  description: "Red social fitness por temáticas deportivas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-100 antialiased`}>
        <TopicProvider>
          <Header />
          <main className="pt-20">{children}</main>
          <AddPostButton />
          <NutritionButton />
        </TopicProvider>
      </body>
    </html>
  );
}

