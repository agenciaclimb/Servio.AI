import React from 'react';
import { SkeletonBlock } from './SkeletonBlock';

const ClientDashboardSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Onboarding Card Skeleton */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-4">
          <SkeletonBlock className="h-8 w-1/3" />
          <SkeletonBlock className="h-4 w-1/2" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <SkeletonBlock className="h-24 rounded-xl" />
            <SkeletonBlock className="h-24 rounded-xl" />
            <SkeletonBlock className="h-24 rounded-xl" />
          </div>
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SkeletonBlock className="h-28 rounded-xl" />
          <SkeletonBlock className="h-28 rounded-xl" />
          <SkeletonBlock className="h-28 rounded-xl" />
        </div>

        {/* Quick Actions Skeleton */}
        <SkeletonBlock className="h-20 rounded-xl" />
      </main>
    </div>
  );
};

export default ClientDashboardSkeleton;