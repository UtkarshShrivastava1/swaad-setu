import React from 'react';

export const SkeletonSidebar = () => (
  <div className="p-4 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
    <ul>
      {[...Array(5)].map((_, i) => (
        <li key={i} className="flex items-center justify-between p-2">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-8"></div>
        </li>
      ))}
    </ul>
  </div>
);

export const SkeletonContent = () => (
  <div className="animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <div className="h-10 bg-gray-200 rounded w-48"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-10"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md">
          <div className="p-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonLoader = () => {
  return (
    <div className="p-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md">
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default SkeletonLoader;
