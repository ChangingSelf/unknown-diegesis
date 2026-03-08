import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const PasteImageExtension = Extension.create({
  name: 'pasteImage',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pasteImage'),
        props: {
          handlePaste: (view, event) => {
            const items = event.clipboardData?.items;
            if (!items) return false;

            for (let i = 0; i < items.length; i++) {
              const item = items[i];

              if (item.type.indexOf('image') === 0) {
                event.preventDefault();

                const file = item.getAsFile();
                if (!file) continue;

                const reader = new FileReader();
                reader.onload = e => {
                  const dataUrl = e.target?.result as string;

                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.imageBlock.create({
                        src: dataUrl,
                        alt: file.name || 'Pasted image',
                      })
                    )
                  );
                };
                reader.readAsDataURL(file);

                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});

export default PasteImageExtension;
