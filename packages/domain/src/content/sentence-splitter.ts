const KOREAN_TEXT_PATTERN = /[\u3131-\u318E\uAC00-\uD7A3]/u

export function hasUsableKoreanArticleText(text: string): boolean {
  return KOREAN_TEXT_PATTERN.test(text)
}

export function normalizeArticleText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim()
}

export function splitKoreanArticleSentences(text: string): string[] {
  const normalized = normalizeArticleText(text);
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const sentences = paragraphs.flatMap((paragraph) => {
    const preservedLines = splitPreservedLines(paragraph);
    if (preservedLines) {
      return preservedLines;
    }

    const collapsed = paragraph.replace(/\n+/g, " ").trim();
    const fragments = collapsed
      .split(/(?<=[.!?。！？])\s+/u)
      .map((fragment) => fragment.trim())
      .filter(Boolean);

    return fragments.length > 0 ? fragments : [collapsed];
  });

  return sentences.filter((sentence) => sentence.trim().length > 0);
}

function splitPreservedLines(paragraph: string): string[] | null {
  if (!paragraph.includes("\n")) {
    return null;
  }

  const lines = paragraph
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return null;
  }

  const containsKorean = lines.some(hasUsableKoreanArticleText);
  const looksLikeVerse = lines.every((line) => line.length <= 120);

  if (!containsKorean || !looksLikeVerse) {
    return null;
  }

  return lines;
}