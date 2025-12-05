
import React from 'react';
import SkeletonBlock from './SkeletonBlock'; // Corrigido

const ClientDashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Welcome Message Skeleton */}
      <div className="mb-8">
        <SkeletonBlock className="h-8 w-1/3 mb-2" />
        <SkeletonBlock className="h-4 w-1/2" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upcoming Appointments & Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Appointments */}
          <div>
            <SkeletonBlock className="h-6 w-1/4 mb-4" />
            <div className="space-y-4">
              <SkeletonBlock className="h-20 rounded-lg" />
              <SkeletonBlock className="h-20 rounded-lg" />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <SkeletonBlock className="h-6 w-1/4 mb-4" />
            <div className="space-y-4">
              <SkeletonBlock className="h-16 rounded-lg" />
              <SkeletonBlock className="h-16 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div>
          <SkeletonBlock className="h-6 w-1/2 mb-4" />
          <div className="space-y-4">
            <SkeletonBlock className="h-12 rounded-lg" />
            <SkeletonBlock className="h-12 rounded-lg" />
            <SkeletonBlock className="h-12 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardSkeleton;
