import React, { useState } from "react";
import { Home, Heart, User, Settings, X, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Sidebar = ({ isOpen, onClose, isDesktopCollapsed, onLoginClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated, hasAdminAccess } = useAuth();

  const handleProtectedNavigation = (e, requiresAuth) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      onLoginClick();
      if (isOpen) {
        onClose();
      }
    }
  };

const linkClasses = (extra = "") =>
  `flex items-center p-3 rounded-lg hover:bg-gray-800 transition-all duration-200 text-gray-300 hover:text-white group space-x-3 ${extra} ${
    isDesktopCollapsed && !isHovered ? "lg:justify-center lg:p-2 lg:space-x-0" : ""
  }`;


const labelClasses =
  "transition-all duration-200" +
  (isDesktopCollapsed && !isHovered
    ? "lg:opacity-0 lg:w-0 lg:overflow-hidden"
    : "opacity-100");


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className="relative">
        <div
          className={`bg-gray-800 shadow-lg transition-all duration-200 ease-out z-40
            ${
              isOpen
                ? "fixed left-0 top-0 h-full translate-x-0"
                : "fixed left-0 top-0 h-full -translate-x-full"
            }
          lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh)] lg:translate-x-0 lg:border-r lg:border-gray-700
          ${isDesktopCollapsed && isHovered ? "lg:shadow-lg" : "lg:shadow-none"}
          ${isDesktopCollapsed ? (isHovered ? "lg:w-64" : "lg:w-16") : "lg:w-64"}
          w-64`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header (mobile only) */}
          <div className="flex items-center justify-end p-4 border-b border-gray-700 lg:hidden">
            <button
              aria-label="Close"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav
            className={`p-4 ${
              isDesktopCollapsed && !isHovered ? "lg:p-2" : ""
            }`}
          >
            <ul className="space-y-2">
              {/* Home */}
              <li>
                <Link
                  to="/"
                  className={linkClasses()}
                  title="Home"
                  onClick={onClose} // 👈 close sidebar on click
                >
                  <Home size={20} className="flex-shrink-0" />
                  <span className={labelClasses}>Home</span>
                </Link>
              </li>

              {/* Favorites */}
              <li>
                <Link
                  to="/favorites"
                  className={linkClasses()}
                  title="Favorites"
                  onClick={onClose} // 👈 close sidebar on click
                >
                  <Heart size={20} className="flex-shrink-0" />
                  <span className={labelClasses}>Favorites</span>
                </Link>
              </li>

              {/* Admin (only if access) */}
              {hasAdminAccess() && (
                <li>
                  <Link
                    to="/admin"
                    className={linkClasses()}
                    title="Admin Dashboard"
                    onClick={onClose} // 👈 close sidebar on click
                  >
                    <LayoutDashboard size={20} className="flex-shrink-0" />
                    <span className={labelClasses}>Admin Dashboard</span>
                  </Link>
                </li>
              )}

              {/* Profile */}
              <li>
                <Link
                  to={isAuthenticated ? "/profile" : "#"}
                  onClick={(e) => {
                    handleProtectedNavigation(e, true);
                    if (isAuthenticated) onClose(); // 👈 close if logged in
                  }}
                  className={linkClasses(!isAuthenticated ? "opacity-75" : "")}
                  title={
                    isAuthenticated ? "Profile" : "Profile (Login required)"
                  }
                >
                  <User size={20} className="flex-shrink-0" />
                  <span className={labelClasses}>Profile</span>
                  {!isAuthenticated && (
                    <span
                      className={`text-xs text-gray-400 ${
                        isDesktopCollapsed && !isHovered ? "lg:hidden" : ""
                      }`}
                    >
                      (Login required)
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
