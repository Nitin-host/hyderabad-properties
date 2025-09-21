import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Home, Users, DollarSign } from "lucide-react";
import api from "../services/api";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"];

const AdminDashboard = () => {
  const { user, hasAdminAccess, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!hasAdminAccess()) {
      navigate("/");
    } else {
       api.get('/properties/admin/stats').then((res) => {
          if (res.data) setStats(res.data);
        }).catch((err) => console.error("Dashboard fetch error:", err));
    }
  }, [hasAdminAccess, navigate]);

  if (!user || !hasAdminAccess() || !stats) {
    return <p className="text-center text-gray-400">Loading Dashboard...</p>;
  }
  console.log(stats);
  const overview = stats.overview;
  const propertyTypeDistribution = stats.propertyTypeDistribution;
  const monthlyStats = stats.monthlyCreationStats.map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    count: item.count,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 text-white">Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <Home className="h-8 w-8 text-blue-400 mb-2" />
          <h2 className="text-lg font-semibold">Total Properties</h2>
          <p className="text-2xl font-bold">{overview.totalProperties}</p>
        </div>

        <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <TrendingUp className="h-8 w-8 text-green-400 mb-2" />
          <h2 className="text-lg font-semibold">Active</h2>
          <p className="text-2xl font-bold">{overview.activeProperties}</p>
        </div>

        <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <DollarSign className="h-8 w-8 text-yellow-400 mb-2" />
          <h2 className="text-lg font-semibold">Avg Price</h2>
          <p className="text-2xl font-bold">
            ₹{Math.round(overview.averagePrice || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <Users className="h-8 w-8 text-purple-400 mb-2" />
          <h2 className="text-lg font-semibold">Featured</h2>
          <p className="text-2xl font-bold">{overview.featuredProperties}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pie Chart - Property Type */}
        <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Property Type Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={propertyTypeDistribution}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {propertyTypeDistribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Monthly Creation */}
        <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Monthly Property Creation
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Status Breakdown */}
      <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Property Status Breakdown
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={[
              { status: "Available", count: overview.availableProperties },
              { status: "Sold", count: overview.soldProperties },
              { status: "Rented", count: overview.rentedProperties },
              { status: "Deleted", count: overview.deletedProperties },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="status" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
