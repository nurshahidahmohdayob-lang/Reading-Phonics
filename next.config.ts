import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served behind Caddy at https://phonics.test (→ localhost:3001). Allow that
  // host as a dev origin so HMR / server-action requests aren't blocked.
  allowedDevOrigins: ["phonics.test"],
};

export default nextConfig;
