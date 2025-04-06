/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permitir que o build prossiga mesmo com erros do ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permitir que o build prossiga mesmo com erros do TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
