const latinWordsPerMinute = 220;
const japaneseCharactersPerMinute = 500;

function plainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~|-]/g, ' ');
}

export function readingMinutes(markdown: string, lang: string) {
  const text = plainText(markdown);
  if (lang === 'ja' || lang.startsWith('ja-')) {
    const japaneseCharacters = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
    const latinWords = text.match(/[\p{Letter}\p{Number}]+/gu)?.length ?? 0;
    return Math.max(
      1,
      Math.ceil(
        japaneseCharacters / japaneseCharactersPerMinute + latinWords / latinWordsPerMinute,
      ),
    );
  }

  const words = text.match(/[\p{Letter}\p{Number}]+(?:['’][\p{Letter}\p{Number}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(words / latinWordsPerMinute));
}
