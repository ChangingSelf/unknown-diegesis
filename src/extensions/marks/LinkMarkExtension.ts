import { Mark, mergeAttributes } from '@tiptap/core';

export interface LinkMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkMark: {
      setLinkMark: (attrs: { target: string; href?: string }) => ReturnType;
      unsetLinkMark: () => ReturnType;
    };
  }
}

export const LinkMark = Mark.create<LinkMarkOptions>({
  name: 'linkMark',

  priority: 1000,

  keepOnSplit: false,

  exitable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      target: {
        default: null,
        parseHTML: element => element.getAttribute('data-target'),
        renderHTML: attributes => {
          if (!attributes.target) return {};
          return { 'data-target': attributes.target };
        },
      },
      href: {
        default: null,
        parseHTML: element => element.getAttribute('data-href') || element.textContent,
        renderHTML: attributes => {
          if (!attributes.href) return {};
          return { 'data-href': attributes.href };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-wiki-link]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(
        { class: 'wiki-link', 'data-wiki-link': 'true' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setLinkMark:
        attrs =>
        ({ commands }) => {
          return commands.setMark(this.name, attrs);
        },
      unsetLinkMark:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export default LinkMark;
