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
import {
  LuFilterX,
  LuPlus,
  LuSparkles,
  LuLayers,
  LuPill,
  LuFlaskConical,
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

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

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
    if (!editingName.trim()) {
      snackbar.error("Please enter an advice title/name");
      return;
    }
    if (!editingAdvice.trim()) {
      snackbar.error("Please enter the advice guidance text");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/api/v1/advice/${editingId}`, {
          name: editingName.trim(),
          advice: editingAdvice.trim(),
        });
        playSaveSound();
        snackbar.success("Care advice updated successfully!");
      } else {
        await api.post("/api/v1/advice", {
          name: editingName.trim(),
          advice: editingAdvice.trim(),
        });
        playSaveSound();
        snackbar.success("Care advice created successfully!");
      }
      handleCloseModal();
      fetchAdvices();
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to save advice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/api/v1/advice/${id}`);
      playDeleteSound();
      snackbar.success("Care advice deleted successfully!");
      setAdvices((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to delete advice");
    }
  };

  // Filtered & Sorted Advices
  const filteredAndSortedAdvices = useMemo(() => {
    const filtered = (advices || []).filter((a) => {
      const matchSearch =
        !search ||
        (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
        (a.advice && a.advice.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });

    return filtered.sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortField === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      } else if (sortField === "advice") {
        valA = (a.advice || "").toLowerCase();
        valB = (b.advice || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [advices, search, sortField, sortDirection]);

  // Pagination Calculations
  const totalAdvices = filteredAndSortedAdvices.length;
  const totalPages = Math.max(1, Math.ceil(totalAdvices / pageSize));
  const paginatedAdvices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedAdvices.slice(start, start + pageSize);
  }, [filteredAndSortedAdvices, currentPage, pageSize]);

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
              <LuSparkles />
            </div>
            <div className="test-title-group">
              <div className="test-title-row">
                <h1 className="test-main-title">Care Advice</h1>
                <span className="test-count-pill">
                  {advices.length} {advices.length === 1 ? "Advice" : "Advices"}
                </span>
              </div>
              <p className="test-subtitle-text">
                Manage reusable clinical advice guidelines, dietary instructions, and lifestyle guidance
              </p>
            </div>
          </div>

          <div className="test-top-bar-right">
            <button
              type="button"
              className="test-primary-btn"
              onClick={() => handleOpenModal()}
            >
              <LuPlus />
              <span>Add Care Advice</span>
            </button>
          </div>
        </header>

        {/* Control Card: Sub-Navigation + Search */}
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
              className="protocol-tab-pill"
              onClick={() => navigate("/tests")}
            >
              <LuFlaskConical className="tab-icon" />
              <span>Lab Tests</span>
            </button>
            <button
              type="button"
              className="protocol-tab-pill active"
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
                placeholder="Search advice title or instructions..."
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

            {search && (
              <button
                type="button"
                className="test-reset-btn"
                title="Reset Search"
                onClick={() => setSearch("")}
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
            Showing <strong>{filteredAndSortedAdvices.length}</strong> of{" "}
            <strong>{advices.length}</strong> care advice guidelines
            {search && " (filtered)"}
          </span>
          {search && (
            <button
              type="button"
              className="test-summary-clear"
              onClick={() => setSearch("")}
            >
              Clear search
            </button>
          )}
        </div>

        {/* Clinical Data Table */}
        <main className="test-table-card">
          {loading ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <p>Loading care advice catalog...</p>
            </div>
          ) : filteredAndSortedAdvices.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "var(--text-muted)" }}>
                <FaCommentMedical />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)" }}>
                No Care Advice Found
              </h3>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-muted)", maxWidth: 400 }}>
                {search
                  ? "No care advice matches your search query. Try modifying your keywords or click Reset."
                  : "No care advice guidelines created yet. Start by adding your first advice template."}
              </p>
              {search ? (
                <button
                  type="button"
                  className="test-reset-btn"
                  onClick={() => setSearch("")}
                  style={{ marginTop: 6 }}
                >
                  <LuFilterX /> Reset Search
                </button>
              ) : (
                <button
                  type="button"
                  className="test-primary-btn"
                  onClick={() => handleOpenModal()}
                  style={{ marginTop: 6 }}
                >
                  <LuPlus /> Add Care Advice
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
                      style={{ width: 240 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Advice Title</span>
                        {renderSortIcon("name")}
                      </div>
                    </th>
                    <th
                      className="th-sortable"
                      onClick={() => handleSort("advice")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Clinical Guidance / Instructions</span>
                        {renderSortIcon("advice")}
                      </div>
                    </th>
                    <th style={{ width: 110, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAdvices.map((a, idx) => {
                    const rowIndex = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr key={a._id || idx}>
                        <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                          {rowIndex}
                        </td>
                        <td className="test-name-cell">{a.name}</td>
                        <td style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                          {a.advice}
                        </td>
                        <td>
                          <div className="test-actions-cell" style={{ justifyContent: "center" }}>
                            <button
                              type="button"
                              className="test-action-icon edit-btn"
                              title="Edit Advice"
                              aria-label={`Edit ${a.name}`}
                              onClick={() => handleOpenModal(a)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="test-action-icon delete-btn"
                              title="Delete Advice"
                              aria-label={`Delete ${a.name}`}
                              onClick={() => handleDelete(a._id, a.name)}
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

      {/* Advice Add / Edit Modal */}
      {showModal && (
        <div className="test-modal-overlay" onClick={handleCloseModal}>
          <div
            className="test-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingId ? "Edit Care Advice" : "Add Care Advice"}</h2>
              <button
                className="close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="protocol-drawer-form">
                <div className="protocol-form-group">
                  <label className="protocol-form-label">
                    Advice Title / Topic *
                  </label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="e.g. Diabetic Foot Care, Post-Op Knee Guidance"
                    required
                    className="protocol-form-input"
                  />
                </div>

                <div className="protocol-form-group">
                  <label className="protocol-form-label">
                    Clinical Guidance & Patient Instructions *
                  </label>
                  <textarea
                    value={editingAdvice}
                    onChange={(e) => setEditingAdvice(e.target.value)}
                    rows={5}
                    placeholder="Detailed patient instructions, dietary rules, exercise or medication precautions..."
                    required
                    className="protocol-form-textarea"
                  />
                </div>

                <div className="protocol-drawer-actions">
                  <button
                    type="button"
                    className="protocol-btn-clear"
                    onClick={handleCloseModal}
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
                      : editingId
                      ? "Update Advice"
                      : "Create Advice"}
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

export default AdviceManagement;
