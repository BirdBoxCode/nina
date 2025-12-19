import type { Metadata } from "next";
import { Inter, Cinzel, Space_Mono } from "next/font/google"; // Using Inter for clean typography, Cinzel for Art, Space Mono for Tattoo
import "./globals.css";
import { clsx } from "clsx";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artist Portfolio",
  description: "Art & Tattoo Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={clsx(
          inter.variable,
          cinzel.variable,
          spaceMono.variable,
          "font-sans min-h-screen flex flex-col bg-neutral-950 text-neutral-50 antialiased selection:bg-neutral-700 selection:text-white"
        )}
      >
        {children}
      </body>
    </html>
  );
}
