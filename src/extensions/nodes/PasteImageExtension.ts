import FileHandler from '@tiptap/extension-file-handler';

export const PasteImageExtension = FileHandler.configure({
  allowedMimeTypes: ['image/*'],
  onPaste: (editor, files) => {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          editor.commands.insertContent({
            type: 'imageBlock',
            attrs: {
              src: reader.result as string,
              alt: file.name || 'Pasted image',
            },
          });
        };
        reader.readAsDataURL(file);
      }
    }
  },
  onDrop: (editor, files, pos) => {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const { tr } = editor.state;
          tr.insert(
            pos,
            editor.schema.nodes.imageBlock.create({
              src: reader.result as string,
              alt: file.name || 'Dropped image',
            })
          );
          editor.view.dispatch(tr);
        };
        reader.readAsDataURL(file);
      }
    }
  },
});

export default PasteImageExtension;
