import { createHash } from "node:crypto";
import path from "node:path";
import { prisma } from "@/lib/prisma";

// Small open-source sentence-embedding model (384 dimensions, ~23 MB quantized).
// Runs locally through transformers.js + ONNX Runtime; downloaded from Hugging Face
// on first use into .cache/models, then works offline.
export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

type Extractor = (
  texts: string[],
  options: { pooling: "mean"; normalize: boolean }
) => Promise<{ tolist(): number[][] }>;

const globalForEmbeddings = globalThis as unknown as {
  embeddingExtractor?: Promise<Extractor>;
};

// One model instance per server process (and across dev hot reloads).
function getExtractor() {
  if (!globalForEmbeddings.embeddingExtractor) {
    globalForEmbeddings.embeddingExtractor = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.cacheDir = path.join(process.cwd(), ".cache", "models");
      const extractor = await pipeline("feature-extraction", EMBEDDING_MODEL, { dtype: "q8" });
      return extractor as unknown as Extractor;
    })().catch((error) => {
      // Let a later request retry (e.g. after the network comes back for the first download).
      globalForEmbeddings.embeddingExtractor = undefined;
      throw error;
    });
  }

  return globalForEmbeddings.embeddingExtractor;
}

function hashText(text: string) {
  return createHash("sha256").update(`${EMBEDDING_MODEL}\n${text}`).digest("hex");
}

// Returns an embedding for every input text. Cached vectors come from the database;
// only new or changed text is run through the model. Throws if the model can't load.
export async function embedTexts(texts: string[]) {
  const unique = Array.from(new Set(texts.filter((text) => text.trim().length > 0)));
  const hashes = new Map(unique.map((text) => [text, hashText(text)]));
  const result = new Map<string, number[]>();

  if (unique.length === 0) {
    return result;
  }

  const cached = await prisma.textEmbedding.findMany({
    where: { hash: { in: Array.from(hashes.values()) } },
    select: { hash: true, embedding: true }
  });
  const cachedByHash = new Map(cached.map((row) => [row.hash, row.embedding as number[]]));
  const missing: string[] = [];

  for (const text of unique) {
    const vector = cachedByHash.get(hashes.get(text)!);
    if (vector) {
      result.set(text, vector);
    } else {
      missing.push(text);
    }
  }

  if (missing.length > 0) {
    const extractor = await getExtractor();
    const vectors = (await extractor(missing, { pooling: "mean", normalize: true })).tolist();

    missing.forEach((text, index) => result.set(text, vectors[index]));

    await prisma.textEmbedding.createMany({
      data: missing.map((text, index) => ({
        hash: hashes.get(text)!,
        model: EMBEDDING_MODEL,
        embedding: vectors[index]
      })),
      skipDuplicates: true
    });
  }

  return result;
}
