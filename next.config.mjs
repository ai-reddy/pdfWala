/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow larger request bodies for file uploads on server actions/route handlers.
    serverComponentsExternalPackages: ["pdf-lib", "jszip"],
  },
};

export default nextConfig;
