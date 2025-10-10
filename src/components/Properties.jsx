import React, { useState, useEffect } from "react";
import PropertyCard from "./PropertyCard";
import { propertiesAPI } from "../services/api";
import {
  Filter,
  Grid,
  List,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import StickyWhatsApp from "./StickyWhatsApp.jsx";
import TableUtil from "../util/TableUtil.jsx";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Filter Popover Component
const FilterPopover = ({
  filters,
  filterOptions,
  handleFilterChange,
  clearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-lg flex items-center justify-center ${
          hasActiveFilters
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        } transition-colors`}
      >
        <Filter size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-lg z-10 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-medium">Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Property Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Property Type
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) =>
                  handleFilterChange("propertyType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm"
              >
                <option value="">All Property Types</option>
                {filterOptions.propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange("bedrooms", e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm"
              >
                <option value="">All Bedrooms</option>
                {filterOptions.bedrooms.map((bed) => (
                  <option key={bed} value={bed}>
                    {bed}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ propertyType: "", bedrooms: "" });
  const [filterOptions, setFilterOptions] = useState({
    propertyTypes: [],
    bedrooms: [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const location = useLocation();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const { hasAdminAccess } = useAuth();

  // Fetch properties
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        search: searchTerm || undefined,
        propertyType: filters.propertyType || undefined,
        bedrooms: filters.bedrooms || undefined,
      };

      const response = await propertiesAPI.getAll(params); // Pass pagination & filters
      const { data, pagination } = response;

      setProperties(data || []);
      setTotalPages(pagination.pages || 1);

      // Dynamic filters from fetched data
      const types = [...new Set((data || []).map((p) => p.propertyType))];
      const beds = [...new Set((data || []).map((p) => p.bedrooms))];
      setFilterOptions({ propertyTypes: types, bedrooms: beds });
    } catch (err) {
      setError(err.message || "Failed to load properties");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, limit, searchTerm, filters]);

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
    setPage(1); // reset page when filter changes
  };

  const clearFilters = () => {
    setFilters({ propertyType: "", bedrooms: "" });
    setSearchTerm("");
    setPage(1);
  };

  // Helper: generate visible page numbers with ellipsis
  const getPageNumbers = (currentPage, totalPages, maxVisible = 5) => {
    const pages = [];

    if (totalPages <= maxVisible) {
      // If total pages are less than max visible, show all
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const sideCount = Math.floor(maxVisible / 2);
      let start = Math.max(currentPage - sideCount, 1);
      let end = start + maxVisible - 1;

      if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisible + 1;
      }

      if (start > 1) pages.push(1); // first page
      if (start > 2) pages.push("start-ellipsis"); // left ellipsis

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push("end-ellipsis"); // right ellipsis
      if (end < totalPages) pages.push(totalPages); // last page
    }

    return pages;
  };

  const tableHeader = [
    {
      label: "Property",
      key: "title",
      imageKey: "images.0.presignUrl",
      textKey: "title",
    },
    { label: "Bedrooms", key: "bedrooms" },
    { label: "Location", key: "location" },
    { label: "Price", key: "price", dataFormat: "currency" },
    { label: "Type", key: "propertyType" },
    { label: "Status", key: "status" },
  ];
  const enableMobileView = location.pathname !== "/";

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header + Search + Filter */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              Properties in Kondapur-HYD
            </h1>
            <p className="text-gray-400 mt-1">
              Discover your dream property from our extensive collection
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by location or title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
            <FilterPopover
              filters={filters}
              filterOptions={filterOptions}
              handleFilterChange={handleFilterChange}
              clearFilters={clearFilters}
            />
            {hasAdminAccess() && (
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                {viewMode === "grid" ? <List size={20} /> : <Grid size={20} />}
              </button>
            )}
          </div>
        </div>

        {/* Properties Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: limit }).map((_, idx) => (
              <div
                key={idx}
                className="h-72 bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <Home size={48} className="mx-auto mb-4" />
            No properties found
          </div>
        ) : (
          <>
            {hasAdminAccess() && viewMode === "list" ? (
              <TableUtil
                tableName=""
                tableData={properties}
                tableHeader={tableHeader}
                enableMobileView={enableMobileView}
              />
            ) : (
              <div
                className={`grid gap-6 ${
                  viewMode === "list"
                    ? "grid-cols-1"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }`}
              >
                {properties.map((property) => (
                  <PropertyCard
                    key={property._id || property.id}
                    property={property}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination & Rows per Page */}
        {properties.length > 0 && (!hasAdminAccess() || viewMode === "grid") && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
            {/* Rows per page - always visible */}
            <div className="flex items-center gap-2 text-gray-300">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-700 text-white px-3 py-1 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[4, 8, 12, 16, 20, 24].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Page navigation - only if multiple pages */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 text-gray-300 flex-wrap">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {getPageNumbers(page, totalPages).map((pageNum, idx) =>
                  pageNum === "start-ellipsis" || pageNum === "end-ellipsis" ? (
                    <span key={idx} className="px-2 py-1 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={idx}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        pageNum === page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(totalPages)}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <StickyWhatsApp />
    </div>
  );
};

export default Properties;
