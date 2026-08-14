import React, { useEffect, useState } from "react";
import {
  Home,
  Heart,
  CircleUser,
  Phone,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";

const Sidebar = ({ isDesktopCollapsed }) => {
  const { isAuthenticated, hasAdminAccess, isSuperAdmin } = useAuth();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!isDesktopCollapsed) setHovered(false);
  }, [isDesktopCollapsed]);

  const expanded = !isDesktopCollapsed || hovered;

  const items = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/favorites", label: "Favorites", icon: Heart },
    ...(hasAdminAccess()
      ? [
          {
            to: "/admin",
            label: isSuperAdmin() ? "Super Admin" : "Admin",
            icon: isSuperAdmin() ? ShieldCheck : LayoutDashboard,
          },
        ]
      : [{ to: "/contact", label: "Contact", icon: Phone }]),
    ...(isAuthenticated
      ? [{ to: "/profile", label: "Profile", icon: CircleUser }]
      : []),
  ];

  const itemClass = (active) =>
    `flex items-center rounded-xl transition-colors w-full ${
      expanded ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-3"
    } ${
      active
        ? "bg-brand/15 text-brand font-medium"
        : "text-muted hover:bg-raised hover:text-fg"
    }`;

  return (
    <aside
      onMouseEnter={() => {
        if (isDesktopCollapsed) setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      className={`relative z-20 hidden lg:flex flex-col shrink-0 self-stretch border-r border-line bg-surface ${
        isDesktopCollapsed ? "w-[4.75rem]" : "w-60"
      }`}
    >
      <div
        className={`sticky top-16 bg-surface transition-[width,box-shadow] duration-200 ${
          isDesktopCollapsed && hovered
            ? "z-30 w-60 min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto border-r border-line shadow-2xl"
            : "w-full max-h-[calc(100vh-4rem)] overflow-y-auto"
        }`}
      >
        <nav className={`py-4 ${expanded ? "px-3" : "px-2"}`}>
          {expanded && (
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Menu
            </p>
          )}
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    className={({ isActive }) => itemClass(isActive)}
                  >
                    <Icon size={22} className="shrink-0" />
                    {expanded && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
