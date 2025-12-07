import React from 'react';
import SkeletonBlock from './SkeletonBlock';

const StatCardSkeleton: React.FC = () => (
  <div className="p-4 bg-white rounded border shadow-sm flex flex-col gap-2">
    <SkeletonBlock className="h-4 w-3/4" />
    <SkeletonBlock className="h-8 w-1/2" />
  </div>
);

const ProspectorDashboardSkeleton: React.FC = () => {
  return (
    <>
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Badge Progress Skeleton */}
      <div className="bg-white p-5 rounded border shadow-sm flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <SkeletonBlock className="h-4 w-24 mb-2" />
            <SkeletonBlock className="h-6 w-32" />
          </div>
          <div className="text-right">
            <SkeletonBlock className="h-4 w-24 mb-2" />
            <SkeletonBlock className="h-6 w-32" />
          </div>
        </div>
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-1/4" />
      </div>

      {/* Leaderboard Skeleton */}
      <div className="bg-white p-5 rounded border shadow-sm mt-4">
        <SkeletonBlock className="h-6 w-1/2 mb-4" />
        <div className="w-full text-sm space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center">
              <SkeletonBlock className="h-5 w-10" />
              <SkeletonBlock className="h-5 w-24" />
              <SkeletonBlock className="h-5 w-16" />
              <SkeletonBlock className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProspectorDashboardSkeleton;
