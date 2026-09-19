import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import { FaSearch, FaEye, FaEdit, FaFlask, FaLayerGroup, FaPlus, FaTimes } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import { LuFilterX } from "react-icons/lu";
import Toolbar from "./Toolbar";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { playSaveSound, playDeleteSound, playLoadSound } from "../utils/soundUtils";
import "./TestManagement.css";

const STANDARD_TEST_TYPES = [
  "All",
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

const STANDARD_TEMPLATE_CATEGORIES = [
  "All",
  "General Health",
  "Infectious Disease",
  "Endocrinology",
  "Orthopedics",
  "Cardiology",
  "Pre-Op Panel",
  "Gastroenterology",
  "Routine Profile",
];

const emptyTestForm = {
  name: "",
  type: "Blood Test",
  precautions: "",
  department: "",
  description: "",
  normalRange: "",
  price: "",
};

const emptyTemplateForm = {
  name: "",
  tests: [{ testName: "" }],
};

const TestManagement = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  // Tab State: 'tests' or 'templates'
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("test_mgmt_tab") || "tests");

  // Tests State
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testSearch, setTestSearch] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("All");
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [editingTestName, setEditingTestName] = useState("");
  const [testNames, setTestNames] = useState([""]);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("All");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);

  // View Details Modal State
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingType, setViewingType] = useState(null); // 'test' or 'template'

  // Submitting loader
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("test_mgmt_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchTests();
    fetchTemplates();
  }, []);

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

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const { data } = await api.get("/api/v1/test/templates/all");
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("Failed to fetch test templates", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // ==================== TEST CRUD HANDLERS ====================

  const handleOpenTestModal = (test = null) => {
    if (test) {
      setEditingTestId(test._id);
      setEditingTestName(test.name || "");
    } else {
      setEditingTestId(null);
      setEditingTestName("");
      setTestNames([""]);
    }
    setShowTestModal(true);
  };

  const handleCloseTestModal = () => {
    setShowTestModal(false);
    setEditingTestId(null);
    setEditingTestName("");
    setTestNames([""]);
  };

  const handleAddMoreTestName = () => {
    setTestNames((prev) => [...prev, ""]);
  };

  const handleRemoveTestName = (idx) => {
    setTestNames((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTestNameChange = (idx, value) => {
    setTestNames((prev) => prev.map((n, i) => (i === idx ? value : n)));
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
        await api.put(`/api/v1/test/${editingTestId}`, { name: editingTestName.trim() });
        playSaveSound();
        snackbar.success("Diagnostic test updated successfully!");
      } else {
        const validNames = testNames.map((n) => n.trim()).filter(Boolean);
        if (validNames.length === 0) {
          snackbar.error("Please enter at least one test name");
          setSubmitting(false);
          return;
        }
        await api.post("/api/v1/test", { names: validNames });
        playSaveSound();
        snackbar.success(
          validNames.length === 1
            ? "Diagnostic test created successfully!"
            : `${validNames.length} diagnostic tests created successfully!`
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

  // ==================== TEMPLATE CRUD HANDLERS ====================

  const handleOpenTemplateModal = (template = null) => {
    if (template) {
      setEditingTemplateId(template._id);
      setTemplateForm({
        name: template.name || "",
        tests:
          Array.isArray(template.tests) && template.tests.length > 0
            ? template.tests.map((t) => ({
                testName: typeof t === "string" ? t : t.testName || t.name || "",
              }))
            : [{ testName: "" }],
      });
    } else {
      setEditingTemplateId(null);
      setTemplateForm(emptyTemplateForm);
    }
    setShowTemplateModal(true);
  };

  const handleCloseTemplateModal = () => {
    setShowTemplateModal(false);
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
  };

  const handleAddTemplateTestRow = () => {
    setTemplateForm((prev) => ({
      ...prev,
      tests: [...prev.tests, { testName: "" }],
    }));
  };

  const handleRemoveTemplateTestRow = (idx) => {
    setTemplateForm((prev) => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== idx),
    }));
  };

  const handleTemplateTestNameChange = (idx, value) => {
    setTemplateForm((prev) => ({
      ...prev,
      tests: prev.tests.map((t, i) => (i === idx ? { ...t, testName: value } : t)),
    }));
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    if (!templateForm.name.trim()) {
      snackbar.error("Please enter a template name");
      return;
    }
    const cleanTests = (templateForm.tests || [])
      .map((t) => (typeof t === "string" ? t.trim() : (t.testName || "").trim()))
      .filter(Boolean);

    if (cleanTests.length === 0) {
      snackbar.error("Please add at least one test to the template");
      return;
    }

    const payload = {
      name: templateForm.name.trim(),
      tests: cleanTests.map((testName) => ({ testName })),
    };

    setSubmitting(true);
    try {
      if (editingTemplateId) {
        await api.put(`/api/v1/test/templates/${editingTemplateId}`, payload);
        playSaveSound();
        snackbar.success("Test template updated successfully!");
      } else {
        await api.post("/api/v1/test/templates", payload);
        playSaveSound();
        snackbar.success("Test template created successfully!");
      }
      handleCloseTemplateModal();
      fetchTemplates();
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await api.delete(`/api/v1/test/templates/${id}`);
      playDeleteSound();
      snackbar.success("Template deleted successfully!");
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      snackbar.error(err?.response?.data?.message || "Failed to delete template");
    }
  };

  // ==================== FILTERING & SEARCH ====================

  const filteredTests = useMemo(() => {
    return (tests || []).filter((t) => {
      const matchSearch =
        !testSearch ||
        (t.name && t.name.toLowerCase().includes(testSearch.toLowerCase())) ||
        (t.department && t.department.toLowerCase().includes(testSearch.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(testSearch.toLowerCase())) ||
        (t.precautions && t.precautions.toLowerCase().includes(testSearch.toLowerCase()));

      const matchType =
        testTypeFilter === "All" ||
        (t.type && t.type.toLowerCase() === testTypeFilter.toLowerCase());

      return matchSearch && matchType;
    });
  }, [tests, testSearch, testTypeFilter]);

  const filteredTemplates = useMemo(() => {
    return (templates || []).filter((tp) => {
      const matchSearch =
        !templateSearch ||
        (tp.name && tp.name.toLowerCase().includes(templateSearch.toLowerCase())) ||
        (tp.description && tp.description.toLowerCase().includes(templateSearch.toLowerCase())) ||
        (Array.isArray(tp.tests) &&
          tp.tests.some((t) => t.testName && t.testName.toLowerCase().includes(templateSearch.toLowerCase()))) ||
        (Array.isArray(tp.tags) &&
          tp.tags.some((tg) => tg.toLowerCase().includes(templateSearch.toLowerCase())));

      const matchCategory =
        templateCategoryFilter === "All" ||
        (tp.category && tp.category.toLowerCase() === templateCategoryFilter.toLowerCase());

      return matchSearch && matchCategory;
    });
  }, [templates, templateSearch, templateCategoryFilter]);

  // Color generator for category badges
  const getBadgeStyle = (type) => {
    if (!type) return { bg: "#f1f5f9", color: "#475569" };
    const lower = type.toLowerCase();
    if (lower.includes("blood") || lower.includes("hematology")) return { bg: "#fee2e2", color: "#b91c1c" };
    if (lower.includes("imaging") || lower.includes("radiology") || lower.includes("x-ray") || lower.includes("mri"))
      return { bg: "#e0f2fe", color: "#0369a1" };
    if (lower.includes("urine")) return { bg: "#fef3c7", color: "#b45309" };
    if (lower.includes("cardio")) return { bg: "#ffe4e6", color: "#e11d48" };
    if (lower.includes("bio") || lower.includes("pathology")) return { bg: "#f3e8ff", color: "#7e22ce" };
    if (lower.includes("infectious")) return { bg: "#ffedd5", color: "#c2410c" };
    if (lower.includes("endo") || lower.includes("diabetes")) return { bg: "#dcfce7", color: "#15803d" };
    if (lower.includes("ortho")) return { bg: "#ccfbf1", color: "#0f766e" };
    return { bg: "#f1f5f9", color: "#475569" };
  };

  return (
    <section className="page test-management-page" style={{ minHeight: "100vh" }}>
      <Toolbar>
        <div className="test-mgmt-header-box">
          {/* Header Row: Back + Title + Action Button */}
          <div className="test-mgmt-top-row">
            <div className="test-mgmt-left">
              <button
                onClick={() => navigate("/settings/medicine")}
                className="arrow-btn"
                title="Back to Medicine Catalog"
                aria-label="Back to Medicine Catalog"
              >
                <BsArrowLeft />
              </button>
              <div className="test-mgmt-title-wrap">
                <h2>Diagnostic Tests & Templates</h2>
                <span className="muted">
                  Configure individual laboratory/diagnostic tests and reusable test profiles.
                </span>
              </div>
            </div>

            <div className="test-mgmt-actions">
              <button
                className="clear-btn"
                onClick={() => navigate("/settings/medicine")}
              >
                Medicine Catalog
              </button>
              {activeTab === "tests" ? (
                <button
                  className="add-btn test-primary-btn"
                  onClick={() => handleOpenTestModal()}
                >
                  <FaPlus style={{ marginRight: "6px", fontSize: "0.85rem" }} />
                  Create Test
                </button>
              ) : (
                <button
                  className="add-btn test-primary-btn"
                  onClick={() => handleOpenTemplateModal()}
                >
                  <FaPlus style={{ marginRight: "6px", fontSize: "0.85rem" }} />
                  Create Test Template
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="test-mgmt-tabs-row">
            <button
              className={`test-tab-btn ${activeTab === "tests" ? "active" : ""}`}
              onClick={() => setActiveTab("tests")}
            >
              <FaFlask className="tab-icon" />
              <span>Diagnostic Tests</span>
              <span className="tab-badge">{tests.length}</span>
            </button>
            <button
              className={`test-tab-btn ${activeTab === "templates" ? "active" : ""}`}
              onClick={() => setActiveTab("templates")}
            >
              <FaLayerGroup className="tab-icon" />
              <span>Test Templates (Panels)</span>
              <span className="tab-badge">{templates.length}</span>
            </button>
          </div>

          {/* Search & Filters Bar */}
          <div className="test-mgmt-filter-row">
            <div className="test-search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={
                  activeTab === "tests"
                    ? "Search tests by name, category, precautions..."
                    : "Search templates by panel name, included test, tag..."
                }
                value={activeTab === "tests" ? testSearch : templateSearch}
                onChange={(e) =>
                  activeTab === "tests"
                    ? setTestSearch(e.target.value)
                    : setTemplateSearch(e.target.value)
                }
                className="search-input"
              />
            </div>

            <div className="test-filter-bar">
              {activeTab === "tests" ? (
                <div className="filter-group">
                  <label className="muted">Type</label>
                  <select
                    value={testTypeFilter}
                    onChange={(e) => setTestTypeFilter(e.target.value)}
                  >
                    {STANDARD_TEST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="filter-group">
                  <label className="muted">Category</label>
                  <select
                    value={templateCategoryFilter}
                    onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                  >
                    {STANDARD_TEMPLATE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {((activeTab === "tests" && (testSearch || testTypeFilter !== "All")) ||
                (activeTab === "templates" && (templateSearch || templateCategoryFilter !== "All"))) && (
                <button
                  className="clear-filter"
                  title="Clear Filters"
                  onClick={() => {
                    if (activeTab === "tests") {
                      setTestSearch("");
                      setTestTypeFilter("All");
                    } else {
                      setTemplateSearch("");
                      setTemplateCategoryFilter("All");
                    }
                  }}
                >
                  <LuFilterX />
                </button>
              )}
            </div>
          </div>
        </div>
      </Toolbar>

      {/* Main Content Area */}
      <main className="test-mgmt-main-content">
        {activeTab === "tests" ? (
          // ==================== TAB 1: DIAGNOSTIC TESTS ====================
          <div className="tests-list-section">
            {loadingTests ? (
              <div className="loading-state">
                <span className="loader"></span>
                <p>Loading diagnostic tests...</p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="empty-state-card">
                <FaFlask className="empty-icon" />
                <h3>No Diagnostic Tests Found</h3>
                <p className="muted">
                  {testSearch || testTypeFilter !== "All"
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
              <div className="tests-grid">
                {filteredTests.map((test) => {
                  const badge = getBadgeStyle(test.type);
                  const hasBodyContent = test.precautions || test.description;
                  return (
                    <div
                      key={test._id}
                      className="test-card"
                    >
                      <div className="test-card-top">
                        <div className="test-title-group">
                          <h3 className="test-name">{test.name}</h3>
                          {test.department && (
                            <span className="test-department muted">
                              Dept: {test.department}
                            </span>
                          )}
                        </div>
                        {test.type && (
                          <span
                            className="test-type-badge"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            {test.type}
                          </span>
                        )}
                      </div>

                      {hasBodyContent && (
                        <div className="test-card-body">
                          {test.precautions && (
                            <div className="test-info-row">
                              <span className="info-label">Precautions:</span>
                              <span className="info-value">{test.precautions}</span>
                            </div>
                          )}
                          {test.description && (
                            <p className="test-description-snippet">
                              {test.description}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="test-card-footer">
                        <div className="action-buttons">
                          <button
                            type="button"
                            title="Edit Test"
                            aria-label={`Edit ${test.name}`}
                            className="action-icon-btn edit-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTestModal(test);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            title="Delete Test"
                            aria-label={`Delete ${test.name}`}
                            className="action-icon-btn delete-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTest(test._id, test.name);
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // ==================== TAB 2: TEST TEMPLATES ====================
          <div className="templates-list-section">
            {loadingTemplates ? (
              <div className="loading-state">
                <span className="loader"></span>
                <p>Loading test templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="empty-state-card">
                <FaLayerGroup className="empty-icon" />
                <h3>No Test Templates Found</h3>
                <p className="muted">
                  {templateSearch || templateCategoryFilter !== "All"
                    ? "Try adjusting your search query or filter."
                    : "Create bundled test panels to prescribe multiple lab tests in one click."}
                </p>
                <button
                  className="add-btn test-primary-btn"
                  onClick={() => handleOpenTemplateModal()}
                  style={{ marginTop: "1rem" }}
                >
                  + Create Test Template
                </button>
              </div>
            ) : (
              <div className="templates-grid">
                {filteredTemplates.map((template) => {
                  const badge = getBadgeStyle(template.category);
                  const testCount = Array.isArray(template.tests) ? template.tests.length : 0;
                  return (
                    <div
                      key={template._id}
                      className="template-card"
                      onClick={() => {
                        setViewingItem(template);
                        setViewingType("template");
                      }}
                    >
                      <div className="template-card-header">
                        <div>
                          <h3 className="template-name">{template.name}</h3>
                          <span
                            className="template-category-badge"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            {template.category || "General Profile"}
                          </span>
                        </div>
                        <span className="template-test-count-pill">
                          {testCount} Test{testCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      {template.description && (
                        <p className="template-desc">{template.description}</p>
                      )}

                      <div className="template-tests-preview">
                        <span className="preview-heading">Included Tests:</span>
                        <div className="tests-chips-wrap">
                          {(template.tests || []).slice(0, 5).map((t, i) => (
                            <span key={i} className="test-chip">
                              {t.testName}
                            </span>
                          ))}
                          {(template.tests || []).length > 5 && (
                            <span className="test-chip more-chip">
                              +{template.tests.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="template-card-footer">
                        <div className="action-buttons">
                          <button
                            type="button"
                            title="View Template Details"
                            aria-label={`View details for ${template.name}`}
                            className="action-icon-btn view-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingItem(template);
                              setViewingType("template");
                            }}
                          >
                            <FaEye />
                          </button>
                          <button
                            type="button"
                            title="Edit Template"
                            aria-label={`Edit ${template.name}`}
                            className="action-icon-btn edit-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTemplateModal(template);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            title="Delete Template"
                            aria-label={`Delete ${template.name}`}
                            className="action-icon-btn delete-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template._id, template.name);
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================== MODAL: ADD / EDIT DIAGNOSTIC TEST ==================== */}
      {showTestModal && (
        <div className="modal-overlay" onClick={handleCloseTestModal}>
          <div className="modal-content test-modal-content simple-test-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTestId ? "Edit Diagnostic Test" : "Add New Diagnostic Test"}</h3>
              <button className="close-btn" onClick={handleCloseTestModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleTestSubmit} className="modal-body test-form">
              {editingTestId ? (
                <div className="form-row">
                  <div className="form-group full-width">
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
                </div>
              ) : (
                <div className="multi-test-create-wrapper">
                  <label className="input-label-header">Test Name *</label>
                  <div className="test-name-inputs-list">
                    {testNames.map((name, idx) => (
                      <div key={idx} className="multi-test-input-row">
                        <input
                          type="text"
                          required={idx === 0}
                          placeholder={`Enter test name (e.g. Complete Blood Count (CBC))`}
                          value={name}
                          onChange={(e) => handleTestNameChange(idx, e.target.value)}
                          autoFocus={idx === 0}
                        />
                        {testNames.length > 1 && (
                          <button
                            type="button"
                            className="action-icon-btn delete-action remove-test-row-btn"
                            title="Remove Test Row"
                            onClick={() => handleRemoveTestName(idx)}
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
                    onClick={handleAddMoreTestName}
                  >
                    <FaPlus style={{ fontSize: "0.75rem", marginRight: "4px" }} />
                    Add more
                  </button>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn secondary" onClick={handleCloseTestModal}>
                  Cancel
                </button>
                <button type="submit" className="btn add-btn test-primary-btn" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingTestId
                    ? "Update Test"
                    : testNames.filter((n) => n.trim()).length > 1
                    ? "Create Tests"
                    : "Create Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT TEST TEMPLATE ==================== */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={handleCloseTemplateModal}>
          <div className="modal-content template-modal-content simple-template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTemplateId ? "Edit Test Template" : "Create Test Template"}</h3>
              <button className="close-btn" onClick={handleCloseTemplateModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleTemplateSubmit} className="modal-body template-form">
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fever & Infection Panel"
                    value={templateForm.name}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, name: e.target.value })
                    }
                    autoFocus
                  />
                </div>
              </div>

              {/* Template Tests Builder */}
              <div className="template-builder-section">
                <div className="builder-header">
                  <h4>Included Tests in this Profile</h4>
                  <button
                    type="button"
                    className="add-btn small-btn"
                    onClick={handleAddTemplateTestRow}
                  >
                    <FaPlus style={{ marginRight: "4px", fontSize: "0.75rem" }} />
                    Add Test Row
                  </button>
                </div>

                <datalist id="available-diagnostic-tests">
                  {tests.map((test) => (
                    <option key={test._id} value={test.name} />
                  ))}
                </datalist>

                <div className="builder-rows-container">
                  {templateForm.tests.map((t, idx) => (
                    <div key={idx} className="builder-test-row simple-builder-row">
                      <div className="row-number">#{idx + 1}</div>

                      <div className="row-field test-name-field" style={{ flex: 1 }}>
                        <input
                          type="text"
                          required
                          list="available-diagnostic-tests"
                          placeholder="Enter or select test name (e.g. Complete Blood Count)"
                          value={t.testName}
                          onChange={(e) =>
                            handleTemplateTestNameChange(idx, e.target.value)
                          }
                        />
                      </div>

                      {templateForm.tests.length > 1 && (
                        <button
                          type="button"
                          className="action-icon-btn delete-action"
                          title="Remove Test Row"
                          onClick={() => handleRemoveTemplateTestRow(idx)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={handleCloseTemplateModal}
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
                    : editingTemplateId
                    ? "Update Template"
                    : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== VIEW DETAILS MODAL ==================== */}
      {viewingItem && (
        <div className="modal-overlay" onClick={() => setViewingItem(null)}>
          <div className="modal-content view-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {viewingType === "test"
                  ? viewingItem.name
                  : `${viewingItem.name} (Template)`}
              </h3>
              <button className="close-btn" onClick={() => setViewingItem(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {viewingType === "test" ? (
                <div className="test-details-sheet">
                  <div className="detail-item">
                    <span className="detail-label">Type / Category:</span>
                    <span
                      className="test-type-badge"
                      style={getBadgeStyle(viewingItem.type)}
                    >
                      {viewingItem.type || "General"}
                    </span>
                  </div>

                  {viewingItem.department && (
                    <div className="detail-item">
                      <span className="detail-label">Department:</span>
                      <span className="detail-value">{viewingItem.department}</span>
                    </div>
                  )}

                  {viewingItem.precautions && (
                    <div className="detail-item">
                      <span className="detail-label">Precautions:</span>
                      <span className="detail-value">{viewingItem.precautions}</span>
                    </div>
                  )}

                  {viewingItem.normalRange && (
                    <div className="detail-item">
                      <span className="detail-label">Normal Range:</span>
                      <span className="detail-value">{viewingItem.normalRange}</span>
                    </div>
                  )}

                  {viewingItem.description && (
                    <div className="detail-item full">
                      <span className="detail-label">Description:</span>
                      <p className="detail-desc-text">{viewingItem.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="template-details-sheet">
                  {viewingItem.category && viewingItem.category !== "General Profile" && (
                    <div className="detail-item">
                      <span className="detail-label">Category:</span>
                      <span
                        className="template-category-badge"
                        style={getBadgeStyle(viewingItem.category)}
                      >
                        {viewingItem.category}
                      </span>
                    </div>
                  )}

                  {viewingItem.description && (
                    <div className="detail-item full">
                      <span className="detail-label">Description:</span>
                      <p className="detail-desc-text">{viewingItem.description}</p>
                    </div>
                  )}

                  {viewingItem.tags && viewingItem.tags.length > 0 && (
                    <div className="detail-item full">
                      <span className="detail-label">Tags:</span>
                      <div className="tags-container">
                        {viewingItem.tags.map((tag, i) => (
                          <span key={i} className="tag tag-blue">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="detail-item full" style={{ marginTop: "0.75rem" }}>
                    <span className="detail-label">
                      Included Tests ({viewingItem.tests?.length || 0}):
                    </span>
                    <div className="template-view-tests-list">
                      {(viewingItem.tests || []).map((t, i) => (
                        <div key={i} className="template-view-test-item">
                          <span className="test-item-num">#{i + 1}</span>
                          <span className="test-item-name">{t.testName || t.name || (typeof t === "string" ? t : "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setViewingItem(null)}>
                Close
              </button>
              <button
                className="btn add-btn test-primary-btn"
                onClick={() => {
                  if (viewingType === "test") {
                    handleOpenTestModal(viewingItem);
                  } else {
                    handleOpenTemplateModal(viewingItem);
                  }
                  setViewingItem(null);
                }}
              >
                Edit Details
              </button>
            </div>
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
