import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import Modal from "react-modal";
import { toast } from "react-toastify";
import {
  fetchMedicinesRequest,
  addMedicineRequest,
  updateMedicineRequest,
  deleteMedicineRequest,
} from '../store/medicineSlice';
import MedicineForm from './MedicineForm';
import { FaSearch } from "./DoctorIcons";
import './MedicineStore.css';

const MedicineStore = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState(null);
  const dispatch = useDispatch();
  const medicines = useSelector(state => state.medicines.medicines);
  const loading = useSelector(state => state.medicines.loading);

  useEffect(() => {
    dispatch(fetchMedicinesRequest({ name: searchTerm }));
  }, [dispatch, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchMedicinesRequest({ name: searchTerm }));
  };

  const handleOpenModal = (medicine = null) => {
    if (medicine) {
      setIsEditing(true);
      setCurrentMedicine(medicine);
    } else {
      setIsEditing(false);
      setCurrentMedicine({ name: '', composition: '', type: '', dose: '', frequency: '', route: '', duration: '', notes: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentMedicine(null);
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      dispatch(deleteMedicineRequest(id));
      toast.success("Medicine deleted successfully!");
    }
  };

  return (
    <section className="medicine-store-page">
      <div className="medicine-store-header">
        <h1>Medicine Store</h1>
        <p className="subtitle">Manage your medicine inventory</p>
      </div>

      <div className="search-bar-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by medicine name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn btn-search">
            Search
          </button>
          <button type="button" onClick={() => handleOpenModal()} className="btn btn-add">
            + Add Medicine
          </button>
        </form>
      </div>

      <div className="medicines-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading medicines...</p>
          </div>
        ) : medicines && medicines.length > 0 ? (
          <div className="medicines-grid">
            {medicines.map((medicine) => (
              <div key={medicine._id} className="medicine-card">
                <div className="medicine-card-header">
                  <h3 className="medicine-name">{medicine.name}</h3>
                  {medicine.price && (
                    <span className="medicine-price">₹{medicine.price}</span>
                  )}
                </div>
                
                <div className="medicine-card-body">
                  {medicine.composition && (
                    <div className="medicine-detail">
                      <span className="detail-label">Composition:</span>
                      <span className="detail-value">{medicine.composition}</span>
                    </div>
                  )}
                  
                  {medicine.description && (
                    <div className="medicine-detail">
                      <span className="detail-label">Description:</span>
                      <p className="detail-description">{medicine.description}</p>
                    </div>
                  )}
                </div>

                <div className="medicine-card-footer">
                  <button 
                    onClick={() => handleOpenModal(medicine)} 
                    className="btn btn-edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(medicine._id)} 
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2>No Medicines Found</h2>
            <p>Try adjusting your search or add a new medicine to get started</p>
            <button onClick={() => handleOpenModal()} className="btn btn-add">
              + Add Your First Medicine
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onRequestClose={handleCloseModal}
        contentLabel={isEditing ? "Edit Medicine" : "Add Medicine"}
        className="medicine-modal"
        overlayClassName="medicine-modal-overlay"
      >
        <div className="modal-header">
          <h2>{isEditing ? "Edit Medicine" : "Add New Medicine"}</h2>
          <button className="close-btn" onClick={handleCloseModal}>&times;</button>
        </div>
        <div className="modal-body">
          {currentMedicine && (
            <MedicineForm
              initialData={currentMedicine}
              submitLabel={isEditing ? 'Update Medicine' : 'Add Medicine'}
              onCancel={handleCloseModal}
              onSave={(data) => {
                if (isEditing) {
                  dispatch(updateMedicineRequest({ id: currentMedicine._id || currentMedicine.id, ...data }));
                  toast.success('Medicine updated successfully!');
                } else {
                  dispatch(addMedicineRequest(data));
                  toast.success('Medicine added successfully!');
                }
                handleCloseModal();
              }}
            />
          )}
        </div>
      </Modal>
    </section>
  );
};

export default MedicineStore;