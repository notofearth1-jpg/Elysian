import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonCard = ({ className = "" }) => (
  <motion.div
    className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
    initial={{ opacity: 0.6 }}
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity }}
  />
);

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonCard 
        key={index} 
        className={`h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Skeleton */}
      <div className="text-center mb-8">
        <SkeletonCard className="h-10 w-64 mx-auto mb-4" />
        <div className="flex items-center justify-center space-x-4">
          <SkeletonCard className="h-8 w-24" />
          <SkeletonCard className="h-8 w-20" />
        </div>
      </div>

      {/* Today's Journey Skeleton */}
      <SkeletonCard className="h-48 w-full" />

      {/* Main Navigation Hub Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} className="h-40" />
        ))}
      </div>

      {/* Bottom Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="h-64" />
        <div className="space-y-6">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
        </div>
      </div>
    </div>
  </div>
);

export const ConversationSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-6">
    <div className="text-center mb-6">
      <SkeletonCard className="h-8 w-64 mx-auto mb-2" />
      <SkeletonCard className="h-4 w-48 mx-auto" />
    </div>
    
    <div className="bg-white rounded-2xl shadow-lg h-96 flex flex-col p-6">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <SkeletonCard className={`h-16 ${index % 2 === 0 ? 'w-3/4' : 'w-1/2'} rounded-2xl`} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const LessonSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-6">
    <div className="text-center mb-6">
      <SkeletonCard className="h-8 w-64 mx-auto mb-2" />
      <SkeletonCard className="h-4 w-48 mx-auto" />
    </div>
    
    <div className="mb-6">
      <SkeletonCard className="h-2 w-full" />
    </div>

    <div className="bg-white rounded-2xl shadow-lg p-8">
      <SkeletonCard className="h-6 w-48 mb-4" />
      <SkeletonText lines={4} className="mb-6" />
      <SkeletonCard className="h-32 w-full" />
    </div>
  </div>
);