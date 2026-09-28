import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
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
  LuLayers,
  LuPill,
  LuFlaskConical,
  LuSparkles,
} from "react-icons/lu";
import { useSnackbar } from "../context/SnackbarContext";
import {
  fetchMedicinesRequest,
  addMedicineRequest,
  addMedicinesRequest,
  updateMedicineRequest,
  deleteMedicineRequest,
} from "../store/medicineSlice";
import MedicineForm from "./MedicineForm";
import BulkMedicineForm from "./BulkMedicineForm";
import Pagination from "./Pagination";
import "./MedicineStore.css";

const STANDARD_MEDICINE_TYPES = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Ointment",
  "Drops",
  "Inhaler",
  "Suspension",
  "Cream",
  "Powder",
  "Lotion",
  "Gel",
];

const MedicineStore = () => {
  const snackbar = useSnackbar();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const medicines = useSelector((state) => state.medicines.medicines) || [];
  const loading = useSelector((state) => state.medicines.loading);

  // Search state
  const [searchTerm, setSearchTerm] = useState(
    () => sessionStorage.getItem("medicines_searchTerm") || ""
  );

  // Type filter state
  const [typeFilter, setTypeFilter] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState(null);

  useEffect(() => {
    sessionStorage.setItem("medicines_searchTerm", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(fetchMedicinesRequest({ name: searchTerm }));
  }, [dispatch, searchTerm]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, pageSize]);

  // Available dosage types
  const availableTypes = useMemo(() => {
    const set = new Set(STANDARD_MEDICINE_TYPES);
    medicines.forEach((m) => {
      if (m.type && typeof m.type === "string" && m.type.trim()) {
        set.add(m.type.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [medicines]);

  // Sorting Handler
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

  // Filtered & Sorted List
  const filteredAndSortedMedicines = useMemo(() => {
    let list = [...(medicines || [])];

    if (typeFilter) {
      const target = typeFilter.toLowerCase();
      list = list.filter(
        (m) => m.type && typeof m.type === "string" && m.type.toLowerCase() === target
      );
    }

    return list.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortField === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      } else if (sortField === "composition") {
        const compA = Array.isArray(a.composition)
          ? a.composition.join(" ")
          : a.composition || "";
        const compB = Array.isArray(b.composition)
          ? b.composition.join(" ")
          : b.composition || "";
        valA = compA.toLowerCase();
        valB = compB.toLowerCase();
      } else if (sortField === "type") {
        valA = (a.type || "").toLowerCase();
        valB = (b.type || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [medicines, typeFilter, sortField, sortDirection]);

  // Pagination calculations
  const totalMedicines = filteredAndSortedMedicines.length;
  const totalPages = Math.max(1, Math.ceil(totalMedicines / pageSize));
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedMedicines.slice(start, start + pageSize);
  }, [filteredAndSortedMedicines, currentPage, pageSize]);

  const hasActiveFilters = Boolean(searchTerm || typeFilter);

  const resetAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
  };

  // Badge color generator for medicine type/form
  const getMedicineTypeBadge = (type) => {
    if (!type) return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };
    const lower = type.toLowerCase();
    if (lower.includes("tab") || lower.includes("tablet"))
      return { bg: "rgba(3, 105, 161, 0.1)", color: "#0284c7" };
    if (lower.includes("cap") || lower.includes("capsule"))
      return { bg: "rgba(126, 34, 206, 0.1)", color: "#9333ea" };
    if (lower.includes("syr") || lower.includes("syrup") || lower.includes("susp"))
      return { bg: "rgba(180, 83, 9, 0.1)", color: "#d97706" };
    if (lower.includes("inj") || lower.includes("injection") || lower.includes("infusion"))
      return { bg: "rgba(185, 28, 28, 0.1)", color: "#ef4444" };
    if (lower.includes("oint") || lower.includes("cream") || lower.includes("gel"))
      return { bg: "rgba(21, 128, 61, 0.1)", color: "#10b981" };
    if (lower.includes("drop"))
      return { bg: "rgba(15, 118, 110, 0.1)", color: "#14b8a6" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };
  };

  // Modal Handlers
  const handleOpenModal = (medicine = null) => {
    if (medicine) {
      setIsEditing(true);
      setCurrentMedicine(medicine);
    } else {
      setIsEditing(false);
      setCurrentMedicine({
        name: "",
        composition: "",
        type: "",
        dose: "",
        frequency: "",
        route: "",
        duration: "",
        notes: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentMedicine(null);
    setIsEditing(false);
  };

  const handleOpenBulkModal = () => {
    setShowBulkModal(true);
  };

  const handleCloseBulkModal = () => {
    setShowBulkModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      dispatch(deleteMedicineRequest(id));
      snackbar.success("Medicine deleted successfully!");
    }
  };

  return (
    <div className="medicine-store-page">
      <div className="medicine-store-container">
        {/* Top Header Card */}
        <header className="medicine-top-bar">
          <div className="medicine-top-bar-left">
            <button
              onClick={() => navigate(-1)}
              className="medicine-back-btn"
              title="Back"
              aria-label="Back to previous page"
            >
              <BsArrowLeft />
            </button>
            <div className="medicine-icon-badge">
              <LuPill />
            </div>
            <div className="medicine-title-group">
              <div className="medicine-title-row">
                <h1 className="medicine-main-title">Medicine Master</h1>
                <span className="medicine-count-pill">
                  {medicines ? medicines.length : 0}{" "}
                  {medicines?.length === 1 ? "Medicine" : "Medicines"}
                </span>
              </div>
              <p className="medicine-subtitle-text">
                Manage clinical medicine catalog, dosage forms, and chemical compositions
              </p>
            </div>
          </div>

          <div className="medicine-top-bar-right">
            <button
              type="button"
              className="medicine-secondary-btn"
              onClick={handleOpenBulkModal}
              title="Import multiple medicines in bulk"
            >
              <LuLayers />
              <span>Bulk Import</span>
            </button>
            <button
              type="button"
              className="medicine-primary-btn"
              onClick={() => handleOpenModal()}
            >
              <LuPlus />
              <span>Add Medicine</span>
            </button>
          </div>
        </header>

        {/* Control Card: Sub-Navigation + Search & Filters */}
        <div className="medicine-control-card">
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
              className="protocol-tab-pill active"
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
              className="protocol-tab-pill"
              onClick={() => navigate("/settings/advice")}
            >
              <LuSparkles className="tab-icon" />
              <span>Care Advice</span>
            </button>
          </nav>

          <div className="medicine-search-filter-group">
            <div className="medicine-search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search medicine name or composition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <select
              className="medicine-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Dosage Form"
            >
              <option value="">All Dosage Forms</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="medicine-reset-btn"
                title="Reset Search & Filters"
                onClick={resetAllFilters}
              >
                <LuFilterX />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Summary Bar */}
        <div className="medicine-summary-bar">
          <span className="medicine-summary-text">
            Showing <strong>{filteredAndSortedMedicines.length}</strong> of{" "}
            <strong>{medicines ? medicines.length : 0}</strong> medicines
            {hasActiveFilters && " (filtered)"}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className="medicine-summary-clear"
              onClick={resetAllFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Clinical Data Table */}
        <main className="medicine-table-card">
          {loading ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <p>Loading medicines catalog...</p>
            </div>
          ) : filteredAndSortedMedicines.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "var(--text-muted)" }}>
                <LuPill />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)" }}>
                No Medicines Found
              </h3>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-muted)", maxWidth: 400 }}>
                {hasActiveFilters
                  ? "No medicines match your search criteria. Try adjusting your query or click Reset."
                  : "No medicines registered yet. Start by adding your first medicine."}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="medicine-reset-btn"
                  onClick={resetAllFilters}
                  style={{ marginTop: 6 }}
                >
                  <LuFilterX /> Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="medicine-primary-btn"
                  onClick={() => handleOpenModal()}
                  style={{ marginTop: 6 }}
                >
                  <LuPlus /> Add Medicine
                </button>
              )}
            </div>
          ) : (
            <div className="medicine-table-wrap">
              <table className="medicine-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th
                      className="th-sortable"
                      onClick={() => handleSort("name")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Medicine Name</span>
                        {renderSortIcon("name")}
                      </div>
                    </th>
                    <th
                      className="th-sortable"
                      onClick={() => handleSort("composition")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Composition</span>
                        {renderSortIcon("composition")}
                      </div>
                    </th>
                    <th
                      className="th-sortable"
                      onClick={() => handleSort("type")}
                      style={{ width: 160 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Dosage Form</span>
                        {renderSortIcon("type")}
                      </div>
                    </th>
                    <th style={{ width: 110, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMedicines.map((m, idx) => {
                    const typeBadge = getMedicineTypeBadge(m.type);
                    const rowIndex = (currentPage - 1) * pageSize + idx + 1;
                    const compStr = Array.isArray(m.composition)
                      ? m.composition.join(", ")
                      : m.composition || "-";

                    return (
                      <tr key={m._id || m.id || idx}>
                        <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                          {rowIndex}
                        </td>
                        <td className="medicine-name-cell">{m.name || "-"}</td>
                        <td className="medicine-comp-cell">{compStr}</td>
                        <td>
                          {m.type ? (
                            <span
                              className="medicine-form-badge"
                              style={{
                                background: typeBadge.bg,
                                color: typeBadge.color,
                              }}
                            >
                              {m.type}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                              -
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="medicine-actions-cell" style={{ justifyContent: "center" }}>
                            <button
                              type="button"
                              className="medicine-action-icon edit-btn"
                              title="Edit Medicine"
                              aria-label={`Edit ${m.name || "medicine"}`}
                              onClick={() => handleOpenModal(m)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="medicine-action-icon delete-btn"
                              title="Delete Medicine"
                              aria-label={`Delete ${m.name || "medicine"}`}
                              onClick={() => handleDelete(m._id || m.id)}
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

      {/* Single Medicine Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onRequestClose={handleCloseModal}
        contentLabel={isEditing ? "Edit Medicine" : "Add Medicine"}
        className="medicine-modal"
        overlayClassName="medicine-modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>{isEditing ? "Edit Medicine" : "Add New Medicine"}</h2>
          <button
            className="close-btn"
            onClick={handleCloseModal}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {currentMedicine && (
            <MedicineForm
              initialData={currentMedicine}
              submitLabel={isEditing ? "Update Medicine" : "Add Medicine"}
              onCancel={handleCloseModal}
              onSave={(data) => {
                if (isEditing) {
                  dispatch(
                    updateMedicineRequest({
                      id: currentMedicine._id || currentMedicine.id,
                      ...data,
                    })
                  );
                  snackbar.success("Medicine updated successfully!");
                } else {
                  dispatch(addMedicineRequest(data));
                  snackbar.success("Medicine added successfully!");
                }
                handleCloseModal();
              }}
            />
          )}
        </div>
      </Modal>

      {/* Bulk Medicine Add Modal */}
      <Modal
        isOpen={showBulkModal}
        onRequestClose={handleCloseBulkModal}
        contentLabel="Add Bulk Medicines"
        className="medicine-modal"
        overlayClassName="medicine-modal-overlay"
        ariaHideApp={false}
      >
        <div className="modal-header">
          <h2>Add Bulk Medicines</h2>
          <button
            className="close-btn"
            onClick={handleCloseBulkModal}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <BulkMedicineForm
            submitLabel="Add Medicines"
            onCancel={handleCloseBulkModal}
            onSave={(data) => {
              dispatch(addMedicinesRequest(data));
              snackbar.success("Medicines added successfully!");
              handleCloseBulkModal();
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MedicineStore;
