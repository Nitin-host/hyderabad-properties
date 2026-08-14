import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import PropertyCard from "./PropertyCard";
import { propertiesAPI } from "../services/api";
import {
  Filter,
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import StickyWhatsApp from "./StickyWhatsApp.jsx";

const PROPERTY_TYPE_OPTIONS = [
  "Standalone",
  "Gated Community",
  "Apartment",
  "Villa",
  "Independent House",
  "Plot",
  "Commercial",
  "Office Space",
  "Other",
];
const BEDROOM_OPTIONS = ["1BHK", "2BHK", "3BHK", "4BHK"];

/* ---------- FilterPopover (unchanged) ---------- */
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
        name="Filter"
        aria-label="Filters button"
        onClick={() => setIsOpen((s) => !s)}
        className={`p-3 rounded-lg flex items-center justify-center ${
          hasActiveFilters
            ? "bg-brand text-brand-fg"
            : "bg-raised text-muted hover:bg-line"
        } transition-colors`}
      >
        <Filter size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface border border-line rounded-lg shadow-lg z-10 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-fg font-medium">Filters</h3>
            <button
              name="close"
              aria-label="Close"
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-fg"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">
                Property Type
              </label>
              <select
                aria-label="Select Property Type"
                value={filters.propertyType}
                onChange={(e) => {
                  handleFilterChange("propertyType", e.target.value);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 border border-line rounded-lg bg-raised text-fg text-sm"
              >
                <option value="">All Property Types</option>
                {filterOptions.propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">
                Bedrooms
              </label>
              <select
                aria-label="Select Number of Bedrooms"
                value={filters.bedrooms}
                onChange={(e) => {
                  handleFilterChange("bedrooms", e.target.value);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 border border-line rounded-lg bg-raised text-fg text-sm"
              >
                <option value="">All Bedrooms</option>
                {filterOptions.bedrooms.map((bed) => (
                  <option key={bed} value={bed}>
                    {bed}
                  </option>
                ))}
              </select>
            </div>

            <button
              name="clear filters"
              aria-label="Clear All Filters"
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-raised text-muted rounded-lg hover:bg-line transition-colors text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- SkeletonPropertyCard (same) ---------- */
const SkeletonPropertyCard = () => (
  <div className="rounded-xl bg-surface border border-line overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
    <div className="relative">
      <div className="h-48 bg-raised w-full shrink-0" />
    </div>

    <div className="p-4 flex flex-col flex-1 space-y-3">
      <div className="h-6 bg-raised rounded w-24" />
      <div className="h-5 bg-raised rounded w-3/5" />
      <div className="h-4 bg-raised rounded w-2/3" />
      <div className="flex items-center space-x-2 mt-2">
        <div className="h-4 w-4 bg-raised rounded" />
        <div className="h-4 bg-raised rounded w-1/2" />
      </div>
      <div className="flex items-center space-x-3 mt-3">
        <div className="h-4 w-14 bg-raised rounded" />
        <div className="h-4 w-16 bg-raised rounded" />
        <div className="h-4 w-16 bg-raised rounded" />
      </div>
      <div className="flex gap-2 mt-2">
        <div className="h-6 w-20 bg-raised rounded-lg" />
        <div className="h-6 w-14 bg-raised rounded-lg" />
        <div className="h-6 w-10 bg-raised rounded-lg" />
        <div className="h-6 w-12 bg-raised rounded-lg" />
      </div>
      <div className="mt-4">
        <div className="h-10 bg-raised rounded-lg w-full" />
      </div>
    </div>
  </div>
);

/* ---------- Main Properties component (responsive: pagination on desktop, infinite on mobile/tablet) ---------- */
const Properties = () => {
  // Data + loading states
  const [properties, setProperties] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Filters and options
  const [filters, setFilters] = useState({ propertyType: "", bedrooms: "" });
  const filterOptions = useMemo(
    () => ({
      propertyTypes: PROPERTY_TYPE_OPTIONS,
      bedrooms: BEDROOM_OPTIONS,
    }),
    []
  );

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination / infinite state
  const [limit, setLimit] = useState(8);
  const [page, setPage] = useState(1); // used in pagination mode
  const pageRef = useRef(1); // used in infinite mode (mutable)
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // responsive mode detection
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => {
    if (typeof window === "undefined") return true; // assume mobile in SSR
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  // sentinel for infinite scroll
  const sentinelRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const loadingLockRef = useRef(false);

  // Determine mode textually (memo)
  const mode = useMemo(
    () => (isMobileOrTablet ? "infinite" : "pagination"),
    [isMobileOrTablet]
  );

  // Debounce search so typing does not hit the API on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Scroll to top when switching to pagination or when page changes (nice UX)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [mode, page]);

  // Listen for viewport changes and update mode (debounced-ish)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (e) => setIsMobileOrTablet(e.matches);
    if ("addEventListener" in mq) {
      mq.addEventListener("change", onChange);
    } else {
      mq.addListener(onChange);
    }
    return () => {
      if ("removeEventListener" in mq) {
        mq.removeEventListener("change", onChange);
      } else {
        mq.removeListener(onChange);
      }
    };
  }, []);

  // Build API params helper
  const buildParams = (pg) => ({
    page: pg,
    limit,
    search: searchTerm || undefined,
    propertyType: filters.propertyType || undefined,
    bedrooms: filters.bedrooms || undefined,
  });

  // Core fetcher: either replace (replace=true) or append (replace=false)
  const fetchPage = useCallback(
    async (pg = 1, replace = true) => {
      if (!replace && loadingLockRef.current) return;

      const requestId = ++requestIdRef.current;
      loadingLockRef.current = true;

      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {
          // ignore abort errors
        }
        abortRef.current = null;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (pg === 1) setLoadingInitial(true);
        else setLoadingMore(true);
        setError(null);

        const params = buildParams(pg);
        const res = await propertiesAPI.getAll(params, {
          signal: controller.signal,
        });
        if (requestId !== requestIdRef.current) return;

        const { data = [], pagination = {} } = res || {};
        const pages = pagination?.pages ?? 1;

        setTotalPages(pages);

        if (replace) {
          setProperties(data);
        } else {
          setProperties((prev) => {
            const existingIds = new Set(prev.map((p) => p._id || p.id));
            const appended = data.filter(
              (p) => !existingIds.has(p._id || p.id)
            );
            return [...prev, ...appended];
          });
        }

        if (mode === "infinite") {
          pageRef.current = pg;
          setHasMore(pg < pages);
        } else {
          setPage(pg);
        }
      } catch (err) {
        if (
          err.name === "AbortError" ||
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }
        if (requestId !== requestIdRef.current) return;
        console.error("Failed to fetch properties:", err);
        setError(err.message || "Failed to load properties");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingInitial(false);
          setLoadingMore(false);
          loadingLockRef.current = false;
          abortRef.current = null;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, searchTerm, limit, mode]
  );

  // Initial load & reset when filters/search/limit change or mode changes:
  useEffect(() => {
    pageRef.current = 1;
    setPage(1);
    setProperties([]);
    setHasMore(true);
    setTotalPages(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.propertyType, filters.bedrooms, searchTerm, limit, mode]);

  // Pagination: skip page 1 because the reset effect already fetched it
  useEffect(() => {
    if (mode !== "pagination") return;
    if (page === 1) return;
    fetchPage(page, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mode]);

  // Infinite scroll observer only active when mode === 'infinite'
  useEffect(() => {
    if (mode !== "infinite") return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    // if IntersectionObserver not available, fallback to scroll handler
    if (!("IntersectionObserver" in window)) {
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const nearBottom =
            window.innerHeight + window.pageYOffset >=
            document.body.offsetHeight - 400;
          if (nearBottom && hasMore && !loadingMore && !loadingInitial) {
            fetchPage(pageRef.current + 1, false);
          }
          ticking = false;
        });
      };
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            hasMore &&
            !loadingMore &&
            !loadingInitial
          ) {
            fetchPage(pageRef.current + 1, false);
          }
        });
      },
      { root: null, rootMargin: "400px", threshold: 0.01 }
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hasMore, loadingMore, loadingInitial]);

  // Handlers
  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
    // reset handled by effect
  };

  const clearFilters = () => {
    setFilters({ propertyType: "", bedrooms: "" });
    setSearchInput("");
    setSearchTerm("");
    pageRef.current = 1;
    setProperties([]);
    setHasMore(true);
  };

  // Pagination helpers for desktop numeric UI
  const getPageNumbers = (currentPage, totalPages, maxVisible = 5) => {
    const pages = [];
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const sideCount = Math.floor(maxVisible / 2);
      let start = Math.max(currentPage - sideCount, 1);
      let end = start + maxVisible - 1;
      if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisible + 1;
      }
      if (start > 1) pages.push(1);
      if (start > 2) pages.push("start-ellipsis");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("end-ellipsis");
      if (end < totalPages) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-page p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header + Search + Filter */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-fg">
              Properties in Kondapur-HYD
            </h1>
            <p className="text-muted mt-1">
              Discover your dream property from our extensive collection
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                placeholder="Search by title, location or BHK..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-lg bg-raised text-fg border border-line focus:ring-2 focus:ring-brand"
                aria-label="Search properties"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <FilterPopover
              filters={filters}
              filterOptions={filterOptions}
              handleFilterChange={handleFilterChange}
              clearFilters={clearFilters}
            />
          </div>
        </div>

        {/* Grid + content */}
        {error ? (
          <div className="text-center text-muted py-16">
            <Home size={48} className="mx-auto mb-4 text-muted" />
            <p className="text-lg font-medium text-fg mb-2">
              Couldn’t load properties
            </p>
            <p className="text-muted mb-6">{error}</p>
            <button
              type="button"
              onClick={() => fetchPage(mode === "pagination" ? page : 1, true)}
              className="px-4 py-2 bg-brand hover:opacity-90 text-brand-fg rounded-lg"
            >
              Try again
            </button>
          </div>
        ) : loadingInitial ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: limit }).map((_, idx) => (
              <SkeletonPropertyCard key={idx} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center text-muted py-16">
            <Home size={48} className="mx-auto mb-4" />
            <p className="text-lg font-medium text-fg mb-2">
              No properties found
            </p>
            <p className="mb-6">
              Try a different search or clear the filters to see all listings.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 bg-raised hover:bg-line text-fg rounded-lg"
            >
              Clear search & filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property, idx) => (
                <PropertyCard
                  key={property._id || property.id}
                  property={property}
                  priority={idx < 4}
                />
              ))}

              {/* When loadingMore on infinite mode, render skeletons appended to grid */}
              {mode === "infinite" &&
                loadingMore &&
                Array.from({ length: limit }).map((_, i) => (
                  <SkeletonPropertyCard key={`loading-more-${i}`} />
                ))}
            </div>

            {/* Mode-specific UI */}
            {mode === "infinite" ? (
              <>
                <div ref={sentinelRef} className="h-6" />
                {!hasMore && (
                  <div className="text-center text-muted mt-6">
                    You’ve reached the end.
                  </div>
                )}
              </>
            ) : (
              // pagination UI for desktop
              <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
                <div className="flex items-center gap-2 text-muted">
                  <span>Rows per page:</span>
                  <select
                    aria-label="Select Rows Per Page"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-raised text-fg px-3 py-1 rounded-lg focus:ring-2 focus:ring-brand"
                  >
                    {[8, 15, 25, 50, 100].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1 text-muted flex-wrap">
                    <button
                      name="left-chevrons"
                      aria-label="go to first page"
                      disabled={page === 1}
                      onClick={() => setPage(1)}
                      className="p-2 bg-raised rounded hover:bg-line disabled:opacity-50 transition-colors"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      name="left-chevron"
                      aria-label="previous page"
                      disabled={page === 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      className="p-2 bg-raised rounded hover:bg-line disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {getPageNumbers(page, totalPages).map((pageNum, idx) =>
                      pageNum === "start-ellipsis" ||
                      pageNum === "end-ellipsis" ? (
                        <span key={idx} className="px-2 py-1 text-muted">
                          ...
                        </span>
                      ) : (
                        <button
                          name="page-number"
                          aria-label={`Go to page ${pageNum}`}
                          key={idx}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            pageNum === page
                              ? "bg-brand text-brand-fg"
                              : "bg-raised text-muted hover:bg-line"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}

                    <button
                      name="right-chevron"
                      aria-label="next page"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className="p-2 bg-raised rounded hover:bg-line disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      name="right-chevrons"
                      aria-label="go to last page"
                      disabled={page === totalPages}
                      onClick={() => setPage(totalPages)}
                      className="p-2 bg-raised rounded hover:bg-line disabled:opacity-50 transition-colors"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <StickyWhatsApp />
    </div>
  );
};

export default Properties;