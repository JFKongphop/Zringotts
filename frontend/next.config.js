const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@initia/interwovenkit-react'],
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,

  webpack: (config, { isServer }) => {
    const emptyModule = require.resolve('./lib/empty-module.js');
    config.resolve.alias['pino-pretty'] = emptyModule;
    config.resolve.alias['@react-native-async-storage/async-storage'] = emptyModule;

    if (!isServer) {
      config.resolve.alias['react'] = path.resolve(__dirname, 'lib/react-shim');

      // snarkjs / circomlibjs use Node APIs not available in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        readline: false,
        path: false,
        stream: false,
        crypto: false,
        assert: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
