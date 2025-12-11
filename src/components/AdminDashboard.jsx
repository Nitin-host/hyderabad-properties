import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PropertyManagement from "./PropertyManagement";
import UserManagement from "./UserManagement";
import AdminStats from "./AdminStats"; // new component for stats

const AdminDashboard = () => {
  const { user, hasAdminAccess, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("properties");

  React.useEffect(() => {
    if (!hasAdminAccess()) {
      navigate("/");
    }
  }, [hasAdminAccess, navigate]);

  if (!user || !hasAdminAccess()) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        {/* User info */}
        <div className="flex items-center mb-6">
          <div className="mr-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {user.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-400">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              aria-label="Statistics"
              onClick={() => setActiveTab("stats")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "stats"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
              }`}
            >
              Statistics
            </button>

            <button
              aria-label="Property Management"
              onClick={() => setActiveTab("properties")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "properties"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
              }`}
            >
              Property Management
            </button>

            {isSuperAdmin() && (
              <button
                aria-label="User Management"
                onClick={() => setActiveTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                User Management
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {activeTab === "stats" && <AdminStats />}
          {activeTab === "properties" && <PropertyManagement />}
          {activeTab === "users" && isSuperAdmin() && <UserManagement />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
