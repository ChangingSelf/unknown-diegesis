import type { TiptapDocument, TiptapNode } from '@/types/tiptap';

function exportTextContent(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    let text = node.text;

    // 处理文本标记
    if (node.marks) {
      node.marks.forEach(mark => {
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`;
            break;
          case 'italic':
            text = `*${text}*`;
            break;
          case 'strike':
            text = `~~${text}~~`;
            break;
          case 'underline':
            text = `<u>${text}</u>`;
            break;
          case 'code':
            text = `\`${text}\``;
            break;
          case 'highlight':
            text = `==${text}==`;
            break;
        }
      });
    }

    return text;
  }

  if (node.content) {
    return node.content.map(exportTextContent).join('');
  }

  return '';
}

function exportNodeToMarkdown(node: TiptapNode): string {
  switch (node.type) {
    case 'blockWrapper':
      return exportBlockWrapperToMarkdown(node);
    case 'diceBlock':
      return exportDiceBlockToMarkdown(node);
    case 'imageBlock':
      return exportImageBlockToMarkdown(node);
    case 'layoutRow':
      return exportLayoutRowToMarkdown(node);
    case 'paragraph':
      return exportParagraphToMarkdown(node);
    case 'heading':
      return exportHeadingToMarkdown(node);
    case 'blockquote':
      return exportBlockquoteToMarkdown(node);
    case 'bulletList':
    case 'orderedList':
      return exportListToMarkdown(node);
    case 'hardBreak':
      return '\n';
    case 'horizontalRule':
      return '\n---\n';
    default:
      return exportGenericNodeToMarkdown(node);
  }
}

function exportBlockWrapperToMarkdown(node: TiptapNode): string {
  if (!node.content || node.content.length === 0) {
    return '';
  }

  const innerContent = node.content
    .map(child => exportNodeToMarkdown(child))
    .filter(Boolean)
    .join('\n');

  return innerContent + '\n\n';
}

function exportDiceBlockToMarkdown(node: TiptapNode): string {
  const attrs = node.attrs || {};
  const formula = String(attrs.formula || '1d20');
  const result = attrs.result;

  if (result !== null && result !== undefined) {
    return `【${formula}=${result}】\n\n`;
  }
  return `【${formula}】\n\n`;
}

function exportImageBlockToMarkdown(node: TiptapNode): string {
  const attrs = node.attrs || {};
  const src = String(attrs.src || '');
  const alt = attrs.alt ? String(attrs.alt) : '';

  if (!src) {
    return '';
  }

  return `![${alt}](${src})\n\n`;
}

function exportLayoutRowToMarkdown(node: TiptapNode): string {
  if (!node.content || node.content.length === 0) {
    return '';
  }

  const columns = node.content.filter(col => col.type === 'layoutColumn');

  if (columns.length <= 1) {
    // 单列布局，直接导出内容
    const firstColumn = columns[0];
    if (firstColumn?.content) {
      return firstColumn.content
        .map(child => exportNodeToMarkdown(child))
        .filter(Boolean)
        .join('\n\n');
    }
    return '';
  }

  // 多列布局，使用 HTML 表格
  const rows: string[] = [];
  const maxBlocks = Math.max(...columns.map(col => col.content?.length || 0));

  for (let i = 0; i < maxBlocks; i++) {
    const cells = columns.map(col => {
      const block = col.content?.[i];
      if (!block) return '';
      const content = exportNodeToMarkdown(block);
      return content.replace(/\n/g, '<br>');
    });

    if (cells.some(cell => cell.trim())) {
      rows.push(`| ${cells.map(cell => cell || ' ').join(' | ')} |`);
    }
  }

  // 添加表头
  if (rows.length > 0) {
    const header = columns.map(() => '---').join(' | ');
    rows.splice(1, 0, `| ${header} |`);
  }

  return rows.join('\n') + '\n\n';
}

function exportParagraphToMarkdown(node: TiptapNode): string {
  if (!node.content || node.content.length === 0) {
    return '\n';
  }

  const text = node.content.map(exportTextContent).join('');
  return text + '\n\n';
}

function exportHeadingToMarkdown(node: TiptapNode): string {
  const level = (node.attrs?.level as number) || 1;
  const text = node.content ? node.content.map(exportTextContent).join('') : '';

  if (!text) return '';

  return `${'#'.repeat(level)} ${text}\n\n`;
}

function exportBlockquoteToMarkdown(node: TiptapNode): string {
  if (!node.content || node.content.length === 0) {
    return '';
  }

  const text = node.content
    .map(child => exportNodeToMarkdown(child))
    .filter(Boolean)
    .join('')
    .trim();

  if (!text) return '';

  const lines = text.split('\n');
  const quoted = lines.map(line => `> ${line}`).join('\n');
  return quoted + '\n\n';
}

function exportListToMarkdown(node: TiptapNode): string {
  if (!node.content) return '';

  const isOrdered = node.type === 'orderedList';
  const items: string[] = [];

  node.content.forEach((item, index) => {
    if (item.type === 'listItem' && item.content) {
      const content = item.content
        .map(child => exportNodeToMarkdown(child))
        .filter(Boolean)
        .join('\n');
      if (content) {
        const prefix = isOrdered ? `${index + 1}.` : '-';
        items.push(`${prefix} ${content.trim()}`);
      }
    }
  });

  return items.join('\n') + '\n\n';
}

function exportGenericNodeToMarkdown(node: TiptapNode): string {
  if (node.content) {
    return node.content
      .map(child => exportNodeToMarkdown(child))
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

export function exportMarkdownFromTiptap(document: TiptapDocument): string {
  if (!document.content || document.content.length === 0) {
    return '';
  }

  const lines = document.content.map(node => exportNodeToMarkdown(node)).filter(Boolean);

  return lines.join('').trim();
}
