# AGENTS.md - 未知叙事项目开发指南

本文档为 AI 编码代理提供项目开发规范。

---

## 1. 项目概述

**项目名称**：未知叙事 (unknown-diegesis)
**类型**：桌面端小说块编辑器
**技术栈**：Electron 28 + React 18 + TypeScript + Vite + Tiptap + Tailwind CSS
**包管理器**：Yarn 4 (PnP 模式)

---

## 2. 开发命令

### 常用命令

```bash
# 开发模式（启动 Vite + Electron）
yarn dev

# 生产构建
yarn build

# 预览生产构建
yarn preview

# 类型检查
yarn type-check

# 代码检查
yarn lint

# 自动修复 lint 错误
yarn lint:fix

# 代码格式化
yarn format

# 格式检查（不修改）
yarn format:check
```

### 测试命令

> 注意：项目当前未配置测试框架。如需添加测试，推荐使用：
>
> - 前端组件：Vitest + React Testing Library
> - Electron：Electron Testing Library
>
> 单个测试文件运行示例（假设使用 vitest）：
>
> ```bash
> > npx vitest run src/utils/exporters/markdown.test.ts
> npx vitest run --filter "exporters"
> ```

---

## 3. 项目结构

```
unknown-diegesis/
├── electron/               # Electron 主进程
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 预加载脚本
├── src/                   # React 渲染进程
│   ├── components/       # UI 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── services/         # 业务服务
│   ├── utils/            # 工具类
│   ├── types/            # 类型定义
│   ├── extensions/       # Tiptap 扩展
│   ├── App.tsx           # 根组件
│   └── main.tsx          # React 入口
├── docs/                  # 项目文档
└── dist/                  # 构建输出
```

### 路径别名

项目配置了以下路径别名：

| 别名             | 路径               |
| ---------------- | ------------------ |
| `@/*`            | `src/*`            |
| `@/components/*` | `src/components/*` |
| `@/utils/*`      | `src/utils/*`      |
| `@/types/*`      | `src/types/*`      |
| `@/hooks/*`      | `src/hooks/*`      |
| `@/services/*`   | `src/services/*`   |
| `@/core/*`       | `src/core/*`       |

---

## 4. 代码风格规范

### 4.1 TypeScript 规范

```typescript
// ✅ 正确：使用 interface 定义类型
interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
}

// ✅ 正确：使用 type 定义联合类型
export type BlockType = 'heading' | 'paragraph' | 'quote' | 'dice' | 'image';

// ✅ 正确：严格类型检查，不使用 any
function updateNodeContent(node: TiptapNode, content: TiptapNode[]): TiptapNode {
  return { ...node, content };
}
```

**禁止**：

- ❌ 使用 `any` 类型
- ❌ 使用 `@ts-ignore`
- ❌ 使用 `as` 类型断言（尽量避免）

### 4.2 命名规范

| 类型      | 规范                         | 示例                                  |
| --------- | ---------------------------- | ------------------------------------- |
| 文件名    | kebab-case                   | `file-service.ts`, `story-service.ts` |
| 组件名    | PascalCase                   | `EditorView.tsx`, `FileMenu.tsx`      |
| 类名      | PascalCase                   | `FileService`, `StoryService`         |
| 函数/方法 | camelCase                    | `getDocuments()`, `openFile()`        |
| 私有方法  | camelCase + 前缀 `_`（可选） | `_generateId()`                       |
| 常量      | UPPER_SNAKE_CASE             | `MAX_COLUMN_COUNT = 3`                |
| 接口      | PascalCase                   | `FileState`, `TiptapDocument`         |

### 4.3 导入规范

```typescript
// ✅ 正确：按顺序导入
// 1. React 相关
import React, { useState, useEffect } from 'react';

// 2. 第三方库
import { EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// 3. 项目内部 - 绝对路径别名
import { TiptapDocument } from '@/types/tiptap';
import { FileService } from '@/services/FileService';
import { exportMarkdownFromTiptap } from '@/utils/exporters/markdown';

// 4. 组件
import { EditorView } from '@/components/EditorView';

// 5. 类型（如果需要）
import type { DocumentMeta } from '@/types/document';

// 6. CSS/样式
import './index.css';

// ❌ 错误：相对路径与别名混用
// import FileService from '../services/FileService'; // 不推荐
```

### 4.4 组件规范

```typescript
// ✅ 正确：使用函数组件 + TypeScript
import React from 'react';
import { TiptapDocument } from '@/types/tiptap';

interface EditorViewProps {
  initialContent?: TiptapDocument;
  onContentChange?: (content: TiptapDocument) => void;
  placeholder?: string;
}

export const EditorView: React.FC<EditorViewProps> = ({
  initialContent,
  onContentChange,
  placeholder = '开始输入...',
}) => {
  // 组件逻辑
  return <div>...</div>;
};
```

### 4.5 服务类规范

