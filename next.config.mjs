/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the headless-Chrome packages out of the webpack bundle so the
  // @sparticuz/chromium binary is loaded at runtime on Vercel.
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com" }, // vendor favicons
    ],
  },
};

export default nextConfig;
