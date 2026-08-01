import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClickAway } from "react-use";
import { ChevronDown, LogOut, User as UserIcon, Settings } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getInitials } from "../../utils/formatters";

/** Authenticated-state replacement for the Navbar's Login button -- renders nothing if no user is loaded. */
const UserMenu = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useClickAway(menuRef, () => setIsOpen(false));

  if (!user) return null;

  const displayName = user.fullName || user.username;
  const roleLabel = user.roles?.[0]?.name;

  const goTo = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex justify-center items-center gap-2 rounded-full  py-1.5 pr-3 transition-all duration-200 ease-in-out"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-goldAccent text-xs font-bold text-primaryBlueDark">
          {getInitials(displayName) || <UserIcon size={14} />}
        </span>
      </button>

      <div
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute right-0 z-50 w-55 origin-top-right overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 text-gray-700 shadow-md transition-all duration-200 ease-in-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "pointer-events-none opacity-0 scale-95 -translate-y-1"
        }`}
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="truncate text-sm font-semibold text-gray-900">
            {displayName}
          </p>
          {user.email && (
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          )}
        </div>

        <button
          role="menuitem"
          onClick={() => goTo("/profile")}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
        >
          <UserIcon size={15} /> My Profile
        </button>
        <button
          role="menuitem"
          onClick={() => goTo("/settings")}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
        >
          <Settings size={15} /> Account Settings
        </button>

        <div className="my-1 border-t border-gray-100" />

        <button
          role="menuitem"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserMenu;
