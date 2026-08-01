import { useState, Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-64 py-20">
    <div className="relative w-9 h-9">
      <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primaryBlue animate-spin" />
    </div>
    <p className="mt-3 text-xs text-gray-400 font-medium tracking-wide animate-pulse">
      Loading…
    </p>
  </div>
);
const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen">
      <AppSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col">
        <AppHeader setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-2 xl:p-4 xl:px-4">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <AppFooter />
      </div>
    </div>
  );
};

export default AppLayout;
