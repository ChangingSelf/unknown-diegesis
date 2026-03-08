interface PasteData {
  src?: string;
  image?: { src?: string };
  clipboardImage?: string;
}

// Handler for paste events to extract image data
export function handlePasteImage(
  pasteData: PasteData | null | undefined
): { src: string; alt?: string } | null {
  // Simple heuristic: clipboard data may contain image URL or data URL
  if (!pasteData) return null;
  const src = pasteData.src || pasteData.image?.src || pasteData.clipboardImage || '';
  if (!src) return null;
  return { src };
}
