/** @type {import('next').NextConfig} */
const nextConfig = {
  // yumekane-salon.com のHPへのiframe埋め込みを許可
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://yumekane-salon.com',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://yumekane-salon.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
