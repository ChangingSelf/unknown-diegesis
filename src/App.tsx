import React from 'react';
import { useBlockManager } from './hooks/useBlockManager';
import { BlockList } from './components/BlockList';

function App() {
  // 初始化一些示例内容
  const initialContent = `# 未知叙事编辑器

这是一个基于 **tiptap** 的块编辑器，支持 Markdown 语法和块编辑功能。

## 主要功能

- **块编辑**：每个内容块可以独立编辑
- **Markdown 支持**：支持常见的 Markdown 语法
- **拖拽排序**：可以通过拖拽调整块的顺序
- **编辑态-渲染态切换**：点击块进入编辑状态，失焦后自动切换回渲染状态

## 使用方法

1. 点击任意块进入编辑状态
2. 编辑完成后，点击其他地方或按 ESC 退出编辑状态
3. 拖拽块左侧的拖拽手柄可以调整块的顺序
4. 使用底部的按钮添加不同类型的新块

> 这是一个引用块，展示不同类型的块样式

## 列表示例

### 无序列表

- 第一项
- 第二项
  - 嵌套项
  - 另一个嵌套项
- 第三项

### 有序列表

1. 第一步
2. 第二步
3. 第三步

---

感谢使用未知叙事编辑器！`;

  const {
    blocks,
    updateBlock,
    addBlock,
    reorderBlocks,
    getMarkdown,
    exportAsJSON,
    importFromJSON,
  } = useBlockManager(initialContent);

  const handleExport = () => {
    const markdown = getMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.json')) {
        importFromJSON(content);
      } else {
        // 简单的Markdown导入
        window.location.reload(); // 简单重载以重新初始化
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            未知叙事 - 小说块编辑器
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            基于 Markdown + 块编辑 + 双链的桌面端编辑器
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              文档编辑
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
              >
                导出 Markdown
              </button>
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                导出 JSON
              </button>
              <label className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm cursor-pointer">
                导入文件
                <input
                  type="file"
                  accept=".md,.json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <BlockList
            blocks={blocks}
            onUpdateBlock={updateBlock}
            onAddBlock={addBlock}
            onReorderBlocks={reorderBlocks}
          />
        </div>
      </main>
    </div>
  );
}

export default App;