import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default image config matches the original (q=75, webp, default sizes); local
  // images only, devicons are plain <img> so no remotePatterns are needed.
  // The dev route indicator is hidden so /dev/* screenshots and asset renders
  // stay clean; build and runtime errors are still surfaced.
  devIndicators: false,
};

export default nextConfig;
