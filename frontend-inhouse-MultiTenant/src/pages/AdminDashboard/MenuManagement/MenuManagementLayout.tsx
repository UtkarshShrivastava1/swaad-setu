import React from 'react';

interface MenuManagementLayoutProps {
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
}

const MenuManagementLayout: React.FC<MenuManagementLayoutProps> = ({ sidebar, mainContent }) => {
  return (
    <div className="flex h-screen bg-black">
      <div className="w-64 bg-black shadow-md">
        {sidebar}
      </div>
      <div className="flex-1 p-6">
        {mainContent}
      </div>
    </div>
  );
};

export default MenuManagementLayout;
