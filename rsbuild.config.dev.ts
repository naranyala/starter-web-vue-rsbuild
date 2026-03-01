// Development config - extends base config with dev-specific settings
import { defineConfig, mergeRsbuildConfig } from '@rsbuild/core';
import baseConfig from './rsbuild.config';

export default defineConfig(
  mergeRsbuildConfig(baseConfig, {
    server: {
      port: 3000,
      strictPort: false, // Auto-find available port if 3000 is in use
      open: false, // Don't auto-open browser
    },
    output: {
      cleanDistPath: false, // Don't clean for faster incremental builds
    },
    performance: {
      chunkSplit: {
        strategy: 'single-vendor',
      },
    },
    dev: {
      hmr: true, // Enable hot module replacement
    },
    tools: {
      rspack: {
        optimization: {
          splitChunks: false, // Disable for faster incremental builds
        },
        cache: {
          type: 'memory', // Use memory cache for development
        },
      },
    },
  }),
);
