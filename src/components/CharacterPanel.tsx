import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, message, Empty, Tooltip, Popconfirm } from 'antd';
import {
  PlusOutlined,
  CloseOutlined,
  UserOutlined,
  PictureOutlined,
  DeleteOutlined,
  LinkOutlined,
  FolderOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { Character, Expression, ImageSource } from '@/types/image';

interface CharacterPanelProps {
  workspacePath: string;
  isOpen: boolean;
  onClose: () => void;
  onInsertExpression: (expression: Expression) => void;
}

const DEMO_CHARACTERS: Character[] = [
  {
    id: 'char_001',
    name: '示例角色',
    description: '这是一个示例角色',
    created: new Date().toISOString(),
  },
];

const DEMO_EXPRESSIONS: Expression[] = [
  {
    id: 'expr_001',
    characterId: 'char_001',
    name: '默认表情',
    source: { type: 'local', path: 'assets/characters/sample/default.png' },
  },
];

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  workspacePath: _workspacePath,
  isOpen,
  onClose,
  onInsertExpression,
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
  const [isAddExpressionModalOpen, setIsAddExpressionModalOpen] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterDesc, setNewCharacterDesc] = useState('');
  const [newExpressionName, setNewExpressionName] = useState('');
  const [newExpressionSource, setNewExpressionSource] = useState('');
  const [expressionSourceType, setExpressionSourceType] = useState<'local' | 'remote'>('local');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCharacters(DEMO_CHARACTERS);
      setExpressions(DEMO_EXPRESSIONS);
    }
  }, [isOpen]);

  const selectedCharacterExpressions = selectedCharacterId
    ? expressions.filter(expr => expr.characterId === selectedCharacterId)
    : [];

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  const handleAddCharacter = () => {
    if (!newCharacterName.trim()) {
      message.warning('请输入角色名称');
      return;
    }

    const newCharacter: Character = {
      id: `char_${Date.now()}`,
      name: newCharacterName.trim(),
      description: newCharacterDesc.trim() || undefined,
      created: new Date().toISOString(),
    };

    setCharacters(prev => [...prev, newCharacter]);
    setNewCharacterName('');
    setNewCharacterDesc('');
    setIsAddCharacterModalOpen(false);
    message.success('角色添加成功');
  };

  const handleDeleteCharacter = (characterId: string) => {
    setCharacters(prev => prev.filter(c => c.id !== characterId));
    setExpressions(prev => prev.filter(e => e.characterId !== characterId));
    if (selectedCharacterId === characterId) {
      setSelectedCharacterId(null);
    }
    message.success('角色已删除');
  };

  const handleAddExpression = () => {
    if (!selectedCharacterId) {
      message.warning('请先选择角色');
      return;
    }

    if (!newExpressionName.trim()) {
      message.warning('请输入差分名称');
      return;
    }

    if (!newExpressionSource.trim()) {
      message.warning('请提供图片路径或链接');
      return;
    }

    const source: ImageSource = {
      type: expressionSourceType,
      path: newExpressionSource.trim(),
    };

    const newExpression: Expression = {
      id: `expr_${Date.now()}`,
      characterId: selectedCharacterId,
      name: newExpressionName.trim(),
      source,
    };

    setExpressions(prev => [...prev, newExpression]);
    setNewExpressionName('');
    setNewExpressionSource('');
    setIsAddExpressionModalOpen(false);
    message.success('差分添加成功');
  };

  const handleDeleteExpression = (expressionId: string) => {
    setExpressions(prev => prev.filter(e => e.id !== expressionId));
    message.success('差分已删除');
  };

  const handleInsertExpression = (expression: Expression) => {
    onInsertExpression(expression);
    message.success(`已插入差分: ${expression.name}`);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const relativePath = `assets/characters/${file.name}`;
      setNewExpressionSource(relativePath);
      setExpressionSourceType('local');
    }
  };

  const getImageUrl = (source: ImageSource): string => {
    if (source.type === 'remote') {
      return source.path;
    }
    return source.path;
  };

  const getCharacterAvatar = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <UserOutlined className="text-indigo-500" />
            角色管理
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CloseOutlined className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
            <div className="p-2 border-b border-gray-100">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                block
                onClick={() => setIsAddCharacterModalOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                添加角色
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {characters.length === 0 ? (
                <div className="p-4 text-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无角色"
                    className="!text-gray-400"
                  />
                </div>
              ) : (
                <div className="py-1">
                  {characters.map(character => (
                    <div
                      key={character.id}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all duration-200
                        group relative
                        ${
                          selectedCharacterId === character.id
                            ? 'bg-indigo-100 border-l-3 border-l-indigo-500'
                            : 'hover:bg-gray-100 border-l-3 border-l-transparent'
                        }
                      `}
                      onClick={() => setSelectedCharacterId(character.id)}
                    >
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                          ${
                            selectedCharacterId === character.id
                              ? 'bg-indigo-500'
                              : 'bg-gradient-to-br from-indigo-400 to-purple-400'
                          }
                        `}
                      >
                        {getCharacterAvatar(character.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {character.name}
                        </div>
                        {character.description && (
                          <div className="text-xs text-gray-400 truncate">
                            {character.description}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {expressions.filter(e => e.characterId === character.id).length}
                      </div>

                      <Popconfirm
                        title="确定删除此角色？"
                        description="删除后无法恢复，相关差分也将被删除"
                        onConfirm={e => {
                          e?.stopPropagation();
                          handleDeleteCharacter(character.id);
                        }}
                        onCancel={e => e?.stopPropagation()}
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <button
                          onClick={e => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                        >
                          <DeleteOutlined className="text-red-400 text-xs" />
                        </button>
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedCharacter ? (
              <>
                <div className="p-3 border-b border-gray-100 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                        {getCharacterAvatar(selectedCharacter.name)}
                      </div>
                      <span className="font-medium text-gray-800">{selectedCharacter.name}</span>
                      <span className="text-xs text-gray-400">
                        · {selectedCharacterExpressions.length} 个差分
                      </span>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setIsAddExpressionModalOpen(true)}
                      className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      添加差分
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {selectedCharacterExpressions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <PictureOutlined className="text-4xl text-gray-200 mb-3" />
                      <p className="text-gray-400 text-sm">暂无差分</p>
                      <Button
                        type="link"
                        onClick={() => setIsAddExpressionModalOpen(true)}
                        className="mt-2 text-indigo-500"
                      >
                        添加第一个差分
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCharacterExpressions.map(expression => (
                        <div
                          key={expression.id}
                          className="group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="aspect-square bg-gray-100 relative overflow-hidden">
                            {expression.source.type === 'remote' ? (
                              <img
                                src={getImageUrl(expression.source)}
                                alt={expression.name}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML =
                                    '<div class="w-full h-full flex items-center justify-center text-gray-300"><PictureOutlined style="font-size: 24px" /></div>';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <PictureOutlined className="text-3xl" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Tooltip title="插入到编辑器">
                                <button
                                  onClick={() => handleInsertExpression(expression)}
                                  className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-1"
                                >
                                  <ExportOutlined />
                                  插入
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="p-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700 truncate flex-1">
                              {expression.name}
                            </span>
                            <Popconfirm
                              title="确定删除此差分？"
                              onConfirm={() => handleDeleteExpression(expression.id)}
                              okText="删除"
                              cancelText="取消"
                              okButtonProps={{ danger: true }}
                            >
                              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all">
                                <DeleteOutlined className="text-red-400 text-xs" />
                              </button>
                            </Popconfirm>
                          </div>

                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-gray-500 flex items-center gap-1">
                            {expression.source.type === 'remote' ? (
                              <>
                                <LinkOutlined className="text-xs" />
                                图床
                              </>
                            ) : (
                              <>
                                <FolderOutlined className="text-xs" />
                                本地
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <UserOutlined className="text-4xl mb-3" />
                <p className="text-sm">请从左侧选择角色</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center text-xs text-gray-400">
          点击差分缩略图可插入到编辑器
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserOutlined className="text-indigo-500" />
            添加角色
          </div>
        }
        open={isAddCharacterModalOpen}
        onCancel={() => {
          setIsAddCharacterModalOpen(false);
          setNewCharacterName('');
          setNewCharacterDesc('');
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsAddCharacterModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAddCharacter}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            添加
          </Button>,
        ]}
        destroyOnClose
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色名称 <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="输入角色名称"
              value={newCharacterName}
              onChange={e => setNewCharacterName(e.target.value)}
              maxLength={50}
              showCount
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色描述</label>
            <Input.TextArea
              placeholder="输入角色描述（可选）"
              value={newCharacterDesc}
              onChange={e => setNewCharacterDesc(e.target.value)}
              maxLength={200}
              showCount
              rows={3}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <PictureOutlined className="text-indigo-500" />
            添加差分
          </div>
        }
        open={isAddExpressionModalOpen}
        onCancel={() => {
          setIsAddExpressionModalOpen(false);
          setNewExpressionName('');
          setNewExpressionSource('');
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsAddExpressionModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAddExpression}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            添加
          </Button>,
        ]}
        destroyOnClose
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              差分名称 <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="例如：开心、生气、默认"
              value={newExpressionName}
              onChange={e => setNewExpressionName(e.target.value)}
              maxLength={30}
              showCount
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">图片来源</label>
            <div className="flex gap-2 mb-3">
              <Button
                type={expressionSourceType === 'local' ? 'primary' : 'default'}
                icon={<FolderOutlined />}
                onClick={() => setExpressionSourceType('local')}
                className={
                  expressionSourceType === 'local' ? 'bg-indigo-500 hover:bg-indigo-600' : undefined
                }
              >
                本地文件
              </Button>
              <Button
                type={expressionSourceType === 'remote' ? 'primary' : 'default'}
                icon={<LinkOutlined />}
                onClick={() => setExpressionSourceType('remote')}
                className={
                  expressionSourceType === 'remote'
                    ? 'bg-indigo-500 hover:bg-indigo-600'
                    : undefined
                }
              >
                图床链接
              </Button>
            </div>

            {expressionSourceType === 'local' ? (
              <div className="space-y-2">
                <Input
                  placeholder="选择或输入图片路径"
                  value={newExpressionSource}
                  onChange={e => setNewExpressionSource(e.target.value)}
                  suffix={
                    <Button size="small" type="link" onClick={handleFileSelect}>
                      浏览
                    </Button>
                  }
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <Input
                placeholder="输入图片URL"
                value={newExpressionSource}
                onChange={e => setNewExpressionSource(e.target.value)}
                prefix={<LinkOutlined className="text-gray-400" />}
              />
            )}
          </div>
        </div>
      </Modal>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {isOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .border-l-3 {
          border-left-width: 3px;
        }
      `}</style>
    </>
  );
};

export default CharacterPanel;
