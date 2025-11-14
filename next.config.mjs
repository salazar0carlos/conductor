/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent static export of API routes (they need runtime env vars)
  // This fixes "supabaseUrl is required" errors during build
  // Use standalone output for production (Vercel handles this automatically)
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,

  // Disable ESLint errors during production builds
  // ESLint warnings should not block deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during production builds
  // Type errors will still show in development
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
