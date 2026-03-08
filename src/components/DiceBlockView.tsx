import { memo, useState, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Button, Input, Space, Typography, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Text } = Typography;

function rollDice(formula: string): number {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    throw new Error('Invalid formula');
  }

  const n = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const k = parseInt(match[3] || '0', 10);

  let total = 0;
  for (let i = 0; i < n; i++) {
    total += Math.floor(Math.random() * m) + 1;
  }

  return total + k;
}

function validateFormula(formula: string): boolean {
  return /^(\d+)d(\d+)([+-]\d+)?$/.test(formula);
}

function parseFormula(formula: string): { count: number; sides: number; modifier: number } {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    return { count: 0, sides: 0, modifier: 0 };
  }
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: parseInt(match[3] || '0', 10),
  };
}

const DiceBlockView = memo(({ node, updateAttributes, selected, deleteNode }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.result);
  const [formula, setFormula] = useState(node.attrs.formula || '1d20');
  const [error, setError] = useState<string | null>(null);

  const result = node.attrs.result;
  const rolledAt = node.attrs.rolledAt;
  const { count, sides, modifier } = parseFormula(formula);

  const handleRoll = useCallback(() => {
    if (!validateFormula(formula)) {
      setError('无效的骰子公式，格式应为：NdM+K（如 2d6+3）');
      return;
    }

    setError(null);

    try {
      const rollResult = rollDice(formula);
      updateAttributes({
        formula,
        result: rollResult,
        rolledAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '掷骰失败');
    }
  }, [formula, updateAttributes]);

  const handleFormulaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormula(e.target.value);
    setError(null);
  }, []);

  const handleReroll = useCallback(() => {
    if (!validateFormula(node.attrs.formula)) return;

    try {
      const rollResult = rollDice(node.attrs.formula);
      updateAttributes({
        result: rollResult,
        rolledAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Reroll failed:', err);
    }
  }, [node.attrs.formula, updateAttributes]);

  const handleDelete = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑公式',
      icon: <EditOutlined />,
      onClick: () => setIsEditing(true),
    },
    {
      key: 'reroll',
      label: '重新掷骰',
      icon: <ReloadOutlined />,
      onClick: handleReroll,
      disabled: !result,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  if (isEditing) {
    return (
      <NodeViewWrapper
        className={`dice-block-editing p-4 bg-paper-50 rounded-lg border border-paper-200 ${selected ? 'ring-2 ring-blue-400' : ''}`}
        data-type="dice-block"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-charcoal-700 mb-1">骰子公式</label>
            <Space.Compact className="w-full">
              <Input
                value={formula}
                onChange={handleFormulaChange}
                placeholder="1d20"
                className="flex-1"
              />
              <Button type="primary" onClick={handleRoll}>
                掷骰
              </Button>
            </Space.Compact>
            {error && (
              <Text type="danger" className="mt-2 block">
                {error}
              </Text>
            )}
            <div className="mt-2 text-xs text-charcoal-500">
              格式：NdM+K（如 2d6+3 表示 2 个 6 面骰子加 3）
            </div>
          </div>

          {result !== null && result !== undefined && (
            <div className="flex flex-col items-center justify-center min-w-[120px] p-4 bg-white rounded-lg border border-paper-300 shadow-sm">
              <div className="text-sm text-charcoal-500 mb-1">结果</div>
              <div className="text-4xl font-bold text-gold-600">{result}</div>
              <div className="mt-2 text-xs text-charcoal-400 text-center">
                <div>
                  {count}d{sides}
                </div>
                {modifier !== 0 && (
                  <div>
                    {modifier > 0 ? '+' : ''}
                    {modifier}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={() => setIsEditing(false)} disabled={!result}>
            完成
          </Button>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`dice-block p-4 bg-paper-50 rounded-lg border border-paper-200 group ${selected ? 'ring-2 ring-blue-400' : ''}`}
      data-type="dice-block"
    >
      <div
        className="dice-controls absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
        contentEditable={false}
      >
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button size="small" type="text">
            •••
          </Button>
        </Dropdown>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-charcoal-800">{node.attrs.formula}</span>
          <span className="ml-2 text-charcoal-500">=</span>
          <span className="ml-2 text-3xl font-bold text-gold-600">{result ?? '?'}</span>
        </div>
        {rolledAt && (
          <div className="text-sm text-charcoal-400">
            {new Date(rolledAt).toLocaleString('zh-CN')}
          </div>
        )}
      </div>

      {result !== null && result !== undefined && (
        <div className="mt-3 pt-3 border-t border-paper-300">
          <div className="text-sm text-charcoal-600 mb-1">掷骰详情：</div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-charcoal-500">数量：</span>
              <span className="font-semibold">{count}</span>
            </div>
            <div>
              <span className="text-charcoal-500">面数：</span>
              <span className="font-semibold">{sides}</span>
            </div>
            {modifier !== 0 && (
              <div>
                <span className="text-charcoal-500">修正：</span>
                <span className="font-semibold">
                  {modifier > 0 ? '+' : ''}
                  {modifier}
                </span>
              </div>
            )}
            <div>
              <span className="text-charcoal-500">结果：</span>
              <span className="font-semibold text-gold-600">{result}</span>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
});

DiceBlockView.displayName = 'DiceBlockView';

export default DiceBlockView;
