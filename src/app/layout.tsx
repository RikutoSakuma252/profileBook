import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, Klee_One, DotGothic16, Special_Elite } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen-kaku",
  display: "swap",
});

const klee = Klee_One({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-klee",
  display: "swap",
});

const dot = DotGothic16({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dot",
  display: "swap",
});

const typewriter = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-typewriter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ダマテンラジオ プロフィール帳",
  description: "社内メンバーの知られざる一面を、プロフィール帳で覗いてみよう。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${zenKaku.variable} ${klee.variable} ${dot.variable} ${typewriter.variable} font-sans antialiased text-paper min-h-screen flex flex-col selection:bg-neon selection:text-ink`}
      >
        <Header />
        <div className="flex-1 content-above-noise">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
