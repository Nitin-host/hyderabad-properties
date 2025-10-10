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
import { TrendingUp, Home, IndianRupee, Image, Video, Slash } from "lucide-react";
import api from "../services/api";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"];

// import statements remain same
const AdminDashboard = () => {
  const { user, hasAdminAccess } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [creationStats, setCreationStats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasAdminAccess()) { navigate("/"); return; }

    const fetchStats = async () => {
      try {
        const res = await api.get(`/properties/admin/stats?range=${timeRange}`);
        if (res.success) {
          setStats(res.data);
          mapCreationStats(res.data?.creationStats);
        }
      } catch (err) { console.error(err); setError(err); }
    };
    fetchStats();
  }, [hasAdminAccess, navigate, timeRange]);

  const mapCreationStats = (data) => {
    const mapped = data.map(item => {
      if (timeRange === "week") return { period: `W${item._id.week} ${item._id.year}`, count: item.count };
      if (timeRange === "month") return { period: `${item._id.month}/${item._id.year}`, count: item.count };
      return { period: `${item._id.year}`, count: item.count };
    });
    setCreationStats(mapped);
  };

  if (error) throw error;
  if (!stats) return <p className="text-center text-gray-400">Loading Dashboard...</p>;

  const { overview, propertyTypeDistribution, statusDistribution } = stats;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          icon={<Home className="h-8 w-8 text-blue-400 mb-2" />}
          title="Total Properties"
          value={overview.totalProperties}
        />
        <Card
          icon={<TrendingUp className="h-8 w-8 text-green-400 mb-2" />}
          title="Active"
          value={overview.activeProperties}
        />
        <Card
          icon={<IndianRupee className="h-8 w-8 text-yellow-400 mb-2" />}
          title="Avg Price"
          value={`₹${Math.round(overview.averagePrice || 0).toLocaleString()}`}
        />
        <Card
          icon={
            <div className="flex space-x-2">
              <Image className="h-8 w-8 text-purple-400 mb-1" />
              <Slash className="h-8 w-8 text-gray-400 mb-1" />
              <Video className="h-8 w-8 text-pink-400 mb-1" />
            </div>
          }
          title="Media Uploaded"
          value={`${overview.totalImagesUploaded} / ${overview.totalVideosUploaded}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ChartCard title="Property Type Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={propertyTypeDistribution}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ _id, percent }) =>
                  `${_id}: ${(percent * 100).toFixed(1)}%`
                }
              >
                {propertyTypeDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} (${props.payload.percentage}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Property Creation">
          <div className="flex justify-end mb-2">
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
        </ChartCard>
      </div>

      <ChartCard title="Property Status Breakdown">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={statusDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="status" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip
              formatter={(value, name, props) => [
                `${value} (${props.payload.percentage}%)`,
                name,
              ]}
            />
            <Legend />
            <Bar dataKey="count">
              {statusDistribution.map((_, i) => {
                const colors = ["#22c55e", "#ef4444", "#f97316", "#6b7280"];
                return <Cell key={i} fill={colors[i]} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

// Utility card component
const Card = ({ icon, title, value }) => (
  <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
    {icon}
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6">{children}</div>
);

export default AdminDashboard;

