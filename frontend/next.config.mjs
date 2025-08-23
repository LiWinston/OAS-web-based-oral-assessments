/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://172.22.80.212:8081/:path*',
      },
      {
        source: '/login',
        destination: 'http://172.22.80.212:8081/login',
      },
      {
        source: '/logout',
        destination: 'http://172.22.80.212:8081/logout',
      },
    ];
  },
};

export default nextConfig;
