// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...require('node-libs-react-native'),

  // stubs you already added
  net   : path.resolve(__dirname, 'shims/empty.js'),
  tls   : path.resolve(__dirname, 'shims/empty.js'),
  ws    : path.resolve(__dirname, 'shims/empty.js'),

  // NEW – anything that tries to touch the file-system
  fs            : path.resolve(__dirname, 'shims/empty.js'),
  'node-gyp-build' : path.resolve(__dirname, 'shims/empty.js'),
  bufferutil       : path.resolve(__dirname, 'shims/empty.js'),
  'utf-8-validate' : path.resolve(__dirname, 'shims/empty.js'),
};

module.exports = config;
