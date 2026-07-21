import type { Metadata } from "next";
import { Inter, Cinzel, Space_Mono, Dancing_Script, Piazzolla } from "next/font/google";
import "./globals.css";
import { clsx } from "clsx";
import { CustomCursor } from "@/components/CustomCursor";
import { FluidBackground } from "@/components/FluidBackground";
import { IntroProvider, MainContent } from "@/components/IntroContext";
import { IntroOverlay } from "@/components/IntroOverlay";
import { PageTransitionProvider } from "@/components/PageTransition";

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

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const piazzolla = Piazzolla({
  variable: "--font-piazzolla",
  subsets: ["latin"],
  weight: ["300"],
});

export const metadata: Metadata = {
  title: "NINARO",
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
          dancingScript.variable,
          piazzolla.variable,
          "font-sans min-h-screen flex flex-col bg-neutral-950 text-neutral-50 antialiased selection:bg-neutral-700 selection:text-white"
        )}
      >
        <FluidBackground />
        <IntroProvider>
          <CustomCursor />
          <IntroOverlay />
          <PageTransitionProvider>
            <MainContent>
              {children}
            </MainContent>
          </PageTransitionProvider>
        </IntroProvider>
      </body>
    </html>
  );
}
