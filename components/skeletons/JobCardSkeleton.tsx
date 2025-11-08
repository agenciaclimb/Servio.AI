import React from 'react';
import { SkeletonBlock } from './SkeletonBlock';

const JobCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3">
      <SkeletonBlock className="h-5 w-1/2" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-10 w-1/3 mt-4" />
    </div>
  );
};

export default JobCardSkeleton;