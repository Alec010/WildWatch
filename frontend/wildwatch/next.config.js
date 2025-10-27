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
  
  // Add API proxy to avoid CORS issues
  async rewrites() {
    // Import the root config file (CommonJS)
    const config = require('./config');
    const backendUrl = config.getBackendUrl();
    
    console.log(`Using backend URL: ${backendUrl}`);
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig 