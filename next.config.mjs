/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
};
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;
