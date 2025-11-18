/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use static export for GitHub Pages, not for Vercel
  // Vercel needs API routes to work (for admin functionality)
  // GitHub Pages only supports static files
  ...(process.env.VERCEL ? {} : { output: 'export' }),
  // Only use basePath for GitHub Pages, not for Vercel
  // Vercel serves from root, GitHub Pages serves from /kiduride subdirectory
  basePath: process.env.NODE_ENV === 'production' && !process.env.VERCEL ? '/kiduride' : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig

