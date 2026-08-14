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

  infiniteScrollOnMobile = false,
  isLoadingMore = false,

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
  const loadMoreRef = useRef(null);

  const useInfiniteScroll =
    mobileView && infiniteScrollOnMobile && isServerPaginated;

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
    if (!useInfiniteScroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!useInfiniteScroll) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (isLoading || isLoadingMore) return;
        if (pageToDisplay >= totalPages) return;
        onPageChange?.(pageToDisplay + 1);
      },
      { root: null, rootMargin: "240px", threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    useInfiniteScroll,
    isLoading,
    isLoadingMore,
    pageToDisplay,
    totalPages,
    onPageChange,
  ]);

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
        className="text-sm text-muted break-words max-w-[220px] md:max-w-[140px] md:truncate"
        title={displayVal}
      >
        {displayVal}
      </div>
    );
  };

  // ------------------- Mobile Card & Skeleton -------------------
const MobileCard = ({ row }) => {
  const [expanded, setExpanded] = useState(false);
  const imageCol = tableHeader.find((col) => col.imageKey);
  const titleCol = imageCol || tableHeader[0];
  const otherColumns = tableHeader.filter((col) => col !== titleCol);
  const previewColumns = otherColumns.slice(0, 3);
  const extraColumns = otherColumns.slice(3);
  const imageUrl = imageCol
    ? getNestedValue(row, imageCol.imageKey)
    : null;
  const titleText = titleCol
    ? getNestedValue(row, titleCol.textKey || titleCol.key)
    : "";

  return (
    <div className="mb-3 rounded-xl border border-line bg-surface overflow-hidden">
      {imageCol && (
        <img
          src={imageUrl || logo}
          alt={titleText || "Property"}
          className="w-full h-36 object-cover"
        />
      )}

      <div className="p-3">
        {titleText && (
          <h4 className="font-semibold text-fg text-base mb-2 leading-snug">
            {titleText}
          </h4>
        )}

        <div className="space-y-1.5">
          {previewColumns.map((colDef, idx) => (
            <div key={idx} className="flex justify-between gap-3 text-sm">
              <span className="text-muted shrink-0">{colDef.label}</span>
              <span className="text-fg text-right min-w-0 break-words">
                {renderCellValue(row, {
                  ...colDef,
                  imageKey: undefined,
                  textKey: undefined,
                })}
              </span>
            </div>
          ))}
        </div>

        {extraColumns.length > 0 && expanded && (
          <div className="space-y-1.5 mt-2 pt-2 border-t border-line">
            {extraColumns.map((colDef, idx) => (
              <div key={idx} className="flex justify-between gap-3 text-sm">
                <span className="text-muted shrink-0">{colDef.label}</span>
                <span className="text-fg text-right min-w-0 break-words">
                  {renderCellValue(row, colDef)}
                </span>
              </div>
            ))}
          </div>
        )}

        {extraColumns.length > 0 && (
          <button
            type="button"
            aria-label={expanded ? "Hide Details" : "Show Details"}
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-2 w-full flex items-center justify-center gap-1 text-brand text-sm font-medium py-2"
          >
            {expanded ? (
              <>
                Hide Details <ChevronUp size={14} />
              </>
            ) : (
              <>
                More Details <ChevronDown size={14} />
              </>
            )}
          </button>
        )}

        {tableActions.length > 0 && (
          <div className="flex flex-wrap justify-stretch gap-2 mt-3">
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
                  aria-label={btnTitle || "Action"}
                  className={`flex-1 min-w-[44px] min-h-10 inline-flex items-center justify-center gap-1 text-xs px-3 rounded-md font-medium bg-raised border border-line ${
                    btnClass || "text-brand"
                  }`}
                  onClick={() => btnAction(row)}
                  title={btnTitle}
                >
                  {Icon ? <Icon size={16} /> : null}
                  {btnTitle ? <span>{btnTitle}</span> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

  const SkeletonRow = ({ cols }) => (
    <div className="animate-pulse grid grid-cols-1 gap-2">
      {[...Array(cols)].map((_, i) => (
        <div key={i} className="h-6 bg-raised rounded" />
      ))}
    </div>
  );

  // ------------------- JSX Render -------------------
  return (
    <div>
      {/* Header + Search + Create */}
      <div className="flex flex-col gap-3 p-2 sm:p-3 md:flex-row md:justify-between md:items-center">
        <h5 className="text-base sm:text-lg font-bold text-fg">
          {tableName}
        </h5>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          {searchKeys.length > 0 && (
            <input
              type="search"
              placeholder={searchPlaceholder || "Search..."}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-line bg-raised text-fg placeholder-muted w-full sm:w-64 text-base"
            />
          )}
          {createBtn.length > 0 && (
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {createBtn.map((btn, idx) => (
                <button
                  key={idx}
                  aria-label={btn.title}
                  onClick={btn.onClick}
                  className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg w-full sm:w-auto text-sm ${
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
        <>
          {isLoading && pagedData.length === 0 ? (
            [...Array(rowsPerPage)].map((_, i) => (
              <div
                key={i}
                className="mb-3 p-4 border-l-4 rounded-lg shadow-sm bg-surface"
              >
                <SkeletonRow cols={3} />
              </div>
            ))
          ) : pagedData.length === 0 ? (
            <div className="text-center py-6 text-muted">
              {emptyStateMessage}
            </div>
          ) : (
            pagedData.map((row) => (
              <MobileCard key={row[rowIdKey] || row.id} row={row} />
            ))
          )}
          {useInfiniteScroll && (
            <div
              ref={loadMoreRef}
              className="py-4 text-center text-sm text-muted"
            >
              {isLoadingMore
                ? "Loading more…"
                : pageToDisplay >= totalPages && pagedData.length > 0
                  ? "All properties loaded"
                  : null}
            </div>
          )}
        </>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-line">
            <thead className="sticky top-0 bg-surface/80 backdrop-blur-sm z-10">
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
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer select-none"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-line">
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
                    className="text-center py-6 text-muted"
                  >
                    {emptyStateMessage}
                  </td>
                </tr>
              ) : (
                pagedData.map((row) => (
                  <tr
                    key={row[rowIdKey] || row.id}
                    className="hover:bg-raised"
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
                              aria-label={btnTitle}
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
      {!useInfiniteScroll && (
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-stretch sm:items-center mt-4 sm:mt-6 px-1 sm:px-3 gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 text-sm">
          <span className="text-muted">Rows</span>
          <select
            value={rowsPerPage}
            onChange={(e) => handleRowsPerPage(Number(e.target.value))}
            className="rounded border border-line px-2 py-2 bg-raised text-fg text-sm"
          >
            {rowsPerPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="sm:hidden text-muted ml-auto">
            Page {pageToDisplay} of {totalPages}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1 text-muted flex-wrap">
          <button
            aria-label="first page"
            disabled={pageToDisplay === 1}
            onClick={() => internalChangePage(1)}
            className="p-2.5 bg-raised rounded hover:bg-line disabled:opacity-50 hidden sm:inline-flex"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            aria-label="previous page"
            disabled={pageToDisplay === 1}
            onClick={() => internalChangePage(pageToDisplay - 1)}
            className="p-2.5 bg-raised rounded hover:bg-line disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers(pageToDisplay, totalPages).map((pageNum, idx) =>
              pageNum === "start-ellipsis" || pageNum === "end-ellipsis" ? (
                <span key={idx} className="px-2 py-1 text-muted">
                  ...
                </span>
              ) : (
                <button
                  aria-label={`Page ${pageNum}`}
                  key={idx}
                  onClick={() => internalChangePage(pageNum)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    pageNum === pageToDisplay
                      ? "bg-brand text-brand-fg"
                      : "bg-raised text-muted hover:bg-line"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>
          <button
            disabled={pageToDisplay === totalPages}
            aria-label="next page"
            onClick={() => internalChangePage(pageToDisplay + 1)}
            className="p-2.5 bg-raised rounded hover:bg-line disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
          <button
            aria-label="last page"
            disabled={pageToDisplay === totalPages}
            onClick={() => internalChangePage(totalPages)}
            className="p-2.5 bg-raised rounded hover:bg-line disabled:opacity-50 hidden sm:inline-flex"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

export default TableUtil;