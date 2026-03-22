import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageBlockView from '@/components/ImageBlockView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      insertImageBlock: (attrs?: { src?: string; alt?: string }) => ReturnType;
    };
  }
}

/**
 * 基于官方 Image 扩展的自定义图片块
 * 继承官方扩展的基础属性解析，增加块级特性和自定义属性
 */
export const ImageBlockExtension = Image.extend({
  name: 'imageBlock',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      // 保留官方属性: src, alt, title, width, height

      // 自定义属性
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-image-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-image-id': attributes.id };
        },
      },
      caption: {
        default: '',
        parseHTML: element => element.getAttribute('data-caption') || '',
        renderHTML: attributes => {
          if (!attributes.caption) return {};
          return { 'data-caption': attributes.caption };
        },
      },
      layout: {
        default: 'full',
        parseHTML: element => element.getAttribute('data-layout') || 'full',
        renderHTML: attributes => {
          return { 'data-layout': attributes.layout };
        },
      },
      originalName: {
        default: '',
        parseHTML: element => element.getAttribute('data-original-name') || '',
        renderHTML: attributes => {
          if (!attributes.originalName) return {};
          return { 'data-original-name': attributes.originalName };
        },
      },
    };
  },
  resize: {
    enabled: true,
    alwaysPreserveAspectRatio: true,
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="image-block"]' },
      { tag: 'img[data-block]' }, // 兼容旧数据
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'image-block' }, ['img', HTMLAttributes]];
  },

  addCommands() {
    return {
      insertImageBlock:
        attrs =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs?.src || '',
              alt: attrs?.alt || '',
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});

export default ImageBlockExtension;
