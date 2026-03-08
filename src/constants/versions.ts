/**
 * Schema Version Constants
 *
 * 使用整数递增版本号来管理数据结构兼容性。
 * 与语义化版本不同，schemaVersion 只关注数据结构是否兼容，
 * 不关注功能变更。
 *
 * 版本升级规则：
 * - 任何数据结构变更（添加/删除/修改字段）都需要升级版本号
 * - 版本号只能递增，不能回退
 * - 必须提供从旧版本到新版本的迁移路径
 */

/**
 * 工作区数据结构版本
 * 用于 workspace.json 文件
 */
export const WORKSPACE_SCHEMA_VERSION = 1;

/**
 * 文档数据结构版本
 * 用于 .ud 文件
 */
export const DOCUMENT_SCHEMA_VERSION = 1;

/**
 * 索引数据结构版本
 * 用于 .index/ 目录下的索引文件
 */
export const INDEX_SCHEMA_VERSION = 1;
