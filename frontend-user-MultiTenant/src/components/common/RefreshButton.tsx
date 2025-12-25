import { RefreshCw } from "lucide-react";
import React from "react";

type RefreshButtonProps = {
  positionClassName?: string;
};

const RefreshButton: React.FC<RefreshButtonProps> = ({
  positionClassName = "bottom-24 right-4",
}) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      className={`fixed ${positionClassName} z-50 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-full p-3 shadow-lg transition-transform transform hover:scale-110 animate-in fade-in zoom-in`}
      aria-label="Refresh Page"
    >
      <RefreshCw size={20} className="animate-spin" />
    </button>
  );
};

export default RefreshButton;