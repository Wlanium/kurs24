/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: __dirname,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'https://api.kurs24.io',
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  },
}

module.exports = nextConfig