/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},

  images: {
    remotePatterns: [
      // tes avatars de test
      { protocol: "https", hostname: "i.pravatar.cc" },

      // TikTok (au cas où tu utilises leur CDN plus tard)
      { protocol: "https", hostname: "p16-sign-va.tiktokcdn.com" },
      { protocol: "https", hostname: "p16-sign.tiktokcdn.com" },
      { protocol: "https", hostname: "p19-sign.tiktokcdn-us.com" },
      { protocol: "https", hostname: "p16-tiktokcdn.com" },
    ],
  },
};

export default nextConfig;