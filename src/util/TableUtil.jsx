// TableUtil.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  ChevronUp,
  ChevronDown,
  User,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import logo from "../assets/RR_PROP_LOGO.png";

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;
const DEFAULT_ROWS_PER_PAGE = 10;

function TableUtil({
  tableName = "Data Table",
  searchPlaceholder,
  tableData = [],
  tableHeader = [],
  tableActions = [],
  searchKeys = [],
  createBtn = [],
  filters = {},
  setFilters = () => {},
  enableMobileView = true,

  // Loading + UI
  isLoading = false,
  emptyStateMessage = "No data found",

  // Server-side pagination
  isServerPaginated = false,
  currentPage: propCurrentPage = 1,
  totalPages: propTotalPages = 1,
  rowsPerPage: propRowsPerPage = DEFAULT_ROWS_PER_PAGE,
  onPageChange = () => {},
  onRowsPerPageChange = () => {},

  // Callbacks for server-side interactions
  onSearchChange = () => {},
  onSortChange = () => {},
  onFilterChange = () => {},

  // Other
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  selectable = false,
  onSelectionChange = () => {},
  rowIdKey = "_id",
}) {
  // ------------------- Local UI state -------------------
  const [searchText, setSearchText] = useState("");
  const [filterVals, setFilterVals] = useState(filters || {});
  const [sortConfig, setSortConfig] = useState({ index: 0, asc: true });
  const [internalPage, setInternalPage] = useState(1);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(
    DEFAULT_ROWS_PER_PAGE
  );
  const [mobileView, setMobileView] = useState(isMobile() && enableMobileView);

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Debounce ref for search
  const searchTimeout = useRef(null);

  // Filter sync
  useEffect(() => {
    setFilterVals((prev) =>
      JSON.stringify(prev) !== JSON.stringify(filters) ? filters : prev
    );
  }, [filters]);

  // Mobile view on resize
  useEffect(() => {
    const onResize = () => setMobileView(enableMobileView && isMobile());
    window.addEventListener("resize", onResize);
    setMobileView(enableMobileView && isMobile());
    return () => window.removeEventListener("resize", onResize);
  }, [enableMobileView]);

  // ------------------- Utilities -------------------
  const getNestedValue = useCallback((obj, path) => {
    if (!obj || !path) return undefined;
    return path
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .reduce((o, k) => (o ? o[k] : undefined), obj);
  }, []);

  // ------------------- Filtering / searching / sorting -------------------
  const filteredData = useMemo(() => {
    if (isServerPaginated) return Array.isArray(tableData) ? tableData : [];

    let filtered = Array.isArray(tableData) ? [...tableData] : [];

    if (searchText && searchKeys.length > 0) {
      const s = searchText.toLowerCase().trim();
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const val = getNestedValue(item, key);
          return val != null && String(val).toLowerCase().trim().includes(s);
        })
      );
    }

    Object.entries(filterVals).forEach(([key, values]) => {
      if (values?.length > 0) {
        filtered = filtered.filter((item) =>
          values.includes(String(getNestedValue(item, key)))
        );
      }
    });

    const { index, asc } = sortConfig;
    const sortKey = tableHeader[index]?.key;
    if (sortKey) {
      filtered.sort((a, b) => {
        const valA = getNestedValue(a, sortKey);
        const valB = getNestedValue(b, sortKey);
        if (valA === valB) return 0;
        if (valA == null) return asc ? -1 : 1;
        if (valB == null) return asc ? 1 : -1;
        if (!isNaN(valA) && !isNaN(valB))
          return asc ? valA - valB : valB - valA;
        return asc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
      });
    }

    filtered.sort((a, b) => {
      if (a?.role === "super_admin") return -1;
      if (b?.role === "super_admin") return 1;
      return 0;
    });

    return filtered;
  }, [
    tableData,
    filterVals,
    searchText,
    sortConfig,
    tableHeader,
    searchKeys,
    isServerPaginated,
    getNestedValue,
  ]);

  // ------------------- Pagination -------------------
  const rowsPerPage = isServerPaginated ? propRowsPerPage : internalRowsPerPage;
  const totalPages = isServerPaginated
    ? Math.max(1, Number(propTotalPages || 1))
    : Math.max(1, Math.ceil(filteredData.length / rowsPerPage || 1));
  const pageToDisplay = isServerPaginated ? propCurrentPage : internalPage;

  const pagedData = useMemo(() => {
    if (isServerPaginated) return Array.isArray(tableData) ? tableData : [];
    const start = (pageToDisplay - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [isServerPaginated, tableData, filteredData, pageToDisplay, rowsPerPage]);

  // ------------------- Selection -------------------
  useEffect(() => {
    onSelectionChange(Array.from(selected));
  }, [selected, onSelectionChange]);

  const toggleSelectAllOnPage = () => {
    const pageIds = pagedData.map((r) => r[rowIdKey]);
    const allSelectedOnPage =
      pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const newSet = new Set(selected);
    if (allSelectedOnPage) pageIds.forEach((id) => newSet.delete(id));
    else pageIds.forEach((id) => newSet.add(id));
    setSelected(newSet);
  };

  const toggleSelectRow = (id) => {
    setSelected((prev) => {
      const clone = new Set(prev);
      if (clone.has(id)) clone.delete(id);
      else clone.add(id);
      return clone;
    });
  };

  // ------------------- Sorting -------------------
  const handleSort = (idx) => {
    setSortConfig((prev) => {
      const next =
        prev.index === idx
          ? { index: idx, asc: !prev.asc }
          : { index: idx, asc: true };
      if (isServerPaginated) {
        const sortKey = tableHeader[idx]?.key;
        onSortChange &&
          onSortChange({ key: sortKey, asc: next.asc, index: idx });
        onPageChange && onPageChange(1);
      } else setInternalPage(1);
      return next;
    });
  };

  // ------------------- Search -------------------
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (isServerPaginated) {
        onSearchChange && onSearchChange(searchText);
        onPageChange && onPageChange(1);
      } else setInternalPage(1);
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [searchText, isServerPaginated]);

  // ------------------- Filters -------------------
  const handleFilterChange = (key, values) => {
    const next = { ...filterVals, [key]: values };
    setFilterVals(next);
    setFilters && setFilters(next);
    onFilterChange && onFilterChange(next);
    if (isServerPaginated) onPageChange && onPageChange(1);
    else setInternalPage(1);
  };

  // ------------------- Page change -------------------
  const internalChangePage = (newPage) => {
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;
    if (isServerPaginated) onPageChange && onPageChange(newPage);
    else setInternalPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ------------------- Rows per page -------------------
  const handleRowsPerPage = (n) => {
    if (isServerPaginated) {
      onRowsPerPageChange && onRowsPerPageChange(n);
      onPageChange && onPageChange(1);
    } else {
      setInternalRowsPerPage(n);
      setInternalPage(1);
    }
  };

  // Insert this helper function inside your component, near other helpers
  const getPageNumbers = (page, totalPages, maxVisible = 5) => {
    const pages = [];
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const sideCount = Math.floor(maxVisible / 2);
      let start = Math.max(page - sideCount, 1);
      let end = start + maxVisible - 1;
      if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisible + 1;
      }
      if (start > 1) pages.push("start-ellipsis");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) pages.push("end-ellipsis");
    }
    return pages;
  };

  // ------------------- Cell rendering -------------------
  const renderCellValue = (row, colDef) => {
    const val = getNestedValue(row, colDef.key);

    if (colDef?.render) return colDef.render(val, row);
    if (val === undefined || val === null) return "";
    if (Array.isArray(val))
      return [...new Set(val.flat(Infinity).map(String))].join(", ") || "-";

    if (colDef.imageKey || colDef.textKey) {
      const imageUrl = getNestedValue(row, colDef.imageKey);
      const text = getNestedValue(row, colDef.textKey);
      return (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded bg-muted dark:bg-muted-dark mr-4">
            <img
              src={imageUrl || logo}
              alt={text || "img"}
              className="h-10 w-10 object-cover rounded"
            />
          </div>
          <div
            className="text-sm font-medium text-foreground dark:text-foreground-dark truncate max-w-[150px]"
            title={text}
          >
            {text}
          </div>
        </div>
      );
    }

    let displayVal;
    switch (colDef.dataFormat) {
      case "currency":
        displayVal = `₹${Number(val).toLocaleString()}`;
        break;
      case "date":
        displayVal = new Date(val).toLocaleDateString();
        break;
      case "boolean":
        displayVal = val ? "Yes" : "No";
        break;
      default:
        displayVal = String(val);
    }

    return (
      <div
        className="text-sm text-muted-foreground dark:text-muted-foreground-dark truncate max-w-[100px]"
        title={displayVal}
      >
        {displayVal}
      </div>
    );
  };

  // ------------------- Mobile Card & Skeleton -------------------
