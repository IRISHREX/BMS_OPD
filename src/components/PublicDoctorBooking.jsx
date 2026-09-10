import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSnackbar } from '../context/SnackbarContext';
import { FaUserMd, FaCalendarCheck, FaClock, FaCheckCircle, FaHospital, FaArrowLeft, FaPhoneAlt } from 'react-icons/fa';
import './AddNewDoctor.css';

const APPLICANT_OPTIONS = [
  'Self',
  'Relative',
  'Primary Clinic',
  'Health Worker',
  'NGO / Community Agent',
  'Other'
];

const SLOT_OPTIONS = [
  'Morning (09:00 AM - 12:00 PM)',
  'Afternoon (12:00 PM - 04:00 PM)',
  'Evening (04:00 PM - 08:00 PM)'
];

const PublicDoctorBooking = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Form fields
  const [patientName, setPatientName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [applicantBy, setApplicantBy] = useState('Self');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [appointmentSlot, setAppointmentSlot] = useState(SLOT_OPTIONS[0]);
  const [symptoms, setSymptoms] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/user/doctors');
      if (res.data?.data) {
        setDoctors(res.data.data);
      } else if (res.data?.doctors) {
        setDoctors(res.data.doctors);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      snackbar.error('Could not load doctors list');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !applicantPhone.trim() || !selectedDoctor) {
      snackbar.error('Please enter patient name, contact number, and select a doctor.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientName: patientName.trim(),
        applicantBy,
        applicantPhone: applicantPhone.trim(),
        applicantEmail: applicantEmail.trim() || undefined,
        age: age ? Number(age) : 30,
        gender: gender.toLowerCase(),
        targetDoctorId: selectedDoctor._id,
        targetDoctorName: `Dr. ${selectedDoctor.firstName || ''} ${selectedDoctor.lastName || ''}`.trim(),
        targetDoctorSpecialty: selectedDoctor.doctorDepartment || selectedDoctor.specialization || 'Specialist',
        department: selectedDoctor.doctorDepartment || 'General Medicine',
        appointmentDate,
        appointmentSlot,
        symptoms: symptoms.trim() || 'General OPD consultation request',
        diagnosis: symptoms.trim() || 'General OPD consultation request',
        clinicalNotes: `Booking submitted via Patient Referral portal. Applicant: ${applicantBy}. Contact: ${applicantPhone}. Preferred slot: ${appointmentSlot}`
      };

      const res = await api.post('/api/v1/referral/book', payload);
      if (res.data?.success) {
        setBookingSuccess({
          referralNumber: res.data.referralNumber || res.data.referral?._id?.substring(0, 8),
          doctor: payload.targetDoctorName,
          specialty: payload.targetDoctorSpecialty,
          date: appointmentDate,
          slot: appointmentSlot,
          patient: patientName,
          applicantBy
        });
        snackbar.success('Consultation referral submitted successfully!');
      } else {
        snackbar.error(res.data?.message || 'Failed to submit referral booking');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      snackbar.error(err.response?.data?.message || 'Failed to submit booking referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBookingSuccess(null);
    setSelectedDoctor(null);
    setPatientName('');
    setApplicantPhone('');
    setApplicantEmail('');
    setAge('');
    setSymptoms('');
    setApplicantBy('Self');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1d',
      color: '#f8fafc',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      padding: '24px 16px'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Top Navbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(217, 119, 6, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e3a8a, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #f59e0b',
              color: '#fef08a',
              fontWeight: '800',
              fontSize: '1.2rem'
            }}>
              OPD
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.5px' }}>
                BMS Hospital • Patient Inbound Referral
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600' }}>
                Doctor Appointment Booking Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid #475569',
              color: '#cbd5e1',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <FaArrowLeft size={12} /> Staff Portal Login
          </button>
        </div>

        {/* Success Confirmation Modal/Card */}
        {bookingSuccess ? (
          <div style={{
            background: 'linear-gradient(145deg, #0f172a, #1e293b)',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '36px 24px',
            textAlign: 'center',
            maxWidth: '650px',
            margin: '40px auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <FaCheckCircle size={60} color="#10b981" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '1.6rem', color: '#f8fafc', marginBottom: '8px' }}>
              Appointment Referral Submitted!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '24px' }}>
              Your referral request has been registered in the Hospital OPD system. Reception and doctors will convert it to an official scheduled appointment.
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#94a3b8' }}>Tracking Number:</span>
                <span style={{ fontWeight: '800', color: '#f59e0b', fontSize: '1.1rem' }}>
                  {bookingSuccess.referralNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#94a3b8' }}>Patient Name:</span>
                <span style={{ fontWeight: '700', color: '#f8fafc' }}>{bookingSuccess.patient}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#94a3b8' }}>Target Doctor:</span>
                <span style={{ fontWeight: '700', color: '#38bdf8' }}>{bookingSuccess.doctor} ({bookingSuccess.specialty})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#94a3b8' }}>Applicant By:</span>
                <span style={{ background: '#0369a1', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                  {bookingSuccess.applicantBy}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Preferred Schedule:</span>
                <span style={{ color: '#f8fafc' }}>{bookingSuccess.date} • {bookingSuccess.slot}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Book Another Appointment
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: '1px solid #475569',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Back to Portal Login
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
              border: '1.5px solid rgba(217, 119, 6, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
            }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: '#f8fafc' }}>
                Find Your Specialist & Book Consultation
              </h2>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Select an attending doctor below to initiate an inbound appointment referral. You or a designated healthcare agent can apply directly without pre-registration.
              </p>
            </div>

            {/* Doctors Grid */}
            <h3 style={{ fontSize: '1.1rem', color: '#f59e0b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaUserMd /> Available Doctors & Specialists ({doctors.length})
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Loading specialists...
              </div>
            ) : doctors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                No registered doctors available for booking at the moment.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                {doctors.map((doc) => {
                  const isSelected = selectedDoctor?._id === doc._id;
                  const docName = `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'Medical Specialist';
                  return (
                    <div
                      key={doc._id}
                      onClick={() => setSelectedDoctor(doc)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #1e293b, #0f172a)' : '#131b2e',
                        border: `2px solid ${isSelected ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '14px',
                        padding: '18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.3)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: '#1e3a8a',
                          border: '1.5px solid #f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fef08a',
                          fontSize: '1.2rem',
                          fontWeight: '800'
                        }}>
                          {doc.firstName?.charAt(0) || 'D'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', color: '#f8fafc' }}>
                            {docName}
                          </h4>
                          <span style={{
                            background: '#0369a1',
                            color: '#e0f2fe',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {doc.doctorDepartment || doc.specialization || 'Consultant'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Fee:</strong> ₹{doc.fees || 500} • <strong>OPD:</strong> Available</div>
                        <div><strong>Email:</strong> {doc.email || 'hospital@bms.com'}</div>
                      </div>

                      <button
                        type="button"
                        style={{
                          width: '100%',
                          background: isSelected ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                          color: isSelected ? '#000000' : '#f8fafc',
                          border: `1px solid ${isSelected ? '#f59e0b' : '#334155'}`,
                          borderRadius: '8px',
                          padding: '8px',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ Selected for Booking' : 'Select Doctor'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Booking Form when a doctor is chosen */}
            {selectedDoctor && (
              <div style={{
                background: '#111827',
                border: '2px solid #f59e0b',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                marginBottom: '40px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #1f2937'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#f8fafc' }}>
                      Complete Consultation Referral Details
                    </h3>
                    <p style={{ margin: 0, color: '#f59e0b', fontSize: '0.85rem' }}>
                      Target: Dr. {selectedDoctor.firstName} {selectedDoctor.lastName} ({selectedDoctor.doctorDepartment || 'Specialist'})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Change Doctor
                  </button>
                </div>

                <form onSubmit={handleBookSubmit}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    {/* Patient Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Patient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Applicant Phone */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Contact Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Applicant By (Crucial User Requirement) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#f59e0b', marginBottom: '6px' }}>
                        Applicant By (Referral Source) *
                      </label>
                      <select
                        value={applicantBy}
                        onChange={(e) => setApplicantBy(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#1e293b',
                          border: '1px solid #f59e0b',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxSizing: 'border-box',
                          fontWeight: '600'
                        }}
                      >
                        {APPLICANT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} style={{ background: '#0f172a' }}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Patient Age
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 35"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="Male" style={{ background: '#0f172a' }}>Male</option>
                        <option value="Female" style={{ background: '#0f172a' }}>Female</option>
                        <option value="Other" style={{ background: '#0f172a' }}>Other</option>
                      </select>
                    </div>

                    {/* Preferred Date */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Preferred Slot */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Preferred Time Slot
                      </label>
                      <select
                        value={appointmentSlot}
                        onChange={(e) => setAppointmentSlot(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      >
                        {SLOT_OPTIONS.map((slot) => (
                          <option key={slot} value={slot} style={{ background: '#0f172a' }}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Email (Optional) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="patient@example.com"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Symptoms */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Symptoms / Reason for Consultation
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe health complaints, previous tests, or specific requests..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(null)}
                      style={{
                        background: 'transparent',
                        color: '#94a3b8',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 28px',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      {isSubmitting ? 'Submitting Referral...' : 'Submit Patient Referral'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicDoctorBooking;
