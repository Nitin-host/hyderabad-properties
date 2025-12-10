import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  User,
  LogOut,
  ChevronRight,
  Home,
  LayoutDashboard,
  X,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NavBar = ({
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  isSidebarOpen,
  setIsSidebarOpen,
  onLoginClick,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isAuthenticated, hasAdminAccess, isSuperAdmin } =
    useAuth();
  const location = useLocation();

  // Separate refs for mobile and desktop menus
  const mobileMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        desktopMenuRef.current &&
        !desktopMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = [{ name: "Home", path: "/" }];

    if (path === "/admin") crumbs.push({ name: "Admin Dashboard", path });
    else if (path === "/profile") crumbs.push({ name: "Profile", path });
    else if (path === "/favorites") crumbs.push({ name: "Favorites", path });
    else if (path.startsWith("/property/"))
      crumbs.push({ name: "Property Details", path });

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* Mobile navbar */}
      <nav className="bg-gray-800 shadow-md p-4 lg:hidden sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            name="SideBar"
            aria-label="side-bar"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700"
          >
            {isSidebarOpen ? (
              <X size={24} className="text-gray-300" />
            ) : (
              <Menu size={24} className="text-gray-300" />
            )}
          </button>

          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/RR_LOGO.svg"
              alt="RR Properties"
              className="h-10 w-auto object-contain"
            />
            <span className="font-bold text-xl text-[#E8A667]">
              RR Properties
            </span>
          </Link>

          <div className="flex items-center space-x-2" ref={mobileMenuRef}>
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                >
                  <User size={20} className="text-gray-300" />
                  <span className="text-sm text-gray-300">{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm text-gray-300">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      {hasAdminAccess() && user.role && (
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                            isSuperAdmin()
                              ? "bg-purple-600 text-white"
                              : hasAdminAccess()
                              ? "bg-blue-600 text-white"
                              : "bg-gray-600 text-gray-300"
                          }`}
                        >
                          {user.role.replace("_", " ").toUpperCase()}
                        </span>
                      )}
                    </div>
                    {hasAdminAccess() && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-2 text-left text-blue-500 hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                      >
                        <LayoutDashboard size={16} />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop navbar */}
      <div className="hidden lg:flex items-center justify-between bg-gray-800 shadow-md p-4 w-full sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/RR_LOGO.svg"
              alt="RR Properties"
              className="h-9 w-auto object-contain"
            />
            <span className="text-[#E8A667] font-bold text-xl tracking-widest">
              RR PROPERTIES
            </span>
          </Link>

          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={20} className="text-gray-300" />
          </button>

          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center space-x-2">
                {index === 0 && <Home size={16} className="text-gray-400" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-white font-medium">{crumb.name}</span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4" ref={desktopMenuRef}>
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <User size={20} className="text-gray-300" />
                <span className="text-sm text-gray-300">{user.name}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm text-gray-300">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {hasAdminAccess() && user.role && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                          isSuperAdmin()
                            ? "bg-purple-600 text-white"
                            : hasAdminAccess()
                            ? "bg-blue-600 text-white"
                            : "bg-gray-600 text-gray-300"
                        }`}
                      >
                        {user.role.replace("_", " ").toUpperCase()}
                      </span>
                    )}
                  </div>
                  {hasAdminAccess() && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-4 py-2 text-left text-blue-500 hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                    >
                      <LayoutDashboard size={16} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default NavBar;