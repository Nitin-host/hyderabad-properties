import React, { useState, useEffect, useRef } from 'react';
import PropertyCard from './PropertyCard';
import PropertyManagement from './PropertyManagement';
import { propertiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, MapPin, Home, DollarSign, Grid, List, AlertCircle, X } from 'lucide-react';
import StickyContactForm from './ContactForm';

// FilterPopover Component
const FilterPopover = ({ filters, handleFilterChange, clearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-lg flex items-center justify-center ${hasActiveFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} transition-colors`}
        title="Filter properties"
      >
        <Filter size={20} />
      </button>
      <StickyContactForm/>
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
            <div>
              <label className="block text-sm text-gray-400 mb-1">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white text-sm"
              >
                <option value="">All Property Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="House">House</option>
                <option value="Plot">Plot</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white text-sm"
              >
                <option value="">All Price Ranges</option>
                <option value="0-2500000">Under ₹25L</option>
                <option value="2500000-5000000">₹25L - ₹50L</option>
                <option value="5000000-10000000">₹50L - ₹1Cr</option>
                <option value="10000000-99999999">Above ₹1Cr</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Bedrooms</label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white text-sm"
              >
                <option value="">All Bedrooms</option>
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="4BHK">4BHK</option>
                <option value="5+BHK">5+BHK</option>
              </select>
            </div>

            <button
              onClick={() => {
                clearFilters();
                setIsOpen(false);
              }}
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
  const { canManageProperties } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    propertyType: "",
    priceRange: "",
    bedrooms: "",
    city: "",
  });

  // Fetch properties from API
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertiesAPI.getAll();
      const propertiesData = response.data || response.properties || response;
      if (Array.isArray(propertiesData)) {
        setProperties(propertiesData);
        setFilteredProperties(propertiesData);
      } else {
        setProperties([]);
        setFilteredProperties([]);
      }
    } catch (err) {
      setError(
        err.message || "Failed to load properties. Please try again later."
      );
      setProperties([]);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Filter properties based on search and filters
  useEffect(() => {
    let filtered = properties;

    // Search filter
    if (searchTerm) {
      console.log("Applying search filter:", searchTerm, filtered);
      filtered = filtered.filter((property) => {
        const title = property?.title || "";
        const location = property?.location || "";
        return (
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(
        (property) => property.propertyType === filters.propertyType
      );
    }

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      filtered = filtered.filter((property) => {
        if (max) {
          return property.price >= min && property.price <= max;
        }
        return property.price >= min;
      });
    }

    // Bedrooms filter
    if (filters.bedrooms) {
      filtered = filtered.filter(
        (property) => property.bedrooms === filters.bedrooms
      );
    }

    setFilteredProperties(filtered);
  }, [searchTerm, filters, properties]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      propertyType: "",
      priceRange: "",
      bedrooms: "",
      city: "",
    });
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg shadow-md p-4"
                >
                  <div className="h-48 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Error Loading Properties
            </h3>
            <p className="text-gray-400 text-center mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-4 sm:px-6 lg:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start lg:items-center">
            {/* Column 1: Header and count */}
            <div className="col-span-1 lg:col-span-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Properties in Kondapur-HYD{" "}
                <span className="text-lg font-normal text-gray-400">
                  ({filteredProperties.length})
                </span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Discover your dream property from our extensive collection
              </p>
            </div>

            {/* Column 2: Search, Filter, View Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-4 lg:mt-0">
              {/* Search Bar + Filter */}
              <div className="flex flex-1 items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex-grow">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by location, property name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white"
                  />
                </div>

                {/* Filter Button */}
                <FilterPopover
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  clearFilters={clearFilters}
                />
              </div>

              {/* View Mode Toggle - Hidden on Mobile */}
              <div className="hidden md:block">
                <button
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                  className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  title={
                    viewMode === "grid"
                      ? "Switch to list view"
                      : "Switch to grid view"
                  }
                >
                  {viewMode === "grid" ? (
                    <List size={20} />
                  ) : (
                    <Grid size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Property Management - Only for Admin/Super Admin */}
        {canManageProperties() && (
          <PropertyManagement
            properties={properties}
            refreshProperties={fetchProperties}
          />
        )}

        {/* Properties Grid/List View */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Home size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No properties found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or filters
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {filteredProperties.map((property, index) => (
              <PropertyCard
                key={property._id?.$oid || property._id || property.id || index}
                property={property}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;