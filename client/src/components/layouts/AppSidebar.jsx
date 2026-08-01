import { useEffect, useRef, useState } from "react";
import useAuthStore from "../../store/authStore";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { sidebarRoutes } from "../../utils/sidebarRoutes";
import { imageAssets } from "../../assets/assets";

/** Drops any item the user's permission list doesn't cover, recursively. */
const filterByPermission = (items, permissions) =>
  items
    .filter((item) => !item.permission || permissions.includes(item.permission))
    .map((item) =>
      item.children
        ? { ...item, children: filterByPermission(item.children, permissions) }
        : item,
    );

const AppSidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { user } = useAuthStore();
  const sidebarRef = useRef(null);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const location = useLocation();

  const roleCode = user?.roles?.[0]?.code;
  const menus = filterByPermission(sidebarRoutes[roleCode] || [], user?.permissions || []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsSidebarOpen]);

  const toggleDropdown = (title) => {
    setOpenDropdowns((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    const checkChildActive = (children, path) =>
      children.some(
        (child) =>
          child.path === path ||
          (child.children && checkChildActive(child.children, path)),
      );

    const openParentsRecursively = (items) => {
      items.forEach((item) => {
        if (item.children) {
          if (checkChildActive(item.children, location.pathname)) {
            setOpenDropdowns((prev) => ({ ...prev, [item.title]: true }));
          }
          openParentsRecursively(item.children);
        }
      });
    };

    openParentsRecursively(menus);
  }, [location.pathname]);

  const renderMenu = (items, depth = 0) =>
    items.map((item, index) => {
      const isOpen = openDropdowns[item.title];

      return (
        <div key={index} className="mb-1">
          {item.children ? (
            <>
              {/* DROPDOWN HEADER */}
              <div
                onClick={() => toggleDropdown(item.title)}
                className="cursor-pointer flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/8 transition-all duration-150 text-sm"
                style={{ paddingLeft: `${depth * 14 + 12}px` }}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon && (
                    <item.icon
                      className="size-4.5 shrink-0"
                      strokeWidth={1.5}
                    />
                  )}
                  <span>{item.title}</span>
                </div>
                <ChevronDown
                  className={`size-4 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* CHILDREN */}
              <div
                className={`relative ml-4 mt-0.5 pl-2.5 border-l border-white/15 transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? "max-h-96" : "max-h-0"
                }`}
              >
                {renderMenu(item.children, depth + 1)}
              </div>
            </>
          ) : (
            <NavLink
              to={item.path}
              end
              className={({ isActive }) =>
                `relative text-sm flex items-center gap-2.5 px-3 py-2.5 mb-0.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-white/15 text-white font-semibold shadow-sm"
                    : "text-white/75 hover:text-white hover:bg-white/8 font-normal"
                }`
              }
              style={{ paddingLeft: `${depth * 14 + 12}px` }}
              onClick={() => setIsSidebarOpen(false)}
            >
              {({ isActive }) => (
                <>
                  {item.icon && (
                    <item.icon
                      className={`size-4.5 shrink-0 transition-colors duration-150 ${
                        isActive ? "text-white" : "text-white/60"
                      }`}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                  )}
                  <span>{item.title}</span>
                  {isActive && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-l-full" />
                  )}
                </>
              )}
            </NavLink>
          )}
        </div>
      );
    });
  return (
    <div
      ref={sidebarRef}
      className={`z-10 bg-primaryBlue min-w-68 flex flex-col h-screen border-r border-primaryBlue/80 max-sm:absolute transition-all duration-300 ${
        isSidebarOpen ? "left-0" : "-left-full"
      }`}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center justify-center py-5 gap-2 border-b border-white/10"
      >
        <img src={imageAssets.logo} alt="Logo" className="h-7 w-auto" />
        <p className="text-xl text-white font-bold tracking-tight">E-File</p>
      </Link>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4">
        {renderMenu(menus)}
      </div>

      {/* Footer strip */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-xs text-white/30 text-center">
          © {new Date().getFullYear()} E-File
        </p>
      </div>
    </div>
  );
};

export default AppSidebar;
