import { LogOut, User, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 bg-white flex items-center justify-between px-4 md:px-6 border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:block" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} />
          <span className="hidden sm:inline">{user?.username}</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs capitalize">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
