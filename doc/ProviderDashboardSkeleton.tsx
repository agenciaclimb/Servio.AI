import React from 'react';
import { SkeletonBlock } from './SkeletonBlock';
import JobCardSkeleton from './JobCardSkeleton';

const ProviderDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* Profile Strength Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <SkeletonBlock className="h-6 w-1/4" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-10 w-1/3" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <SkeletonBlock className="h-6 w-1/3" />
          <SkeletonBlock className="h-4 w-3/4" />
        </div>
      </div>

      {/* Job Lists Skeleton */}
      <div>
        <SkeletonBlock className="h-8 w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => <JobCardSkeleton key={index} />)}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboardSkeleton;