import { countWords } from '@/utils/wordCount';

export interface WordCountResult {
  total: number;
  selected: number;
}

export function useWordCount(text: string): number {
  return countWords(text);
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
