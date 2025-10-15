import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  User,
  ChevronsLeft ,
  ChevronLeft,
  ChevronRight,
  ChevronsRight ,
} from "lucide-react";
import logo from "../assets/RR_PROP_LOGO.png";

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

function TableUtil({
  tableName = "Data Table",
  tableData = [],
  tableHeader = [],
  tableActions = [],
  searchKeys = [],
  createBtn = [],
  filterKeys = [],
  filters = {},
  setFilters = () => {},
  getCardBorderColor,
  enableMobileView = true,
}) {
  const [searchText, setSearchText] = useState("");
  const [filterVals, setFilterVals] = useState(filters);
  const [sortConfig, setSortConfig] = useState({ index: 0, asc: true });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [mobileView, setMobileView] = useState(isMobile() && enableMobileView);

  useEffect(() => {
    setFilterVals((prev) =>
      JSON.stringify(prev) !== JSON.stringify(filters) ? filters : prev
    );
  }, [filters]);

 useEffect(() => {
   const onResize = () => setMobileView(enableMobileView && isMobile());
   window.addEventListener("resize", onResize);

   // Also update mobileView immediately if enableMobileView changes
   setMobileView(enableMobileView && isMobile());

   return () => window.removeEventListener("resize", onResize);
 }, [enableMobileView]);


  const getNestedValue = (obj, path) => {
    if (!obj || !path) return undefined;
    return path
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .reduce((o, k) => (o ? o[k] : undefined), obj);
  };

  const filteredData = useMemo(() => {
    let filtered = [...tableData];

    if (searchText && searchKeys.length > 0) {
      const s = searchText.toLowerCase().trim(); // trim spaces
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const val = getNestedValue(item, key);
          return val && val.toString().toLowerCase().trim().includes(s); // trim item value too
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
        return asc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
      });
    }

    filtered.sort((a, b) => {
      if (a.role === "super_admin") return -1;
      if (b.role === "super_admin") return 1;
      return 0;
    });

    return filtered;
  }, [tableData, filterVals, searchText, sortConfig, tableHeader, searchKeys]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const pagedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (idx) => {
    setCurrentPage(1);
    setSortConfig((prev) =>
      prev.index === idx
        ? { index: idx, asc: !prev.asc }
        : { index: idx, asc: true }
    );
  };

  const MobileCard = ({ row }) => {
    return (
      <div className="mb-3 p-4 border-l-4 border-primary bg-card text-card-foreground dark:bg-card-dark dark:text-card-foreground-dark rounded-lg shadow-sm">
        {tableHeader.map((colDef, idx) => {
          const val = getNestedValue(row, colDef.key);

          if (colDef.imageKey || colDef.textKey) {
            const imageUrl = getNestedValue(row, colDef.imageKey);
            const text = getNestedValue(row, colDef.textKey);
            return (
              <div key={idx} className="flex justify-between items-center mb-2">
                <strong className="min-w-[90px]">{colDef.label}:</strong>
                <div
                  className="flex items-center gap-2 truncate flex-1"
                  title={text}
                >
                  <div className="h-10 w-10 flex-shrink-0 rounded bg-muted dark:bg-muted-dark">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={text || "img"}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <img
                        src={logo}
                        alt={text || "img"}
                        className="h-10 w-10 object-cover rounded"
                      />
                      // <User className="w-10 h-10 text-muted-foreground dark:text-muted-foreground-dark p-1" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate">{text}</span>
                </div>
              </div>
            );
          }

          let displayVal = val;
          if (val === undefined || val === null) displayVal = "";
          if (colDef.dataFormat === "currency")
            displayVal = `₹${Number(val).toLocaleString()}`;
          if (colDef.dataFormat === "date")
            displayVal = new Date(val).toLocaleDateString();
          if (colDef.dataFormat === "boolean") displayVal = val ? "Yes" : "No";

          return (
            <div key={idx} className="flex justify-between mb-1 flex-wrap">
              <strong className="min-w-[90px]">{colDef.label}:</strong>
              <span
                className="text-sm text-muted-foreground dark:text-muted-foreground-dark truncate flex-1"
                title={displayVal}
              >
                {displayVal}
              </span>
            </div>
          );
        })}

        {tableActions.length > 0 && (
          <div className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
            {tableActions.map((action, idx) => {
              const {
                btnTitle,
                btnClass,
                iconComponent: Icon,
                btnAction,
                customRender,
                isVisible,
              } = action;

              if (typeof isVisible === "function" && !isVisible(row))
                return null;
              if (typeof isVisible === "boolean" && !isVisible) return null;
              if (typeof customRender === "function")
                return <span key={idx}>{customRender(row)}</span>;

              return (
                <button
                  key={idx}
                  className={`${
                    btnClass ||
                    "text-primary hover:text-primary/80 dark:text-primary-dark dark:hover:text-primary-dark/80"
                  } flex items-center`}
                  onClick={() => btnAction(row)}
                  title={btnTitle}
                >
                  {Icon ? <Icon size={16} /> : btnTitle}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCell = (row, colDef) => {
    const val = getNestedValue(row, colDef.key);

    if (colDef?.render) return colDef.render(val, row);
    if (val === undefined || val === null) return "";
    if (Array.isArray(val)) {
      const unique = [...new Set(val.flat(Infinity).map(String))];
      return unique.join(", ") || "-";
    }

    if (colDef.imageKey || colDef.textKey) {
      const imageUrl = getNestedValue(row, colDef.imageKey);
      const text = getNestedValue(row, colDef.textKey);
      return (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded bg-muted dark:bg-muted-dark mr-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={text || "img"}
                className="h-10 w-10 object-cover rounded"
              />
            ) : (
              <img
                src={logo}
                alt={text || "img"}
                className="h-10 w-10 object-cover rounded"
              />
              // <User className="w-10 h-10 text-muted-foreground dark:text-muted-foreground-dark p-1" />
            )}
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
              placeholder="Search..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded border border-border bg-muted text-foreground placeholder-muted-foreground dark:bg-muted-dark dark:text-foreground-dark dark:placeholder-muted-foreground-dark w-full sm:w-64"
            />
          )}

          {createBtn.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {createBtn.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded w-full sm:w-auto
                        text-xs sm:text-sm
                    ${
                      btn.btnClass ||
                      "bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
                    }
                  `}
                  title={btn.title}
                >
                  {btn.icon && <btn.icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span className="truncate">{btn.label}</span>{" "}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Table */}
      {mobileView ? (
        <div>
          {pagedData.map((row) => (
            <MobileCard key={row._id || row.id} row={row} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border dark:divide-border-dark">
            <thead>
              <tr>
                {tableHeader.map((colDef, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort(idx)}
                  >
                    {colDef.label}{" "}
                    {sortConfig.index === idx &&
                      (sortConfig.asc ? (
                        <ChevronUp className="inline w-4 h-4" />
                      ) : (
                        <ChevronDown className="inline w-4 h-4" />
                      ))}
                  </th>
                ))}
                {tableActions.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {pagedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeader.length + tableActions.length}
                    className="px-6 py-4 text-center text-muted-foreground dark:text-muted-foreground-dark"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                pagedData.map((row) => (
                  <tr
                    key={row._id || row.id}
                    className="hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                  >
                    {tableHeader.map((colDef, idx) => (
                      <td key={idx} className="px-6 py-4 whitespace-nowrap">
                        {renderCell(row, colDef)}
                      </td>
                    ))}
                    {tableActions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
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
                            typeof isVisible === "function" &&
                            !isVisible(row)
                          )
                            return null;
                          if (typeof isVisible === "boolean" && !isVisible)
                            return null;

                          if (typeof customRender === "function")
                            return <span key={idx}>{customRender(row)}</span>;

                          return (
                            <button
                              key={idx}
                              className={`${
                                btnClass ||
                                "text-primary hover:text-primary/80 dark:text-primary-dark dark:hover:text-primary-dark/80"
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
      {filteredData.length > 0 && (
        <div className="flex justify-between items-center gap-3 my-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {/* First Page */}
            <button
              className="px-3 py-1 rounded bg-muted hover:bg-muted/80 dark:bg-muted-dark dark:hover:bg-muted-dark/80 disabled:opacity-50 flex items-center justify-center"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              className="px-3 py-1 rounded bg-muted hover:bg-muted/80 dark:bg-muted-dark dark:hover:bg-muted-dark/80 disabled:opacity-50 flex items-center justify-center"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 rounded ${
                  currentPage === idx + 1
                    ? "bg-primary text-white dark:bg-primary-dark"
                    : "bg-muted text-foreground dark:bg-muted-dark dark:text-foreground-dark hover:bg-muted/80 dark:hover:bg-muted-dark/80"
                }`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}

            {/* Next Page */}
            <button
              className="px-3 py-1 rounded bg-muted hover:bg-muted/80 dark:bg-muted-dark dark:hover:bg-muted-dark/80 disabled:opacity-50 flex items-center justify-center"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              className="px-3 py-1 rounded bg-muted hover:bg-muted/80 dark:bg-muted-dark dark:hover:bg-muted-dark/80 disabled:opacity-50 flex items-center justify-center"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Last"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded bg-gray-800 text-foreground border border-border dark:bg-muted-dark dark:text-foreground-dark dark:border-border-dark"
            >
              {[5, 10, 25, 50, 100].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableUtil;
