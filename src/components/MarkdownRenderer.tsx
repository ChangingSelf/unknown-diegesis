import React from 'react';
import { Block } from '../types/block';

interface MarkdownRendererProps {
  block: Block;
  onEdit: () => void;
}

// 简单的Markdown解析器（实际项目中应使用更完善的库如Lute）
const parseMarkdown = (content: string): { html: string; isHeading: boolean } => {
  let html = content;
  let isHeading = false;

  // 处理标题
  if (content.startsWith('#')) {
    const match = content.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      html = `<h${level}>${text}</h${level}>`;
      isHeading = true;
    }
  }
  // 处理引用
  else if (content.startsWith('>')) {
    const lines = content.split('\n');
    const quotedLines = lines.map(line => {
      if (line.startsWith('>')) {
        return line.substring(1).trim();
      }
      return line;
    });
    html = `<blockquote>${quotedLines.join('<br>')}</blockquote>`;
  }
  // 处理列表
  else if (content.startsWith('-') || content.startsWith('*') || /^\d+\./.test(content)) {
    const lines = content.split('\n');
    const isOrdered = /^\d+\./.test(lines[0]);
    const listTag = isOrdered ? 'ol' : 'ul';

    const listItems = lines.map(line => {
      let itemText = line;
      if (isOrdered) {
        itemText = line.replace(/^\d+\.\s*/, '');
      } else {
        itemText = line.replace(/^[-*]\s*/, '');
      }
      return `<li>${itemText}</li>`;
    });

    html = `<${listTag}>${listItems.join('')}</${listTag}>`;
  }
  // 处理分割线
  else if (content.trim() === '---' || content.trim() === '***') {
    html = '<hr>';
  }
  // 处理普通段落
  else {
    // 处理粗体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // 处理斜体
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // 处理行内代码
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    // 处理链接
    html = html.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    // 处理双链（预留）
    html = html.replace(/\[\[(.+?)\]\]/g, '<span class="wiki-link">[[$1]]</span>');

    html = `<p>${html}</p>`;
  }

  return { html, isHeading };
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ block, onEdit }) => {
  if (block.type === 'dice') {
    return (
      <div
        className="dice-block-view p-4 bg-paper-50 rounded-lg border border-paper-300 cursor-pointer mb-2"
        onClick={onEdit}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-semibold text-charcoal-800">
              {block.diceData?.formula || '1d20'}
            </span>
            <span className="ml-2 text-charcoal-500">=</span>
            <span className="ml-2 text-2xl font-bold text-gold-600">
              {block.diceData?.result ?? '?'}
            </span>
          </div>
          {block.diceData?.result !== undefined && (
            <div className="text-sm text-charcoal-500">
              {new Date(block.diceData.rolledAt || '').toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      </div>
    );
  }

  let html = block.content;
  let isHeading = false;

  const isHTML = block.content.includes('<') && block.content.includes('>');

  if (isHTML) {
    html = block.content;
    isHeading = /<h[1-6]>/.test(html);
  } else {
    const parsed = parseMarkdown(block.content);
    html = parsed.html;
    isHeading = parsed.isHeading;
  }

  return (
    <div
      className={`markdown-renderer ${isHeading ? 'heading-block' : ''} mb-2 cursor-pointer`}
      onClick={onEdit}
    >
      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default MarkdownRenderer;
