import type { NextConfig } from "next";

// Debe ser >= MAX_FILE_SIZE_MB (lib/config/limits.ts) + margen para el
// overhead de multipart/form-data, o la subida de documentos falla con
// "Body exceeded 1 MB limit" (límite por defecto de Next.js).
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB) || 10;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: `${maxFileSizeMb + 2}mb`,
    },
  },
};

export default nextConfig;
