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
import { TrendingUp, Home, IndianRupee } from "lucide-react";
import api from "../services/api";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"];

const AdminDashboard = () => {
  const { user, hasAdminAccess } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month"); // week, month, year
  const [creationStats, setCreationStats] = useState([]);

  useEffect(() => {
    if (!hasAdminAccess()) {
      navigate("/");
    } else {
      api
        .get(`/properties/admin/stats?range=${timeRange}`)
        .then((res) => {
          if (res.data) {
            setStats(res.data);
            mapCreationStats(res.data.monthlyCreationStats);
          }
        })
        .catch((err) => console.error("Dashboard fetch error:", err));
    }
  }, [hasAdminAccess, navigate, timeRange]);

  const mapCreationStats = (data) => {
    const mapped = data.map((item) => {
      if (timeRange === "week") {
        return {
          period: `W${item._id.week} ${item._id.year}`,
          count: item.count,
        };
      } else if (timeRange === "month") {
        return {
          period: `${item._id.month}/${item._id.year}`,
          count: item.count,
        };
      } else {
        // year
        return { period: `${item._id.year}`, count: item.count };
      }
    });
    setCreationStats(mapped);
  };

  if (!user || !hasAdminAccess() || !stats) {
    return <p className="text-center text-gray-400">Loading Dashboard...</p>;
  }

  const overview = stats.overview;
  const propertyTypeDistribution = stats.propertyTypeDistribution;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 text-white">Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
          <IndianRupee className="h-8 w-8 text-yellow-400 mb-2" />
          <h2 className="text-lg font-semibold">Avg Price</h2>
          <p className="text-2xl font-bold">
            ₹{Math.round(overview.averagePrice || 0).toLocaleString()}
          </p>
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

        {/* Line Chart - Property Creation */}
        <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Property Creation</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-700 text-white rounded p-1"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={creationStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="period" stroke="#ccc" />
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
            <Bar dataKey="count">
              {[
                overview.availableProperties,
                overview.soldProperties,
                overview.rentedProperties,
                overview.deletedProperties,
              ].map((_, index) => {
                const colors = ["#22c55e", "#ef4444", "#f97316", "#6b7280"]; // green, red, orange, gray
                return <Cell key={index} fill={colors[index]} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