```typescript
// ✅ 正确：服务类使用 JSDoc 注释
/**
 * 文件服务类
 * 负责文件操作和状态管理
 */
export class FileService {
  private fileState: FileState;
  private listeners: Set<(state: FileState) => void> = new Set();

  constructor() {
    this.fileState = {
      currentFilePath: null,
      isModified: false,
      // ...
    };
  }

  /**
   * 打开文件
   */
  async openFile(): Promise<FileOperationResult> {
    // ...
  }
}
```

### 4.6 工具函数规范

```typescript
// ✅ 正确：使用 JSDoc 说明函数用途
/**
 * 生成唯一 ID
 * @returns 唯一标识符字符串
 */
function generateId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

---

## 5. 错误处理规范

### 5.1 同步函数

```typescript
// ✅ 正确：返回 boolean 表示成功/失败
function saveDocument(doc: TiptapDocument): boolean {
  if (!doc.content) return false;
  // 保存逻辑
  return true;
}

// ✅ 正确：返回 null 表示失败
function getNodeById(doc: TiptapDocument, id: string): TiptapNode | undefined {
  return findNodeRecursive(doc.content, node => node.attrs?.id === id);
}
```

### 5.2 异步函数

```typescript
// ✅ 正确：返回结果对象
async function saveFile(content: string): Promise<FileOperationResult> {
  try {
    // 保存逻辑
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 5.3 React 组件错误边界

```typescript
// 推荐：为关键组件添加错误边界
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>出错了</div>;
    }
    return this.props.children;
  }
}
```

---

## 6. 状态管理

### 6.1 当前模式

项目使用 **Tiptap 单编辑器架构**，所有内容通过单个 Tiptap 编辑器实例管理：

```typescript
function App() {
  // 编辑器内容状态
  const [documentContent, setDocumentContent] = useState<TiptapDocument>(createEmptyDocument());

  // 使用 useRef 存储不触发重渲染的服务实例
  const fileServiceRef = useRef<FileService>(new FileService());
  const storyServiceRef = useRef<StoryService>(new StoryService());

  // 状态提升到根组件
  const [fileState, setFileState] = useState(fileServiceRef.current.getState());
}
```

### 6.2 编辑器架构

编辑器使用自定义 Tiptap 节点实现块级功能：

- `blockWrapper` - 包装段落、标题等文本块
- `diceBlock` - 骰点块
- `imageBlock` - 图片块
- `layoutRow` / `layoutColumn` - 布局行和列

每个节点通过 `ReactNodeViewRenderer` 渲染为 React 组件。

### 6.2 观察者模式

服务类使用观察者模式管理状态变化：

```typescript
// FileService 示例
private listeners: Set<(state: FileState) => void> = new Set();

subscribe(listener: (state: FileState) => void): () => void {
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);
}
```

---

## 7. Electron IPC 通信

### 7.1 渲染进程调用

```typescript
// ✅ 正确：通过 window.electronAPI 调用
const result = await window.electronAPI.fileOpen();
if (result.success) {
  // 处理文件内容
}
```

### 7.2 主进程处理

```typescript
// electron/main.ts
ipcMain.handle('file:open', async () => {
  try {
    const result = await dialog.showOpenDialog({...});
    return { success: true, path: result.filePaths[0], content: ... };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

---

## 8. CSS / 样式规范

### 8.1 Tailwind CSS

项目使用 **Tailwind CSS 4**，优先使用工具类：

```tsx
// ✅ 正确：使用 Tailwind 工具类
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <h1 className="text-xl font-semibold text-gray-900">标题</h1>
</div>

// ❌ 避免：内联样式
<div style={{ padding: '1rem' }}>
```

### 8.2 条件类名

```tsx
// ✅ 正确：使用模板字符串条件类名
<div className={`p-4 ${isActive ? 'bg-blue-500' : 'bg-gray-100'}`}>
```

---

## 9. Git 提交规范

### 9.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 9.2 Type 类型

| 类型       | 说明      |
| ---------- | --------- |
| `feat`     | 新功能    |
| `fix`      | Bug 修复  |
| `docs`     | 文档更新  |
| `style`    | 样式调整  |
| `refactor` | 代码重构  |
| `test`     | 测试相关  |
| `chore`    | 构建/工具 |

### 9.3 示例

```
feat(block): 添加块拖拽排序功能

- 支持普通拖拽进行块排序
- Alt+拖拽创建并列布局

Closes #123
```

---

## 10. 性能优化建议

1. **防抖处理**：用户输入使用防抖（如自动保存 3 秒延迟）
2. **useRef 优化**：不触发重渲染的值使用 useRef
3. **Memo 化**：复杂计算使用 useMemo，回调函数使用 useCallback
4. **虚拟列表**：大量块时考虑虚拟滚动

---

## 11. 安全规范

1. **XSS 防护**：用户输入需要过滤（推荐使用 DOMPurify）
2. **路径验证**：文件操作前验证路径安全性
3. **上下文隔离**：Electron 使用 contextIsolation: true

---

## 12. 参考资源

- [React 文档](https://react.dev)
- [Tiptap 文档](https://tiptap.dev)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Electron 文档](https://www.electronjs.org/docs)

---

> 最后更新：2026-03-08
> 项目版本：0.1.0
