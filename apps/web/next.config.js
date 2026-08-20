/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@taxiva/tax-engine-core",
    "@taxiva/tax-engine-us",
    "@taxiva/tax-engine-ph",
    "@taxiva/document-ai",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
