/** @type {import('next').NextConfig} */
const nextConfig = {
  // Visiting `/` lands you straight on the countdown page.
  async redirects() {
    return [
      {
        source: '/',
        destination: '/coming-soon',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
