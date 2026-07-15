import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import GoogleTranslate from "@/components/GoogleTranslate";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YieldSmart — Smart Farming Platform",
  description:
    "AI-powered farming dashboard with real-time weather intelligence, soil analytics, crop recommendations, and plant disease detection.",
  keywords: "farming, agriculture, plant disease, weather, soil, crop recommendation, AI",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <GoogleTranslate />
      </body>
    </html>
  );
}


