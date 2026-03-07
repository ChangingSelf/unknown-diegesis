import React, { useState, useRef } from 'react';
import { AssetMeta } from '../../services/AssetService';

interface AssetBrowserProps {
  assets: AssetMeta[];
  onImport: (files: File[]) => void;
  onDelete: (assetPath: string) => void;
  onInsert: (assetPath: string) => void;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({
  assets,
  onImport,
  onDelete,
  onInsert,
}) => {
  const [filter, setFilter] = useState<'all' | 'image' | 'document'>('all');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = filter === 'all' ? assets : assets.filter(asset => asset.type === filter);

  const images = filteredAssets.filter(asset => asset.type === 'image');
  const documents = filteredAssets.filter(asset => asset.type === 'document');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onImport(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      onImport(Array.from(e.dataTransfer.files));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatModifiedDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="asset-browser h-full flex flex-col">
      <div className="border-b border-paper-300 p-4 bg-paper-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-charcoal-800">资源管理</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === 'all'
                  ? 'bg-gold-500 text-white'
                  : 'bg-paper-200 text-charcoal-700 hover:bg-paper-300'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === 'image'
                  ? 'bg-gold-500 text-white'
                  : 'bg-paper-200 text-charcoal-700 hover:bg-paper-300'
              }`}
            >
              图片
            </button>
            <button
              onClick={() => setFilter('document')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === 'document'
                  ? 'bg-gold-500 text-white'
                  : 'bg-paper-200 text-charcoal-700 hover:bg-paper-300'
              }`}
            >
              文档
            </button>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-gold-400 bg-gold-50' : 'border-paper-300 hover:border-gold-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-12 h-12 text-charcoal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-charcoal-600">
              拖拽文件到此处，或{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-gold-600 hover:text-gold-700 font-medium"
              >
                点击选择文件
              </button>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-charcoal-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg">暂无资源</p>
            <p className="text-sm mt-1">拖拽文件或点击上方按钮导入资源</p>
          </div>
        ) : (
          <>
            {images.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-charcoal-700 mb-3">
                  图片 ({images.length})
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  {images.map(asset => (
                    <div
                      key={asset.path}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border border-paper-200 hover:shadow-lg hover:border-gold-300 transition-all"
                    >
                      <img
                        src={`file:///${asset.path}`}
                        alt={asset.name}
                        className="w-full h-32 object-cover"
                        onClick={() => onInsert(asset.path)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDelete(asset.path);
                          }}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          删除
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2">
                        <div className="truncate">{asset.name}</div>
                        <div className="flex justify-between mt-0.5">
                          <span>{formatFileSize(asset.size)}</span>
                          <span>{formatModifiedDate(asset.modified)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {documents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-charcoal-700 mb-3">
                  文档 ({documents.length})
                </h4>
                <div className="space-y-2">
                  {documents.map(asset => (
                    <div
                      key={asset.path}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-paper-200 hover:border-gold-300 hover:shadow-md transition-all group"
                    >
                      <div
                        className="flex-1 flex items-center gap-3 cursor-pointer"
                        onClick={() => onInsert(asset.path)}
                      >
                        <svg
                          className="w-8 h-8 text-charcoal-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1">
                          <div className="font-medium text-charcoal-800 truncate">{asset.name}</div>
                          <div className="text-sm text-charcoal-500">
                            {formatFileSize(asset.size)} · {formatModifiedDate(asset.modified)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDelete(asset.path);
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AssetBrowser;
