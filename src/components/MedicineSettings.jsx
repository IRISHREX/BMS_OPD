import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  playSaveSound,
  playLoadSound,
  playDeleteSound,
} from "../utils/soundUtils";
import "./Settings.css";
import MedicineCard from "./MedicineCard";
import MedicineSearch from "./MedicineSearch";
import {
  FaEye,
  FaEdit,
  FaSearch,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import MedicineDrawer from "./MedicineDrawer";
import Toolbar from "./Toolbar";
import {
  LuFilterX,
  LuPill,
  LuFlaskConical,
  LuLayers,
  LuSparkles,
  LuTag,
  LuListFilter,
} from "react-icons/lu";
import { BsArrowLeft } from "react-icons/bs";

// Standard clinical & form types
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
  "Antibiotic",
  "Analgesic",
  "Antacid",
  "Antipyretic",
  "Antidiabetic",
  "Antihistamine",
  "Cardiovascular",
  "Dermatological",
  "General",
];

// MedicineStore moved to its own page at /medicines

const emptyForm = {
  name: "",
  symptoms: "",
  type: "",
  route: "",
  desese_description: "",
  // nested structured fields
  medicines: [], // { name,type,dose,frequency,route,duration,notes }
  testAdvice: [], // { testName,testType,precautions,testDate }
  medication: "",
  diet: "",
  aliases: "",
  tags: "",
  followupDays: "",
  followupNote: "",
  dose: "",
  frequency: "",
  duration: "",
};

