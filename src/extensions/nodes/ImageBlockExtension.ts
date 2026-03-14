import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageBlockView from '@/components/ImageBlockView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      insertImageBlock: (attrs?: { src?: string; alt?: string }) => ReturnType;
    };
  }
}

export const ImageBlockExtension = Node.create({
  name: 'imageBlock',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-image-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-image-id': attributes.id };
        },
      },
      src: {
        default: '',
        parseHTML: element =>
          element.getAttribute('data-src') || element.querySelector('img')?.src || '',
        renderHTML: attributes => {
          return { 'data-src': attributes.src };
        },
      },
      alt: {
        default: '',
        parseHTML: element =>
          element.getAttribute('data-alt') || element.querySelector('img')?.alt || '',
        renderHTML: attributes => {
          return { 'data-alt': attributes.alt };
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
      width: {
        default: null,
        parseHTML: element => {
          const wAttr = element.getAttribute('data-width');
          return wAttr != null ? Number(wAttr) : null;
        },
        renderHTML: attributes => {
          if (attributes.width == null) return {};
          return { 'data-width': attributes.width };
        },
      },
      layout: {
        default: 'full',
        parseHTML: element => element.getAttribute('data-layout') || 'full',
        renderHTML: attributes => {
          return { 'data-layout': attributes.layout };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'image-block' }, HTMLAttributes)];
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
