import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../utils/api';
import { playSaveSound, playLoadSound } from '../utils/soundUtils';
import { fetchPreviewRequest, fetchPreviewSuccess, fetchPreviewFailure } from './previewSlice';

function* fetchPreviewSaga(action) {
  try {
    playLoadSound();
    let { patientId, appointmentId } = action.payload;
    
    // If appointmentId is provided instead of patientId, fetch the appointment first
    if (appointmentId && !patientId) {
      try {
        const { data: appointmentData } = yield call(api.get, `/api/v1/appointment/getall`);
        const allAppointments = appointmentData.appointments || [];
        const targetAppointment = allAppointments.find(apt => apt._id === appointmentId);
        if (targetAppointment) {
          patientId = targetAppointment.patientId;
        }
      } catch (e) {
        // If fetching all appointments fails, we'll proceed with the appointmentId as patientId
        patientId = appointmentId;
      }
    }

    let appts = [];
    try {
      const { data: ad } = yield call(api.get, `/api/v1/appointment/patient/${patientId}`);
      appts = ad.appointments || [];
    } catch (e) {
      try {
        const { data: appointmentData } = yield call(api.get, `/api/v1/appointment/getall`);
        const allAppointments = appointmentData.appointments || [];
        const found = allAppointments.find(
          (apt) => String(apt._id) === String(patientId) || String(apt.patientId) === String(patientId)
        );
        if (found) {
          appts = [found];
        }
      } catch (err) {
        appts = [];
      }
    }

    let patient = null;
    let doctor = null;

    if (appts.length > 0) {
      let targetAppt = appts.find(
        (apt) =>
          String(apt._id) === String(patientId) ||
          String(apt.appointmentId) === String(patientId) ||
          (appointmentId && String(apt._id) === String(appointmentId))
      );

      if (!targetAppt) {
        appts.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || b.appointment_date) -
            new Date(a.updatedAt || a.createdAt || a.appointment_date)
        );
        targetAppt = appts[0];
      }
      
      const latest = targetAppt;
      let prescriptionReport = latest.result || [];
      let presList = [];
      try {
        const { data: presRes } = yield call(api.get, `/api/v1/prescription/patient/${patientId}`);
        presList = presRes?.prescriptions || [];
        if (presList.length > 0) {
           const lp = presList[0];
           prescriptionReport = [{
             initialComplain: typeof lp.provisionalDiagnosis === 'object' ? (lp.provisionalDiagnosis?.value || '') : (lp.provisionalDiagnosis || ''),
             medicalHistory: lp.medicalHistory || '',
             clinical_findings: lp.clinicalFindings || {},
             diagnosys: lp.vitals || lp.diagnosys || {},
             diagnosys_heading: lp.diagnosys_heading || 'Provisional Diagnosis',
             medicineAdvice: lp.medicines || lp.medicineAdvice || [],
             advice: lp.advice || {},
             additionalAdvice: lp.additionalAdvice || '',
             followUp: lp.followUp || '',
             presentingComplaints: lp.presentingComplaints || '',
             pathologyReport: lp.pathologyReport || '',
             radiologyReport: lp.radiologyReport || '',
             femaleTests: lp.femaleTests,
             Gravida: lp.femaleTests?.Gravida || lp.gravida || '',
             Parity: lp.femaleTests?.Parity || lp.parity || '',
             LMP: lp.femaleTests?.LMP || lp.LMP || '',
             EDD: lp.femaleTests?.EDD || lp.EDD || '',
             POG: lp.femaleTests?.POG || lp.POG || '',
             LCB: lp.femaleTests?.LCB || lp.LCB || '',
             MOD: lp.femaleTests?.MOD || lp.MOD || '',
           }];
        }
      } catch (e) {
        console.warn("Failed to fetch prescription", e);
      }

      patient = {
        _id: latest.patientId || patientId,
        firstName: latest.firstName || latest.patientName || '',
        lastName: latest.lastName || '',
        name: latest?.name || `${latest.firstName || ''} ${latest.lastName || ''}`.trim(),
        nic: latest.nic || latest.NIC || '',
        email: latest.email || '',
        phone: latest.phone || latest.contact || '',
        dob: latest.dob || latest.DOB || null,
        age: latest.age || null,
        gender: latest.gender || '',
        updatedAt: latest.updatedAt || latest.appointment_date,
        weight: prescriptionReport[0] && prescriptionReport[0].diagnosys ? prescriptionReport[0].diagnosys.Weight : latest.weight,
        report: prescriptionReport,
        appointmentId: latest._id,
        appointment_date: latest.appointment_date,
        appointmentType: latest.appointmentType || latest.type || 'OPD',
        examinedBy: latest.examinedBy || latest.doctorName || '',
        reportdate: latest.reportdate || '',
        address: latest.address || '',
        department: latest.department || '',
        price: latest.price || 0,
        paymentStatus: latest.paymentStatus || '',
      };

      const docRef = latest.doctorId || (presList[0] && presList[0].doctorId);
      if (docRef) {
        try {
          const docId = typeof docRef === 'object' ? (docRef._id || docRef.id) : docRef;
          if (docId) {
            const { data: dd } = yield call(api.get, `/api/v1/user/doctor/${docId}`);
            if (dd && dd.doctor) doctor = dd.doctor;
          }
        } catch (e) {
          if (typeof docRef === 'object') {
            doctor = docRef;
          } else {
            doctor = null;
          }
        }
      }
    }
    // If no appointments returned, try fetching patient directly (fallback)
    if (!patient && appts.length === 0) {
      try {
        const { data: ud } = yield call(api.get, `/api/v1/user/patient/${patientId}`);
        const u = ud.patient || ud.user || null;
        if (u) {
          patient = {
            _id: u._id,
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            nic: u.nic || u.NIC || '',
            email: u.email || '',
            phone: u.phone || u.contact || '',
            dob: u.dob || null,
            age: u.age || null,
            gender: u.gender || '',
            updatedAt: u.updatedAt || null,
            weight: u.weight || null,
            report: u.report || [],
            appointmentId: '',
            appointment_date: '',
            appointmentType: u.appointmentType || 'OPD',
            examinedBy: '',
            reportdate: '',
            address: u.address || '',
            department: u.department || '',
            price: 0,
            paymentStatus: '',
          };
        }
      } catch (e) {
        // fallback patient fetch failed - swallow to allow saga to continue
      }
    }
    yield put(fetchPreviewSuccess({ patient, doctor }));
  } catch (e) {
    yield put(fetchPreviewFailure(e?.response?.data?.message || e.message || 'Failed to load preview'));
  }
}

export default function* previewWatcher() {
  yield takeLatest(fetchPreviewRequest.type, fetchPreviewSaga);
}