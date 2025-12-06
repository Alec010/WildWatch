import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jcldwuryjuqtrbsqlgoi.supabase.co",
      },
    ],
  },
};

export default nextConfig;
