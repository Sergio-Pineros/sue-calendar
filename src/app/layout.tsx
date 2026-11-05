import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono, Spectral } from "next/font/google";
import { StoreProvider } from "@/components/StoreProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const display = Spectral({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const ui = Figtree({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "SÚE — calendario cíclico",
  description:
    "Un overlay de 13 periodos de 28 días sobre tu calendario gregoriano. Planificación cíclica, no un calendario universal antiguo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${ui.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
