import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  playSaveSound,
  playLoadSound,
  playDeleteSound,
} from "../utils/soundUtils";
import "./TreatmentProtocols.css";
import MedicineCard from "./MedicineCard";
import MedicineDrawer from "./MedicineDrawer";
import Pagination from "./Pagination";
import {
  FaEye,
  FaEdit,
  FaSearch,
  FaPlus,
  FaTimes,
  FaStethoscope,
} from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
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

const emptyForm = {
  name: "",
  symptoms: "",
  type: "",
  route: "",
  desese_description: "",
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
  const location = useLocation();
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
  const searchRef = useRef();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusedMedicineIndex, setFocusedMedicineIndex] = useState(null);
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

  // Handle prefill protocol state passed from Prescription
  useEffect(() => {
    if (location.state?.prefillProtocol) {
      const p = location.state.prefillProtocol;
      setForm({
        name: p.name || "",
        symptoms: Array.isArray(p.symptoms)
          ? p.symptoms.join(", ")
          : p.symptoms || "",
        type: p.type || "",
        route: p.route || "",
        desese_description: p.desese_description || "",
        medicines: Array.isArray(p.medicines)
          ? p.medicines.map((m) => ({
              name: m.name || "",
              type: m.type || "",
              dose: m.dose || "",
              frequency: m.frequency || "",
              route: m.route || "",
              duration: m.duration || "",
              notes: m.notes || "",
            }))
          : [],
        testAdvice: Array.isArray(p.testAdvice)
          ? p.testAdvice.map((t) => ({
              testName: t.testName || "",
              testType: t.testType || "",
              precautions: t.precautions || "",
              testDate: t.testDate || "",
            }))
          : [],
        medication: p.medication || "",
        diet: p.diet || "",
        aliases: Array.isArray(p.aliases)
          ? p.aliases.join(", ")
          : p.aliases || "",
        tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
        followupDays: p.followupDays || "",
        followupNote: p.followupNote || "",
        dose: p.dose || "",
        frequency: p.frequency || "",
        duration: p.duration || "",
      });
      setEditingId(null);
      setDrawerOpen(true);
      snackbar.info("Pre-filled Treatment Protocol from Prescription");
      // Clear location state from browser history
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // When drawer opens and a focused medicine index exists, scroll it into view
  useEffect(() => {
    if (!drawerOpen) return;
    if (focusedMedicineIndex === null || focusedMedicineIndex === undefined)
      return;
    setTimeout(() => {
      const el =
        medicineRowRefs.current &&
        medicineRowRefs.current[focusedMedicineIndex];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el.querySelector("input, textarea");
        if (input) input.focus();
      }
    }, 120);
  }, [drawerOpen, focusedMedicineIndex]);

  useEffect(() => {
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
      setFocusedMedicineIndex(null);
      medicineRowRefs.current = {};
      setDrawerOpen(false);
      await fetchMedicines();
    } catch (err) {
      snackbar.error(
        err?.response?.data?.message || "Failed to save medical advice",
      );
    } finally {
      setSaving(false);
    }
  };

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

  const getColorForString = (str) => {
    if (!str) return "#e2e8f0";
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
    <div className="protocol-page">
      <div className="protocol-page-container">
        {/* Top Bar: Back + Title + Total Count + Primary CTA */}
        <header className="protocol-top-bar">
          <div className="protocol-top-bar-left">
            <button
              onClick={() => navigate(-1)}
              className="protocol-back-button"
              title="Back"
              aria-label="Back to previous page"
            >
              <BsArrowLeft />
            </button>
            <div className="protocol-icon-badge">
              <FaStethoscope />
            </div>
            <div className="protocol-title-group">
              <div className="protocol-title-row">
                <h1 className="protocol-main-title">Treatment Protocols</h1>
                <span className="protocol-count-pill">
                  {medicines.length} {medicines.length === 1 ? "Protocol" : "Protocols"}
                </span>
              </div>
              <p className="protocol-subtitle-text">
                Manage clinical treatment templates, lab test recommendations, and care advice
              </p>
            </div>
          </div>

          <div className="protocol-top-bar-right">
            <button
              type="button"
              className="protocol-btn-primary"
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setDrawerOpen(true);
              }}
            >
              <FaPlus />
              <span>Create Protocol</span>
            </button>
          </div>
        </header>

        {/* Control Bar: Sub-Navigation Tabs + Search & Filters */}
        <div className="protocol-control-card">
          <nav className="protocol-segmented-tabs" aria-label="Clinical Catalog Sections">
            <button
              type="button"
              className="protocol-tab-pill active"
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
              className="protocol-tab-pill"
              onClick={() => navigate("/settings/advice")}
            >
              <LuSparkles className="tab-icon" />
              <span>Care Advice</span>
            </button>
          </nav>

          <div className="protocol-filter-controls">
            {/* Search Box */}
            <div className="protocol-search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search condition, symptoms, or tags..."
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

            {/* Dropdown Filters */}
            <div className="protocol-select-group">
              <select
                className="protocol-select"
                onChange={(e) => setFilterType(e.target.value)}
                value={filterType}
                aria-label="Filter by Protocol Type"
              >
                <option value="">All Types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                className="protocol-select"
                value={filterHasTest || ""}
                onChange={(e) => setFilterHasTest(e.target.value)}
                aria-label="Filter by Lab Tests"
              >
                <option value="">All Tests</option>
                <option value="yes">With Tests</option>
                <option value="no">No Tests</option>
              </select>

              <input
                type="text"
                className="protocol-tag-input"
                placeholder="Filter tag..."
                value={filterTag || ""}
                onChange={(e) => setFilterTag(e.target.value)}
              />

              {hasActiveFilters && (
                <button
                  type="button"
                  className="protocol-reset-btn"
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

        {/* Results Summary Bar */}
        <div className="protocol-summary-bar">
          <span className="protocol-summary-text">
            Showing <strong>{filteredMedicines.length}</strong>{" "}
            {filteredMedicines.length === 1 ? "protocol" : "protocols"}
            {hasActiveFilters && " matching active filters"}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className="protocol-summary-clear"
              onClick={resetAllFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Protocol List Container */}
        <main className="protocol-card-list">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="protocol-skeleton-card">
                <div className="protocol-skeleton-bar title"></div>
                <div className="protocol-skeleton-bar sub"></div>
              </div>
            ))
          ) : filteredMedicines.length === 0 ? (
            <div className="protocol-empty-state">
              <div className="protocol-empty-icon-box">
                <LuListFilter />
              </div>
              <h3>No treatment protocols found</h3>
              <p>
                {hasActiveFilters
                  ? "No protocols match your active search or filters. Try adjusting your query or click Reset."
                  : "No clinical treatment protocols added yet. Start by creating your first standardized protocol template."}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="protocol-reset-btn"
                  onClick={resetAllFilters}
                  style={{ marginTop: 6 }}
                >
                  <LuFilterX /> Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="protocol-btn-primary"
                  onClick={() => {
                    setForm(emptyForm);
                    setEditingId(null);
                    setDrawerOpen(true);
                  }}
                  style={{ marginTop: 6 }}
                >
                  <FaPlus />
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
                  className="protocol-item-card"
                  onClick={() => setViewingAdvice(m)}
                  title="Click to view full protocol breakdown"
                >
                  <div className="protocol-card-left">
                    <div className="protocol-card-title-line">
                      <span className="protocol-card-name">{m.name || "Unnamed Protocol"}</span>
                      {hasValidType && (
                        <span
                          className="protocol-specialty-pill"
                          style={{
                            backgroundColor: getColorForString(m.type),
                          }}
                        >
                          {m.type}
                        </span>
                      )}
                    </div>
                    <p className="protocol-symptoms-line">
                      {Array.isArray(m.symptoms) && m.symptoms.length > 0
                        ? m.symptoms.slice(0, 6).join(" • ")
                        : "No specific symptoms listed"}
                    </p>
                    {Array.isArray(m.tags) && m.tags.length > 0 && (
                      <div className="protocol-tags-container">
                        {m.tags.slice(0, 4).map((tag, tIdx) => (
                          <span key={tIdx} className="protocol-tag-chip">
                            <LuTag className="tag-icon" /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="protocol-card-right">
                    {/* Medicines Stat Badge */}
                    <div
                      className={`protocol-stat-pill ${
                        medCount > 0 ? "med-badge" : "empty-badge"
                      }`}
                      title={`${medCount} medicines configured in this protocol`}
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

                    {/* Lab Tests Stat Badge */}
                    <div
                      className={`protocol-stat-pill ${
                        testCount > 0 ? "test-badge" : "empty-badge"
                      }`}
                      title={`${testCount} lab tests recommended in this protocol`}
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

                    {/* Card Actions */}
                    <div
                      className="protocol-action-group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        title="View Protocol Details"
                        aria-label={`View details for ${m.name || "protocol"}`}
                        className="protocol-action-icon view-btn"
                        onClick={() => setViewingAdvice(m)}
                      >
                        <FaEye />
                      </button>
                      <button
                        type="button"
                        title="Edit Protocol"
                        aria-label={`Edit ${m.name || "protocol"}`}
                        className="protocol-action-icon edit-btn"
                        onClick={() => handleOpenEditDrawer(m)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        title="Delete Protocol"
                        aria-label={`Delete ${m.name || "protocol"}`}
                        className="protocol-action-icon delete-btn"
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
        </main>

        {/* Unified Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: 8 }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}

        {/* Quick View Details Modal */}
        {viewingAdvice && (
          <MedicineCard
            advice={viewingAdvice}
            onClose={() => setViewingAdvice(null)}
            onEdit={handleOpenEditDrawer}
          />
        )}

        {/* Create / Edit Drawer */}
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
      </div>
    </div>
  );
};

export default MedicineSettings;
