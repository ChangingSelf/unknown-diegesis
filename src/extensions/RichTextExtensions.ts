/**
 * 富文本扩展配置
 * 集成颜色、字体样式、高亮和 Markdown 导出功能
 */

import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Markdown } from 'tiptap-markdown';

export const richTextExtensions = [
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  Markdown.configure({
    html: true,
    tightLists: true,
  }),
];
