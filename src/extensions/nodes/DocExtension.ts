import { Node } from '@tiptap/core';

export const DocExtension = Node.create({
  name: 'doc',
  topNode: true,
  content: '(blockWrapper | diceBlock | imageBlock | layoutRow)+',
});

export default DocExtension;
