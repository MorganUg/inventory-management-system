import { NavLink } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, BarChart, BarChart2, BookOpen, ClipboardList, FlaskConical, LayoutDashboard, Logs, Package, Truck, Users, Candy, Tag } from 'lucide-react';
import Logo from '../../assets/logo.png';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/raw-materials', label: 'Raw Materials', icon: FlaskConical },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/restocks', label: 'Restock', icon: ArrowDownCircle },
  { to: '/bom', label: 'Bill of Materials', icon: BookOpen },
  { to: '/batches', label: 'Production', icon: ClipboardList },
  { to: '/finished-goods', label: 'Finished Goods', icon: Package },
  { to: '/dispatches', label: 'Dispatches', icon: ArrowUpCircle },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/stock-movements', label: 'stock History', icon: BarChart },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
  { to: '/logs', label: 'Logs', icon: Logs },
];

export const Sidebar = () => (
  <aside className="w-16 md:w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col overflow-hidden">
    <div className="p-5 md:p-5 p-2 border-b border-gray-200">
      <div className="flex items-center gap-2 justify-center md:justify-start">
        <div className="md:w-10 md:h-10 bg-amber-500 rounded-lg shadow-sm flex items-center justify-center">
          {/* <span className="text-white font-semibold text-xs md:text-sm tracking-wide">CK</span> */}
          {/* <Candy size={20} className="text-white md:size-20" /> */}
          <img 
            src={Logo}
            alt="CK Logo"
            className="md:w-10 md:h-10 object-contain"
          />

        </div>
        <div className="hidden md:block">
          <p className="font-bold text-gray-900 text-sm">Candy Kingdom</p>
          <p className="text-xs text-gray-400">Inventory Management System</p>
        </div>
      </div>
    </div>

    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          title={label}
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => 
            `flex items-center md:justify-start gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive 
              ? 'bg-amber-50 text-amber-700 font-medium' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <Icon size={17} />
          <span className="hidden md:inline">{label}</span>
        </NavLink>
      ))}
    </nav>
  </aside>
)