// 块类型定义
export type BlockType = 'heading' | 'paragraph' | 'quote' | 'bulletList' | 'orderedList' | 'taskList' | 'horizontalRule';

// 块数据结构
export interface Block {
  id: string; // 块唯一标识（用于双链关联）
  type: BlockType; // 块类型
  content: string; // 存储 Markdown 源码（如 "# 标题" 或 "正文 [[链接]]"）
  references?: string[]; // 引用的其他块 ID（正向双链）
  referencedBy?: string[]; // 被引用的块 ID（反向双链）
  metadata?: {
    // 预留元数据字段
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
}
