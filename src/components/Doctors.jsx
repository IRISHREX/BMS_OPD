import api from "../utils/api";
import Modal from "react-modal";
import React, { useContext, useEffect, useState } from "react";
import { useSnackbar } from "../context/SnackbarContext";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import { FaSearch } from "./DoctorIcons";
import UserCard from './UserCard';
import RequirePermission from "./RequirePermission";
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctorsRequest } from '../store/doctorsSlice';
import { playSaveSound, playDeleteSound } from '../utils/soundUtils';
import CapacitySchedulerForm from "./CapacitySchedulerForm";

const Doctors = () => {
  const snackbar = useSnackbar();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [updateFields, setUpdateFields] = useState({});
  const [newDocAvatar, setNewDocAvatar] = useState(null);
  const [newDocAvatarPreview, setNewDocAvatarPreview] = useState("");
  const [newSignImage, setNewSignImage] = useState(null);
  const [newSignImagePreview, setNewSignImagePreview] = useState("");
  const [newHeaderImage, setNewHeaderImage] = useState(null);
  const [newHeaderImagePreview, setNewHeaderImagePreview] = useState("");
  const { isAuthenticated } = useContext(Context);
  const dispatch = useDispatch();
  const storeDoctors = useSelector(s => s.doctors.doctors || []);
  const doctorsLoading = useSelector(s => s.doctors.loading);

  useEffect(() => {
    dispatch(fetchDoctorsRequest({ query: searchTerm }));
  }, [searchTerm, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in updateFields) {
      formData.append(key, updateFields[key]);
    }
    if (newDocAvatar) {
      formData.append("docAvatar", newDocAvatar);
    }
    if (newSignImage) {
      formData.append("signImage", newSignImage);
    }
    if (newHeaderImage) {
      formData.append("headerImage", newHeaderImage);
    }

    try {
      await api.put(`/api/v1/user/user/${selectedDoctor._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      playSaveSound();
      snackbar.success('Doctor updated');
      setShowUpdateModal(false);
      dispatch(fetchDoctorsRequest({ query: searchTerm }));
    } catch (err) {
      snackbar.error('Update failed');
    }
  };

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <section className="page doctors">
        <h1>DOCTORS</h1>
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search by name, phone, department, NIC..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', width: '250px' }}
          />
          <button type="submit" style={{ background: '#271776ca', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaSearch /> Search
          </button>
        </form>
        <div className="banner">
          {doctorsLoading ? (
            <span className="loader"></span>
          ) : storeDoctors && storeDoctors.length > 0 ? (
            storeDoctors.map((element) => (
              <UserCard
                key={element._id}
                user={element}
                extraLines={[
                  <div key="dept"><strong>Dept:</strong> {element.doctorDepartment}</div>,
                  <div key="qual"><strong>Qualifications:</strong> {element?.qualifications || 'N/A'}</div>
                ]}
                onView={(u) => {
                  setSelectedDoctor(u);
                  setShowViewModal(true);
                }}
                onEdit={(u) => {
                  setSelectedDoctor(u);
                  setUpdateFields({
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                    phone: u.phone,
                    nic: u.nic,
                    dob: u.dob ? u.dob.substring(0,10) : '',
                    gender: u.gender,
                    doctorDepartment: u.doctorDepartment,
                    consultationFee: u.consultationFee || 100,
                    qualifications: u.qualifications || ''
                  });
                  setNewDocAvatar(null);
                  setNewDocAvatarPreview("");
                  setNewSignImage(null);
                  setNewSignImagePreview("");
                  setNewHeaderImage(null);
                  setNewHeaderImagePreview("");
                  setShowUpdateModal(true);
                }}
                onDelete={(u) => {
                  snackbar.confirm('Are you sure you want to delete this doctor?', async () => {
                    try {
                      await api.delete(`/api/v1/user/user/${u._id}`);
                      playDeleteSound();
                      snackbar.success('Doctor deleted');
                      dispatch(fetchDoctorsRequest({ query: searchTerm }));
                    } catch (err) {
                      snackbar.error('Delete failed');
                    }
                  });
                }}
              />
            ))
          ) : (
            <h1>No Registered Doctors Found!</h1>
          )}
        </div>
      </section>
      <Modal
        isOpen={showUpdateModal}
        onRequestClose={() => setShowUpdateModal(false)}
        contentLabel="Update Doctor"
        style={{ overlay: { zIndex: 1000 }, content: { maxWidth: '500px', margin: 'auto', borderRadius: '12px', padding: '2rem' } }}
      >
        <h2>Update Doctor</h2>
        {selectedDoctor && (
          <form onSubmit={handleUpdateSubmit}>
            <label>First Name: <input type="text" value={updateFields.firstName} onChange={e => setUpdateFields(f => ({ ...f, firstName: e.target.value }))} /></label><br/>
            <label>Last Name: <input type="text" value={updateFields.lastName} onChange={e => setUpdateFields(f => ({ ...f, lastName: e.target.value }))} /></label><br/>
            <label>Email: <input type="email" value={updateFields.email} onChange={e => setUpdateFields(f => ({ ...f, email: e.target.value }))} /></label><br/>
            <label>Phone: <input type="text" value={updateFields.phone} onChange={e => setUpdateFields(f => ({ ...f, phone: e.target.value }))} /></label><br/>
            <label>NIC: <input type="text" value={updateFields.nic} onChange={e => setUpdateFields(f => ({ ...f, nic: e.target.value }))} /></label><br/>
            <label>DOB: <input type="date" value={updateFields.dob} onChange={e => setUpdateFields(f => ({ ...f, dob: e.target.value }))} /></label><br/>
            <label>Gender: <select value={updateFields.gender} onChange={e => setUpdateFields(f => ({ ...f, gender: e.target.value }))}><option value="Male">Male</option><option value="Female">Female</option></select></label><br/>
            <label>Department: <input type="text" value={updateFields.doctorDepartment} onChange={e => setUpdateFields(f => ({ ...f, doctorDepartment: e.target.value }))} /></label><br/>
            <label>Qualifications: <input type="text" value={updateFields.qualifications} onChange={e => setUpdateFields(f => ({ ...f, qualifications: e.target.value }))} /></label><br/>
            <label>Consultation Fee: <input type="number" value={updateFields.consultationFee} onChange={e => setUpdateFields(f => ({ ...f, consultationFee: Number(e.target.value) }))} /></label><br/>
            
            <div>
              <label>Doctor Avatar:</label>
              <input type="file" onChange={e => handleFileChange(e, setNewDocAvatar, setNewDocAvatarPreview)} />
              {newDocAvatarPreview && <img src={newDocAvatarPreview} alt="Avatar Preview" style={{ width: "100px", height: "100px" }} />}
            </div>
            <div>
              <label>Signature Image:</label>
              <input type="file" onChange={e => handleFileChange(e, setNewSignImage, setNewSignImagePreview)} />
              {newSignImagePreview && <img src={newSignImagePreview} alt="Signature Preview" style={{ width: "100px", height: "100px" }} />}
            </div>
            <div>
              <label>Header Image:</label>
              <input type="file" onChange={e => handleFileChange(e, setNewHeaderImage, setNewHeaderImagePreview)} />
              {newHeaderImagePreview && <img src={newHeaderImagePreview} alt="Header Preview" style={{ width: "100px", height: "100px" }} />}
            </div>

            <button type="submit">Update</button>
            <button type="button" onClick={() => setShowUpdateModal(false)}>Cancel</button>
          </form>
        )}
      </Modal>

      {/* View Modal with Capacity Scheduler */}
      <Modal
        isOpen={showViewModal}
        onRequestClose={() => setShowViewModal(false)}
        contentLabel="Doctor Profile"
        style={{ 
          overlay: { zIndex: 1000 }, 
          content: { 
            maxWidth: '600px', 
            margin: 'auto', 
            borderRadius: '12px', 
            padding: '2rem',
            maxHeight: '90vh',
            overflow: 'auto'
          } 
        }}
      >
        {selectedDoctor && (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              👨‍⚕️ {selectedDoctor.firstName} {selectedDoctor.lastName}
            </h2>
            
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#271776' }}>Email:</span> {selectedDoctor.email}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#271776' }}>Phone:</span> {selectedDoctor.phone}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#271776' }}>NIC:</span> {selectedDoctor.nic}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#271776' }}>Gender:</span> {selectedDoctor.gender}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#271776' }}>Department:</span> {selectedDoctor.doctorDepartment}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#271776' }}>DOB:</span> {selectedDoctor.dob ? selectedDoctor.dob.substring(0,10) : 'N/A'}
                </div>
                {selectedDoctor.consultationFee && (
                  <div>
                    <span style={{ fontWeight: 600, color: '#271776' }}>Consultation Fee:</span> Rs. {selectedDoctor.consultationFee}
                  </div>
                )}
                {selectedDoctor.qualifications && (
                  <div>
                    <span style={{ fontWeight: 600, color: '#271776' }}>Qualifications:</span> {selectedDoctor.qualifications}
                  </div>
                )}
              </div>
            </div>

            {/* Capacity Scheduler Form for Admin */}
            <RequirePermission allowedRoles={["Admin"]}>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <CapacitySchedulerForm 
                  doctorId={selectedDoctor._id}
                  allowAdminSelfManagement={false}
                />
              </div>
            </RequirePermission>

            <button 
              type="button" 
              onClick={() => setShowViewModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: '#271776',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Doctors;