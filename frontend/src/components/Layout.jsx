import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench,
  Fuel, BarChart3, Settings as SettingsIcon, LogOut, Menu, X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fleet", label: "Fleet", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/trips", label: "Trips", icon: RouteIcon },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const navContent = (
    <>
      <div className="px-3 mb-8 flex items-center justify-between">
        <h1 className="text-white font-semibold text-lg">TransitOps</h1>
        <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm transition ${
                isActive
                  ? "bg-amber-600/90 text-white"
                  : "text-gray-400 hover:bg-[#161b22] hover:text-gray-200"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded text-sm text-gray-400 hover:bg-[#161b22] hover:text-red-400 transition"
      >
        <LogOut size={16} />
        Logout
      </button>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#0d1117]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-[#0d1117] border-r border-gray-800 flex flex-col py-6 px-3 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 bg-[#0d1117] gap-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {title && <h2 className="text-white text-base sm:text-lg font-semibold lg:hidden">{title}</h2>}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <span
              className={`hidden sm:inline w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-600"}`}
              title={connected ? "Live updates connected" : "Live updates disconnected"}
            />
            <span className="text-sm text-gray-300 hidden sm:inline">{user?.name || "User"}</span>
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium">
              {user?.role || "Role"}
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs text-white font-medium">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {title && <h2 className="text-white text-lg font-semibold mb-5 hidden lg:block">{title}</h2>}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
