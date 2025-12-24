import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, Menu } from 'lucide-react';

interface MenuManagementLayoutProps {
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onFullscreenChange: (isFs: boolean) => void;
  modals?: (isFullscreen: boolean) => React.ReactNode; // Changed prop type
}

const MenuManagementLayout: React.FC<MenuManagementLayoutProps> = ({ sidebar, mainContent, isSidebarOpen, toggleSidebar, onFullscreenChange, modals }) => {
  const layoutRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;
      const currentlyFullscreen = fsElement === layoutRef.current;
      setIsFullscreen(currentlyFullscreen);
      onFullscreenChange(currentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  const toggleFullscreen = () => {
    if (!layoutRef.current) return;

    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) { /* Safari */
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { /* Firefox */
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) { /* IE11 */
        (document as any).msExitFullscreen();
      }
    } else {
      if (layoutRef.current.requestFullscreen) {
        layoutRef.current.requestFullscreen();
      } else if ((layoutRef.current as any).webkitRequestFullscreen) { /* Safari */
        (layoutRef.current as any).webkitRequestFullscreen();
      } else if ((layoutRef.current as any).mozRequestFullScreen) { /* Firefox */
        (layoutRef.current as any).mozRequestFullScreen();
      } else if ((layoutRef.current as any).msRequestFullscreen) { /* IE11 */
        (layoutRef.current as any).msRequestFullscreen();
      }
    }
  };

  return (
    <div ref={layoutRef} className={`relative flex h-screen ${isFullscreen ? 'w-screen' : 'bg-gray-100 dark:bg-black overflow-hidden'}`}>
      {/* Responsive Sidebar */}
      <div
        className={`w-64 md:w-72 bg-white dark:bg-gray-900 shadow-md z-40
          ${
            isSidebarOpen
              ? 'fixed inset-y-0 left-0 transform translate-x-0 transition-transform duration-300 ease-in-out'
              : 'fixed inset-y-0 left-0 transform -translate-x-full transition-transform duration-300 ease-in-out md:translate-x-0'
          }
          md:static
        `}
        aria-hidden={!isSidebarOpen}
      >
        {sidebar}
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && !isFullscreen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden md:w-[calc(100%-18rem)]">
        <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-900">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 ml-auto"
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {mainContent}
        </div>
      </div>
                      {modals && modals(isFullscreen)}
                    </div>
                  );
                };export default MenuManagementLayout;
