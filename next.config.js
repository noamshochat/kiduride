/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use static export for GitHub Pages production builds, not for Vercel or local development
  // Vercel and local dev need API routes to work (for admin functionality)
  // GitHub Pages only supports static files
  ...(process.env.VERCEL || process.env.NODE_ENV === 'development' ? {} : { output: 'export' }),
  // Only use basePath for GitHub Pages, not for Vercel or local development
  // Vercel serves from root, GitHub Pages serves from /kiduride subdirectory
  basePath: process.env.NODE_ENV === 'production' && !process.env.VERCEL ? '/kiduride' : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig

