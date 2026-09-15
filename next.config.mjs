/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow larger request bodies for file uploads on server actions/route handlers.
    serverComponentsExternalPackages: ["pdf-lib", "jszip", "pdfjs-dist"],
    // Ensure the pdfjs worker file is included in the serverless function bundle
    // (it is resolved dynamically at runtime, so tracing needs a hint).
    outputFileTracingIncludes: {
      "/api/process": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    },
  },
  webpack: (config) => {
    // pdfjs-dist and tesseract.js reference Node-only modules that must not be
    // bundled for the browser; stub them so the browser code paths are used.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
      "node-fetch": false,
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
