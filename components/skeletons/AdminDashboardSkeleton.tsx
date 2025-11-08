import React from 'react';
import { SkeletonBlock } from './SkeletonBlock';

const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <SkeletonBlock className="h-10 w-1/3" />
        <SkeletonBlock className="h-10 w-24 rounded-md" />
      </div>

      {/* Tabs Skeleton */}
      <SkeletonBlock className="h-12 w-full rounded-lg" />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Table/List Skeleton */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <SkeletonBlock className="h-8 w-1/4 mb-4" />
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardSkeleton;