/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow isolated local runs when a stale Next process owns the default .next trace file.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};
export default nextConfig;
