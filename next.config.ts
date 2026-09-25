import type { NextConfig } from "next";

// BUILD_TARGET=android → static export for Capacitor
// (default) → standalone for Electron / systemd server
const isAndroid = process.env.BUILD_TARGET === 'android';

const nextConfig: NextConfig = {
  output: isAndroid ? 'export' : 'standalone',
  // Static export doesn't support image optimisation
  ...(isAndroid ? { images: { unoptimized: true } } : {}),
};

export default nextConfig;
