import React from "react";
import { GoSearch } from "react-icons/go";
import { RxCross2, RxReload } from "react-icons/rx";
import { FaUserMd, FaCalendarAlt } from "react-icons/fa";
import useClickSound from "../hooks/useClickSound";

const MessageFilter = ({
  filters,
  onFilterChange,
  onClearFilters,
  user,
  filteredDoctors,
}) => {
  const setupClickSound = useClickSound();

  return (
    <div className="msg-filter-controls">
      {/* Search Input with Clear Button */}
      <div className="msg-search-box">
        <GoSearch className="msg-search-icon" />
        <input
          type="text"
          name="q"
          placeholder="Search by sender, phone, content..."
          value={filters.q}
          onChange={onFilterChange}
          className="msg-search-input"
        />
        {filters.q && (
          <button
            type="button"
            className="msg-search-clear-btn"
            onClick={() =>
              onFilterChange({ target: { name: "q", value: "" } })
            }
            title="Clear search"
          >
            <RxCross2 />
          </button>
        )}
      </div>

      {/* Date Filter Dropdown */}
      <div className="msg-filter-select-wrapper">
        <FaCalendarAlt className="msg-select-icon" />
        <select
          name="filterOption"
          value={filters.filterOption}
          onChange={onFilterChange}
          className="msg-filter-select"
        >
          <option value="All">All Dates</option>
          <option value="Today">Today's Messages</option>
          <option value="Old">Older Messages</option>
          <option value="Custom">Custom Date Range</option>
        </select>
      </div>

      {/* Doctor Filter Dropdown (if Admin or Multi-Doctor) */}
      {user?.role !== "Doctor" && (
        <div className="msg-filter-select-wrapper">
          <FaUserMd className="msg-select-icon" />
          <select
            name="doctorId"
            value={filters.doctorId}
            onChange={onFilterChange}
            className="msg-filter-select"
          >
            <option value="">All Doctors</option>
            {filteredDoctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                Dr. {doc.firstName} {doc.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom Date Range Picker */}
      {filters.filterOption === "Custom" && (
        <div className="msg-custom-date-range">
          <input
            type="date"
            name="customStart"
            value={filters.customStart}
            onChange={onFilterChange}
            className="msg-date-input"
            title="Start Date"
          />
          <span className="msg-date-separator">to</span>
          <input
            type="date"
            name="customEnd"
            value={filters.customEnd}
            onChange={onFilterChange}
            className="msg-date-input"
            title="End Date"
          />
        </div>
      )}

      {/* Reset / Reload Button */}
      <button
        ref={setupClickSound}
        onClick={onClearFilters}
        className="msg-reload-btn"
        title="Reset all filters"
        type="button"
      >
        <RxReload className="msg-reload-icon" />
        <span className="msg-reload-label">Reset</span>
      </button>
    </div>
  );
};

export default MessageFilter;
