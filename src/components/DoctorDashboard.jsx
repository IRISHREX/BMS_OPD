import React, { useState } from "react";
import "./DoctorDashboard.css";
import SearchHospitalsTab from "./tabs/SearchHospitalsTab";
import QueryResourcesTab from "./tabs/QueryResourcesTab";
import CreateReferralTab from "./tabs/CreateReferralTab";
import TrackReferralsTab from "./tabs/TrackReferralsTab";

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState("referral");
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    specialty: "",
    insurance: "",
    nabh: false,
  });
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [queryParams, setQueryParams] = useState({
    bedType: "general",
    icuType: "",
    otRequired: false,
    services: [],
  });
  const [referralForm, setReferralForm] = useState({
    patientName: "",
    age: "",
    gender: "male",
    abhaId: "",
    diagnosis: "",
    clinicalNotes: "",
    urgency: "routine",
    requiredCare: "",
  });
  const [referrals] = useState([
    {
      id: "REF001",
      patient: "John Doe",
      hospital: "City Hospital",
      status: "under-review",
      date: "2026-01-03",
      urgency: "urgent",
    },
    {
      id: "REF002",
      patient: "Jane Smith",
      hospital: "Metro Medical",
      status: "accepted",
      date: "2026-01-02",
      urgency: "emergency",
    },
    {
      id: "REF003",
      patient: "Bob Johnson",
      hospital: "Care Hospital",
      status: "scheduled",
      date: "2026-01-01",
      urgency: "routine",
    },
  ]);

  const hospitals = [
    {
      id: 1,
      name: "City Hospital",
      location: "Downtown",
      specialty: "Cardiology",
      nabh: true,
      beds: 15,
      icu: 8,
      rating: 4.5,
    },
    {
      id: 2,
      name: "Metro Medical Center",
      location: "Uptown",
      specialty: "Neurology",
      nabh: true,
      beds: 8,
      icu: 12,
      rating: 4.8,
    },
    {
      id: 3,
      name: "Care Hospital",
      location: "Suburbs",
      specialty: "Orthopedics",
      nabh: false,
      beds: 20,
      icu: 5,
      rating: 4.2,
    },
  ];
  const renderReferralTab = () => (
    <CreateReferralTab
      referralForm={referralForm}
      setReferralForm={setReferralForm}
      setActiveTab={setActiveTab}
    />
  );

  const renderSearchTab = () => (
    <SearchHospitalsTab
      searchFilters={searchFilters}
      setSearchFilters={setSearchFilters}
      hospitals={hospitals}
      setSelectedHospital={setSelectedHospital}
      setActiveTab={setActiveTab}
    />
  );

  const renderQueryTab = () => (
    <QueryResourcesTab
      selectedHospital={selectedHospital}
      queryParams={queryParams}
      setQueryParams={setQueryParams}
      setActiveTab={setActiveTab}
    />
  );


  const renderTrackingTab = () => <TrackReferralsTab referrals={referrals} />;

  return (
    <section>
      <div className="dashboard">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "referral" ? "active" : ""}`}
            onClick={() => setActiveTab("referral")}
          >
            Create Referral
          </button>
          <button
            className={`tab ${activeTab === "search" ? "active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            Search Hospitals
          </button>
          <button
            className={`tab ${activeTab === "query" ? "active" : ""}`}
            onClick={() => setActiveTab("query")}
          >
            Query Resources
          </button>

          <button
            className={`tab ${activeTab === "tracking" ? "active" : ""}`}
            onClick={() => setActiveTab("tracking")}
          >
            Track Referrals
          </button>
        </div>
        <div className="dashboard-content">
           {activeTab === "referral" && renderReferralTab()}
          {activeTab === "search" && renderSearchTab()}
          {activeTab === "query" && renderQueryTab()}
         
          {activeTab === "tracking" && renderTrackingTab()}
        </div>
      </div>
    </section>
  );
};

export default DoctorDashboard;
