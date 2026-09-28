import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import {
  FaSearch,
  FaEdit,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import {
  LuFilterX,
  LuPlus,
  LuFlaskConical,
  LuLayers,
  LuPill,
  LuSparkles,
} from "react-icons/lu";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  playSaveSound,
  playDeleteSound,
  playLoadSound,
} from "../utils/soundUtils";
import Pagination from "./Pagination";
import "./TestManagement.css";

const STANDARD_TEST_CATEGORIES = [
  "General",
  "Blood / Hematology",
  "Biochemistry",
  "Pathology",
  "Radiology / Imaging",
  "Urine Analysis",
  "Microbiology",
  "Serology",
  "Endocrinology",
  "Cardiology / ECG",
  "Orthopedics",
];

const TestManagement = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  // Tests State
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [submitting, setSubmitting] = useState(false);

  // Multi-row Add State
  const [testRows, setTestRows] = useState([
    { name: "", category: "General" },
  ]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      playLoadSound();
      const { data } = await api.get("/api/v1/test");
      setTests(data.tests || []);
    } catch (err) {
      console.error("Failed to fetch tests", err);
      snackbar.error("Failed to load diagnostic tests");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [testSearch, testCategoryFilter, pageSize]);

  // Sorting Handlers
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
      return <FaSort style={{ opacity: 0.35, fontSize: "0.85rem" }} />;
    }
    return sortDirection === "asc" ? (
      <FaSortUp style={{ color: "var(--accent, #1a9e9b)", fontSize: "0.95rem" }} />
    ) : (
      <FaSortDown style={{ color: "var(--accent, #1a9e9b)", fontSize: "0.95rem" }} />
    );
  };

  // Modal Handlers
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

  // Multi-row Handlers
  const addTestRow = () => {
    setTestRows((prev) => [...prev, { name: "", category: "General" }]);
  };

  const removeTestRow = (idx) => {
    if (testRows.length === 1) return;
    setTestRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTestRow = (idx, field, value) => {
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

  // Filtered & Sorted Tests
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

  // Pagination Calculations
  const totalTests = filteredAndSortedTests.length;
  const totalPages = Math.max(1, Math.ceil(totalTests / pageSize));
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedTests.slice(start, start + pageSize);
  }, [filteredAndSortedTests, currentPage, pageSize]);

  const hasActiveFilters = Boolean(testSearch || testCategoryFilter !== "All");

  const resetAllFilters = () => {
    setTestSearch("");
    setTestCategoryFilter("All");
  };

  // Badge Style Generator
  const getBadgeStyle = (category) => {
    if (!category) return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };
    const lower = category.toLowerCase();
    if (lower.includes("blood") || lower.includes("hematology"))
      return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    if (
      lower.includes("imaging") ||
      lower.includes("radiology") ||
      lower.includes("x-ray") ||
      lower.includes("mri") ||
      lower.includes("ct") ||
      lower.includes("usg") ||
      lower.includes("ultrasound")
    )
      return { bg: "rgba(2, 132, 199, 0.1)", color: "#0284c7" };
    if (lower.includes("urine"))
      return { bg: "rgba(217, 119, 6, 0.1)", color: "#d97706" };
    if (lower.includes("cardio") || lower.includes("ecg") || lower.includes("echo"))
      return { bg: "rgba(225, 29, 72, 0.1)", color: "#e11d48" };
    if (lower.includes("bio") || lower.includes("pathology"))
      return { bg: "rgba(147, 51, 234, 0.1)", color: "#9333ea" };
    if (lower.includes("micro") || lower.includes("infectious"))
      return { bg: "rgba(234, 88, 12, 0.1)", color: "#ea580c" };
    if (lower.includes("serology"))
      return { bg: "rgba(219, 39, 119, 0.1)", color: "#db2777" };
    if (lower.includes("endo") || lower.includes("diabetes"))
      return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (lower.includes("ortho"))
      return { bg: "rgba(20, 184, 166, 0.1)", color: "#14b8a6" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };
  };

  return (
    <div className="test-management-page">
      <div className="test-mgmt-container">
        {/* Top Header Card */}
        <header className="test-top-bar">
          <div className="test-top-bar-left">
            <button
              onClick={() => navigate(-1)}
              className="test-back-btn"
              title="Back"
              aria-label="Back to previous page"
            >
              <BsArrowLeft />
            </button>
            <div className="test-icon-badge">
              <LuFlaskConical />
            </div>
            <div className="test-title-group">
              <div className="test-title-row">
                <h1 className="test-main-title">Diagnostic Tests</h1>
                <span className="test-count-pill">
                  {tests.length} {tests.length === 1 ? "Test" : "Tests"}
                </span>
              </div>
              <p className="test-subtitle-text">
                Configure clinical diagnostic lab tests, pathology orders, and imaging procedures
              </p>
            </div>
          </div>

          <div className="test-top-bar-right">
            <button
              type="button"
              className="test-primary-btn"
              onClick={() => handleOpenTestModal()}
            >
              <LuPlus />
              <span>Create Test</span>
            </button>
          </div>
        </header>

        {/* Control Card: Sub-Navigation + Search & Filters */}
        <div className="test-control-card">
          <nav className="protocol-segmented-tabs" aria-label="Clinical Catalog Sections">
            <button
              type="button"
              className="protocol-tab-pill"
              onClick={() => navigate("/settings/medicine")}
            >
              <LuLayers className="tab-icon" />
              <span>Protocols</span>
            </button>
            <button
              type="button"
              className="protocol-tab-pill"
              onClick={() => navigate("/medicines")}
            >
              <LuPill className="tab-icon" />
              <span>Medicine Master</span>
            </button>
            <button
              type="button"
              className="protocol-tab-pill active"
              onClick={() => navigate("/tests")}
            >
              <LuFlaskConical className="tab-icon" />
              <span>Lab Tests</span>
            </button>
            <button
              type="button"
              className="protocol-tab-pill"
              onClick={() => navigate("/settings/advice")}
            >
              <LuSparkles className="tab-icon" />
              <span>Care Advice</span>
            </button>
          </nav>

          <div className="test-search-filter-group">
            <div className="test-search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search diagnostic tests or categories..."
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

            <select
              className="test-filter-select"
              value={testCategoryFilter}
              onChange={(e) => setTestCategoryFilter(e.target.value)}
              aria-label="Filter by Category"
            >
              <option value="All">All Categories</option>
              {STANDARD_TEST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="test-reset-btn"
                title="Reset Filters"
                onClick={resetAllFilters}
              >
                <LuFilterX />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Summary Bar */}
        <div className="test-summary-bar">
          <span className="test-summary-text">
            Showing <strong>{filteredAndSortedTests.length}</strong> of{" "}
            <strong>{tests.length}</strong> diagnostic tests
            {hasActiveFilters && " (filtered)"}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className="test-summary-clear"
              onClick={resetAllFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Clinical Data Table */}
        <main className="test-table-card">
          {loading ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <p>Loading diagnostic tests...</p>
            </div>
          ) : filteredAndSortedTests.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "var(--text-muted)" }}>
                <LuFlaskConical />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)" }}>
                No Diagnostic Tests Found
              </h3>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-muted)", maxWidth: 400 }}>
                {hasActiveFilters
                  ? "No tests match your active search or category filter. Try adjusting your query."
                  : "No diagnostic tests created yet. Get started by adding your first test."}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="test-reset-btn"
                  onClick={resetAllFilters}
                  style={{ marginTop: 6 }}
                >
                  <LuFilterX /> Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="test-primary-btn"
                  onClick={() => handleOpenTestModal()}
                  style={{ marginTop: 6 }}
                >
                  <LuPlus /> Create Test
                </button>
              )}
            </div>
          ) : (
            <div className="test-table-wrap">
              <table className="test-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th
                      className="th-sortable"
                      onClick={() => handleSort("name")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Test Name</span>
                        {renderSortIcon("name")}
                      </div>
                    </th>
                    <th
                      className="th-sortable"
                      onClick={() => handleSort("category")}
                      style={{ width: 220 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Category</span>
                        {renderSortIcon("category")}
                      </div>
                    </th>
                    <th style={{ width: 110, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTests.map((t, idx) => {
                    const category = t.category || t.type || "General";
                    const badgeStyle = getBadgeStyle(category);
                    const rowIndex = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr key={t._id || idx}>
                        <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                          {rowIndex}
                        </td>
                        <td className="test-name-cell">{t.name}</td>
                        <td>
                          <span
                            className="test-category-badge"
                            style={{
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                            }}
                          >
                            {category}
                          </span>
                        </td>
                        <td>
                          <div className="test-actions-cell" style={{ justifyContent: "center" }}>
                            <button
                              type="button"
                              className="test-action-icon edit-btn"
                              title="Edit Test"
                              aria-label={`Edit ${t.name}`}
                              onClick={() => handleOpenTestModal(t)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="test-action-icon delete-btn"
                              title="Delete Test"
                              aria-label={`Delete ${t.name}`}
                              onClick={() => handleDeleteTest(t._id, t.name)}
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
          )}
        </main>

        {/* Unified Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: 8 }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

      {/* Test Add / Edit Modal */}
      {showTestModal && (
        <div className="test-modal-overlay" onClick={handleCloseTestModal}>
          <div
            className="test-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingTestId ? "Edit Diagnostic Test" : "Create Diagnostic Tests"}</h2>
              <button
                className="close-btn"
                onClick={handleCloseTestModal}
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleTestSubmit} className="protocol-drawer-form">
                {editingTestId ? (
                  <>
                    <div className="protocol-form-group">
                      <label className="protocol-form-label">
                        Test Name *
                      </label>
                      <input
                        type="text"
                        value={editingTestName}
                        onChange={(e) => setEditingTestName(e.target.value)}
                        placeholder="e.g. Complete Blood Count (CBC)"
                        required
                        className="protocol-form-input"
                      />
                    </div>
                    <div className="protocol-form-group">
                      <label className="protocol-form-label">
                        Category / Specialty
                      </label>
                      <select
                        value={editingTestCategory}
                        onChange={(e) => setEditingTestCategory(e.target.value)}
                        className="protocol-form-input"
                      >
                        {STANDARD_TEST_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Add one or more diagnostic tests simultaneously:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {testRows.map((row, idx) => (
                        <div key={idx} className="test-multi-row-card">
                          <input
                            type="text"
                            placeholder="Test Name (e.g. X-Ray Chest PA)"
                            value={row.name}
                            onChange={(e) => updateTestRow(idx, "name", e.target.value)}
                            className="protocol-row-input"
                            style={{ flex: 2.2, minWidth: 160 }}
                          />
                          <select
                            value={row.category}
                            onChange={(e) => updateTestRow(idx, "category", e.target.value)}
                            className="protocol-row-input"
                            style={{ flex: 1.5, minWidth: 140 }}
                          >
                            {STANDARD_TEST_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          {testRows.length > 1 && (
                            <button
                              type="button"
                              className="protocol-row-delete-btn"
                              title="Remove Row"
                              aria-label="Remove test row"
                              onClick={() => removeTestRow(idx)}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="protocol-btn-add-row"
                        onClick={addTestRow}
                        style={{ marginTop: 4 }}
                      >
                        + Add Another Test Row
                      </button>
                    </div>
                  </>
                )}

                <div className="protocol-drawer-actions">
                  <button
                    type="button"
                    className="protocol-btn-clear"
                    onClick={handleCloseTestModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="protocol-btn-submit"
                  >
                    {submitting
                      ? "Saving..."
                      : editingTestId
                      ? "Update Test"
                      : "Create Test(s)"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
