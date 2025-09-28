import React, { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, User } from "lucide-react";

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
    const onResize = () => setMobileView(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enableMobileView]);

 const getNestedValue = (obj, path) => {
   if (!obj || !path) return undefined;
   return path
     .replace(/\[(\d+)\]/g, ".$1") // convert [0] to .0
     .split(".")
     .reduce((o, k) => (o ? o[k] : undefined), obj);
 };


  const filteredData = useMemo(() => {
    let filtered = [...tableData];

    // search
    if (searchText && searchKeys.length > 0) {
      const s = searchText.toLowerCase();
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const val = getNestedValue(item, key);
          return val && val.toString().toLowerCase().includes(s);
        })
      );
    }

    // filters
    Object.entries(filterVals).forEach(([key, values]) => {
      if (values?.length > 0) {
        filtered = filtered.filter((item) =>
          values.includes(String(getNestedValue(item, key)))
        );
      }
    });

    // sort
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

    // super_admin first if role exists
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
      <div className="mb-3 p-4 border-l-4 border-green-500 bg-gray-900 text-white rounded-lg shadow-sm">
        {tableHeader.map((colDef, idx) => {
          const val = getNestedValue(row, colDef.key);

          // Image + text column
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
                  <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-700">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={text || "img"}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-400 p-1" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate">{text}</span>
                </div>
              </div>
            );
          }

          // Other fields with tooltip if truncated
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
                className="text-sm text-gray-300 truncate flex-1"
                title={displayVal}
              >
                {displayVal}
              </span>
            </div>
          );
        })}

        {/* Actions */}
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
                    btnClass || "text-blue-500 hover:text-blue-400"
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

    // Image + text column
    if (colDef.imageKey || colDef.textKey) {
      const imageUrl = getNestedValue(row, colDef.imageKey);
      const text = getNestedValue(row, colDef.textKey);
      return (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-700 mr-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={text || "img"}
                className="h-10 w-10 object-cover rounded"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400 p-1" />
            )}
          </div>
          <div className="text-sm font-medium text-white truncate" title={text}>
            {text}
          </div>
        </div>
      );
    }

    // Other formats
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
      <span className="text-sm text-gray-300 truncate" title={displayVal}>
        {displayVal}
      </span>
    );
  };

  return (
    <div>
      {/* Header + Search + Create */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-3">
        {/* Table Title */}
        <h5 className="text-lg font-bold">{tableName}</h5>

        {/* Search + Buttons */}
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
              className="px-3 py-2 rounded border border-gray-500 bg-gray-700 text-white placeholder-gray-400 w-full sm:w-64"
            />
          )}

          {createBtn.length > 0 &&
            createBtn.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.onClick}
                className={`px-4 py-2 rounded text-white text-sm ${
                  btn.btnClass || "bg-green-600 hover:bg-green-700"
                } flex items-center justify-center gap-1`}
                title={btn.title}
              >
                {btn.icon && <btn.icon className="w-4 h-4" />}
                {btn.label}
              </button>
            ))}
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
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                {tableHeader.map((colDef, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer select-none"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {pagedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeader.length + tableActions.length}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                pagedData.map((row) => (
                  <tr key={row._id || row.id} className="hover:bg-gray-800/50">
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

                          // 🔹 check visibility
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
                                btnClass || "text-blue-500 hover:text-blue-400"
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
      {totalPages > 1 && (
        <div className="flex justify-between items-center gap-3 my-3 flex-wrap">
          {/* Pagination Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 rounded ${
                  currentPage === idx + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>

          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded bg-gray-700 text-white border border-gray-500"
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
