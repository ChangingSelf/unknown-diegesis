import React from 'react';
import type { Block } from '@/types/block';

type Props = {
  src?: string;
  alt?: string;
  layout?: 'full' | 'left' | 'right' | 'center';
  block?: Block;
  onUpdate?: (b: Block) => void;
  isEditing?: boolean;
};

interface ImageBlockLike {
  type?: string;
  src?: string;
  alt?: string;
  layout?: 'full' | 'left' | 'right' | 'center';
}

const ImageBlock: React.FC<Props> = ({ block, src, alt, layout = 'full' }) => {
  // Bridge: if block is provided, extract data from it
  if (block) {
    const b = block as unknown as ImageBlockLike;
    src = b.src;
    alt = b.alt ?? alt;
    layout = b.layout ?? layout;
  }

  const textAlign =
    layout === 'left'
      ? 'left'
      : layout === 'center'
        ? 'center'
        : layout === 'right'
          ? 'right'
          : undefined;
  const className = `image-block ${layout}`;
  const imgClass = layout === 'center' ? 'mx-auto' : '';
  return (
    <div className={className} style={{ textAlign }}>
      <img src={src ?? ''} alt={alt ?? ''} className={imgClass ? `w-full ${imgClass}` : 'w-full'} />
    </div>
  );
};

export default ImageBlock;
