import React from 'react';

export const CharacterPanel: React.FC<{ characters: string[] }> = ({ characters }) => {
  return (
    <aside className="character-panel border rounded p-2">
      <div className="font-semibold mb-2">Characters</div>
      <ul className="list-disc pl-5 space-y-1">
        {characters.map(c => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </aside>
  );
};
