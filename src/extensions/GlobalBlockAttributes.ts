import { Extension } from '@tiptap/core';

export default Extension.create({
  name: 'GlobalBlockAttributes',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'taskList'],
        attributes: {
          id: {
            default: null,
            parseHTML: element => element.getAttribute('data-block-id'),
            renderHTML: attributes => {
              if (!attributes?.id) return {};
              return { 'data-block-id': attributes.id };
            },
          },
          created: {
            default: null,
            parseHTML: element => element.getAttribute('data-created'),
            renderHTML: attributes => {
              if (!attributes.created) return {};
              return { 'data-created': attributes.created };
            },
          },
          modified: {
            default: null,
            parseHTML: element => element.getAttribute('data-modified'),
            renderHTML: attributes => {
              if (!attributes.modified) return {};
              return { 'data-modified': attributes.modified };
            },
          },
          references: {
            default: [],
            parseHTML: element => {
              const refs = element.getAttribute('data-references');
              return refs ? JSON.parse(refs) : [];
            },
            renderHTML: attributes => {
              if (!attributes.references || attributes.references.length === 0) return {};
              return { 'data-references': JSON.stringify(attributes.references) };
            },
          },
          referencedBy: {
            default: [],
            parseHTML: element => {
              const refs = element.getAttribute('data-referenced-by');
              return refs ? JSON.parse(refs) : [];
            },
            renderHTML: attributes => {
              if (!attributes.referencedBy || attributes.referencedBy.length === 0) return {};
              return { 'data-referenced-by': JSON.stringify(attributes.referencedBy) };
            },
          },
        },
      },
    ];
  },
});
