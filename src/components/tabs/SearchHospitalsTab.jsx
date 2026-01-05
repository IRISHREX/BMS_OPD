import React from 'react';

const SearchHospitalsTab = ({ searchFilters, setSearchFilters, hospitals, setSelectedHospital, setActiveTab }) => {
  return (
    <div className="tab-content">
      <div className="form-component">
        <form>
          <h2>Search Hospitals</h2>
          <div className="grid-container">
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                placeholder="Enter city or area"
                value={searchFilters.location}
                onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Specialty</label>
              <select 
                value={searchFilters.specialty}
                onChange={(e) => setSearchFilters({...searchFilters, specialty: e.target.value})}
              >
                <option value="">All Specialties</option>
                <option value="cardiology">Cardiology</option>
                <option value="neurology">Neurology</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="oncology">Oncology</option>
              </select>
            </div>
            <div className="form-group">
              <label>Insurance Network</label>
              <input 
                type="text" 
                placeholder="Insurance provider"
                value={searchFilters.insurance}
                onChange={(e) => setSearchFilters({...searchFilters, insurance: e.target.value})}
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox"
                  checked={searchFilters.nabh}
                  onChange={(e) => setSearchFilters({...searchFilters, nabh: e.target.checked})}
                />
                NABH Accredited Only
              </label>
            </div>
          </div>
        </form>
        
        <div className="doctors banner">
          {hospitals.map(hospital => (
            <div key={hospital.id} className="card">
              <div className="doc-card-header">
                <div>
                  <h4>{hospital.name}</h4>
                  <p>{hospital.location} • {hospital.specialty}</p>
                </div>
                <div className="rating-badge">{hospital.rating} ★</div>
              </div>
              <div className="doc-card-details">
                <div className="detail-item">
                  <span>Available Beds:</span>
                  <span>{hospital.beds}</span>
                </div>
                <div className="detail-item">
                  <span>ICU Beds:</span>
                  <span>{hospital.icu}</span>
                </div>
                {hospital.nabh && <span className="badge nabh-badge">NABH</span>}
              </div>
              <button 
                className="btn"
                onClick={() => {
                  setSelectedHospital(hospital);
                  setActiveTab('query');
                }}
              >
                Query Availability
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchHospitalsTab;
