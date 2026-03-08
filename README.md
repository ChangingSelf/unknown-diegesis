# 未知叙事 - 小说块编辑器

一个基于 Markdown + 块编辑 + 双链的桌面端小说编辑器。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面应用**: Electron
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **包管理**: Yarn

## 开发环境设置

### 环境要求

- Node.js >= 18.0.0
- Yarn >= 1.22.0

### 安装依赖

```bash
yarn install
```

### 开发模式

启动开发服务器（Vite + Electron）：

```bash
yarn dev
```

### 构建

构建生产版本：

```bash
yarn build
```

### 代码检查

运行 ESLint：

```bash
yarn lint
```

类型检查：

```bash
yarn type-check
```

## 项目结构

```
unknown-diegesis/
├── electron/                 # Electron 主进程代码
│   ├── main.ts              # 主进程入口
│   └── preload.ts           # 预加载脚本
├── src/                     # React 应用代码
│   ├── App.tsx              # 应用根组件
│   ├── main.tsx             # React 入口
│   ├── index.css            # 全局样式
│   └── ...
├── docs/                    # 项目文档
│   └── 开发方案.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 开发计划

- [x] 项目基础框架搭建
- [x] tiptap 编辑器集成
- [x] 工作区基本功能
- [ ] 标签页
- [ ] Markdown 解析和渲染
- [x] 本地数据存储
- [ ] 导出功能
- [ ] 导入功能
- [ ] 粘贴NGA网页内容到编辑器
- [x] 章节管理
- [x] 图文混排
- [x] 差分管理
- [x] 图床链接管理
- [x] 图片粘贴支持
- [ ] 类似PicGo，手动上传图片到图床并管理链接
- [ ] vscode安科助手差分文件导入
- [ ] 一键复制为NGA代码
- [ ] 自动排版：自动加粗骰点、选项、调整图片大小、字体
- [ ] 骰点块
- [ ] 更新热力图
- [ ] 双链功能
- [ ] 章节标签

## 许可证

MIT
