/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jcldwuryjuqtrbsqlgoi.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'wildwatch-9djc.onrender.com',
        pathname: '/api/images/**',
      },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig 