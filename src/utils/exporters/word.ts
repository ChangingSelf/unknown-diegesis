export interface WordExportOptions {
  workspacePath: string;
  outputPath: string;
  fileName?: string;
}

export async function exportToWord(
  _blocks: unknown[],
  _options: WordExportOptions
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  return {
    success: false,
    error: 'Word export requires docx library. Please install: yarn add docx',
  };
}

export default exportToWord;
