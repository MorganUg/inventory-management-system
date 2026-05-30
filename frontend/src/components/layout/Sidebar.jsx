import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart,
  BarChart2,
  BookOpen,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Logs,
  Package,
  Truck,
  Users,
  Candy,
  Tag,
} from "lucide-react";
import Logo from "../../assets/logo.png";

const allLinks = [
  {
    group: "Main",
    links: [
      {
        to: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "manager", "staff"],
      },
    ],
  },
  {
    group: "Inventory",
    links: [
      {
        to: "/raw-materials",
        label: "Raw Materials",
        icon: FlaskConical,
        roles: ["admin", "manager", "staff"],
      },
      {
        to: "/restocks",
        label: "Restocks",
        icon: ArrowDownCircle,
        roles: ["admin", "manager"],
      },
      {
        to: "/finished-goods",
        label: "Finished Goods",
        icon: Package,
        roles: ["admin", "manager", "staff"],
      },
      {
        to: "/stock-movements",
        label: "Stock History",
        icon: BarChart2,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    group: "Production",
    links: [
      {
        to: "/bom",
        label: "Bill of Materials",
        icon: BookOpen,
        roles: ["admin", "manager"],
      },
      {
        to: "/batches",
        label: "Production Batches",
        icon: ClipboardList,
        roles: ["admin", "manager", "staff"],
      },
      {
        to: "/dispatches",
        label: "Dispatches",
        icon: ArrowUpCircle,
        roles: ["admin", "manager", "staff"],
      },
    ],
  },
  {
    group: "Management",
    links: [
      {
        to: "/suppliers",
        label: "Suppliers",
        icon: Truck,
        roles: ["admin", "manager"],
      },
      {
        to: "/customers",
        label: "Customers",
        icon: Users,
        roles: ["admin", "manager"],
      },
      {
        to: "/categories",
        label: "Categories",
        icon: Tag,
        roles: ["admin", "manager"],
      },
      {
        to: "/users",
        label: "Users",
        icon: Users,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    group: "Analytics",
    links: [
      {
        to: "/reports",
        label: "Reports",
        icon: BarChart2,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    group: "Admin",
    links: [
      {
        to: "/logs",
        label: "Logs",
        icon: Logs,
        roles: ["admin"],
      },
    ],
  },
];

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role;

  // Filter links based on user role
  const visibleGroups = allLinks
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => link.roles.includes(role)),
    }))
    .filter((group) => group.links.length > 0); // Only show groups with visible links

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
            <img
              src={Logo}
              alt="CK Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Candy Kingdom</p>
            <p className="text-xs text-gray-400">Inventory Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.group} className="mb-4">
            {/* Group Title */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
              {group.group}
            </p>

            {/* Group Links */}
            <div className="space-y-0.5">
              {group.links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors 
                  ${
                    isActive
                      ? "bg-amber-50 text-amber-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Role-based Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 uppercase">
            {user?.username?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-400">{role}</p>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${
              role === "admin"
                ? "bg-red-100 text-red-700"
                : role === "manager"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {role}
          </span>
        </div>
      </div>
    </aside>
  );
};
