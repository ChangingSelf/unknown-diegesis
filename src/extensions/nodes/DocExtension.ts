import { Node } from '@tiptap/core';

export const DocExtension = Node.create({
  name: 'doc',
  topNode: true,
  content:
    '(paragraph | heading | blockquote | bulletList | orderedList | taskList | horizontalRule | diceBlock | imageBlock | layoutRow)+',
});

export default DocExtension;
