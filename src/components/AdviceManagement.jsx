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
import { FaTrash, FaCommentMedical } from "react-icons/fa6";
import { LuFilterX, LuPlus } from "react-icons/lu";
import Toolbar from "./Toolbar";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  playSaveSound,
  playDeleteSound,
  playLoadSound,
} from "../utils/soundUtils";
import "./TestManagement.css";

const AdviceManagement = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  // Advices State
  const [advices, setAdvices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Sorting State
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingAdvice, setEditingAdvice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdvices();
  }, []);

  const fetchAdvices = async () => {
    setLoading(true);
    try {
      playLoadSound();
      const { data } = await api.get("/api/v1/advice");
      setAdvices(data.advices || []);
    } catch (err) {
      console.error("Failed to fetch advices", err);
      snackbar.error("Failed to load care advice");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="sort-icon inactive" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setEditingName(item.name || "");
      setEditingAdvice(item.advice || "");
    } else {
      setEditingId(null);
      setEditingName("");
      setEditingAdvice("");
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setEditingName("");
    setEditingAdvice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!editingName.trim()) {
        snackbar.error("Please enter an advice name");
        setSubmitting(false);
        return;
      }
      if (!editingAdvice.trim()) {
        snackbar.error("Please enter the advice text");
        setSubmitting(false);
        return;
      }

      if (editingId) {
        await api.put(`/api/v1/advice/${editingId}`, {
          name: editingName.trim(),
          advice: editingAdvice.trim(),
        });
        snackbar.success("Care advice updated successfully!");
      } else {
        await api.post("/api/v1/advice", {
          name: editingName.trim(),
          advice: editingAdvice.trim(),
        });
        snackbar.success("Care advice created successfully!");
      }
      playSaveSound();
      handleCloseModal();
      fetchAdvices();
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to save advice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this advice?")) return;
    try {
      await api.delete(`/api/v1/advice/${id}`);
      playDeleteSound();
      snackbar.success("Care advice deleted successfully");
      setAdvices((prev) => prev.filter((a) => a._id !== id));
    } catch (e) {
      snackbar.error(e?.response?.data?.message || "Failed to delete advice");
    }
  };

  // Filtered and Sorted Advices
  const filteredAndSortedAdvices = useMemo(() => {
    let result = [...advices];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          (a.name || "").toLowerCase().includes(q) ||
          (a.advice || "").toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      const valA = (a[sortField] || "").toString().toLowerCase();
      const valB = (b[sortField] || "").toString().toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [advices, search, sortField, sortDirection]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Pagination Computations
  const totalPages = Math.ceil(filteredAndSortedAdvices.length / pageSize) || 1;
  const paginatedAdvices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedAdvices.slice(start, start + pageSize);
  }, [filteredAndSortedAdvices, currentPage, pageSize]);

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
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
                  <h2>Care Advice</h2>
                  <span className="test-count-badge">
                    {advices.length} {advices.length === 1 ? "Advice" : "Advices"}
                  </span>
                </div>
                <span className="test-mgmt-subtitle">
                  Configure and manage clinical care advice, diet guidelines, and lifestyle instructions
                </span>
              </div>
            </div>

            <div className="test-mgmt-actions">
              <button
                className="test-primary-btn"
                onClick={() => handleOpenModal()}
                title="Create New Advice"
              >
                <LuPlus className="btn-icon" />
                Create Advice
              </button>
            </div>
          </div>

          {/* Search & Results Count Control Bar */}
          <div className="test-mgmt-filter-row">
            <div className="test-search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search advice by name or instruction text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch("")}
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="test-filter-bar">
              {search && (
                <button
                  className="test-reset-filter-btn"
                  title="Reset search"
                  onClick={() => setSearch("")}
                >
                  <LuFilterX className="btn-icon-sm" />
                  Reset
                </button>
              )}

              <div className="test-results-count">
                Showing <strong>{filteredAndSortedAdvices.length}</strong> of{" "}
                <strong>{advices.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </Toolbar>

      {/* Main Content Area */}
      <main className="test-mgmt-main-content">
        <div className="tests-list-section">
          {loading ? (
            <div className="loading-state">
              <span className="loader"></span>
              <p>Loading care advice...</p>
            </div>
          ) : filteredAndSortedAdvices.length === 0 ? (
            <div className="empty-state-card">
              <FaCommentMedical className="empty-icon" />
              <h3>No Care Advice Found</h3>
              <p className="muted">
                {search
                  ? "No advice matches your search query. Try modifying keywords or reset search."
                  : "Get started by creating your first clinical care advice template."}
              </p>
              <button
                className="add-btn test-primary-btn"
                onClick={() => handleOpenModal()}
                style={{ marginTop: "1rem" }}
              >
                + Add Care Advice
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
                        style={{ width: "240px" }}
                        title={`Sort by Advice Name (${
                          sortField === "name" && sortDirection === "asc"
                            ? "Click for Descending"
                            : "Click for Ascending"
                        })`}
                      >
                        <div className="th-sort-wrapper">
                          <span>Advice Name</span>
                          <span className="th-sort-icon-box">
                            {renderSortIcon("name")}
                          </span>
                        </div>
                      </th>
                      <th
                        className={`th-advice th-sortable ${
                          sortField === "advice" ? "sorted" : ""
                        }`}
                        onClick={() => handleSort("advice")}
                        title={`Sort by Advice Text (${
                          sortField === "advice" && sortDirection === "asc"
                            ? "Click for Descending"
                            : "Click for Ascending"
                        })`}
                      >
                        <div className="th-sort-wrapper">
                          <span>Advice Text / Instructions</span>
                          <span className="th-sort-icon-box">
                            {renderSortIcon("advice")}
                          </span>
                        </div>
                      </th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAdvices.map((adv, index) => {
                      const serialNumber =
                        (currentPage - 1) * pageSize + index + 1;
                      return (
                        <tr key={adv._id} className="test-table-row">
                          <td className="td-index">{serialNumber}</td>
                          <td className="td-name">
                            <span className="test-table-name-text">
                              {adv.name}
                            </span>
                          </td>
                          <td className="td-advice">
                            <span
                              style={{
                                color: "#334155",
                                fontSize: "0.9rem",
                                lineHeight: "1.45",
                                display: "block",
                              }}
                            >
                              {adv.advice}
                            </span>
                          </td>
                          <td className="td-actions">
                            <div className="table-action-buttons">
                              <button
                                type="button"
                                title="Edit Advice"
                                aria-label={`Edit ${adv.name}`}
                                className="action-icon-btn edit-action"
                                onClick={() => handleOpenModal(adv)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                title="Delete Advice"
                                aria-label={`Delete ${adv.name}`}
                                className="action-icon-btn delete-action"
                                onClick={() => handleDelete(adv._id)}
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

              {/* Pagination Controls */}
              <div className="test-pagination-wrapper">
                <div className="pagination-info">
                  Showing{" "}
                  <strong>
                    {Math.min(
                      (currentPage - 1) * pageSize + 1,
                      filteredAndSortedAdvices.length,
                    )}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {Math.min(
                      currentPage * pageSize,
                      filteredAndSortedAdvices.length,
                    )}
                  </strong>{" "}
                  of <strong>{filteredAndSortedAdvices.length}</strong> advices
                </div>

                <div className="pagination-controls-group">
                  <div className="rows-per-page">
                    <label>Rows per page:</label>
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
                        <span
                          key={`ellipsis-${idx}`}
                          className="pagination-ellipsis"
                        >
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
                      ),
                    )}

                    <button
                      className="page-nav-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
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

      {/* Modal: Add / Edit Advice */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content test-modal-content"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editingId ? "Edit Care Advice" : "Add New Care Advice"}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body test-form">
              <div className="single-test-edit-fields">
                <div className="form-group">
                  <label>Advice Name / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diabetes Diet Guidelines, Fever Management"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Advice Text / Instructions *</label>
                  <textarea
                    required
                    placeholder="Detailed patient care advice, dosage notes, dietary restrictions, or precautions..."
                    value={editingAdvice}
                    onChange={(e) => setEditingAdvice(e.target.value)}
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "0.9rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontFamily: "inherit",
                      lineHeight: "1.45",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  className="test-secondary-btn"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="test-primary-btn"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Advice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdviceManagement;

