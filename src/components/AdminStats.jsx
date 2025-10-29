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
import {
  TrendingUp,
  Home,
  IndianRupee,
  Image,
  Video,
  Slash,
  LayoutDashboard,
} from "lucide-react";
import api from "../services/api";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"];

const AdminDashboard = () => {
  const { user, hasAdminAccess } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [creationStats, setCreationStats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasAdminAccess()) {
      navigate("/");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await api.get(`/properties/admin/stats?range=${timeRange}`);
        if (res.success) {
          setStats(res.data);
          mapCreationStats(res.data?.creationStats);
        }
      } catch (err) {
        console.error(err);
        setError(err);
      }
    };
    fetchStats();
  }, [hasAdminAccess, navigate, timeRange]);

 const getDateRangeOfWeek = (week, year) => {
   const simple = new Date(year, 0, 1 + (week - 1) * 7);
   const dayOfWeek = simple.getDay();
   const ISOweekStart = new Date(simple);

   if (dayOfWeek <= 4)
     ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
   else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

   const ISOweekEnd = new Date(ISOweekStart);
   ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

   const formatDate = (date) => {
     let day = date.getDate();
     let month = date.toLocaleString("en-GB", { month: "short" });
     if (day < 10) day = `0${day}`; // ✅ Add 0 before single digits
     return `${day} ${month}`;
   };

   return `${formatDate(ISOweekStart)} - ${formatDate(ISOweekEnd)} ${year}`;
 };


  const mapCreationStats = (data) => {
    const mapped = data.map((item) => {
      if (timeRange === "week") {
        return {
          period: getDateRangeOfWeek(item._id.week, item._id.year), // ✅ Now shows real dates
          count: item.count,
        };
      }
      if (timeRange === "month") {
        return {
          period: `${item._id.month}/${item._id.year}`,
          count: item.count,
        };
      }
      return { period: `${item._id.year}`, count: item.count };
    });
    setCreationStats(mapped);
  };

  if (error) throw error;
  if (!stats)
    return <p className="text-center text-gray-400">Loading Dashboard...</p>;

  const { overview, propertyTypeDistribution, statusDistribution } = stats;

  const tooltipStyle = {
    backgroundColor: "#1f2937",
    border: "none",
    borderRadius: 6,
    padding: "6px 8px",
    color: "#fff",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
    maxWidth: 180,
    overflowWrap: "break-word",
  };

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
          value={`${overview.totalImagesUploaded || 0} / ${
            overview.totalVideosUploaded || 0
          }`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Property Type Distribution */}
        <ChartCard title="Property Type Distribution">
          <h2 className="text-lg font-semibold mb-2">
            Property Type Distribution
          </h2>
          <div className="w-full h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertyTypeDistribution}
                  dataKey="count"
                  nameKey="type" // <-- use the correct field
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  label
                  labelLine={false}
                >
                  {propertyTypeDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Property Creation */}
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
          <div className="w-full h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={creationStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="period" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: "#3b82f6", strokeWidth: 2 }}
                />
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
        </ChartCard>
      </div>

      {/* Property Status Breakdown */}
      <ChartCard title="Property Status Breakdown">
        <div className="w-full h-64 sm:h-72 lg:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="status" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="count">
                {statusDistribution.map((_, i) => {
                  const colors = ["#22c55e", "#ef4444", "#f97316", "#6b7280"];
                  return <Cell key={i} fill={colors[i]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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
  <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-6">
    {children}
  </div>
);

export default AdminDashboard;