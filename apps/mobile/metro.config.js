const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Let `require('...tflite')` resolve the classifier model as a bundled asset.
config.resolver.assetExts.push('tflite');

module.exports = config;
