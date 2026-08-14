import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Building2,
  ImageOff,
  IndianRupee,
  KeyRound,
  Tag,
  Trash2,
  VideoOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

const TYPE_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444", "#14b8a6"];

const STATUS_COLORS = {
  "For Rent": "#22c55e",
  "For Sale": "#3b82f6",
  Available: "#14b8a6",
  "Under Contract": "#a855f7",
  Rented: "#f97316",
  Sold: "#6b7280",
  Occupied: "#ef4444",
};

const formatInr = (n) => {
  const value = Number(n) || 0;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
};

const AdminStats = () => {
  const { hasAdminAccess } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark";
  const axis = isDark ? "#b4ada3" : "#6b645b";
  const grid = isDark ? "#323846" : "#e2d8c8";
  const brand = isDark ? "#e8a667" : "#b67a32";
  const tooltipStyle = {
    backgroundColor: isDark ? "#1a1e27" : "#ffffff",
    border: `1px solid ${grid}`,
    borderRadius: 8,
    color: isDark ? "#f3efe8" : "#1c1915",
    fontSize: "0.8rem",
  };

  useEffect(() => {
    if (!hasAdminAccess()) {
      navigate("/");
      return;
    }

    let cancelled = false;
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/properties/admin/stats?range=${timeRange}`);
        if (!cancelled && res.success) setStats(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load statistics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [hasAdminAccess, navigate, timeRange]);

  const creationStats = useMemo(
    () =>
      (stats?.creationStats || []).map((item) => ({
        period: item.label,
        count: item.count,
      })),
    [stats]
  );

  const statusDistribution = stats?.statusDistribution || [];
  const tiltStatusAxis = statusDistribution.length > 4;

  if (loading && !stats) {
    return <p className="text-center text-muted py-8">Loading statistics…</p>;
  }

  if (error && !stats) {
    return <p className="text-center text-red-500 py-8">{error}</p>;
  }

  if (!stats) return null;

  const isSuper = stats.role === "super_admin";
  const { overview } = stats;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-fg">
          {isSuper ? "Operations" : "My listings"}
        </h2>
        <p className="text-sm text-muted mt-1">
          {isSuper
            ? "Live inventory, video health, and listings that need attention."
            : "Active listings you created, by status and location."}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          icon={<Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />}
          title="Active"
          value={overview.activeProperties || 0}
        />
        <StatCard
          icon={<KeyRound className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />}
          title="For Rent"
          value={overview.forRent || 0}
        />
        <StatCard
          icon={<Tag className="h-6 w-6 sm:h-8 sm:w-8 text-sky-400" />}
          title="For Sale"
          value={overview.forSale || 0}
        />
        {isSuper ? (
          <StatCard
            icon={<VideoOff className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />}
            title="Stuck videos"
            value={overview.stuckVideos || 0}
            warn={overview.stuckVideos > 0}
          />
        ) : (
          <StatCard
            icon={<IndianRupee className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />}
            title="Median rent"
            value={formatInr(overview.medianRent)}
          />
        )}
      </div>

      {isSuper && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <StatCard
            icon={<IndianRupee className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />}
            title="Median rent"
            value={formatInr(overview.medianRent)}
            hint="Active For Rent only"
          />
          <StatCard
            icon={<ImageOff className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />}
            title="No photos"
            value={overview.listingsWithoutPhotos || 0}
            warn={overview.listingsWithoutPhotos > 0}
          />
          <StatCard
            icon={<Trash2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted" />}
            title="Deleted"
            value={overview.deletedProperties || 0}
          />
        </div>
      )}

      {(stats.attention || []).length > 0 && (
        <section className="bg-surface rounded-2xl border border-line overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-line">
            <h3 className="font-semibold">Needs attention</h3>
            <p className="text-sm text-muted">
              Missing photos, failed or stuck video, or listed 90+ days.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="px-4 sm:px-6 py-2 font-medium">Listing</th>
                  <th className="px-4 sm:px-6 py-2 font-medium hidden sm:table-cell">
                    Location
                  </th>
                  <th className="px-4 sm:px-6 py-2 font-medium">Why</th>
                </tr>
              </thead>
              <tbody>
                {stats.attention.map((row) => (
                  <tr key={row._id} className="border-t border-line">
                    <td className="px-4 sm:px-6 py-3">
                      {row.slug ? (
                        <Link
                          to={`/property/${row.slug}`}
                          className="text-brand hover:underline font-medium"
                        >
                          {row.title}
                        </Link>
                      ) : (
                        row.title
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-muted hidden sm:table-cell">
                      {row.location || "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.reasons.map((reason) => (
                          <span
                            key={reason}
                            className="inline-block rounded-full bg-raised px-2 py-0.5 text-xs"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isSuper && (stats.adminPerformance || []).length > 0 && (
        <section className="bg-surface rounded-2xl border border-line overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-line">
            <h3 className="font-semibold">Admin performance</h3>
            <p className="text-sm text-muted">Who is producing live listings.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="px-4 sm:px-6 py-2 font-medium">Admin</th>
                  <th className="px-4 sm:px-6 py-2 font-medium text-right">Active</th>
                  <th className="px-4 sm:px-6 py-2 font-medium text-right">Rent</th>
                  <th className="px-4 sm:px-6 py-2 font-medium text-right">Sale</th>
                  <th className="px-4 sm:px-6 py-2 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.adminPerformance.map((row) => (
                  <tr key={row._id || row.email} className="border-t border-line">
                    <td className="px-4 sm:px-6 py-3">
                      <div className="font-medium">{row.name}</div>
                      {row.email ? (
                        <div className="text-xs text-muted">{row.email}</div>
                      ) : null}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">{row.active}</td>
                    <td className="px-4 sm:px-6 py-3 text-right">{row.forRent}</td>
                    <td className="px-4 sm:px-6 py-3 text-right">{row.forSale}</td>
                    <td className="px-4 sm:px-6 py-3 text-right">{row.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isSuper && (stats.wishlistTop || []).length > 0 && (
        <section className="bg-surface rounded-2xl border border-line overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-line">
            <h3 className="font-semibold">Most wishlisted</h3>
            <p className="text-sm text-muted">Demand on live listings.</p>
          </div>
          <ul className="divide-y divide-line">
            {stats.wishlistTop.map((row) => (
              <li
                key={row._id}
                className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3"
              >
                <div className="min-w-0">
                  {row.slug ? (
                    <Link
                      to={`/property/${row.slug}`}
                      className="text-brand hover:underline font-medium truncate block"
                    >
                      {row.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{row.title}</span>
                  )}
                  <p className="text-xs text-muted truncate">{row.location}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {row.saves} saves
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Listings over time">
          <div className="flex justify-end mb-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-raised text-fg rounded p-1 text-sm"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={creationStats}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="period" stroke={axis} tick={{ fontSize: 11, fill: axis }} />
                <YAxis
                  stroke={axis}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: axis }}
                  width={36}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Listings"
                  stroke={brand}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Active listings by status">
          <p className="text-xs text-muted mb-2">
            Share of {overview.activeProperties || 0} active listings. Deleted
            listings are not included.
          </p>
          <div className="w-full h-64 sm:h-72">
            {statusDistribution.length === 0 ? (
              <p className="text-sm text-muted h-full flex items-center justify-center">
                No active listings yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusDistribution}
                  margin={{
                    top: 8,
                    right: 8,
                    left: 0,
                    bottom: tiltStatusAxis ? 28 : 8,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis
                    dataKey="status"
                    stroke={axis}
                    interval={0}
                    angle={tiltStatusAxis ? -28 : 0}
                    textAnchor={tiltStatusAxis ? "end" : "middle"}
                    height={tiltStatusAxis ? 64 : 36}
                    tick={{ fontSize: 11, fill: axis }}
                  />
                  <YAxis
                    stroke={axis}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: axis }}
                    width={36}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, item) => [
                      `${value} (${item.payload.percentage}%)`,
                      "Listings",
                    ]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="count" name="Listings" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {statusDistribution.map((row) => (
                      <Cell
                        key={row.status}
                        fill={STATUS_COLORS[row.status] || "#94a3b8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {statusDistribution.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs">
              {statusDistribution.map((row) => (
                <li key={row.status} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[row.status] || "#94a3b8" }}
                  />
                  <span className="truncate">
                    {row.status}: {row.count} ({row.percentage}%)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top locations">
          <div className="w-full h-64 sm:h-72">
            {(stats.locationDistribution || []).length === 0 ? (
              <p className="text-sm text-muted h-full flex items-center justify-center">
                No location data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={stats.locationDistribution}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke={axis}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: axis }}
                  />
                  <YAxis
                    type="category"
                    dataKey="location"
                    stroke={axis}
                    width={96}
                    tick={{ fontSize: 11, fill: axis }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="Listings"
                    fill={brand}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="By bedrooms">
          <div className="w-full h-64 sm:h-72">
            {(stats.bedroomDistribution || []).length === 0 ? (
              <p className="text-sm text-muted h-full flex items-center justify-center">
                No bedroom data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.bedroomDistribution}
                  margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis
                    dataKey="bedrooms"
                    stroke={axis}
                    interval={0}
                    tick={{ fontSize: 11, fill: axis }}
                  />
                  <YAxis
                    stroke={axis}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: axis }}
                    width={36}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="Listings"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={64}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {(stats.propertyTypeDistribution || []).length > 0 && (
        <ChartCard title="Property type">
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.propertyTypeDistribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  label={({ type, percentage }) => `${type} ${percentage}%`}
                  labelLine={false}
                >
                  {stats.propertyTypeDistribution.map((row, i) => (
                    <Cell
                      key={row.type}
                      fill={TYPE_COLORS[i % TYPE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name, item) => [
                    `${value} (${item.payload.percentage}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, hint, warn }) => (
  <div
    className={`bg-surface text-fg rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col items-center text-center border ${
      warn ? "border-red-400/50" : "border-line"
    }`}
  >
    {icon}
    <h3 className="text-sm sm:text-base font-semibold mt-2">{title}</h3>
    <p className="text-xl sm:text-2xl font-bold">{value}</p>
    {hint ? <p className="text-xs text-muted mt-1">{hint}</p> : null}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-surface text-fg rounded-2xl shadow-sm p-4 sm:p-6 border border-line">
    <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
    {children}
  </div>
);

export default AdminStats;
