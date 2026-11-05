import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { StoreProvider } from "@/components/StoreProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { PwaRegister } from "@/components/PwaRegister";
import { NativeShell } from "@/components/NativeShell";
import { copy } from "@/lib/copy";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: `${copy.app.name} — ${copy.app.tagline}`,
  description: copy.app.tagline,
  applicationName: copy.app.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: copy.app.name,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: copy.app.name,
    description: copy.app.tagline,
    images: ["/social-preview.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#100c16",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="ancient-amethyst"
      className={`${sans.variable} ${sans.className} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </StoreProvider>
        <PwaRegister />
        <NativeShell />
      </body>
    </html>
  );
}
