// helpers/chunkText.ts

/**
 * Roughly estimate the number of tokens in a given string.
 * GPT models generally use 1 token ≈ 4 characters in English.
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chunk a large string into pieces that fit within the token limits of a GPT model.
 * @param text The full input string to chunk.
 * @param maxTokens The model's total token limit (e.g., 8192 for GPT-4).
 * @param safetyMargin Number of tokens to reserve for the model's response (e.g., 500).
 * @returns An array of text chunks.
 */
export function chunkTextByTokens(
  text: string,
  maxTokens: number = 8192,
  safetyMargin: number = 500
): string[] {
  const targetTokens = maxTokens - safetyMargin;
  const sentences = text.match(/[^\.!\?]+[\.!\?]+|\n+/g) || [text];
  const chunks: string[] = [];

  let currentChunk = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokenCount(sentence);

    if (currentTokens + sentenceTokens > targetTokens) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentTokens = sentenceTokens;
    } else {
      currentChunk += sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
