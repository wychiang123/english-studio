// Matches CJK Unified Ideographs (incl. Extension A) and CJK Compatibility
// Ideographs -- i.e. Chinese characters. Text containing any of these is
// treated as Chinese rather than English.
const CJK_PATTERN = /[㐀-鿿豈-﫿]/;

export function isEnglishText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && !CJK_PATTERN.test(trimmed);
}
