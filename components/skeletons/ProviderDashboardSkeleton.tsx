import React from 'react';
import SkeletonBlock from './SkeletonBlock'; // Corrigido

const ProviderDashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header Skeleton */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <SkeletonBlock className="h-8 w-48 mb-2" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-10 w-32" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SkeletonBlock className="h-24 rounded-lg" />
        <SkeletonBlock className="h-24 rounded-lg" />
        <SkeletonBlock className="h-24 rounded-lg" />
      </div>

      {/* Main Content Area Skeleton */}
      <div>
        <SkeletonBlock className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <SkeletonBlock className="h-28 rounded-lg" />
          <SkeletonBlock className="h-28 rounded-lg" />
          <SkeletonBlock className="h-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboardSkeleton;
