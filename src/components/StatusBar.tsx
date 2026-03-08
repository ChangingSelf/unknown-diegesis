import React from 'react';
import { useEditorContext } from '@/components/editor/EditorContext';

export interface StatusBarProps {
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ className = '' }) => {
  const { editor, isReady } = useEditorContext();
  const [wordCount, setWordCount] = React.useState(0);
  const [selectedCount, setSelectedCount] = React.useState(0);

  const countWords = (text: string): number => {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    const numbers = text.match(/\d+/g) || [];
    return chineseChars.length + englishWords.length + numbers.length;
  };

  React.useEffect(() => {
    if (!editor || !isReady) return;

    const updateCounts = () => {
      const text = editor.getText();
      const total = countWords(text);
      setWordCount(total);

      const { from, to } = editor.state.selection;
      if (from !== to) {
        const selectedText = editor.state.doc.textBetween(from, to);
        setSelectedCount(countWords(selectedText));
      } else {
        setSelectedCount(0);
      }
    };

    editor.on('update', updateCounts);
    editor.on('selectionUpdate', updateCounts);
    updateCounts();

    return () => {
      editor.off('update', updateCounts);
      editor.off('selectionUpdate', updateCounts);
    };
  }, [editor, isReady]);

  return (
    <div
      className={`status-bar flex items-center justify-between px-4 h-8 bg-white border-t border-gray-200 text-sm text-gray-600 ${className}`}
    >
      <div className="flex gap-4">
        <span>总字数: {wordCount.toLocaleString()}</span>
        {selectedCount > 0 && <span>已选中: {selectedCount.toLocaleString()}</span>}
      </div>
      <div className="flex gap-4 text-gray-400">
        <span>块数: {editor?.state.doc.childCount || 0}</span>
      </div>
    </div>
  );
};

export default StatusBar;
