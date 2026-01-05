import React from 'react';

const QueryResourcesTab = ({ selectedHospital, queryParams, setQueryParams, setActiveTab }) => {
  return (
    <div className="tab-content">
      <div className="form-component">
        <form>
          <h2>Query Hospital Resources</h2>
          {selectedHospital && (
            <div className="selected-hospital">
              <h4>{selectedHospital.name}</h4>
              <p>{selectedHospital.location}</p>
            </div>
          )}
          
          <div className="form-section">
            <h4>Bed Requirements</h4>
            <div className="radio-group">
              {['general', 'semi-private', 'private', 'icu'].map(type => (
                <label key={type} className="radio-label">
                  <input 
                    type="radio" 
                    name="bedType"
                    value={type}
                    checked={queryParams.bedType === type}
                    onChange={(e) => setQueryParams({...queryParams, bedType: e.target.value})}
                  />
                  {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </label>
              ))}
            </div>
          </div>

          {queryParams.bedType === 'icu' && (
            <div className="form-section">
              <h4>ICU Type</h4>
              <select 
                value={queryParams.icuType}
                onChange={(e) => setQueryParams({...queryParams, icuType: e.target.value})}
              >
                <option value="">Select ICU Type</option>
                <option value="micu">MICU (Medical)</option>
                <option value="sicu">SICU (Surgical)</option>
                <option value="picu">PICU (Pediatric)</option>
                <option value="nicu">NICU (Neonatal)</option>
              </select>
            </div>
          )}

          <div className="form-section">
            <h4>Additional Services</h4>
            <div className="checkbox-list">
              {['Ventilator', 'Dialysis', 'OT Slot', 'MRI/CT', 'Cath Lab', 'Laboratory'].map(service => (
                <label key={service} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={queryParams.services.includes(service)}
                    onChange={(e) => {
                      const services = e.target.checked 
                        ? [...queryParams.services, service]
                        : queryParams.services.filter(s => s !== service);
                      setQueryParams({...queryParams, services});
                    }}
                  />
                  {service}
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h4>Estimated Cost</h4>
            <div className="cost-estimate">
              <div className="cost-item">
                <span>Bed Charges (per day)</span>
                <span className="cost-value">₹2,500</span>
              </div>
              <div className="cost-item">
                <span>Services</span>
                <span className="cost-value">₹5,000</span>
              </div>
              <div className="cost-item total">
                <span>Estimated Total (3 days)</span>
                <span className="cost-value">₹22,500</span>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button className="btn" onClick={() => setActiveTab('search')}>
              Back to Search
            </button>
            <button className="btn" onClick={() => setActiveTab('referral')}>
              Create Referral
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QueryResourcesTab;
