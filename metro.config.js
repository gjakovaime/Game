const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow .lottie binary files to be bundled as static assets
config.resolver.assetExts.push('lottie');

module.exports = config;
