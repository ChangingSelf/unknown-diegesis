import { AssetType, AssetMeta } from './document';

/**
 * 资源子目录映射
 */
export const ASSET_SUBDIRS: Record<AssetType, string> = {
  image: 'images',
  document: 'documents',
  audio: 'audio',
  video: 'video',
};

/**
 * 图片资源子目录
 */
export const IMAGE_SUBDIRS = {
  characters: 'characters', // 角色立绘
  scenes: 'scenes', // 场景图
  illustrations: 'illustrations', // 插图
} as const;

/**
 * 资源分类
 */
export type AssetCategory = keyof typeof IMAGE_SUBDIRS;

/**
 * 图片尺寸信息
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 资源上传参数
 */
export interface AssetUploadParams {
  /** 工作区路径 */
  workspacePath: string;
  /** 文件数据（Base64 或 ArrayBuffer） */
  fileData: string | ArrayBuffer;
  /** 原始文件名 */
  fileName: string;
  /** MIME 类型 */
  mimeType: string;
  /** 资源类型 */
  assetType: AssetType;
  /** 子分类（仅图片） */
  category?: AssetCategory;
}

/**
 * 资源删除结果
 */
export interface AssetDeleteResult {
  success: boolean;
  /** 如果资源正在使用，返回引用列表 */
  usedBy?: string[];
  error?: string;
}

// 重新导出类型
export type { AssetType, AssetMeta };
