
import React from 'react';
import SkeletonBlock from './SkeletonBlock'; // Corrigido

const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <SkeletonBlock className="h-8 w-1/3 mb-2" />
        <SkeletonBlock className="h-4 w-1/2" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SkeletonBlock className="h-24 rounded-lg" />
        <SkeletonBlock className="h-24 rounded-lg" />
        <SkeletonBlock className="h-24 rounded-lg" />
        <SkeletonBlock className="h-24 rounded-lg" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Chart */}
        <div className="lg:col-span-2">
          <SkeletonBlock className="h-80 rounded-lg" />
        </div>

        {/* Right Column - Recent Activity */}
        <div>
          <SkeletonBlock className="h-6 w-1/4 mb-4" />
          <div className="space-y-4">
            <SkeletonBlock className="h-16 rounded-lg" />
            <SkeletonBlock className="h-16 rounded-lg" />
            <SkeletonBlock className="h-16 rounded-lg" />
            <SkeletonBlock className="h-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSkeleton;
