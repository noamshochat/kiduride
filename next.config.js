/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Only use basePath for GitHub Pages, not for Vercel
  // Vercel serves from root, GitHub Pages serves from /kiduride subdirectory
  basePath: process.env.NODE_ENV === 'production' && !process.env.VERCEL ? '/kiduride' : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig

