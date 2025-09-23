import { CalendarIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CustomDatePicker = ({
  value,
  onChange,
  minDate,
  placeholder = "YYYY-MM-DD",
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [mode, setMode] = useState("day"); // 'day', 'month', 'year'
  const [yearRangeStart, setYearRangeStart] = useState(
    () => Math.floor(new Date(value || Date.now()).getFullYear() / 10) * 10
  );
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const calendarRef = useRef();
  const yearDropdownRef = useRef();

  const today = new Date();
  const min = minDate ? new Date(minDate) : null;

  useEffect(() => {
    if (value) {
      const valDate = new Date(value);
      setCurrentMonth(valDate);
      setYearRangeStart(Math.floor(valDate.getFullYear() / 10) * 10);
    }
  }, [value]);

  const selectedDate = value ? new Date(value) : null;

  const toggleCalendar = () => {
    setShowCalendar((v) => !v);
    setMode("day");
  };

  const handleClickOutside = (e) => {
    if (calendarRef.current && !calendarRef.current.contains(e.target)) {
      setShowCalendar(false);
      setMode("day");
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (month, year) => {
    const date = new Date(year, month, 1);
    const days = [];
    const startDay = date.getDay();
    for (let i = 0; i < startDay; i++) days.push(null);
    while (date.getMonth() === month) {
      days.push(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const monthDays = daysInMonth(
    currentMonth.getMonth(),
    currentMonth.getFullYear()
  );

  const isSameDay = (d1, d2) =>
    d1 &&
    d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const prevYearRange = () => {
    setYearRangeStart((yr) => yr - 10);
  };

  const nextYearRange = () => {
    setYearRangeStart((yr) => yr + 10);
  };

  const handleDateClick = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const localISODate = `${year}-${month}-${day}`;

    onChange(localISODate);
    setShowCalendar(false);
    setMode("day");
  };

  return (
    <div className="relative w-full" ref={calendarRef}>
      <div className="flex items-center w-full">
        <input
          type="text"
          readOnly
          placeholder={placeholder}
          value={value ? value : ""}
          onClick={toggleCalendar}
          className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-600 bg-gray-800 text-gray-100 cursor-pointer"
        />
        <span className="ml-2 cursor-pointer" onClick={toggleCalendar}>
          <CalendarIcon size={20} className="text-gray-400" />
        </span>
      </div>

      {showCalendar && (
        <div className="absolute z-10 mt-1 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-lg w-72 text-gray-100">
          {/* Header: different content depending on mode */}
          <div className="flex justify-between items-center mb-2">
            {mode === "day" && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevMonth();
                  }}
                  className="px-2 py-1 rounded hover:bg-gray-700"
                >
                  &lt;
                </button>

                <div
                  onClick={() => setMode("month")}
                  className="cursor-pointer flex items-center gap-1 select-none text-gray-100 font-semibold"
                  style={{ userSelect: "none" }}
                >
                  {/* Combined month + year with no button border */}
                  <span>
                    {currentMonth.toLocaleString("default", { month: "long" })}{" "}
                    {currentMonth.getFullYear()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextMonth();
                  }}
                  className="px-2 py-1 rounded hover:bg-gray-700"
                >
                  &gt;
                </button>
              </>
            )}
            {mode === "month" && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newYear = currentMonth.getFullYear() - 1;
                    setCurrentMonth(
                      new Date(newYear, currentMonth.getMonth(), 1)
                    );
                  }}
                  className="px-2 py-1 rounded hover:bg-gray-700"
                >
                  &lt;
                </button>
                
                <div className="flex items-center gap-2 cursor-default select-none grow justify-center text-gray-100 font-semibold">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode("year");
                    }}
                    className=""
                  >
                    {currentMonth.getFullYear()}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newYear = currentMonth.getFullYear() + 1;
                    setCurrentMonth(
                      new Date(newYear, currentMonth.getMonth(), 1)
                    );
                  }}
                  className="px-2 py-1 rounded hover:bg-gray-700"
                >
                  &gt;
                </button>
              </>
            )}

            {mode === "year" && (
              <>
                <button
                  type="button"
                  onClick={() => prevYearRange()}
                  className="px-2 py-1 rounded hover:bg-gray-700"
                >
                  &lt;
                </button>
                <span className="font-semibold">
                  {yearRangeStart} - {yearRangeStart + 9}
                </span>
                <button
                  type="button"
                  onClick={() => nextYearRange()}
                  className="px-2 py-1 rounded hover:bg-gray-700"
                >
                  &gt;
                </button>
              </>
            )}
          </div>

          {/* Body content based on mode */}

          {mode === "day" && (
            <>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-center font-medium mb-1">
                {weekdays.map((day) => (
                  <div key={day} className="text-gray-400 text-xs">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, idx) =>
                  day ? (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!min || day >= min) handleDateClick(day);
                      }}
                      className={`p-2 rounded cursor-pointer text-center text-sm
                      ${isSameDay(day, today) ? "bg-gray-700" : ""}
                      ${
                        isSameDay(day, selectedDate)
                          ? "bg-blue-600 text-white font-semibold"
                          : ""
                      }
                      ${
                        min && day < min
                          ? "text-gray-600 cursor-not-allowed"
                          : "hover:bg-gray-700"
                      }
                      `}
                    >
                      {day.getDate()}
                    </div>
                  ) : (
                    <div key={idx}></div>
                  )
                )}
              </div>
            </>
          )}

          {mode === "month" && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[...Array(12).keys()].map((m) => {
                const monthName = new Date(0, m).toLocaleString("default", {
                  month: "short",
                });
                return (
                  <div
                    key={m}
                    onClick={() => {
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), m, 1)
                      );
                      setMode("day");
                    }}
                    className={`cursor-pointer rounded p-2 ${
                      m === currentMonth.getMonth()
                        ? "bg-blue-600 text-white font-semibold"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    {monthName}
                  </div>
                );
              })}
            </div>
          )}

          {mode === "year" && (
            <div className="grid grid-cols-5 gap-2 text-center">
              {Array.from({ length: 10 }).map((_, i) => {
                const yr = yearRangeStart + i;
                return (
                  <div
                    key={yr}
                    onClick={() => {
                      setCurrentMonth(new Date(yr, currentMonth.getMonth(), 1));
                      setMode("month");
                    }}
                    className={`cursor-pointer rounded p-2 ${
                      yr === currentMonth.getFullYear()
                        ? "bg-blue-600 text-white font-semibold"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    {yr}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
