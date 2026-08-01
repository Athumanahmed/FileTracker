import React from "react";
import UserMenu from "../shared/UserMenu";
import NotificationBell from "../shared/NotificationBell";
import { PanelLeft } from "lucide-react";

const AppHeader = ({ setIsSidebarOpen }) => {
  return (
    <header className="w-full px-4 xl:px-8 py-3 shrink-0 sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mx-auto">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={19} />
          </button>

          <div className="flex flex-col leading-tight">
            <span className="sm:hidden text-base font-semibold text-primaryBlue">
              E-File
            </span>
            <span className="hidden sm:block lg:hidden text-base font-semibold text-primaryBlue">
              E-file Dashboard
            </span>
            <span className="hidden lg:flex items-center gap-2 text-base font-semibold text-primaryBlue">
              E-File Tracking Management System
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
