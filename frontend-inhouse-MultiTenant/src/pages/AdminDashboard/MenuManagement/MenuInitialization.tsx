import React, { useState } from 'react';
import CreateMenuModal from './components/CreateMenuModal';

const MenuInitialization = ({ onMenuCreated }: { onMenuCreated: () => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <div className="text-center">
        <div className="mb-8">
                      <svg
                      className="w-48 h-48 mx-auto text-gray-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0c-.454-.303-.977-.454-1.5-.454V4.546c.523 0 1.046-.151 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0c.454.303.977.454 1.5.454v11z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 18.546V21m0-16.5V21m-4-11v11m8-11v11"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Let's set up your digital menu.
        </h1>
        <p className="text-gray-300 mb-8">
          Create a beautiful, organized menu for your customers in minutes.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
        >
          Create Menu
        </button>
      </div>
      <CreateMenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMenuCreated={onMenuCreated}
      />
    </div>
  );
};

export default MenuInitialization;
