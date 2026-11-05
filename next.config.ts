import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The embedding model loads native ONNX Runtime binaries, so Next.js must
  // require it at runtime instead of bundling it.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
