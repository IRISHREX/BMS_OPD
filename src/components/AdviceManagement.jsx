import React, { useState, useEffect, useMemo } from "react";
import { BsArrowLeft } from "react-icons/bs";
import {
  FaSearch,
  FaEdit,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import { FaTrash, FaCommentMedical } from "react-icons/fa6";
import Toolbar from "./Toolbar";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import { playSaveSound, playLoadSound } from "../utils/soundUtils";
import "./TestManagement.css"; // Reuse the css styles

const AdviceManagement = () => {
  const snackbar = useSnackbar();
  const [advices, setAdvices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

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
    return sortDirection === "asc" ? <FaSortUp className="sort-icon active" /> : <FaSortDown className="sort-icon active" />;
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
        snackbar.error("Please enter a name");
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
        snackbar.success("Advice updated successfully!");
      } else {
        await api.post("/api/v1/advice", {
          name: editingName.trim(),
          advice: editingAdvice.trim()
        });
        snackbar.success("Advice created successfully!");
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
    snackbar.confirm("Are you sure you want to delete this advice?", async () => {
      try {
        await api.delete(`/api/v1/advice/${id}`);
        snackbar.success("Advice deleted");
        fetchAdvices();
      } catch (e) {
        snackbar.error("Failed to delete advice");
      }
    });
  };

  const filteredAdvices = useMemo(() => {
    let result = [...advices];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          (a.name || "").toLowerCase().includes(q) ||
          (a.advice || "").toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let valA = (a[sortField] || "").toLowerCase();
      let valB = (b[sortField] || "").toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [advices, search, sortField, sortDirection]);

  return (
    <section className="page medicine-store-layout" style={{ minHeight: "100vh" }}>
      <Toolbar title="Manage Advice">
        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          title="Add New Advice"
        >
          <FaPlus /> Add
        </button>
      </Toolbar>

      <div className="store-content">
        <div className="store-filters-panel" style={{ marginBottom: "1rem" }}>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search advices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="store-loading">Loading advice...</div>
          ) : filteredAdvices.length === 0 ? (
            <div className="store-empty-state">
              <FaCommentMedical className="empty-icon" />
              <h3>No Advice Found</h3>
              <p>Try adjusting your search</p>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSearch("");
                }}
                title="Clear Filters"
              >
                Clear
              </button>
            </div>
          ) : (
            <table className="store-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                    Name {renderSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("advice")} style={{ cursor: "pointer" }}>
                    Advice Text {renderSortIcon("advice")}
                  </th>
                  <th className="action-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdvices.map((adv) => (
                  <tr key={adv._id}>
                    <td>{adv.name}</td>
                    <td className="description-cell">{adv.advice}</td>
                    <td className="action-cells">
                      <button
                        className="icon-btn edit-btn"
                        onClick={() => handleOpenModal(adv)}
                        title="Edit Advice"
                        style={{ color: "#16a34a" }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        onClick={() => handleDelete(adv._id)}
                        title="Delete Advice"
                        style={{ color: "#dc2626" }}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="store-modal-overlay">
          <div className="store-modal-content" style={{ maxWidth: 500 }}>
            <div className="store-modal-header">
              <h3>{editingId ? "Edit Advice" : "Add New Advice"}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="store-modal-body">
              <div className="store-form-row">
                <div className="store-form-group">
                  <label>Advice Name</label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="e.g. Diabetes Diet"
                    autoFocus
                  />
                </div>
              </div>
              <div className="store-form-row">
                <div className="store-form-group">
                  <label>Advice Text</label>
                  <textarea
                    value={editingAdvice}
                    onChange={(e) => setEditingAdvice(e.target.value)}
                    placeholder="Detailed advice..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="store-modal-footer" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Advice"}
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
