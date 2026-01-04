import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "portfolio-s-info.s3.ap-northeast-1.amazonaws.com",
        pathname: "/**/*",
      },
    ],
  },
};

export default nextConfig;
