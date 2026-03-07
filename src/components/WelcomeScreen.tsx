import React from 'react';

export interface WelcomeScreenProps {
  onCreateWorkspace: () => void;
  onOpenWorkspace: () => void;
  onNewDocument: () => void;
  onOpenDocument: () => void;
}

const IconPlus: React.FC<{ width?: number; height?: number }> = ({ width = 20, height = 20 }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="add"
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const IconFolder: React.FC<{ width?: number; height?: number }> = ({ width = 20, height = 20 }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="folder"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconDocumentPlus: React.FC<{ width?: number; height?: number }> = ({
  width = 20,
  height = 20,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="document-plus"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const IconDocument: React.FC<{ width?: number; height?: number }> = ({
  width = 20,
  height = 20,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="document"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const cardBaseClasses =
  'bg-white rounded-xl p-5 border border-paper-200 flex flex-col shadow-sm hover:shadow-md hover:border-gold-300 transition-all duration-200';

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateWorkspace,
  onOpenWorkspace,
  onNewDocument,
  onOpenDocument,
}) => {
  const items = [
    {
      id: 'create-workspace',
      title: '新建工作区',
      description: '创建一个新的工作区来组织笔记、模板与文档。',
      buttonLabel: '新建工作区',
      onClick: onCreateWorkspace,
      Icon: IconPlus,
    },
    {
      id: 'open-workspace',
      title: '打开工作区',
      description: '从已有列表中打开一个现有的工作区。',
      buttonLabel: '打开工作区',
      onClick: onOpenWorkspace,
      Icon: IconFolder,
    },
    {
      id: 'new-document',
      title: '新建文档',
      description: '在当前工作区内创建一个新的文档。',
      buttonLabel: '新建文档',
      onClick: onNewDocument,
      Icon: IconDocumentPlus,
    },
    {
      id: 'open-document',
      title: '打开文档',
      description: '打开一个已存在的文档进行编辑。',
      buttonLabel: '打开文档',
      onClick: onOpenDocument,
      Icon: IconDocument,
    },
  ];

  return (
    <section aria-label="Welcome" className="px-6 py-8 bg-paper-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map(item => (
          <div key={item.id} className={cardBaseClasses} style={{ minHeight: 170 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-charcoal/10 flex items-center justify-center text-gold">
                <item.Icon />
              </div>
              <h3 className="text-charcoal text-lg font-semibold">{item.title}</h3>
            </div>
            <p className="text-charcoal/70 text-sm mb-4 flex-1">{item.description}</p>
            <div className="mt-auto pt-2">
              <button className="btn-primary" onClick={item.onClick}>
                {item.buttonLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WelcomeScreen;
