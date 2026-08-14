import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Heart,
  Phone,
  CircleUser,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MobileBottomNav = () => {
  const { isAuthenticated, hasAdminAccess, isSuperAdmin } = useAuth();
  const location = useLocation();
  const isAdmin = hasAdminAccess();

  const items = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/favorites", label: "Saved", icon: Heart },
    ...(isAdmin
      ? [
          {
            to: "/admin",
            label: "Admin",
            icon: isSuperAdmin() ? ShieldCheck : LayoutDashboard,
          },
        ]
      : [{ to: "/contact", label: "Contact", icon: Phone }]),
    ...(isAuthenticated
      ? [{ to: "/profile", label: "You", icon: CircleUser }]
      : []),
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 pointer-events-none"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Mobile menu"
    >
      <div className="pointer-events-auto mx-3 mb-1 rounded-[1.75rem] border border-line/70 bg-surface/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
        <ul
          className="grid h-[4.25rem] px-1.5"
          style={{
            gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <li key={item.to} className="h-full flex items-center justify-center">
                <NavLink
                  to={item.to}
                  end={item.end}
                  aria-label={item.label}
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-[3.75rem] py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? "bg-brand text-brand-fg shadow-sm"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.4 : 2}
                    fill={
                      isActive && item.to === "/favorites"
                        ? "currentColor"
                        : "none"
                    }
                  />
                  <span className="text-[11px] font-semibold leading-none">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
