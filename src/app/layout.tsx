import type { Metadata, Viewport } from "next";
import { Orbitron, Rajdhani, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";

// Self-hosted fonts via next/font — no runtime request to Google.
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
  display: "swap",
});
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
const techMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voide Warframe — Tenno Network",
  description:
    "Full-stack платформа по Warframe: трекер событий, инвентарь модов, AI-ассистент.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#03050a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${orbitron.variable} ${rajdhani.variable} ${techMono.variable}`}
    >
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
