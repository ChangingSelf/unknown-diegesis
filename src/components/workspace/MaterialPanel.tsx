import React, { useState } from 'react';
import { Input, Collapse, List, Button, Popconfirm, Typography, Badge, Tag, Tooltip } from 'antd';
import {
  UserOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { MaterialMeta, MaterialType } from '@/types/material';

const { Text } = Typography;

interface MaterialPanelProps {
  materials: MaterialMeta[];
  currentMaterialId: string | null;
  onSelect: (materialId: string) => void;
  onCreate: (type: MaterialType) => void;
  onDelete: (materialId: string) => void;
}

const MATERIAL_TYPE_CONFIG: Record<
  MaterialType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  character: { label: '角色', icon: <UserOutlined />, color: 'blue' },
  location: { label: '地点', icon: <EnvironmentOutlined />, color: 'green' },
  item: { label: '物品', icon: <GiftOutlined />, color: 'orange' },
  timeline: { label: '时间线', icon: <CalendarOutlined />, color: 'purple' },
  note: { label: '笔记', icon: <FileTextOutlined />, color: 'cyan' },
};

export const MaterialPanel: React.FC<MaterialPanelProps> = ({
  materials,
  currentMaterialId,
  onSelect,
  onCreate,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeKeys, setActiveKeys] = useState<string[]>(['character', 'location']);

  const groupedMaterials = materials.reduce(
    (acc, material) => {
      if (!acc[material.type]) {
        acc[material.type] = [];
      }
      acc[material.type].push(material);
      return acc;
    },
    {} as Record<MaterialType, MaterialMeta[]>
  );

  const filteredGroups = Object.entries(groupedMaterials).reduce(
    (acc, [type, items]) => {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[type as MaterialType] = filtered;
      }
      return acc;
    },
    {} as Record<MaterialType, MaterialMeta[]>
  );

  const collapseItems = Object.entries(MATERIAL_TYPE_CONFIG).map(([type, config]) => {
    const typeMaterials = filteredGroups[type as MaterialType] || [];
    const totalCount = groupedMaterials[type as MaterialType]?.length || 0;

    return {
      key: type,
      label: (
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <Tag color={config.color} className="!m-0">
              {config.icon}
            </Tag>
            <span className="font-medium">{config.label}</span>
            {totalCount > 0 && (
              <Badge
                count={totalCount}
                size="small"
                style={{ backgroundColor: 'var(--ant-color-bg-container)' }}
                className="!text-gray-500"
              />
            )}
          </div>
          <Tooltip title={`新建${config.label}`}>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={e => {
                e.stopPropagation();
                onCreate(type as MaterialType);
              }}
              className="opacity-0 group-hover:opacity-100"
            />
          </Tooltip>
        </div>
      ),
      children:
        typeMaterials.length > 0 ? (
          <List
            size="small"
            dataSource={typeMaterials}
            renderItem={material => {
              const isSelected = currentMaterialId === material.id;
              return (
                <List.Item
                  onClick={() => onSelect(material.id)}
                  className={`
                    cursor-pointer transition-all duration-200 !px-2 !py-1.5
                    ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}
                  `}
                  actions={[
                    <Tooltip key="delete" title="删除">
                      <Popconfirm
                        title="确定删除此资料？"
                        onConfirm={e => {
                          e?.stopPropagation();
                          onDelete(material.id);
                        }}
                        onCancel={e => e?.stopPropagation()}
                        okText="删除"
                        okButtonProps={{ danger: true }}
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={e => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100"
                        />
                      </Popconfirm>
                    </Tooltip>,
                  ]}
                >
                  <div className="flex items-center gap-2 w-full group">
                    <Text
                      strong={isSelected}
                      ellipsis
                      className={`flex-1 ${isSelected ? '!text-blue-600' : '!text-gray-700'}`}
                    >
                      {material.name}
                    </Text>
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <div className="text-center text-gray-400 py-6 text-sm">
            <span className="text-2xl mb-2 block opacity-50">{config.icon}</span>
            暂无{config.label}
          </div>
        ),
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <Input
          placeholder="搜索素材..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          allowClear
          variant="filled"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <Collapse
          activeKey={activeKeys}
          onChange={keys => setActiveKeys(keys as string[])}
          ghost
          items={collapseItems}
          className="[&_.ant-collapse-header]:!py-2 [&_.ant-collapse-header]:!px-3 [&_.ant-collapse-content-box]:!p-0"
        />
      </div>
    </div>
  );
};
