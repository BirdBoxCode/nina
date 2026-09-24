import type { Metadata } from "next";
import "./globals.css";
import { clsx } from "clsx";
import { CustomCursor } from "@/components/CustomCursor";
import { IntroProvider, MainContent } from "@/components/IntroContext";
import { PageTransitionProvider } from "@/components/PageTransition";

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
      <head>
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://use.typekit.net/uyl4jnb.css" />
      </head>
      <body
        className={clsx(
          "font-sans min-h-screen flex flex-col bg-neutral-950 text-neutral-50 antialiased selection:bg-neutral-700 selection:text-white"
        )}
      >
        <IntroProvider>
          <CustomCursor />
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
