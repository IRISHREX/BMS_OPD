import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import {
  FaSearch,
  FaEdit,
  FaFlask,
  FaPlus,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
} from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import { LuFilterX, LuPlus } from "react-icons/lu";
import Toolbar from "./Toolbar";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { playSaveSound, playDeleteSound, playLoadSound } from "../utils/soundUtils";
import "./TestManagement.css";

const STANDARD_CATEGORIES = [
  "Blood Test",
  "Imaging",
  "Pathology",
  "Urine Test",
  "Cardiology",
  "Radiology",
  "Biochemistry",
  "Hematology",
  "Microbiology",
  "Serology",
  "Endocrinology",
  "General",
];

const FILTER_CATEGORIES = ["All", ...STANDARD_CATEGORIES];

const TestManagement = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  // Tests State
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testSearch, setTestSearch] = useState("");
  const [testCategoryFilter, setTestCategoryFilter] = useState("All");

  // Sorting State
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [editingTestName, setEditingTestName] = useState("");
  const [editingTestCategory, setEditingTestCategory] = useState("General");
  const [testRows, setTestRows] = useState([{ name: "", category: "General" }]);

  // Submitting loader
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  // Reset to page 1 whenever filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [testSearch, testCategoryFilter, pageSize]);

  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      playLoadSound();
      const { data } = await api.get("/api/v1/test");
      setTests(data.tests || []);
    } catch (err) {
      console.error("Failed to fetch diagnostic tests", err);
    } finally {
      setLoadingTests(false);
    }
  };

  // ==================== SORTING HANDLERS ====================

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <FaSort className="sort-icon inactive" />;
    }
    return sortDirection === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  // ==================== TEST CRUD HANDLERS ====================

  const handleOpenTestModal = (test = null) => {
    if (test) {
      setEditingTestId(test._id);
      setEditingTestName(test.name || "");
      setEditingTestCategory(test.category || test.type || "General");
    } else {
      setEditingTestId(null);
      setEditingTestName("");
      setEditingTestCategory("General");
      setTestRows([{ name: "", category: "General" }]);
    }
    setShowTestModal(true);
  };

  const handleCloseTestModal = () => {
    setShowTestModal(false);
    setEditingTestId(null);
    setEditingTestName("");
    setEditingTestCategory("General");
    setTestRows([{ name: "", category: "General" }]);
  };

  const handleAddMoreTestRow = () => {
    setTestRows((prev) => [
      ...prev,
      { name: "", category: prev[prev.length - 1]?.category || "General" },
    ]);
  };

  const handleRemoveTestRow = (idx) => {
    setTestRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTestRowChange = (idx, field, value) => {
    setTestRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTestId) {
        if (!editingTestName.trim()) {
          snackbar.error("Please enter a test name");
          setSubmitting(false);
          return;
        }
        await api.put(`/api/v1/test/${editingTestId}`, {
          name: editingTestName.trim(),
          category: editingTestCategory.trim() || "General",
        });
        playSaveSound();
        snackbar.success("Diagnostic test updated successfully!");
      } else {
        const validRows = testRows
          .map((r) => ({
            name: (r.name || "").trim(),
            category: (r.category || "General").trim() || "General",
          }))
          .filter((r) => r.name.length > 0);

        if (validRows.length === 0) {
          snackbar.error("Please enter at least one valid test name");
          setSubmitting(false);
          return;
        }

        await api.post("/api/v1/test", { tests: validRows });
        playSaveSound();
        snackbar.success(
          validRows.length === 1
            ? "Diagnostic test created successfully!"
            : `${validRows.length} diagnostic tests created successfully!`
        );
      }
      handleCloseTestModal();
      fetchTests();
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to save test(s)");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTest = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/api/v1/test/${id}`);
      playDeleteSound();
      snackbar.success("Test deleted successfully!");
      setTests((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to delete test");
    }
  };

  // ==================== FILTERING & SORTING ====================

  const filteredAndSortedTests = useMemo(() => {
    const filtered = (tests || []).filter((t) => {
      const testCat = t.category || t.type || "General";
      const matchSearch =
        !testSearch ||
        (t.name && t.name.toLowerCase().includes(testSearch.toLowerCase())) ||
        testCat.toLowerCase().includes(testSearch.toLowerCase());

      const matchCategory =
        testCategoryFilter === "All" ||
        testCat.toLowerCase() === testCategoryFilter.toLowerCase();

      return matchSearch && matchCategory;
    });

    return filtered.sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortField === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      } else if (sortField === "category") {
        valA = (a.category || a.type || "General").toLowerCase();
        valB = (b.category || b.type || "General").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [tests, testSearch, testCategoryFilter, sortField, sortDirection]);

  // ==================== PAGINATION CALCULATIONS ====================

  const totalTests = filteredAndSortedTests.length;
  const totalPages = Math.max(1, Math.ceil(totalTests / pageSize));
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedTests.slice(start, start + pageSize);
  }, [filteredAndSortedTests, currentPage, pageSize]);

  const startIndex = totalTests === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalTests);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Color generator for category badges
  const getBadgeStyle = (category) => {
    if (!category) return { bg: "#f1f5f9", color: "#475569" };
    const lower = category.toLowerCase();
    if (lower.includes("blood") || lower.includes("hematology"))
      return { bg: "#fee2e2", color: "#b91c1c" };
    if (
      lower.includes("imaging") ||
      lower.includes("radiology") ||
      lower.includes("x-ray") ||
      lower.includes("mri") ||
      lower.includes("ct") ||
      lower.includes("usg") ||
      lower.includes("ultrasound")
    )
      return { bg: "#e0f2fe", color: "#0369a1" };
    if (lower.includes("urine")) return { bg: "#fef3c7", color: "#b45309" };
    if (lower.includes("cardio") || lower.includes("ecg") || lower.includes("echo"))
      return { bg: "#ffe4e6", color: "#e11d48" };
    if (lower.includes("bio") || lower.includes("pathology"))
      return { bg: "#f3e8ff", color: "#7e22ce" };
    if (lower.includes("micro") || lower.includes("infectious"))
      return { bg: "#ffedd5", color: "#c2410c" };
    if (lower.includes("serology")) return { bg: "#fce7f3", color: "#be185d" };
    if (lower.includes("endo") || lower.includes("diabetes"))
      return { bg: "#dcfce7", color: "#15803d" };
    if (lower.includes("ortho")) return { bg: "#ccfbf1", color: "#0f766e" };
    return { bg: "#f1f5f9", color: "#475569" };
  };

  return (
    <section className="page test-management-page" style={{ minHeight: "100vh" }}>
      <Toolbar>
        <div className="test-mgmt-header-box">
          {/* Header Row: Back + Title with Counter + Actions */}
          <div className="test-mgmt-top-row">
            <div className="test-mgmt-left">
              <button
                onClick={() => navigate(-1)}
                className="test-back-btn"
                title="Back"
                aria-label="Back to previous page"
              >
                <BsArrowLeft />
              </button>
              <div className="test-mgmt-title-wrap">
                <div className="test-title-line">
                  <h2>Diagnostic Tests</h2>
                  <span className="test-count-badge">
                    {tests.length} {tests.length === 1 ? "Test" : "Tests"}
                  </span>
                </div>
                <span className="test-mgmt-subtitle">
                  Configure and manage laboratory and clinical diagnostic tests
                </span>
              </div>
            </div>

            <div className="test-mgmt-actions">
              <button
                className="test-primary-btn"
                onClick={() => handleOpenTestModal()}
              >
                <LuPlus className="btn-icon" />
                Create Test
              </button>
            </div>
          </div>

          {/* Search & Filters Unified Control Bar */}
          <div className="test-mgmt-filter-row">
            <div className="test-search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search tests by name or category..."
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                className="search-input"
              />
              {testSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setTestSearch("")}
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="test-filter-bar">
              <div className="filter-select-wrapper">
                <FaFilter className="filter-select-icon" />
                <select
                  value={testCategoryFilter}
                  onChange={(e) => setTestCategoryFilter(e.target.value)}
                  className="filter-category-select"
                >
                  {FILTER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "All" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
              </div>

              {(testSearch || testCategoryFilter !== "All") && (
                <button
                  className="test-reset-filter-btn"
                  title="Reset all filters"
                  onClick={() => {
                    setTestSearch("");
                    setTestCategoryFilter("All");
                  }}
                >
                  <LuFilterX className="btn-icon-sm" />
                  Reset
                </button>
              )}

              <div className="test-results-count">
                Showing <strong>{filteredAndSortedTests.length}</strong> of{" "}
                <strong>{tests.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </Toolbar>

      {/* Main Content Area */}
      <main className="test-mgmt-main-content">
        <div className="tests-list-section">
          {loadingTests ? (
            <div className="loading-state">
              <span className="loader"></span>
              <p>Loading diagnostic tests...</p>
            </div>
          ) : filteredAndSortedTests.length === 0 ? (
            <div className="empty-state-card">
              <FaFlask className="empty-icon" />
              <h3>No Diagnostic Tests Found</h3>
              <p className="muted">
                {testSearch || testCategoryFilter !== "All"
                  ? "Try adjusting your search query or filter."
                  : "Get started by creating your first clinical diagnostic test."}
              </p>
              <button
                className="add-btn test-primary-btn"
                onClick={() => handleOpenTestModal()}
                style={{ marginTop: "1rem" }}
              >
                + Add Diagnostic Test
              </button>
            </div>
          ) : (
            <>
              {/* Table View */}
              <div className="test-table-container">
                <table className="test-table">
                  <thead>
                    <tr>
                      <th className="th-index">#</th>
                      <th
                        className={`th-name th-sortable ${
                          sortField === "name" ? "sorted" : ""
                        }`}
                        onClick={() => handleSort("name")}
                        title={`Sort by Test Name (${
                          sortField === "name" && sortDirection === "asc"
                            ? "Click for Descending"
                            : "Click for Ascending"
                        })`}
                      >
                        <div className="th-sort-wrapper">
                          <span>Test Name</span>
                          <span className="th-sort-icon-box">
                            {renderSortIcon("name")}
                          </span>
                        </div>
                      </th>
                      <th
                        className={`th-category th-sortable ${
                          sortField === "category" ? "sorted" : ""
                        }`}
                        onClick={() => handleSort("category")}
                        title={`Sort by Category (${
                          sortField === "category" && sortDirection === "asc"
                            ? "Click for Descending"
                            : "Click for Ascending"
                        })`}
                      >
                        <div className="th-sort-wrapper">
                          <span>Category</span>
                          <span className="th-sort-icon-box">
                            {renderSortIcon("category")}
                          </span>
                        </div>
                      </th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTests.map((test, index) => {
                      const categoryName = test.category || test.type || "General";
                      const badge = getBadgeStyle(categoryName);
                      const serialNumber = (currentPage - 1) * pageSize + index + 1;
                      return (
                        <tr key={test._id} className="test-table-row">
                          <td className="td-index">{serialNumber}</td>
                          <td className="td-name">
                            <span className="test-table-name-text">{test.name}</span>
                          </td>
                          <td className="td-category">
                            <span
                              className="test-type-badge"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {categoryName}
                            </span>
                          </td>
                          <td className="td-actions">
                            <div className="table-action-buttons">
                              <button
                                type="button"
                                title="Edit Test"
                                aria-label={`Edit ${test.name}`}
                                className="action-icon-btn edit-action"
                                onClick={() => handleOpenTestModal(test)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                title="Delete Test"
                                aria-label={`Delete ${test.name}`}
                                className="action-icon-btn delete-action"
                                onClick={() => handleDeleteTest(test._id, test.name)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Footer */}
              <div className="test-pagination-wrapper">
                <div className="pagination-info">
                  Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of{" "}
                  <strong>{totalTests}</strong> tests
                </div>

                <div className="pagination-controls-group">
                  <div className="rows-per-page">
                    <label>Rows:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div className="pagination-btns">
                    <button
                      className="page-nav-btn"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(1)}
                      title="First Page"
                    >
                      «
                    </button>
                    <button
                      className="page-nav-btn"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      title="Previous Page"
                    >
                      ‹ Prev
                    </button>

                    {getPageNumbers().map((item, idx) =>
                      item === "..." ? (
                        <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          className={`page-num-btn ${
                            item === currentPage ? "active" : ""
                          }`}
                          onClick={() => setCurrentPage(item)}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      className="page-nav-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      title="Next Page"
                    >
                      Next ›
                    </button>
                    <button
                      className="page-nav-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      title="Last Page"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ==================== MODAL: ADD / EDIT DIAGNOSTIC TEST ==================== */}
      {showTestModal && (
        <div className="modal-overlay" onClick={handleCloseTestModal}>
          <div
            className="modal-content test-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {editingTestId
                  ? "Edit Diagnostic Test"
                  : "Add New Diagnostic Test"}
              </h3>
              <button className="close-btn" onClick={handleCloseTestModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleTestSubmit} className="modal-body test-form">
              {editingTestId ? (
                // Single Test Edit Form
                <div className="single-test-edit-fields">
                  <div className="form-group">
                    <label>Test Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Complete Blood Count (CBC)"
                      value={editingTestName}
                      onChange={(e) => setEditingTestName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "12px" }}>
                    <label>Test Category</label>
                    <select
                      value={editingTestCategory}
                      onChange={(e) => setEditingTestCategory(e.target.value)}
                    >
                      {STANDARD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                // Multi-Test Create Form
                <div className="multi-test-create-wrapper">
                  <div className="multi-test-header-labels">
                    <span className="col-label test-name-col-label">
                      Test Name *
                    </span>
                    <span className="col-label test-cat-col-label">
                      Test Category
                    </span>
                  </div>

                  <div className="test-name-inputs-list">
                    {testRows.map((row, idx) => (
                      <div key={idx} className="multi-test-input-row">
                        <div className="row-input-wrap test-name-input-wrap">
                          <input
                            type="text"
                            required={idx === 0}
                            placeholder="e.g. Complete Blood Count (CBC)"
                            value={row.name}
                            onChange={(e) =>
                              handleTestRowChange(idx, "name", e.target.value)
                            }
                            autoFocus={idx === 0}
                          />
                        </div>

                        <div className="row-input-wrap test-cat-select-wrap">
                          <select
                            value={row.category}
                            onChange={(e) =>
                              handleTestRowChange(
                                idx,
                                "category",
                                e.target.value
                              )
                            }
                          >
                            {STANDARD_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {testRows.length > 1 && (
                          <button
                            type="button"
                            className="action-icon-btn delete-action remove-test-row-btn"
                            title="Remove Row"
                            onClick={() => handleRemoveTestRow(idx)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="add-more-test-btn"
                    onClick={handleAddMoreTestRow}
                  >
                    <LuPlus style={{ fontSize: "0.85rem", marginRight: "4px" }} />
                    Add more
                  </button>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={handleCloseTestModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn add-btn test-primary-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingTestId
                    ? "Update Test"
                    : testRows.filter((r) => r.name.trim()).length > 1
                    ? "Create Tests"
                    : "Create Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="settings-footer">
        OPD Diagnostic Test Management • © {new Date().getFullYear()}
      </footer>
    </section>
  );
};

export default TestManagement;
