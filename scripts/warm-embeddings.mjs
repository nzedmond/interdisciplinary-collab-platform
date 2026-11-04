// Downloads the local embedding model into .cache/models (about 23 MB, once) and
// checks it runs, so matching works offline and the first page load isn't slowed.
// Usage: npm run embeddings:warm
import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";

// Keep in sync with EMBEDDING_MODEL in lib/embeddings.ts.
const MODEL = "Xenova/all-MiniLM-L6-v2";

env.cacheDir = path.join(process.cwd(), ".cache", "models");

const started = Date.now();
const extract = await pipeline("feature-extraction", MODEL, { dtype: "q8" });
const output = await extract(["Interdisciplinary campus collaboration"], { pooling: "mean", normalize: true });

console.log(`Model ready: ${MODEL} (${output.dims.at(-1)} dimensions) in ${Date.now() - started} ms.`);
console.log(`Cached in ${env.cacheDir}`);
