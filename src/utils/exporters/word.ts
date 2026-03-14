import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import type { TiptapDocument, TiptapNode } from '@/types/tiptap';

export async function exportWordFromTiptap(document: TiptapDocument): Promise<Uint8Array> {
  if (!document.content || document.content.length === 0) {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [new Paragraph({})],
        },
      ],
    });
    return Packer.toBuffer(doc);
  }

  const children: Paragraph[] = [];

  for (const node of document.content) {
    const paragraphs = convertNodeToParagraphs(node);
    children.push(...paragraphs);
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function convertNodeToParagraphs(node: TiptapNode): Paragraph[] {
  switch (node.type) {
    case 'blockWrapper':
      return convertBlockWrapperToParagraphs(node);
    case 'diceBlock':
      return convertDiceBlockToParagraphs(node);
    case 'imageBlock':
      return convertImageBlockToParagraphs(node);
    case 'layoutRow':
      return convertLayoutRowToParagraphs(node);
    case 'paragraph':
      return convertParagraphToParagraphs(node);
    case 'heading':
      return convertHeadingToParagraphs(node);
    case 'blockquote':
      return convertBlockquoteToParagraphs(node);
    case 'bulletList':
    case 'orderedList':
      return convertListToParagraphs(node);
    case 'horizontalRule':
      return [new Paragraph({ children: [new TextRun({ text: '' })] })];
    default:
      return convertGenericNodeToParagraphs(node);
  }
}

function convertBlockWrapperToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content || node.content.length === 0) {
    return [];
  }

  const paragraphs: Paragraph[] = [];

  for (const child of node.content) {
    const childParagraphs = convertNodeToParagraphs(child);
    paragraphs.push(...childParagraphs);
  }

  return paragraphs;
}

function convertDiceBlockToParagraphs(node: TiptapNode): Paragraph[] {
  const attrs = node.attrs || {};
  const formula = String(attrs.formula || '1d20');
  const result = attrs.result;

  let text = `【${formula}`;
  if (result !== null && result !== undefined) {
    text += `=${result}`;
  }
  text += '】';

  return [
    new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
        }),
      ],
    }),
  ];
}

function convertImageBlockToParagraphs(node: TiptapNode): Paragraph[] {
  const attrs = node.attrs || {};
  const src = String(attrs.src || '');
  const alt = attrs.alt ? String(attrs.alt) : '';

  if (!src) {
    return [];
  }

  const fileName = src.split(/[/\\]/).pop() || 'image';

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `[图片: ${alt || fileName}]`,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];
}

function convertLayoutRowToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content || node.content.length === 0) {
    return [];
  }

  const columns = node.content.filter(col => col.type === 'layoutColumn');

  if (columns.length <= 1) {
    const firstColumn = columns[0];
    if (firstColumn?.content) {
      const paragraphs: Paragraph[] = [];
      for (const block of firstColumn.content) {
        paragraphs.push(...convertNodeToParagraphs(block));
      }
      return paragraphs;
    }
    return [];
  }

  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    if (column?.content) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `【列 ${i + 1}】`,
              bold: true,
            }),
          ],
        })
      );

      for (const block of column.content) {
        paragraphs.push(...convertNodeToParagraphs(block));
      }
    }
  }

  return paragraphs;
}

function convertParagraphToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content || node.content.length === 0) {
    return [new Paragraph({ children: [new TextRun({ text: '' })] })];
  }

  const textRuns = convertTextContent(node.content);

  return [
    new Paragraph({
      children: textRuns,
    }),
  ];
}

function convertTextContent(nodes: TiptapNode[]): TextRun[] {
  const textRuns: TextRun[] = [];

  for (const node of nodes) {
    if (node.type === 'text' && node.text) {
      const isBold = node.marks?.some(mark => mark.type === 'bold') ?? false;
      const isItalic = node.marks?.some(mark => mark.type === 'italic') ?? false;
      const isStrike = node.marks?.some(mark => mark.type === 'strike') ?? false;

      const textRun = new TextRun({
        text: node.text,
        bold: isBold,
        italics: isItalic,
        strike: isStrike,
      });

      textRuns.push(textRun);
    } else if (node.type === 'hardBreak') {
      textRuns.push(
        new TextRun({
          text: '',
          break: 1,
        })
      );
    } else if (node.content && Array.isArray(node.content)) {
      textRuns.push(...convertTextContent(node.content));
    }
  }

  return textRuns;
}

function convertHeadingToParagraphs(node: TiptapNode): Paragraph[] {
  const level = (node.attrs?.level as number) || 1;
  const text = node.content ? node.content.map(n => (n.text ? n.text : '')).join('') : '';

  if (!text) {
    return [];
  }

  const headingLevelMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };

  return [
    new Paragraph({
      text,
      heading: headingLevelMap[level] || HeadingLevel.HEADING_1,
      spacing: {
        before: 200,
        after: 200,
      },
    }),
  ];
}

function convertBlockquoteToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content || node.content.length === 0) {
    return [];
  }

  const paragraphs: Paragraph[] = [];

  for (const child of node.content) {
    const childParagraphs = convertNodeToParagraphs(child);
    paragraphs.push(...childParagraphs);
  }

  return paragraphs;
}

function convertListToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content) {
    return [];
  }

  const isOrdered = node.type === 'orderedList';
  const paragraphs: Paragraph[] = [];

  node.content.forEach((item, index) => {
    if (item.type === 'listItem' && item.content) {
      const prefix = isOrdered ? `${index + 1}.` : '•';

      for (let i = 0; i < item.content.length; i++) {
        const child = item.content[i];
        const childParagraphs = convertNodeToParagraphs(child);

        for (let j = 0; j < childParagraphs.length; j++) {
          const p = childParagraphs[j];
          if (i === 0 && j === 0) {
            const prefixRun = new TextRun({
              text: `${prefix} `,
              bold: true,
            });
            paragraphs.push(
              new Paragraph({
                children: [prefixRun],
              })
            );
          }
          paragraphs.push(p);
        }
      }
    }
  });

  return paragraphs;
}

function convertGenericNodeToParagraphs(node: TiptapNode): Paragraph[] {
  if (node.content && Array.isArray(node.content)) {
    const paragraphs: Paragraph[] = [];
    for (const child of node.content) {
      paragraphs.push(...convertNodeToParagraphs(child));
    }
    return paragraphs;
  }
  return [];
}
