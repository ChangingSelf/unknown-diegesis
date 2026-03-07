import React, { useState } from 'react';
import { Input, Collapse, List, Button, Popconfirm, Typography, Badge } from 'antd';
import {
  UserOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
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

const MATERIAL_TYPE_CONFIG: Record<MaterialType, { label: string; icon: React.ReactNode }> = {
  character: { label: '角色', icon: <UserOutlined /> },
  location: { label: '地点', icon: <EnvironmentOutlined /> },
  item: { label: '物品', icon: <GiftOutlined /> },
  timeline: { label: '时间线', icon: <CalendarOutlined /> },
  note: { label: '笔记', icon: <FileTextOutlined /> },
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
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {config.icon}
            <span>{config.label}</span>
            <Badge count={totalCount} size="small" />
          </div>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={e => {
              e.stopPropagation();
              onCreate(type as MaterialType);
            }}
          />
        </div>
      ),
      children:
        typeMaterials.length > 0 ? (
          <List
            size="small"
            dataSource={typeMaterials}
            renderItem={material => (
              <List.Item
                onClick={() => onSelect(material.id)}
                className={`cursor-pointer ${
                  currentMaterialId === material.id
                    ? 'bg-blue-50 border-r-2 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="确定删除此资料？"
                    onConfirm={e => {
                      e?.stopPropagation();
                      onDelete(material.id);
                    }}
                    onCancel={e => e?.stopPropagation()}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={e => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <Text ellipsis>{material.name}</Text>
              </List.Item>
            )}
          />
        ) : (
          <div className="text-center text-gray-400 py-4 text-sm">暂无资料</div>
        ),
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <Input.Search
          placeholder="搜索资料..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <Collapse
          activeKey={activeKeys}
          onChange={keys => setActiveKeys(keys as string[])}
          ghost
          items={collapseItems}
        />
      </div>
    </div>
  );
};
