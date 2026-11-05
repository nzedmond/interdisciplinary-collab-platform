import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The local embedding model uses native ONNX Runtime binaries; load them from
  // node_modules at runtime instead of bundling them.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  // Ship the embedding model downloaded at build time (`npm run embeddings:warm`) with the
  // server functions, so production never downloads it at runtime.
  // Also include ONNX Runtime's Linux x64 native library: it's loaded by a computed path the
  // file tracer can't follow, so without this the model would fail to load in production.
  outputFileTracingIncludes: {
    "/**": [".cache/models/**", "node_modules/onnxruntime-node/bin/napi-v*/linux/x64/**"]
  },
  // Keep server functions under Vercel's size limit: onnxruntime-node ships binaries for
  // every OS (~290 MB); production runs on Linux x64 only. transformers.js's Node build
  // bundles what it needs from onnxruntime-web, so that package isn't needed either.
  outputFileTracingExcludes: {
    "/**": [
      "node_modules/onnxruntime-node/bin/napi-v*/darwin/**",
      "node_modules/onnxruntime-node/bin/napi-v*/win32/**",
      "node_modules/onnxruntime-node/bin/napi-v*/linux/arm64/**",
      "node_modules/onnxruntime-web/**"
    ]
  },
  typedRoutes: true
};

export default nextConfig;
