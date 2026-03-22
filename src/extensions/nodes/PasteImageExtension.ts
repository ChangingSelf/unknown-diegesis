import FileHandler from '@tiptap/extension-file-handler';

export const PasteImageExtension = FileHandler.configure({
  allowedMimeTypes: ['image/*'],
  onPaste: (editor, files) => {
    console.log('[PasteImageExtension] onPaste triggered', {
      filesCount: files.length,
      files: files.map((f: { name: string; type: string; size: number }) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    });
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;
          const workspacePath = window.__WORKSPACE_PATH__;

          if (!workspacePath) {
            await window.electronAPI.dialogShowError(
              '无法保存图片',
              '请先打开工作区，再粘贴图片。'
            );
            return;
          }

          try {
            const result = await window.electronAPI.imageSave(workspacePath, base64Data, file.name);

            if (result.success && result.relativePath) {
              editor.commands.insertContent({
                type: 'imageBlock',
                attrs: {
                  src: result.relativePath,
                  alt: file.name || 'Pasted image',
                  originalName: file.name,
                },
              });
              return;
            } else {
              await window.electronAPI.dialogShowError('保存图片失败', result.error || '未知错误');
              return;
            }
          } catch (error) {
            await window.electronAPI.dialogShowError(
              '保存图片失败',
              error instanceof Error ? error.message : '未知错误'
            );
            return;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  },
  onDrop: (editor, files, pos) => {
    console.log('[PasteImageExtension] onDrop triggered', {
      filesCount: files.length,
      files: files.map((f: { name: string; type: string; size?: number }) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    });
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;
          const workspacePath = window.__WORKSPACE_PATH__;

          if (!workspacePath) {
            await window.electronAPI.dialogShowError(
              '无法保存图片',
              '请先打开工作区，再拖拽图片。'
            );
            return;
          }

          try {
            const result = await window.electronAPI.imageSave(workspacePath, base64Data, file.name);

            if (result.success && result.relativePath) {
              const { tr } = editor.state;
              tr.insert(
                pos,
                editor.schema.nodes.imageBlock.create({
                  src: result.relativePath,
                  alt: file.name || 'Dropped image',
                  originalName: file.name,
                })
              );
              editor.view.dispatch(tr);
              return;
            } else {
              await window.electronAPI.dialogShowError('保存图片失败', result.error || '未知错误');
              return;
            }
          } catch (error) {
            await window.electronAPI.dialogShowError(
              '保存图片失败',
              error instanceof Error ? error.message : '未知错误'
            );
            return;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  },
});

export default PasteImageExtension;
