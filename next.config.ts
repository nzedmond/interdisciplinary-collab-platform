import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The local embedding model uses native ONNX Runtime binaries; load them from
  // node_modules at runtime instead of bundling them.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  typedRoutes: true
};

export default nextConfig;
