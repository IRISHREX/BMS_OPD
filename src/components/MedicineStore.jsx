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

  const handleSave = () => {
    if (isEditing) {
      dispatch(updateMedicineRequest(currentMedicine));
      toast.success("Medicine updated successfully!");
    } else {
      dispatch(addMedicineRequest(currentMedicine));
      toast.success("Medicine added successfully!");
    }
    handleCloseModal();
  };
  
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      dispatch(deleteMedicineRequest(id));
      toast.success("Medicine deleted successfully!");
    }
  };

  return (
    <section className="page">
      <h1>Medicine Store</h1>
      <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', width: '250px' }}
        />
        <button type="submit" style={{ background: '#271776ca', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaSearch /> Search
        </button>
        <button type="button" onClick={() => handleOpenModal()} style={{ background: '#271776ca', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem' }}>
          Add Medicine
        </button>
      </form>
      <div className="banner">
        {loading ? (
          <p>Loading...</p>
        ) : medicines && medicines.length > 0 ? (
          medicines.map((medicine) => (
            <div key={medicine._id} className="card">
              <h3>{medicine.name}</h3>
              <p><strong>Composition:</strong> {medicine.composition}</p>
              <p><strong>Price:</strong> {medicine.price}</p>
              <p><strong>Description:</strong> {medicine.description}</p>
              <button onClick={() => handleOpenModal(medicine)}>Edit</button>
              <button onClick={() => handleDelete(medicine._id)}>Delete</button>
            </div>
          ))
        ) : (
          <h1>No Medicines Found!</h1>
        )}
      </div>
      <Modal
        isOpen={showModal}
        onRequestClose={handleCloseModal}
        contentLabel={isEditing ? "Edit Medicine" : "Add Medicine"}
        style={{ overlay: { zIndex: 1000 }, content: { maxWidth: '500px', margin: 'auto', borderRadius: '12px', padding: '2rem' } }}
      >
        <h2>{isEditing ? "Edit Medicine" : "Add Medicine"}</h2>
          {currentMedicine && (
            // Use the reusable MedicineForm component for a professional add/edit form
            <MedicineForm
              initialData={currentMedicine}
              submitLabel={isEditing ? 'Update' : 'Add'}
              onCancel={handleCloseModal}
              onSave={(data) => {
                if (isEditing) {
                  // include id for update
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
      </Modal>
    </section>
  );
};

export default MedicineStore;