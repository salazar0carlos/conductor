/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent static export of API routes (they need runtime env vars)
  // This fixes "supabaseUrl is required" errors during build
  // Use standalone output for production (Vercel handles this automatically)
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,
};

export default nextConfig;
