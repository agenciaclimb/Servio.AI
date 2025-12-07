import React from 'react';
import SkeletonBlock from './SkeletonBlock'; // Corrigido

const JobCardSkeleton: React.FC = () => {
  return (
    <div className="border border-gray-200 bg-white rounded-lg p-4 shadow-sm animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <SkeletonBlock className="h-5 w-3/5" />
        <SkeletonBlock className="h-5 w-1/5" />
      </div>

      {/* Client Info */}
      <div className="flex items-center mb-4">
        <SkeletonBlock className="h-4 w-1/4" />
      </div>

      {/* Service Details */}
      <div className="mb-4">
        <SkeletonBlock className="h-4 w-full mb-2" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>

      {/* Time & Price */}
      <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-3">
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-8 w-1/4" />
      </div>
    </div>
  );
};

export default JobCardSkeleton;
