/**
 * 文档分类类型
 * 只有两种：story（正文）和 material（资料）
 */
export type DocumentCategory = 'story' | 'material';

/**
 * 资料类型
 * 保持细分，每种类型有实际意义
 */
export type MaterialType =
  | 'character' // 角色设定
  | 'location' // 地点设定
  | 'item' // 物品设定
  | 'worldview' // 世界观设定（新增）
  | 'outline' // 大纲（新增）
  | 'timeline' // 时间线
  | 'note'; // 笔记

/**
 * 资源类型
 */
export type AssetType =
  | 'image' // 图片
  | 'document' // 文档
  | 'audio' // 音频
  | 'video'; // 视频

/**
 * 文档元数据（统一格式）
 * 适用于正文和资料
 */
export interface DocumentMeta {
  /** 唯一标识符 */
  id: string;
  /** 文档标题 */
  title: string;
  /** 文档分类 */
  category: DocumentCategory;

  /** 资料类型（仅资料文档需要） */
  materialType?: MaterialType;

  /** 章节编号（仅正文需要，向后兼容） */
  number?: number;
  /** 章节状态（仅正文需要） */
  status?: 'draft' | 'revising' | 'final';

  /** 逻辑文件夹路径（多级用 "/" 分隔，如 "第一卷/第一章"） */
  folder?: string;
  /** 在当前文件夹内的排序 */
  order: number;

  /** 字数统计 */
  wordCount: number;

  /** 创建时间 (ISO 8601) */
  created: string;
  /** 最后修改时间 (ISO 8601) */
  modified: string;

  /** 相对文件路径 */
  path: string;
}

/**
 * 工作区元数据
 * 存储在 workspace.json 中
 */
export interface WorkspaceMeta {
  /** 数据结构版本号（整数递增） */
  schemaVersion: number;
  /** 唯一标识符 */
  id: string;
  /** 作品标题 */
  title: string;
  /** 作者 */
  author?: string;
  /** 体裁（小说/散文/剧本） */
  genre?: string;
  /** 简介 */
  description?: string;

  /** 总字数 */
  wordCount: number;
  /** 章节数 */
  chapterCount: number;

  /** 创建时间 (ISO 8601) */
  created: string;
  /** 最后修改时间 (ISO 8601) */
  modified: string;
}

/**
 * 资源元数据
 */
export interface AssetMeta {
  /** 唯一标识符 */
  id: string;
  /** 资源类型 */
  type: AssetType;
  /** 相对路径 */
  path: string;
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  mimeType: string;

  /** 图片宽度（仅图片） */
  width?: number;
  /** 图片高度（仅图片） */
  height?: number;

  /** 创建时间 (ISO 8601) */
  created: string;
  /** 最后修改时间 (ISO 8601) */
  modified: string;

  /** 引用该资源的文档 ID 列表 */
  usedBy: string[];
}

/**
 * 文档数据结构
 * 存储在 .ud 文件中
 */
export interface DocumentData<TMeta = DocumentMeta> {
  /** 数据结构版本号（整数递增） */
  schemaVersion: number;
  /** 文档类型标识 */
  type: 'story' | MaterialType;
  /** 元数据 */
  meta: TMeta;
  /** 块列表 */
  blocks: import('./block').Block[];
  /** 布局行 */
  layoutRows: import('./block').LayoutRow[];
}
