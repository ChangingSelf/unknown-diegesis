import React, { useState } from 'react';
import { Block } from '../types/block';

interface DiceBlockProps {
  block: Block;
  onUpdate: (block: Block) => void;
  isEditing: boolean;
}

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

export const DiceBlock: React.FC<DiceBlockProps> = ({ block, onUpdate, isEditing }) => {
  const [formula, setFormula] = useState(block.diceData?.formula || '1d20');
  const [result, setResult] = useState<number | undefined>(block.diceData?.result);
  const [error, setError] = useState<string | null>(null);

  const handleRoll = () => {
    if (!validateFormula(formula)) {
      setError('无效的骰子公式，格式应为：NdM+K（如 2d6+3）');
      return;
    }

    setError(null);

    try {
      const rollResult = rollDice(formula);
      setResult(rollResult);

      onUpdate({
        ...block,
        diceData: {
          formula,
          result: rollResult,
          rolledAt: new Date().toISOString(),
        },
        metadata: {
          ...block.metadata,
          modified: new Date(),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '掷骰失败');
    }
  };

  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormula(e.target.value);
    setError(null);
  };

  const parseFormula = (formula: string): { count: number; sides: number; modifier: number } => {
    const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      return { count: 0, sides: 0, modifier: 0 };
    }

    return {
      count: parseInt(match[1], 10),
      sides: parseInt(match[2], 10),
      modifier: parseInt(match[3] || '0', 10),
    };
  };

  const { count, sides, modifier } = parseFormula(formula);

  if (!isEditing) {
    return (
      <div className="dice-block p-4 bg-paper-50 rounded-lg border border-paper-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-charcoal-800">{formula}</span>
            <span className="ml-2 text-charcoal-500">=</span>
            <span className="ml-2 text-3xl font-bold text-gold-600">{result ?? '?'}</span>
          </div>
          <div className="text-sm text-charcoal-400">
            {block.diceData?.rolledAt && new Date(block.diceData.rolledAt).toLocaleString('zh-CN')}
          </div>
        </div>
        {result !== undefined && (
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
      </div>
    );
  }

  return (
    <div className="dice-block-editing p-4 bg-paper-50 rounded-lg border border-paper-200">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-charcoal-700 mb-1">骰子公式</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formula}
              onChange={handleFormulaChange}
              placeholder="1d20"
              className="flex-1 px-3 py-2 border border-paper-300 rounded-lg focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-100"
            />
            <button
              onClick={handleRoll}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors"
            >
              掷骰
            </button>
          </div>
          {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
          <div className="mt-2 text-xs text-charcoal-500">
            格式：NdM+K（如 2d6+3 表示 2 个 6 面骰子加 3）
          </div>
        </div>

        {result !== undefined && (
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

      {block.diceData?.rolledAt && (
        <div className="mt-3 pt-3 border-t border-paper-300">
          <div className="text-sm text-charcoal-500">
            上次掷骰时间：
            {new Date(block.diceData.rolledAt).toLocaleString('zh-CN')}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiceBlock;
