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
import { LuFilterX, LuPlus, LuLayers, LuPill } from "react-icons/lu";
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
import Toolbar from "./Toolbar";
import "./MedicineStore.css";

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

  // Reset to page 1 when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

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

  // ==================== FILTERING & SORTING ====================
  const filteredAndSortedMedicines = useMemo(() => {
    const list = [...(medicines || [])];

    return list.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortField === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      } else if (sortField === "composition") {
        const compA = Array.isArray(a.composition)
          ? a.composition.join(", ")
          : a.composition || "";
        const compB = Array.isArray(b.composition)
          ? b.composition.join(", ")
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
  }, [medicines, sortField, sortDirection]);

  // ==================== PAGINATION CALCULATIONS ====================
  const totalMedicines = filteredAndSortedMedicines.length;
  const totalPages = Math.max(1, Math.ceil(totalMedicines / pageSize));
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedMedicines.slice(start, start + pageSize);
  }, [filteredAndSortedMedicines, currentPage, pageSize]);

  const startIndex =
    totalMedicines === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalMedicines);

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

  // Badge color generator for medicine type/form
  const getMedicineTypeBadge = (type) => {
    if (!type) return { bg: "#f1f5f9", color: "#475569" };
    const lower = type.toLowerCase();
    if (lower.includes("tab") || lower.includes("tablet"))
      return { bg: "#e0f2fe", color: "#0369a1" };
    if (lower.includes("cap") || lower.includes("capsule"))
      return { bg: "#f3e8ff", color: "#7e22ce" };
    if (lower.includes("syr") || lower.includes("syrup") || lower.includes("susp"))
      return { bg: "#fef3c7", color: "#b45309" };
    if (lower.includes("inj") || lower.includes("injection") || lower.includes("infusion"))
      return { bg: "#fee2e2", color: "#b91c1c" };
    if (lower.includes("oint") || lower.includes("cream") || lower.includes("gel"))
      return { bg: "#dcfce7", color: "#15803d" };
    if (lower.includes("drop"))
      return { bg: "#ccfbf1", color: "#0f766e" };
    return { bg: "#f1f5f9", color: "#475569" };
  };

  // ==================== MODAL HANDLERS ====================
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
    <section className="page medicine-store-page" style={{ minHeight: "100vh" }}>
      <Toolbar>
        <div className="medicine-store-header-box">
          {/* Header Row: Back + Title with Counter + Actions */}
          <div className="medicine-store-top-row">
            <div className="medicine-store-left">
              <button
                onClick={() => navigate(-1)}
                className="medicine-back-btn"
                title="Back"
                aria-label="Back to previous page"
              >
                <BsArrowLeft />
              </button>
              <div className="medicine-store-title-wrap">
                <div className="medicine-title-line">
                  <h2>Medicine Master</h2>
                  <span className="medicine-count-badge">
                    {medicines ? medicines.length : 0}{" "}
                    {medicines?.length === 1 ? "Medicine" : "Medicines"}
                  </span>
                </div>
                <span className="medicine-store-subtitle">
                  Manage clinical medicine inventory, dosage forms, and generic compositions
                </span>
              </div>
            </div>

            <div className="medicine-store-actions">
              <button
                type="button"
                className="medicine-secondary-btn"
                onClick={handleOpenBulkModal}
                title="Import multiple medicines in bulk"
              >
                <LuLayers className="bulk-btn-icon" />
                Bulk Import
              </button>
              <button
                type="button"
                className="medicine-primary-btn"
                onClick={() => handleOpenModal()}
              >
                <LuPlus className="btn-icon" />
                Add Medicine
              </button>
            </div>
          </div>

          {/* Search & Filters Unified Control Bar */}
          <div className="medicine-store-filter-row">
            <div className="medicine-search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by medicine name or composition..."
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

            <div className="medicine-filter-bar">
              {searchTerm && (
                <button
                  className="medicine-reset-filter-btn"
                  title="Reset Search"
                  onClick={() => setSearchTerm("")}
                >
                  <LuFilterX className="btn-icon-sm" />
                  Reset
                </button>
              )}

              <div className="medicine-results-count">
                Showing <strong>{filteredAndSortedMedicines.length}</strong> of{" "}
                <strong>{medicines ? medicines.length : 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </Toolbar>

      {/* Main Content Area */}
      <main className="medicine-store-main-content">
        <div className="medicines-list-section">
          {loading ? (
            <div className="loading-state">
              <span className="loader"></span>
              <p>Loading medicines...</p>
            </div>
          ) : filteredAndSortedMedicines.length === 0 ? (
            <div className="empty-state-card">
              <LuPill className="empty-icon" />
              <h3>No Medicines Found</h3>
              <p className="muted">
                {searchTerm
                  ? "Try adjusting your search query."
                  : "Get started by adding your first medicine or importing in bulk."}
              </p>
              <button
                className="medicine-primary-btn"
                onClick={() => handleOpenModal()}
                style={{ marginTop: "1rem" }}
              >
                <LuPlus className="btn-icon" />
                Add Medicine
              </button>
            </div>
          ) : (
            <>
              {/* Table View */}
              <div className="medicine-table-container">
                <table className="medicine-table">
                  <thead>
                    <tr>
                      <th className="th-index">#</th>
                      <th
                        className={`th-name th-sortable ${
                          sortField === "name" ? "sorted" : ""
                        }`}
                        onClick={() => handleSort("name")}
                        title={`Sort by Medicine Name (${
                          sortField === "name" && sortDirection === "asc"
                            ? "Click for Descending"
                            : "Click for Ascending"
                        })`}
                      >
                        <div className="th-sort-wrapper">
                          <span>Medicine Name</span>
                          <span className="th-sort-icon-box">
                            {renderSortIcon("name")}
                          </span>
                        </div>
                      </th>
                      <th
                        className={`th-composition th-sortable ${
                          sortField === "composition" ? "sorted" : ""
                        }`}
                        onClick={() => handleSort("composition")}
                        title={`Sort by Composition (${
                          sortField === "composition" && sortDirection === "asc"
                            ? "Click for Descending"
                            : "Click for Ascending"
                        })`}
                      >
                        <div className="th-sort-wrapper">
                          <span>Composition</span>
                          <span className="th-sort-icon-box">
                            {renderSortIcon("composition")}
                          </span>
                        </div>
                      </th>
                      <th
                        className={`th-type th-sortable ${
                          sortField === "type" ? "sorted" : ""
                        }`}
                        onClick={() => handleSort("type")}
                        title={`Sort by Type (${
                          sortField === "type" && sortDirection === "asc"
                            ? "Click for Descending"
                            : "Click for Ascending"
                        })`}
                      >
                        <div className="th-sort-wrapper">
                          <span>Type / Form</span>
                          <span className="th-sort-icon-box">
                            {renderSortIcon("type")}
                          </span>
                        </div>
                      </th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMedicines.map((medicine, index) => {
                      const serialNumber =
                        (currentPage - 1) * pageSize + index + 1;
                      const compText = Array.isArray(medicine.composition)
                        ? medicine.composition.join(", ")
                        : medicine.composition || "—";
                      const typeText = medicine.type || "General";
                      const badge = getMedicineTypeBadge(typeText);

                      return (
                        <tr
                          key={medicine._id || index}
                          className="medicine-table-row"
                        >
                          <td className="td-index">{serialNumber}</td>
                          <td className="td-name">
                            <span className="medicine-table-name-text">
                              {medicine.name}
                            </span>
                          </td>
                          <td className="td-composition">
                            <span className="medicine-table-comp-text">
                              {compText}
                            </span>
                          </td>
                          <td className="td-type">
                            <span
                              className="medicine-type-badge"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {typeText}
                            </span>
                          </td>
                          <td className="td-actions">
                            <div className="table-action-buttons">
                              <button
                                type="button"
                                title="Edit Medicine"
                                aria-label={`Edit ${medicine.name}`}
                                className="action-icon-btn edit-action"
                                onClick={() => handleOpenModal(medicine)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                title="Delete Medicine"
                                aria-label={`Delete ${medicine.name}`}
                                className="action-icon-btn delete-action"
                                onClick={() => handleDelete(medicine._id)}
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
              <div className="medicine-pagination-wrapper">
                <div className="pagination-info">
                  Showing <strong>{startIndex}</strong> to{" "}
                  <strong>{endIndex}</strong> of{" "}
                  <strong>{totalMedicines}</strong> medicines
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
                      )
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

      {/* Single Medicine Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onRequestClose={handleCloseModal}
        contentLabel={isEditing ? "Edit Medicine" : "Add Medicine"}
        className="medicine-modal"
        overlayClassName="medicine-modal-overlay"
      >
        <div className="modal-header">
          <h2>{isEditing ? "Edit Medicine" : "Add New Medicine"}</h2>
          <button className="close-btn" onClick={handleCloseModal}>
            &times;
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
      >
        <div className="modal-header">
          <h2>Add Bulk Medicines</h2>
          <button className="close-btn" onClick={handleCloseBulkModal}>
            &times;
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

      <footer className="settings-footer">
        OPD Medicine Store Management • © {new Date().getFullYear()}
      </footer>
    </section>
  );
};

export default MedicineStore;
