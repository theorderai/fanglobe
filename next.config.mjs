/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      // Public read API (match feed) can be polled cross-origin by broadcasters.
      source: '/api/match/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
      ],
    },
    {
      // Broadcast overlay must be embeddable.
      source: '/widget/:path*',
      headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
    },
  ],
}

export default nextConfig
