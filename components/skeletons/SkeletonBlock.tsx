import React from 'react';

interface SkeletonBlockProps {
  className?: string;
}

const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      data-testid="skeleton-block"
    ></div>
  );
};

export default SkeletonBlock;
