/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_ACTIONS ? '/Casetta_web_app' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
