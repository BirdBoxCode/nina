import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sanity image CDN (uploads from the Studio)
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
};

export default nextConfig;
