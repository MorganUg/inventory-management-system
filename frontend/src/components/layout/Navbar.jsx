import { LogOut, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} />
          <span>{user?.username}</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs capitalize">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
};
