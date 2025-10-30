import React from "react";
import "./presFormat.css";

const PrescriptionFormat = () => {
  return (
    <div className="pres-page">
      <div className="header">
        <div className="logo">
          <img src={"/logo.png"} alt="logo" />
        </div>
        <div className="Dr-detail">
          <h2>Doctor Stone</h2>
          <p>Doctor's complete address</p>
        </div>
      </div>

      <div className="main">
        <div className="upper-box">
          <div className="pHeader">
            <div className="pName-age">
              <p>
                Samir Hossain,
                <br /> 24 Year(s)/Male
              </p>
            </div>
            <div className="cDate">
              <p>
                <b>Consultation Date: </b>26-10-2025
              </p>
            </div>
          </div>
          <div className="pAddress-id">
            <div className="paddress">
              <p>
                <b>Address: </b>Town,district,state,732201
              </p>
            </div>
            <div className="pId">
              <p>
                <b>Patient ID: </b> 123456789
              </p>
            </div>
          </div>
          <div className="pData">
            <div className="complaints">
              <b>Chief Complaints: </b>
              <div></div>
            </div>
            <div className="history">
              <b>Medical History: </b>
              <p></p>
            </div>
            <div className="diagnostics">
              <b>Diagnostics: </b>
              <div>
                <p><b>BP: </b>120/80,</p>
                <p><b>Diabetics: </b>120,</p>
                <p><b>SPO2: </b>80,</p>
                <p><b>Height: </b>120,</p>
                <p><b>Weight: </b>80,</p>
                <p><b>Others: </b>Nothing</p>
              </div>
            </div>
          </div>
        </div>
        <div className="diagno-advice">
          <h3>Prescription (RX)</h3>
          <p>
            <b>Provisional Diagnosis: </b>Joint pain
          </p>
          <p>
            <b>Advice: </b>Tab: paracetamol 200mg for 2days
          </p>
        </div>
        <div className="seal">
          <div className="follow-date">
            <p><b>Follow-up-date: </b>27-10-20025</p>
          </div>
          <div className="drSeal">
            <h3>Doctor Stone</h3>
            <p>General Medicine (MBBS)</p>
            <p>Complete address</p>
          </div>
        </div>
      </div>

      <div className="footer">
        <p>For any concerns please contact the clinic. Contact: 3330333033</p>
      </div>
    </div>
  );
};

export default PrescriptionFormat;
