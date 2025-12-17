import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter for clean typography
import "./globals.css";
import { clsx } from "clsx";

const inter = Inter({
  variable: "--font-inter",
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
          "font-sans min-h-screen flex flex-col"
        )}
      >
        {children}
      </body>
    </html>
  );
}
