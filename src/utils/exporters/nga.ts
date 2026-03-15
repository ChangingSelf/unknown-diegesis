import type { TiptapDocument, TiptapNode } from '@/types/tiptap';

export interface NGAExportOptions {
  includeDiceFormat?: 'standard' | 'compact';
  imageFormat?: 'url' | 'bbcode';
  includeMetadata?: boolean;
}

export function exportToNGA(doc: TiptapDocument, options: NGAExportOptions = {}): string {
  const { includeDiceFormat = 'standard', imageFormat = 'bbcode' } = options;

  if (!doc.content || doc.content.length === 0) {
    return '';
  }

  const lines: string[] = [];

  doc.content.forEach(node => {
    const exported = exportNodeToNGA(node, includeDiceFormat, imageFormat);
    if (exported) {
      lines.push(exported);
    }
  });

  return lines.join('\n\n');
}

function exportNodeToNGA(
  node: TiptapNode,
  diceFormat: 'standard' | 'compact',
  imageFormat: 'url' | 'bbcode'
): string {
  switch (node.type) {
    case 'diceBlock':
      return exportDiceBlockToNGA(node, diceFormat);
    case 'imageBlock':
      return exportImageBlockToNGA(node, imageFormat);
    case 'layoutRow':
      return exportLayoutRowToNGA(node, diceFormat, imageFormat);
    case 'paragraph':
      return exportParagraphToNGA(node);
    case 'heading':
      return exportHeadingToNGA(node);
    case 'blockquote':
      return exportBlockquoteToNGA(node);
    case 'bulletList':
    case 'orderedList':
      return exportListToNGA(node);
    case 'taskList':
      return exportTaskListToNGA(node);
    case 'horizontalRule':
      return '[hr]';
    default:
      return exportGenericNodeToNGA(node);
  }
}

function exportDiceBlockToNGA(node: TiptapNode, format: 'standard' | 'compact'): string {
  const attrs = node.attrs || {};
  const formula = String(attrs.formula || '1d20');
  const result = attrs.result;

  if (format === 'compact') {
    return result !== null && result !== undefined ? `${formula}=${result}` : formula;
  }

  return result !== null && result !== undefined ? `【${formula}=${result}】` : `【${formula}】`;
}

function exportImageBlockToNGA(node: TiptapNode, format: 'url' | 'bbcode'): string {
  const attrs = node.attrs || {};
  const src = String(attrs.src || '');
  const alt = attrs.alt ? String(attrs.alt) : '';

  if (!src) {
    return '';
  }

  if (format === 'url') {
    return alt ? `${src} (${alt})` : src;
  }

  return alt ? `[img=${src}]${alt}[/img]` : `[img]${src}[/img]`;
}

function exportLayoutRowToNGA(
  node: TiptapNode,
  diceFormat: 'standard' | 'compact',
  imageFormat: 'url' | 'bbcode'
): string {
  if (!node.content || node.content.length === 0) {
    return '';
  }

  const columns = node.content.filter(col => col.type === 'layoutColumn');

  if (columns.length <= 1) {
    const firstColumn = columns[0];
    if (firstColumn?.content) {
      return firstColumn.content
        .map(child => exportNodeToNGA(child, diceFormat, imageFormat))
        .filter(Boolean)
        .join('\n');
    }
    return '';
  }

  const rows: string[] = [];
  const maxBlocks = Math.max(...columns.map(col => col.content?.length || 0));

  for (let i = 0; i < maxBlocks; i++) {
    const cells = columns.map(col => {
      const block = col.content?.[i];
      if (!block) return '';
      return exportNodeToNGA(block, diceFormat, imageFormat);
    });

    rows.push(`[tr]${cells.map(cell => `[td]${cell || ' '}[/td]`).join('')}[/tr]`);
  }

  return `[table]\n${rows.join('\n')}\n[/table]`;
}

function exportParagraphToNGA(node: TiptapNode): string {
  if (!node.content) {
    return '';
  }

  return node.content
    .map(child => exportTextContentToNGA(child))
    .filter(Boolean)
    .join('');
}

function exportTextContentToNGA(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    let text = node.text;

    if (node.marks) {
      node.marks.forEach(mark => {
        switch (mark.type) {
          case 'bold':
            text = `[b]${text}[/b]`;
            break;
          case 'italic':
            text = `[i]${text}[/i]`;
            break;
          case 'underline':
            text = `[u]${text}[/u]`;
            break;
          case 'strike':
            text = `[del]${text}[/del]`;
            break;
          case 'link': {
            const href = mark.attrs?.href || '';
            text = `[url=${href}]${text}[/url]`;
            break;
          }
          case 'linkMark': {
            const target = mark.attrs?.target || '';
            text = `[url=${target}]${text}[/url]`;
            break;
          }
          case 'highlight':
            text = `[color=orange]${text}[/color]`;
            break;
        }
      });
    }

    return text;
  }

  if (node.content) {
    return node.content
      .map(child => exportTextContentToNGA(child))
      .filter(Boolean)
      .join('');
  }

  return '';
}

function exportHeadingToNGA(node: TiptapNode): string {
  const level = (node.attrs?.level as number) || 1;
  const content = exportParagraphToNGA(node);

  if (!content) return '';

  const sizes = ['', '', 'size=150%', 'size=133%', 'size=117%', 'size=100%', 'size=83%'];
  const size = sizes[level] || 'size=100%';

  return `[${size}][b]${content}[/b][/${size.replace('=', '==')}][/size]`;
}

function exportBlockquoteToNGA(node: TiptapNode): string {
  const content = exportParagraphToNGA(node);
  return content ? `[quote]${content}[/quote]` : '';
}

function exportListToNGA(node: TiptapNode): string {
  if (!node.content) return '';

  const isOrdered = node.type === 'orderedList';
  const items: string[] = [];

  node.content.forEach(item => {
    if (item.type === 'listItem' && item.content) {
      const content = item.content
        .map(child => exportNodeToNGA(child, 'standard', 'bbcode'))
        .filter(Boolean)
        .join('');
      if (content) {
        items.push(isOrdered ? `[*]${content}` : `[*]${content}`);
      }
    }
  });

  return `[list]\n${items.join('\n')}\n[/list]`;
}

function exportTaskListToNGA(node: TiptapNode): string {
  if (!node.content) return '';

  const items: string[] = [];

  node.content.forEach(item => {
    if (item.type === 'taskItem' && item.content) {
      const checked = item.attrs?.checked ? '✓' : '○';
      const content = item.content
        .map(child => exportNodeToNGA(child, 'standard', 'bbcode'))
        .filter(Boolean)
        .join('');
      items.push(`${checked} ${content}`);
    }
  });

  return items.join('\n');
}

function exportGenericNodeToNGA(node: TiptapNode): string {
  if (node.content) {
    return node.content
      .map(child => exportNodeToNGA(child, 'standard', 'bbcode'))
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
