import React from 'react';
import { Bell } from 'lucide-react';

interface CallWaiterButtonProps {
  onClick?: () => void;
}

const CallWaiterButton: React.FC<CallWaiterButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-emerald-500 text-white px-3 py-2 rounded-full shadow hover:bg-emerald-600 transition-colors flex items-center gap-2"
      // Removed fixed, position, bottom, right classes
    >
      <Bell size={15} />
      <span className="font-semibold text-sm">Call Waiter</span>
    </button>
  );
};

export default CallWaiterButton;
