const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Only watch the current project directory, not parent directories
config.watchFolders = [__dirname];

// Ignore nested node_modules to prevent watching too many files
config.resolver.blacklistRE = /node_modules\/.*\/node_modules\/.*/;

// Explicitly set project root to current directory only
config.projectRoot = __dirname;

// Limit the number of workers to reduce file handles
config.maxWorkers = 2;

// Prevent watching parent directories
config.watchman = {
  deferStates: ['hg.update'],
  ignore_dirs: ['node_modules']
};

module.exports = config;
