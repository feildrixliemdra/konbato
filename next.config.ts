import type { NextConfig } from "next";

interface WebpackWarning {
  module?: {
    resource?: string;
  };
  message?: string;
}

interface ReplacementResource {
  request: string;
}

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // Enable async WebAssembly and top-level await for mupdf WASM workers
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    // Suppress false-positive "topLevelAwait" warnings from mupdf.js.
    // mupdf only runs inside a { type: 'module' } Web Worker where
    // topLevelAwait is fully supported. The warning fires because webpack
    // statically traces the import chain: page → pdf.worker.ts → mupdf.js.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      (warning: WebpackWarning) =>
        warning.module?.resource?.includes('mupdf') &&
        warning.message?.includes('topLevelAwait'),
    ];

    if (!isServer) {
      // Mock Node.js core modules in the browser bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        module: false,
      };

      // Strip "node:" prefix from client-side imports (e.g., node:fs -> fs)
      // so Webpack can resolve them using fallbacks above.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: ReplacementResource) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );
    }
    return config;
  },
};

export default nextConfig;
