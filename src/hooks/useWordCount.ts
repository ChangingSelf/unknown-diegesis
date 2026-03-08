export interface WordCountResult {
  total: number;
  selected: number;
}

export function useWordCount(text: string): number {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  const numbers = text.match(/\d+/g) || [];

  return chineseChars.length + englishWords.length + numbers.length;
}

export function useWordCountWithSelection(
  text: string,
  selection: { from: number; to: number }
): WordCountResult {
  const selectedText = text.slice(selection.from, selection.to);

  return {
    total: useWordCount(text),
    selected: useWordCount(selectedText),
  };
}
