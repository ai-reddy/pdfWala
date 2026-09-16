// Unicode-aware text statistics (spec sections 15/16). Uses Intl.Segmenter
// (word/grapheme aware) when available so CJK text and emoji are handled
// sensibly, falling back to a whitespace split for older runtimes.
export interface TextStats {
  words: number;
  characters: number;
  charactersExcludingSpaces: number;
  charactersExcludingWhitespace: number;
  unicodeCodePoints: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const SegmenterCtor = (Intl as unknown as { Segmenter?: new (locale: string, opts: { granularity: string }) => { segment: (t: string) => Iterable<{ isWordLike?: boolean }> } }).Segmenter;
  if (SegmenterCtor) {
    const segmenter = new SegmenterCtor("en", { granularity: "word" });
    let count = 0;
    for (const seg of segmenter.segment(trimmed)) {
      if (seg.isWordLike) count++;
    }
    return count;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function computeTextStats(text: string): TextStats {
  const characters = text.length;
  const charactersExcludingSpaces = text.replace(/ /g, "").length;
  const charactersExcludingWhitespace = text.replace(/\s/g, "").length;
  const unicodeCodePoints = Array.from(text).length;
  const trimmed = text.trim();
  const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+|\S+$/g) ?? []).filter((s) => s.trim()).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const lines = text ? text.split("\n").length : 0;
  const words = countWords(text);

  return {
    words,
    characters,
    charactersExcludingSpaces,
    charactersExcludingWhitespace,
    unicodeCodePoints,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
  };
}
