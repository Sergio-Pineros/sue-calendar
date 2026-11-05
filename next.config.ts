import path from "node:path";
import type { NextConfig } from "next";

const capacitor = process.env.CAPACITOR === "1";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  ...(capacitor
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
