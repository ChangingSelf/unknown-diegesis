import React from 'react';

export const ImageHostPanel: React.FC<{ hosts: string[] }> = ({ hosts }) => {
  return (
    <aside className="image-host-panel border rounded p-2">
      <div className="font-semibold mb-2">Image Hosts</div>
      <ul className="list-disc pl-5 space-y-1">
        {hosts.map(h => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </aside>
  );
};
