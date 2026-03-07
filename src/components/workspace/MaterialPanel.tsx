import React, { useState } from 'react';
import { MaterialMeta, MaterialType } from '@/types/material';

interface MaterialPanelProps {
  materials: MaterialMeta[];
  currentMaterialId: string | null;
  onSelect: (materialId: string) => void;
  onCreate: (type: MaterialType) => void;
  onDelete: (materialId: string) => void;
}

const MATERIAL_TYPE_CONFIG: Record<MaterialType, { label: string; icon: string }> = {
  character: { label: '角色', icon: '👤' },
  location: { label: '地点', icon: '📍' },
  item: { label: '物品', icon: '📦' },
  timeline: { label: '时间线', icon: '📅' },
  note: { label: '笔记', icon: '📝' },
};

export const MaterialPanel: React.FC<MaterialPanelProps> = ({
  materials,
  currentMaterialId,
  onSelect,
  onCreate,
  onDelete,
}) => {
  const [expandedTypes, setExpandedTypes] = useState<Set<MaterialType>>(
    new Set(['character', 'location'])
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleType = (type: MaterialType) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

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

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-paper-200">
        <input
          type="text"
          placeholder="搜索资料..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-paper-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(MATERIAL_TYPE_CONFIG).map(([type, config]) => {
          const typeMaterials = filteredGroups[type as MaterialType] || [];
          const isExpanded = expandedTypes.has(type as MaterialType);

          return (
            <div key={type} className="border-b border-paper-100">
              <div
                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-paper-50"
                onClick={() => toggleType(type as MaterialType)}
              >
                <div className="flex items-center gap-2">
                  <span>{isExpanded ? '▼' : '▶'}</span>
                  <span>{config.icon}</span>
                  <span className="text-sm font-medium text-charcoal-700">{config.label}</span>
                  <span className="text-xs text-charcoal-400">({typeMaterials.length})</span>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onCreate(type as MaterialType);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gold-100 rounded text-gold-600 text-xs"
                >
                  +
                </button>
              </div>

              {isExpanded && typeMaterials.length > 0 && (
                <div className="bg-paper-25">
                  {typeMaterials.map(material => (
                    <div
                      key={material.id}
                      onClick={() => onSelect(material.id)}
                      className={`group flex items-center justify-between px-6 py-1.5 cursor-pointer ${
                        currentMaterialId === material.id
                          ? 'bg-gold-50 border-r-2 border-gold-500'
                          : 'hover:bg-paper-50'
                      }`}
                    >
                      <span className="text-sm text-charcoal-600 truncate">{material.name}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm('确定删除此资料？')) {
                            onDelete(material.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded text-red-500 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
