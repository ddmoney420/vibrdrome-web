/** Simple fuzzy matching score. Higher = better match. Returns -1 for no match. */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact match
  if (t === q) return 100;

  // Starts with
  if (t.startsWith(q)) return 80 + (q.length / t.length) * 10;

  // Contains as substring
  const idx = t.indexOf(q);
  if (idx >= 0) return 60 + (q.length / t.length) * 10;

  // Word-start match (each query char matches a word start)
  const words = t.split(/\s+/);
  let wordMatch = true;
  let wi = 0;
  for (let i = 0; i < q.length && wi < words.length; i++) {
    if (words[wi][0] === q[i]) {
      wi++;
    } else {
      wordMatch = false;
      break;
    }
  }
  if (wordMatch && wi > 0) return 40 + wi * 5;

  // Subsequence match (all query chars appear in order)
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  if (qi === q.length) return 20 + (q.length / t.length) * 10;

  return -1;
}

/** Filter and sort items by fuzzy match score */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  accessor: (item: T) => string,
): T[] {
  if (!query.trim()) return items;

  return items
    .map((item) => ({ item, score: fuzzyScore(query, accessor(item)) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
