import React from 'react';

const TrackReferralsTab = ({ referrals }) => {
  return (
    <div className="tab-content">
      <div className="form-component">
        <h2>Track Referrals</h2>
        
        <div className="doctors banner">
          {referrals.map(referral => {
            return (
              <div key={referral.id} className="card">
                <div className="doc-card-header">
                  <div>
                    <h4>{referral.patient}</h4>
                    <p>ID: {referral.id}</p>
                  </div>
                  <span 
                    className={`urgency-badge urgency-${referral.urgency}`}
                  >
                    {referral.urgency.toUpperCase()}
                  </span>
                </div>
                
                <div className="doc-card-details">
                  <div className="detail-row">
                    <span>Hospital:</span>
                    <span>{referral.hospital}</span>
                  </div>
                  <div className="detail-row">
                    <span>Date Submitted:</span>
                    <span>{referral.date}</span>
                  </div>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span 
                      className={`status-badge status-${referral.status}`}
                    >
                      {referral.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </div>
                </div>

                <div className="status-timeline">
                  {['submitted', 'under-review', 'accepted', 'scheduled'].map((step) => {
                    const stepIndex = ['submitted', 'under-review', 'accepted', 'scheduled'].indexOf(step);
                    const currentIndex = ['submitted', 'under-review', 'accepted', 'scheduled'].indexOf(referral.status);
                    const isActive = step === referral.status;
                    const isCompleted = stepIndex < currentIndex;
                    
                    return (
                      <div 
                        key={step} 
                        className={`timeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      >
                        <div className="timeline-dot"></div>
                        <span className="timeline-label">{step.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </div>
                    );
                  })}
                </div>

                <button className="btn">View Details</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackReferralsTab;
