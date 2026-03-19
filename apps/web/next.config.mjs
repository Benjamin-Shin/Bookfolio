/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@bookfolio/shared"],
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;

