import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ComboCardShimmer: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <Skeleton height={160} />
      <div className="p-4">
        <Skeleton height={24} width="80%" />
        <Skeleton height={16} width="60%" className="mt-2" />
        <div className="mt-4 flex justify-between items-center">
          <Skeleton height={28} width="40%" />
          <Skeleton height={20} width="30%" />
        </div>
        <Skeleton height={44} className="mt-3" />
      </div>
    </div>
  );
};

export default ComboCardShimmer;
