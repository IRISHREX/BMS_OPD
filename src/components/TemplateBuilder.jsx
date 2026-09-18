import React, { useState, useEffect, useContext } from "react";
import { Context } from "../main";
import api from "../utils/api";
import { useSnackbar } from "../context/SnackbarContext";
import Sidebar from "./Sidebar";
import RadialMenu from "./RadialMenu";
import { MdAdd, MdDelete, MdCheck } from "react-icons/md";
import "./Settings.css";

const TemplateBuilder = () => {
  const { isAuthenticated, userDetails } = useContext(Context);
  const snackbar = useSnackbar();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "New Template",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    fontSize: 10,
    showBorder: true,
    headerHeight: 50,
    footerHeight: 15,
    layoutType: "Template 1: Right-side margin layout",
    visibility: { vitals: true, symptoms: true, diagnosis: true, advice: true },
    isDefault: false,
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/v1/template/my-templates");
      if (data.success) setTemplates(data.templates);
    } catch (error) {
      snackbar.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (tmpl) => {
    setEditingTemplate(tmpl._id);
    setFormData({
      ...tmpl,
      margins: { ...tmpl.margins },
      visibility: { ...tmpl.visibility }
    });
  };

  const handleCreateNew = () => {
    setEditingTemplate("new");
    setFormData({
      name: `Template ${templates.length + 1}`,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      fontSize: 10,
      showBorder: true,
      headerHeight: 50,
      footerHeight: 15,
      layoutType: "Template 1: Right-side margin layout",
      visibility: { vitals: true, symptoms: true, diagnosis: true, advice: true },
      isDefault: templates.length === 0,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const id = editingTemplate === "new" ? "" : editingTemplate;
      const { data } = id 
        ? await api.put(`/api/v1/template/${id}`, formData)
        : await api.post(`/api/v1/template/`, formData);
        
      if (data.success) {
        snackbar.success(data.message);
        setEditingTemplate(null);
        fetchTemplates();
      }
    } catch (error) {
      snackbar.error(error.response?.data?.message || "Failed to save template");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      const { data } = await api.delete(`/api/v1/template/${id}`);
      if (data.success) {
        snackbar.success("Template deleted");
        fetchTemplates();
      }
    } catch (error) {
      snackbar.error("Failed to delete template");
    }
  };

  return (
    <>
      <Sidebar />
      <RadialMenu />
      <section className="page settings-page">
        <div className="settings-container">
          <div className="settings-header">
            <h1>Prescription Template Builder</h1>
            <p>Customize margins and layouts for your prescriptions</p>
          </div>

          {!editingTemplate ? (
            <div className="template-list">
              <button className="add-btn" onClick={handleCreateNew} style={{marginBottom: "20px"}}>
                <MdAdd /> Create New Template
              </button>
              
              {loading ? <p>Loading templates...</p> : (
                <div className="card-grid">
                  {templates.map(tmpl => (
                    <div key={tmpl._id} className="template-card" style={{border: "1px solid #ccc", padding: "15px", borderRadius: "8px", position: "relative"}}>
                      <h3>{tmpl.name} {tmpl.isDefault && <span className="badge badge-success">Default</span>}</h3>
                      <p>Layout: {tmpl.layoutType}</p>
                      <p>Margins: {tmpl.margins?.top}T {tmpl.margins?.bottom}B {tmpl.margins?.left}L {tmpl.margins?.right}R</p>
                      
                      <div style={{marginTop: "15px", display: "flex", gap: "10px"}}>
                        <button className="btn edit-btn" onClick={() => handleEdit(tmpl)}>Edit</button>
                        <button className="btn delete-btn" onClick={() => handleDelete(tmpl._id)} style={{background: "#ff4d4f", color: "white"}}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="template-editor" style={{background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)"}}>
              <form onSubmit={handleSave}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                  <h2>{editingTemplate === "new" ? "New Template" : "Edit Template"}</h2>
                  <button type="button" className="btn" onClick={() => setEditingTemplate(null)}>Cancel</button>
                </div>

                <div className="form-group" style={{marginBottom: "15px"}}>
                  <label>Template Name</label>
                  <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>

                <div className="grid-2" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px"}}>
                  <div className="form-group">
                    <label>Top Margin (mm)</label>
                    <input type="number" className="form-control" value={formData.margins.top} onChange={e => setFormData({...formData, margins: {...formData.margins, top: Number(e.target.value)}})} />
                  </div>
                  <div className="form-group">
                    <label>Bottom Margin (mm)</label>
                    <input type="number" className="form-control" value={formData.margins.bottom} onChange={e => setFormData({...formData, margins: {...formData.margins, bottom: Number(e.target.value)}})} />
                  </div>
                  <div className="form-group">
                    <label>Left Margin (mm)</label>
                    <input type="number" className="form-control" value={formData.margins.left} onChange={e => setFormData({...formData, margins: {...formData.margins, left: Number(e.target.value)}})} />
                  </div>
                  <div className="form-group">
                    <label>Right Margin (mm)</label>
                    <input type="number" className="form-control" value={formData.margins.right} onChange={e => setFormData({...formData, margins: {...formData.margins, right: Number(e.target.value)}})} />
                  </div>
                </div>

                <div className="form-group" style={{marginBottom: "15px"}}>
                  <label>Layout Type</label>
                  <select className="form-control" value={formData.layoutType} onChange={e => setFormData({...formData, layoutType: e.target.value})}>
                    <option value="Template 1: Right-side margin layout">Template 1: Right-side margin layout</option>
                    <option value="Template 2: Left-side margin layout">Template 2: Left-side margin layout</option>
                    <option value="default">Default Layout (Single Column)</option>
                  </select>
                </div>

                <div className="form-group" style={{marginBottom: "20px"}}>
                  <label style={{display: "flex", alignItems: "center", gap: "8px"}}>
                    <input type="checkbox" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} />
                    Set as Default Template
                  </label>
                </div>

                <button type="submit" className="add-btn">Save Template</button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default TemplateBuilder;
