export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length)
    throw new Error(
      `cosineSimilarity: vector length mismatch (${String(a.length)} vs ${String(b.length)})`
    );

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0)
    throw new Error('cosineSimilarity: one or both vectors have zero magnitude');

  return dot / (magA * magB);
}
