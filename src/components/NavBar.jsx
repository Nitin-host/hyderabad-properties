import React, { useState, useEffect, useRef } from "react";
import {
  User,
  LogOut,
  ChevronRight,
  Home,
  LayoutDashboard,
  Sun,
  Moon,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

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
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate("/", { replace: true });
  };

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
      <nav className="bg-surface border-b border-line shadow-sm p-4 lg:hidden sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            aria-label="RR Properties Hyderabad home"
            className="flex items-center space-x-2"
          >
            <img
              src="/RR_LOGO.svg"
              alt=""
              className="h-10 w-auto object-contain"
            />
            <span className="font-bold text-xl text-brand">
              RR Properties
            </span>
          </Link>

          <div className="flex items-center space-x-1" ref={mobileMenuRef}>
            <button
              type="button"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-raised text-muted"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {isAuthenticated ? (
              <div className="relative">
                <button
                  aria-label="User icon"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 rounded-lg hover:bg-raised flex items-center space-x-2"
                >
                  <User size={20} className="text-muted" />
                  <span className="text-sm text-fg">{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-line z-50">
                    <div className="px-4 py-2 border-b border-line">
                      <p className="text-sm text-fg">{user.name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                      {hasAdminAccess() && user.role && (
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                            isSuperAdmin()
                              ? "bg-purple-600 text-white"
                              : "bg-blue-600 text-white"
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
                        className="w-full px-4 py-2 text-left text-brand hover:bg-raised rounded-lg flex items-center space-x-2"
                      >
                        <LayoutDashboard size={16} />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      aria-label="Logout"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-raised rounded-lg flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                aria-label="Login"
                onClick={onLoginClick}
                className="px-4 py-2 bg-brand hover:opacity-90 text-brand-fg rounded-lg text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop navbar */}
      <div className="hidden lg:flex items-center justify-between bg-surface border-b border-line shadow-sm px-4 py-3 w-full sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            aria-label="RR Properties Hyderabad home"
            className="flex items-center space-x-2"
          >
            <img
              src="/RR_LOGO.svg"
              alt=""
              className="h-9 w-auto object-contain"
            />
            <span className="text-brand font-bold text-xl tracking-widest">
              RR PROPERTIES
            </span>
          </Link>

          <button
            aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="p-2 rounded-lg hover:bg-raised transition-colors"
            title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isDesktopCollapsed ? (
              <PanelLeft size={20} className="text-muted" />
            ) : (
              <PanelLeftClose size={20} className="text-muted" />
            )}
          </button>

          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center space-x-2">
                {index === 0 && <Home size={16} className="text-muted" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-fg font-medium">{crumb.name}</span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-muted hover:text-fg transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight size={16} className="text-muted" />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2" ref={desktopMenuRef}>
          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-raised text-muted"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {isAuthenticated ? (
            <div className="relative">
              <button
                aria-label="User icon"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 rounded-lg hover:bg-raised flex items-center space-x-2"
              >
                <User size={20} className="text-muted" />
                <span className="text-sm text-fg">{user.name}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-line z-50">
                  <div className="px-4 py-2 border-b border-line">
                    <p className="text-sm text-fg">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                    {hasAdminAccess() && user.role && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                          isSuperAdmin()
                            ? "bg-purple-600 text-white"
                            : "bg-blue-600 text-white"
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
                      className="w-full px-4 py-2 text-left text-brand hover:bg-raised rounded-lg flex items-center space-x-2"
                    >
                      <LayoutDashboard size={16} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    aria-label="Logout"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-raised rounded-lg flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              aria-label="Login"
              onClick={onLoginClick}
              className="px-4 py-2 bg-brand hover:opacity-90 text-brand-fg rounded-lg text-sm font-medium"
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