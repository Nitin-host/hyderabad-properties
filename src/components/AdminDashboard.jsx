import React, { useState, useEffect } from "react";
import { BarChart3, Building2, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PropertyManagement from "./PropertyManagement";
import UserManagement from "./UserManagement";
import AdminStats from "./AdminStats";

const AdminDashboard = () => {
  const { user, hasAdminAccess, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("properties");

  useEffect(() => {
    if (!hasAdminAccess()) {
      navigate("/");
    }
  }, [hasAdminAccess, navigate]);

  if (!user || !hasAdminAccess()) {
    return null;
  }

  const tabClass = (id) =>
    `py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
      activeTab === id
        ? "border-brand text-brand"
        : "border-transparent text-muted hover:text-fg hover:border-line"
    }`;

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-8 pb-24 lg:pb-8">
      <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6">
        Admin Dashboard
      </h1>

      <div className="bg-surface rounded-lg shadow-md p-3 sm:p-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="mr-3 sm:mr-4 shrink-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-brand flex items-center justify-center text-brand-fg text-lg sm:text-xl font-bold">
              {user.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold truncate">
              {user.name}
            </h2>
            <p className="text-sm text-muted">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
            </p>
          </div>
        </div>

        <div className="border-b border-line mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0">
          <nav className="-mb-px flex gap-4 sm:gap-8 overflow-x-auto">
            <button
              aria-label="Statistics"
              onClick={() => setActiveTab("stats")}
              className={`${tabClass("stats")} inline-flex items-center gap-1.5`}
            >
              <BarChart3 size={16} />
              Statistics
            </button>
            <button
              aria-label="Property Management"
              onClick={() => setActiveTab("properties")}
              className={`${tabClass("properties")} inline-flex items-center gap-1.5`}
            >
              <Building2 size={16} />
              Properties
            </button>
            {isSuperAdmin() && (
              <button
                aria-label="User Management"
                onClick={() => setActiveTab("users")}
                className={`${tabClass("users")} inline-flex items-center gap-1.5`}
              >
                <Users size={16} />
                Users
              </button>
            )}
          </nav>
        </div>

        <div className="py-2 sm:py-4">
          {activeTab === "stats" && <AdminStats />}
          {activeTab === "properties" && <PropertyManagement />}
          {activeTab === "users" && isSuperAdmin() && <UserManagement />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
