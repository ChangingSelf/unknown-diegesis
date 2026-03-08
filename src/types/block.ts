import { TiptapContent } from './tiptap';
import { ImageBlockContent } from './image';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'quote'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'horizontalRule'
  | 'dice'
  | 'image'
  | 'layoutRow';

export interface DiceBlockData {
  formula: string;
  result?: number;
  rolledAt?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: TiptapContent;
  references?: string[];
  referencedBy?: string[];
  layoutRowId?: string;
  layoutColumnId?: string;
  diceData?: DiceBlockData;
  imageContent?: ImageBlockContent;
  metadata?: {
    tags?: string[];
    created?: Date;
    modified?: Date;
  };
}

// 文档数据结构
export interface Document {
  id: string;
  title: string;
  blocks: Block[]; // 块列表
  created: Date;
  modified: Date;
  filePath?: string | null; // 文件路径
  fileName?: string; // 文件名
  fileFormat?: 'md' | 'udn' | 'txt'; // 文件格式
  lastSaved?: Date | null; // 最后保存时间
  isModified?: boolean; // 是否已修改
}

// 布局列数据结构
export interface LayoutColumn {
  id: string; // 列唯一标识
  width: number; // 宽度百分比 (0-100)
  blockIds: string[]; // 该列包含的块 ID 列表
}

// 布局行数据结构
export interface LayoutRow {
  id: string; // 行唯一标识
  type: 'row'; // 类型标记
  columns: LayoutColumn[]; // 列数组，长度 1-3
}

// 文件操作结果
export interface FileOperationResult {
  success: boolean;
  path?: string;
  content?: string;
  error?: string;
}

// 保存状态
export type SaveStatus = 'saved' | 'saving' | 'error' | 'modified';

// 文件状态
export interface FileState {
  currentFilePath: string | null;
  isModified: boolean;
  lastSavedTime: Date | null;
  autoSaveEnabled: boolean;
  fileFormat: 'md' | 'udn' | 'txt';
  saveStatus: SaveStatus;
}