const MobileCard = ({ row }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => setExpanded((prev) => !prev);

  const visibleColumns = tableHeader.slice(0, 2); // show top 2 columns always
  const hiddenColumns = tableHeader.slice(2); // hide the rest under accordion

  return (
    <div className="mb-3 p-4 rounded-xl shadow-sm border border-border bg-card text-card-foreground dark:bg-gray-800 dark:text-gray-100 transition-all duration-200">
      {/* Checkbox (if selectable) */}
      {selectable && (
        <div className="flex justify-end mb-2">
          <input
            type="checkbox"
            checked={selected.has(row[rowIdKey])}
            onChange={() => toggleSelectRow(row[rowIdKey])}
            className="accent-blue-600"
          />
        </div>
      )}

      {/* Always visible columns */}
      <div className="space-y-2">
        {visibleColumns.map((colDef, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center border-b border-border/40 pb-1 last:border-b-0"
          >
            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
              {colDef.label}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[160px] text-right">
              {renderCellValue(row, colDef)}
            </span>
          </div>
        ))}
      </div>

      {/* Expandable Section */}
      {hiddenColumns.length > 0 && (
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-[500px] mt-2" : "max-h-0"
          }`}
        >
          <div className="space-y-2 pt-2 border-t border-border/40">
            {hiddenColumns.map((colDef, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b border-border/30 pb-1 last:border-b-0"
              >
                <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                  {colDef.label}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[160px] text-right">
                  {renderCellValue(row, colDef)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {hiddenColumns.length > 0 && (
        <button
          onClick={toggleExpand}
          className="mt-2 w-full flex items-center justify-center gap-1 text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors"
        >
          {expanded ? (
            <>
              Hide Details <ChevronUp size={14} />
            </>
          ) : (
            <>
              Show Details <ChevronDown size={14} />
            </>
          )}
        </button>
      )}

      {/* Actions */}
      {tableActions.length > 0 && (
        <div className="flex flex-wrap justify-end mt-3 gap-2">
          {tableActions.map((action, idx) => {
            const {
              btnTitle,
              btnClass,
              iconComponent: Icon,
              btnAction,
              customRender,
              isVisible,
            } = action;
            if (
              (typeof isVisible === "function" && !isVisible(row)) ||
              (typeof isVisible === "boolean" && !isVisible)
            )
              return null;
            if (typeof customRender === "function")
              return <span key={idx}>{customRender(row)}</span>;
            return (
              <button
                key={idx}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium border border-border hover:bg-muted/40 transition-all ${
                  btnClass || "text-blue-500"
                }`}
                onClick={() => btnAction(row)}
                title={btnTitle}
              >
                {Icon ? <Icon size={14} /> : btnTitle}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

  const SkeletonRow = ({ cols }) => (
    <div className="animate-pulse grid grid-cols-1 gap-2">
      {[...Array(cols)].map((_, i) => (
        <div key={i} className="h-6 bg-gray-700 rounded" />
      ))}
    </div>
  );

  // ------------------- JSX Render -------------------
  return (
    <div>
      {/* Header + Search + Create */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-3">
        <h5 className="text-lg font-bold text-foreground dark:text-foreground-dark">
          {tableName}
        </h5>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          {searchKeys.length > 0 && (
            <input
              type="text"
              placeholder={searchPlaceholder || "Search..."}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-3 py-2 rounded border border-border bg-muted text-foreground placeholder-muted-foreground dark:bg-muted-dark dark:text-foreground-dark dark:placeholder-muted-foreground-dark w-full sm:w-64"
            />
          )}
          {createBtn.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {createBtn.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded w-full sm:w-auto text-xs sm:text-sm ${
                    btn.btnClass || "bg-primary"
                  }`}
                  title={btn.title}
                >
                  {btn.icon && <btn.icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span className="truncate">{btn.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table / Mobile Cards */}
      {mobileView ? (
        isLoading ? (
          [...Array(rowsPerPage)].map((_, i) => (
            <div
              key={i}
              className="mb-3 p-4 border-l-4 rounded-lg shadow-sm bg-card"
            >
              <SkeletonRow cols={3} />
            </div>
          ))
        ) : pagedData.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground dark:text-muted-foreground-dark">
            {emptyStateMessage}
          </div>
        ) : (
          pagedData.map((row) => (
            <MobileCard key={row[rowIdKey] || row.id} row={row} />
          ))
        )
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-border dark:divide-border-dark">
            <thead className="sticky top-0 bg-card/80 backdrop-blur-sm z-10">
              <tr>
                {selectable && (
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAllOnPage}
                      checked={
                        pagedData.length > 0 &&
                        pagedData.every((r) => selected.has(r[rowIdKey]))
                      }
                      aria-label="select all"
                    />
                  </th>
                )}
                {tableHeader.map((colDef, idx) => (
                  <th
                    key={idx}
                    style={colDef.width ? { width: colDef.width } : {}}
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort(idx)}
                  >
                    <div className="flex items-center gap-1">
                      {colDef.label}{" "}
                      {sortConfig.index === idx ? (
                        sortConfig.asc ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : null}
                    </div>
                  </th>
                ))}
                {tableActions.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border dark:bg-card-dark dark:divide-border-dark">
              {isLoading ? (
                [...Array(rowsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td
                      colSpan={
                        tableHeader.length +
                        (selectable ? 1 : 0) +
                        (tableActions.length > 0 ? 1 : 0)
                      }
                    >
                      <SkeletonRow cols={tableHeader.length} />
                    </td>
                  </tr>
                ))
              ) : pagedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      tableHeader.length +
                      (selectable ? 1 : 0) +
                      (tableActions.length > 0 ? 1 : 0)
                    }
                    className="text-center py-6 text-muted-foreground dark:text-muted-foreground-dark"
                  >
                    {emptyStateMessage}
                  </td>
                </tr>
              ) : (
                pagedData.map((row) => (
                  <tr
                    key={row[rowIdKey] || row.id}
                    className="hover:bg-muted/20 dark:hover:bg-muted-dark/20"
                  >
                    {selectable && (
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(row[rowIdKey])}
                          onChange={() => toggleSelectRow(row[rowIdKey])}
                        />
                      </td>
                    )}
                    {tableHeader.map((colDef, idx) => (
                      <td key={idx} className="px-6 py-3">
                        {renderCellValue(row, colDef)}
                      </td>
                    ))}
                    {tableActions.length > 0 && (
                      <td className="px-6 py-3 flex gap-2">
                        {tableActions.map((action, idx) => {
                          const {
                            btnTitle,
                            btnClass,
                            iconComponent: Icon,
                            btnAction,
                            customRender,
                            isVisible,
                          } = action;
                          if (
                            (typeof isVisible === "function" &&
                              !isVisible(row)) ||
                            (typeof isVisible === "boolean" && !isVisible)
                          )
                            return null;
                          if (typeof customRender === "function")
                            return <span key={idx}>{customRender(row)}</span>;
                          return (
                            <button
                              key={idx}
                              className={`${
                                btnClass || "text-primary"
                              } flex items-center`}
                              onClick={() => btnAction(row)}
                              title={btnTitle}
                            >
                              {Icon ? <Icon size={16} /> : btnTitle}
                            </button>
                          );
                        })}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center mt-6 px-3 gap-4">
        <div className="flex items-center gap-2 text-sm mr-4">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => handleRowsPerPage(Number(e.target.value))}
            className="rounded border border-border dark:border-border-dark px-2 py-1 bg-gray-700 dark:bg-card-dark text-foreground dark:text-foreground-dark"
          >
            {rowsPerPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 text-gray-300 flex-wrap">
          <button
            disabled={pageToDisplay === 1}
            onClick={() => internalChangePage(1)}
            className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            disabled={pageToDisplay === 1}
            onClick={() => internalChangePage(pageToDisplay - 1)}
            className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {getPageNumbers(pageToDisplay, totalPages).map((pageNum, idx) =>
            pageNum === "start-ellipsis" || pageNum === "end-ellipsis" ? (
              <span key={idx} className="px-2 py-1 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => internalChangePage(pageNum)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  pageNum === pageToDisplay
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {pageNum}
              </button>
            )
          )}
          <button
            disabled={pageToDisplay === totalPages}
            onClick={() => internalChangePage(pageToDisplay + 1)}
            className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            disabled={pageToDisplay === totalPages}
            onClick={() => internalChangePage(totalPages)}
            className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TableUtil;