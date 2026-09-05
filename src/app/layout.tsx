import type { Metadata } from "next";
import { Cinzel, Spectral } from "next/font/google";

import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Armello Rank",
  description: "Ranking privado do clã Armello — marque vitórias no pergaminho.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0612",
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${cinzel.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col font-body">{children}</body>
    </html>
  );
}
