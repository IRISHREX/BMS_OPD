import React from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaAnglesLeft,
  FaAnglesRight,
} from "react-icons/fa6";
import useClickSound from "../hooks/useClickSound";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const setupClickSound = useClickSound();

  if (totalPages <= 1) return null;

  // Build a smart windowed pagination array (e.g., [1, 2, 3, '...', 10])
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always include page 1
    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push("...");
    }

    // Always include last page
    pages.push(totalPages);

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="msg-pagination-card">
      <div className="msg-pagination-info">
        <span>
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </span>
      </div>

      <div className="msg-pagination-buttons">
        {/* Jump to First Page */}
        {currentPage > 2 && (
          <button
            ref={setupClickSound}
            type="button"
            onClick={() => onPageChange(1)}
            className="msg-page-nav-btn jump-btn"
            title="First Page"
          >
            <FaAnglesLeft />
          </button>
        )}

        {/* Previous Page */}
        <button
          ref={setupClickSound}
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="msg-page-nav-btn"
          title="Previous Page"
        >
          <FaChevronLeft />
          <span className="msg-page-nav-text">Prev</span>
        </button>

        {/* Page Number Buttons */}
        <div className="msg-page-numbers-wrap">
          {visiblePages.map((page, idx) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="msg-page-ellipsis">
                  &hellip;
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                ref={setupClickSound}
                type="button"
                onClick={() => onPageChange(page)}
                className={`msg-page-num-btn ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          ref={setupClickSound}
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="msg-page-nav-btn"
          title="Next Page"
        >
          <span className="msg-page-nav-text">Next</span>
          <FaChevronRight />
        </button>

        {/* Jump to Last Page */}
        {currentPage < totalPages - 1 && (
          <button
            ref={setupClickSound}
            type="button"
            onClick={() => onPageChange(totalPages)}
            className="msg-page-nav-btn jump-btn"
            title="Last Page"
          >
            <FaAnglesRight />
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
