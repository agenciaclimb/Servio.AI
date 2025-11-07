import React from 'react';

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={`bg-slate-200 rounded animate-pulse ${className}`} />;
};