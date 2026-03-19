/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    // Add 90 to the allowed qualities
    qualities: [75, 90],
  },
  distDir: 'out',
}

module.exports = nextConfig