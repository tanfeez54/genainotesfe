import type { NextConfig } from "next";

const nextConfig: any = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.storage' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:4000', '*.vercel.app', 'genainotesbe.onrender.com'],
    },
  },
};

export default nextConfig;
