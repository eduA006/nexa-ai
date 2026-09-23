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
  images: {
    // Comprobantes de pago: URLs firmadas y temporales del bucket privado
    // `payment-proofs`, mostradas solo en /admin/pagos.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
