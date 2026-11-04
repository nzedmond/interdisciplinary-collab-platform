-- CreateTable
CREATE TABLE "TextEmbedding" (
    "hash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextEmbedding_pkey" PRIMARY KEY ("hash")
);
