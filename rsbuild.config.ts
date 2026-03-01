// Base config - shared settings for dev and production
import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import path from 'node:path';

export default defineConfig({
  source: {
    entry: {
      index: './src/main.ts',
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  html: {
    template: './index.html',
  },
  plugins: [pluginVue()],
  output: {
    distPath: {
      root: './dist',
    },
    assetPrefix: './',
    filename: {
      js: 'static/js/[name].[contenthash:8].js',
      css: 'static/css/[name].[contenthash:8].css',
    },
    // Enable CSS modules for *.module.css files
    cssModules: {
      auto: true,
    },
  },
  server: {
    port: 3000,
    printUrls: true,
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
  dev: {
    writeToDisk: true,
  },
  tools: {
    rspack: {
      cache: {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      },
    },
    // CSS-specific tooling options
    cssExtract: {
      loaderOptions: {
        // Additional options for CSS extraction
      },
    },
  },
});
