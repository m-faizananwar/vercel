module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com'
      }
    ]
  },
  // Increase body size limit for API routes to allow large file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  }
}
