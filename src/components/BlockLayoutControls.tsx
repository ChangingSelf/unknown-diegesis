import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface BlockLayoutControlsProps {
  onCreateSibling: () => void;
}

export const BlockLayoutControls: React.FC<BlockLayoutControlsProps> = ({ onCreateSibling }) => {
  return (
    <div className="block-layout-controls flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <Button size="small" icon={<PlusOutlined />} onClick={onCreateSibling} title="添加并列块">
        并列块
      </Button>
    </div>
  );
};