const MedicineSettings = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const [medicines, setMedicines] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  // `MedicineStore` is now a separate page at `/medicines`.
  const searchRef = useRef();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusedMedicineIndex, setFocusedMedicineIndex] = useState(null);
  const drawerContentRef = useRef();
  const medicineRowRefs = useRef({});
  const [filterType, setFilterType] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterHasTest, setFilterHasTest] = useState("");
  const [viewingAdvice, setViewingAdvice] = useState(null);

  const availableTypes = useMemo(() => {
    const dynamicTypes = new Set();
    (medicines || []).forEach((m) => {
      if (m.type && typeof m.type === "string" && m.type.trim()) {
        dynamicTypes.add(m.type.trim());
      }
      if (Array.isArray(m.medicines)) {
        m.medicines.forEach((med) => {
          if (med.type && typeof med.type === "string" && med.type.trim()) {
            dynamicTypes.add(med.type.trim());
          }
        });
      }
    });
    const combined = Array.from(
      new Set([...STANDARD_MEDICINE_TYPES, ...dynamicTypes]),
    );
    return combined.sort((a, b) => a.localeCompare(b));
  }, [medicines]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  // When drawer opens and a focused medicine index exists, scroll it into view
  useEffect(() => {
    if (!drawerOpen) return;
    if (focusedMedicineIndex === null || focusedMedicineIndex === undefined)
      return;
    // small timeout to wait for drawer mount/render
    setTimeout(() => {
      const el =
        medicineRowRefs.current &&
        medicineRowRefs.current[focusedMedicineIndex];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // try focusing first input inside the row
        const input = el.querySelector("input, textarea");
        if (input) input.focus();
      }
    }, 120);
  }, [drawerOpen, focusedMedicineIndex]);

  useEffect(() => {
    // debounce search
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      if (!search) fetchMedicines();
      else searchMedicines(search);
    }, 400);
    return () => clearTimeout(searchRef.current);
  }, [search]);

  const fetchMedicines = async () => {
    setLoading(true);
    setError("");
    try {
      playLoadSound();
      const { data } = await api.get(`/api/v1/medical/`, {
        params: { page, limit: 10 },
      });
      setMedicines(data.advices || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const searchMedicines = async (q) => {
    setLoading(true);
    try {
      playLoadSound();
      const { data } = await api.get(`/api/v1/medical/search`, {
        params: { q, page: 1, limit: 10 },
      });
      setMedicines(data.advices || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      // if backend returns 404 for no results, clear list
      if (e.response && e.response.status === 404) setMedicines([]);
      else setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = async (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    setLoading(true);
    setError("");
    try {
      const params = { page: p, limit: 10 };
      if (search) params.q = search;
      const { data } = await api.get(
        search ? `/api/v1/medical/search` : `/api/v1/medical/`,
        { params },
      );

      setMedicines(data.advices || []);
      setTotalPages(data.totalPages || 1);
      playLoadSound();
    } catch (err) {
      setError("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        symptoms: form.symptoms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        type: form.type,
        route: form.route,
        desese_description: form.desese_description,
        // nested
        medicines: Array.isArray(form.medicines)
          ? form.medicines.map((m) => ({
              name: m.name || "",
              type: m.type || "",
              dose: m.dose || "",
              frequency: m.frequency || "",
              route: m.route || "",
              duration: m.duration || "",
              notes: m.notes || "",
            }))
          : [],
        testAdvice: Array.isArray(form.testAdvice)
          ? form.testAdvice.map((t) => ({
              testName: t.testName || "",
              testType: t.testType || "",
              precautions: t.precautions || "",
              testDate: t.testDate || "",
            }))
          : [],
        medication: form.medication || "",
        diet: form.diet || "",
        aliases: form.aliases
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tags: form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        followup: {
          days: form.followupDays ? parseInt(form.followupDays, 10) : undefined,
          note: form.followupNote || "",
        },
        dose: form.dose || "",
        frequency: form.frequency || "",
        duration: form.duration || "",
      };
      if (editingId) {
        await api.put(`/api/v1/medical/${editingId}`, payload);
        playSaveSound();
        snackbar.success("Medical advice updated successfully!");
      } else {
        await api.post(`/api/v1/medical/`, payload);
        playSaveSound();
        snackbar.success("Medical advice created successfully!");
      }
      setForm(emptyForm);
      setEditingId(null);
      // clear focused medicine selection and refs after save
      setFocusedMedicineIndex(null);
      medicineRowRefs.current = {};
      await fetchMedicines();
    } catch (err) {
      snackbar.error(
        err?.response?.data?.message || "Failed to save medical advice",
      );
    } finally {
      setSaving(false);
    }
  };

  // Nested handlers for medicines
  const addMedicineRow = () =>
    setForm((prev) => ({
      ...prev,
      medicines: [
        ...(prev.medicines || []),
        {
          name: "",
          type: "",
          dose: "",
          frequency: "",
          route: "",
          duration: "",
          notes: "",
        },
      ],
    }));
  const updateMedicineRow = (idx, field, value) =>
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m, i) =>
        i === idx ? { ...m, [field]: value } : m,
      ),
    }));
  const removeMedicineRow = (idx) =>
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== idx),
    }));

  // Nested handlers for testAdvice
  const addTestRow = () =>
    setForm((prev) => ({
      ...prev,
      testAdvice: [
        ...(prev.testAdvice || []),
        { testName: "", testType: "", precautions: "", testDate: "" },
      ],
    }));
  const updateTestRow = (idx, field, value) =>
    setForm((prev) => ({
      ...prev,
      testAdvice: prev.testAdvice.map((t, i) =>
        i === idx ? { ...t, [field]: value } : t,
      ),
    }));
  const removeTestRow = (idx) =>
    setForm((prev) => ({
      ...prev,
      testAdvice: prev.testAdvice.filter((_, i) => i !== idx),
    }));

  const handleEdit = (m) => {
    setEditingId(m._1 || m._id || m.id || null);
    setForm({
      name: m.name || "",
      symptoms: (m.symptoms || []).join(", "),
      type: m.type || "",
      route: m.route || "",
      desese_description: m.desese_description || "",
      medicines: Array.isArray(m.medicines)
        ? m.medicines.map((x) => ({ ...x }))
        : [],
      testAdvice: Array.isArray(m.testAdvice)
        ? m.testAdvice.map((x) => ({ ...x }))
        : [],
      medication: m.medication || "",
      diet: m.diet || "",
      aliases: (m.aliases || []).join(", "),
      tags: (m.tags || []).join(", "),
      followupDays: m.followup?.days ? String(m.followup.days) : "",
      followupNote: m.followup?.note || "",
      dose: m.dose || "",
      frequency: m.frequency || "",
      duration: m.duration || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open drawer and focus a specific medicine row inside form
  const handleEditMedicineRow = (medicineOwner, medIndex) => {
    // medicineOwner is the parent advice object; medIndex is the index inside its medicines array
    const id =
      medicineOwner._1 || medicineOwner._id || medicineOwner.id || null;
    handleEdit(medicineOwner);
    setFocusedMedicineIndex(medIndex);
    setDrawerOpen(true);
    // scroll/focus will be handled after drawer mounts via useEffect
  };

  const handleOpenEditDrawer = (advice) => {
    handleEdit(advice);
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this treatment protocol?")) return;
    try {
      await api.delete(`/api/v1/medical/${id}`);
      playDeleteSound();
      snackbar.success("Protocol deleted successfully.");
      setMedicines((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      snackbar.error(e?.response?.data?.message || "Failed to delete");
    }
  };

  const clearForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  // Helper to get a consistent soft color for a given string (e.g., medicine type)
  const getColorForString = (str) => {
    if (!str) return "#e2e8f0"; // slate-200 for empty
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 92%)`;
  };

  const filteredMedicines = useMemo(() => {
    return (medicines || [])
      .filter((m) => {
        if (!filterType) return true;
        const target = filterType.toLowerCase();
        const matchAdviceType =
          typeof m.type === "string" &&
          m.type.toLowerCase() === target;
        const matchMedicineType =
          Array.isArray(m.medicines) &&
          m.medicines.some(
            (med) =>
              typeof med.type === "string" &&
              med.type.toLowerCase() === target,
          );
        return matchAdviceType || matchMedicineType;
      })
      .filter(
        (m) =>
          !filterTag ||
          (m.tags || []).some((t) =>
            t.toLowerCase().includes(filterTag.toLowerCase()),
          ),
      )
      .filter((m) => {
        if (!filterHasTest) return true;
        const hasTests = Array.isArray(m.testAdvice) && m.testAdvice.length > 0;
        return filterHasTest === "yes" ? hasTests : !hasTests;
      });
  }, [medicines, filterType, filterTag, filterHasTest]);

  const hasActiveFilters = Boolean(filterType || filterTag || filterHasTest || search);

  const resetAllFilters = () => {
    setFilterTag("");
    setFilterType("");
    setFilterHasTest("");
    setSearch("");
  };

  return (
    <section className="page medicine-settings-page" style={{ minHeight: "100vh" }}>
      <>
        <Toolbar>
          <div className="protocol-header-box">
            {/* Top Row: Back + Title + Total Count + Primary CTA */}
            <div className="protocol-top-row">
              <div className="protocol-heading-group">
                <button
                  onClick={() => navigate(-1)}
                  className="protocol-back-btn"
                  title="Back"
                  aria-label="Back to previous page"
                >
                  <BsArrowLeft />
                </button>
                <div className="protocol-title-wrap">
                  <div className="protocol-title-line">
                    <h2>Treatment Protocols</h2>
                    <span className="protocol-total-badge">
                      {medicines.length} {medicines.length === 1 ? "Protocol" : "Protocols"}
                    </span>
                  </div>
                  <span className="protocol-subtitle">
                    Manage clinical treatment templates, lab test recommendations, and care advice
                  </span>
                </div>
              </div>

              <div className="protocol-primary-actions">
                <button
                  type="button"
                  className="protocol-create-btn"
                  onClick={() => {
                    setForm(emptyForm);
                    setEditingId(null);
                    setDrawerOpen(true);
                  }}
                >
                  <FaPlus className="btn-icon" />
                  <span>Create Protocol</span>
                </button>
              </div>
            </div>

            {/* Filter Row: Tabs + Search & Filters */}
            <div className="protocol-filter-row">
              <div className="protocol-nav-tabs">
                <button
                  type="button"
                  className="nav-tab-btn active"
                  onClick={() => navigate("/settings/medicine")}
                >
                  <LuLayers className="tab-icon" />
                  <span>Protocols</span>
                </button>
                <button
                  type="button"
                  className="nav-tab-btn"
                  onClick={() => navigate("/medicines")}
                >
                  <LuPill className="tab-icon" />
                  <span>Medicine Master</span>
                </button>
                <button
                  type="button"
                  className="nav-tab-btn"
                  onClick={() => navigate("/tests")}
                >
                  <LuFlaskConical className="tab-icon" />
                  <span>Lab Tests</span>
                </button>
                <button
                  type="button"
                  className="nav-tab-btn"
                  onClick={() => navigate("/settings/advice")}
                >
                  <LuSparkles className="tab-icon" />
                  <span>Care Advice</span>
                </button>
              </div>

              <div className="protocol-search-filter-group">
                <div className="protocol-search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by condition, symptoms, or tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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

                <div className="protocol-filters">
                  <select
                    className="filter-select"
                    onChange={(e) => setFilterType(e.target.value)}
                    value={filterType}
                  >
                    <option value="">All Types</option>
                    {availableTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={filterHasTest || ""}
                    onChange={(e) => setFilterHasTest(e.target.value)}
                  >
                    <option value="">All Tests</option>
                    <option value="yes">With Tests</option>
                    <option value="no">No Tests</option>
                  </select>

                  <input
                    type="text"
                    className="filter-tag-input"
                    placeholder="Filter tag..."
                    value={filterTag || ""}
                    onChange={(e) => setFilterTag(e.target.value)}
                  />

                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="clear-all-filters-btn"
                      title="Reset All Filters"
                      onClick={resetAllFilters}
                    >
                      <LuFilterX />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Toolbar>

        {/* Main content: list and pagination */}
        <main className="protocol-main-content">
          {/* Results Summary Bar */}
          <div className="protocol-results-bar">
            <span className="results-count">
              Showing <strong>{filteredMedicines.length}</strong> {filteredMedicines.length === 1 ? "protocol" : "protocols"}
              {hasActiveFilters && " matching current filters"}
            </span>
            {hasActiveFilters && (
              <button
                className="inline-reset-link"
                onClick={resetAllFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="protocol-list-container">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="protocol-card-skeleton"
                >
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-sub"></div>
                </div>
              ))
            ) : filteredMedicines.length === 0 ? (
              <div className="protocols-empty-state">
                <div className="empty-icon-wrap">
                  <LuListFilter />
                </div>
                <h3>No treatment protocols found</h3>
                <p>
                  {hasActiveFilters
                    ? "No protocols match your search criteria. Try modifying your search or reset filters."
                    : "No treatment protocols configured yet. Start by creating your first clinical template."}
                </p>
                {hasActiveFilters ? (
                  <button
                    className="protocol-reset-cta"
                    onClick={resetAllFilters}
                  >
                    <LuFilterX /> Reset Filters
                  </button>
                ) : (
                  <button
                    className="protocol-create-btn"
                    onClick={() => {
                      setForm(emptyForm);
                      setEditingId(null);
                      setDrawerOpen(true);
                    }}
                  >
                    <FaPlus className="btn-icon" />
                    <span>Create First Protocol</span>
                  </button>
                )}
              </div>
            ) : (
              filteredMedicines.map((m, idx) => {
                const medCount = (m.medicines || []).length;
                const testCount = (m.testAdvice || []).length;
                const hasValidType = m.type && m.type.trim() && m.type !== "N/A";

                return (
                  <div
                    key={m._id || idx}
                    className="protocol-card"
                    onClick={() => setViewingAdvice(m)}
                    title="Click to view full protocol details"
                  >
                    <div className="protocol-card-main">
                      <div className="protocol-card-title-row">
                        <span className="protocol-card-name">{m.name || "Unnamed Protocol"}</span>
                        {hasValidType && (
                          <span
                            className="protocol-type-chip"
                            style={{
                              backgroundColor: getColorForString(m.type),
                            }}
                          >
                            {m.type}
                          </span>
                        )}
                      </div>
                      <p className="protocol-card-symptoms">
                        {Array.isArray(m.symptoms) && m.symptoms.length > 0
                          ? m.symptoms.slice(0, 5).join(" • ")
                          : "No specific symptoms listed"}
                      </p>
                      {Array.isArray(m.tags) && m.tags.length > 0 && (
                        <div className="protocol-tags-row">
                          {m.tags.slice(0, 3).map((tag, tIdx) => (
                            <span key={tIdx} className="protocol-tag-badge">
                              <LuTag className="tag-badge-icon" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="protocol-card-stats">
                      {/* Medicine Count Chip */}
                      <div
                        className={`protocol-stat-badge ${
                          medCount > 0 ? "has-data med-badge" : "empty-badge"
                        }`}
                        title={`${medCount} medicines configured`}
                      >
                        <LuPill className="stat-icon" />
                        <span>
                          {medCount === 1
                            ? "1 Medicine"
                            : medCount > 1
                            ? `${medCount} Medicines`
                            : "No Medicines"}
                        </span>
                      </div>

                      {/* Lab Test Count Chip */}
                      <div
                        className={`protocol-stat-badge ${
                          testCount > 0 ? "has-data test-badge" : "empty-badge"
                        }`}
                        title={`${testCount} lab tests configured`}
                      >
                        <LuFlaskConical className="stat-icon" />
                        <span>
                          {testCount === 1
                            ? "1 Lab Test"
                            : testCount > 1
                            ? `${testCount} Lab Tests`
                            : "No Tests"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div
                        className="protocol-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          title="Quick View Details"
                          aria-label={`View details for ${m.name || "protocol"}`}
                          className="action-icon-btn view-action"
                          onClick={() => setViewingAdvice(m)}
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          title="Edit Protocol"
                          aria-label={`Edit ${m.name || "protocol"}`}
                          className="action-icon-btn edit-action"
                          onClick={() => handleOpenEditDrawer(m)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          title="Delete Protocol"
                          aria-label={`Delete ${m.name || "protocol"}`}
                          className="action-icon-btn delete-action"
                          onClick={() => handleDelete(m._id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 16, marginBottom: 24 }}>
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                Prev
              </button>
              {Array.from({ length: totalPages })
                .slice(0, 7)
                .map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      className={p === page ? "active" : ""}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
              <button
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </button>
            </div>
            <div className="footer-note">
              Showing page {page} of {totalPages}
            </div>
          </div>
        </main>
        {/* </div> */}

        {/* View Details Modal */}
        {viewingAdvice && (
          <MedicineCard
            advice={viewingAdvice}
            onClose={() => setViewingAdvice(null)}
            onEdit={handleOpenEditDrawer}
          />
        )}
        {/* Drawer for create/edit (moved to separate component) */}
        {drawerOpen && (
          <MedicineDrawer
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            saving={saving}
            editingId={editingId}
            error={error}
            addMedicineRow={addMedicineRow}
            updateMedicineRow={updateMedicineRow}
            removeMedicineRow={removeMedicineRow}
            addTestRow={addTestRow}
            updateTestRow={updateTestRow}
            removeTestRow={removeTestRow}
            clearForm={clearForm}
            onClose={() => {
              setDrawerOpen(false);
              setForm(emptyForm);
              setEditingId(null);
              setFocusedMedicineIndex(null);
              medicineRowRefs.current = {};
            }}
            medicineRowRefs={medicineRowRefs}
            focusedMedicineIndex={focusedMedicineIndex}
            addSelectedMedicine={(medicine) =>
              setForm((prev) => ({
                ...prev,
                medicines: [
                  ...(prev.medicines || []),
                  { ...medicine, selected: true },
                ],
              }))
            }
          />
        )}
        <footer className="settings-footer">
          OPD Dashboard • © {new Date().getFullYear()}
        </footer>
      </>
    </section>
  );
};

export default MedicineSettings;
