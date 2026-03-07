import React from 'react';
import { Modal } from 'antd';
import { Tab } from '@/types';

interface UnsavedTabsDialogProps {
  visible: boolean;
  tabs: Tab[];
  onSave: (tabId: string) => Promise<void>;
  onDiscard: (tabId: string) => void;
  onCancel: () => void;
}

export const UnsavedTabsDialog: React.FC<UnsavedTabsDialogProps> = ({
  visible,
  tabs,
  onSave,
  onDiscard,
  onCancel,
}) => {
  const handleSaveAll = async () => {
    for (const tab of tabs) {
      await onSave(tab.id);
    }
  };

  const handleDiscardAll = () => {
    tabs.forEach(tab => onDiscard(tab.id));
  };

  return (
    <Modal
      title="未保存的更改"
      open={visible}
      onOk={handleSaveAll}
      onCancel={onCancel}
      okText="全部保存"
      cancelText="取消"
      footer={[
        <button
          key="discard"
          onClick={handleDiscardAll}
          className="px-4 py-2 text-red-600 hover:text-red-700"
        >
          全部丢弃
        </button>,
        <button
          key="cancel"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-700"
        >
          取消
        </button>,
        <button
          key="save"
          onClick={handleSaveAll}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          全部保存
        </button>,
      ]}
    >
      <div className="py-4">
        <p className="mb-3 text-gray-700">以下标签页有未保存的更改：</p>
        <ul className="space-y-2">
          {tabs.map(tab => (
            <li key={tab.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{tab.title}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onSave(tab.id)}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={() => onDiscard(tab.id)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  丢弃
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};
