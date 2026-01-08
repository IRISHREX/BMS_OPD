import React from 'react';

const TrackReferralsTab = ({ referrals, onSubmit, loading = false }) => {
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  if (loading) {
    return (
      <div className="tab-content">
        <div className="form-component">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading referrals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="form-component">
        <h2>Track Referrals</h2>
        
        <div className="doctors banner">
          {!referrals || referrals.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#999' }}>
              No referrals yet
            </div>
          ) : (
            referrals.map(referral => {
              const statusSteps = ['submitted', 'under-review', 'accepted', 'scheduled'];
              const currentStatus = referral.status || 'submitted';
              
              return (
                <div key={referral._id} className="card">
                  <div className="doc-card-header">
                    <div>
                      <h4>{referral.patientName}</h4>
                      <p>ID: {referral.referralNumber || referral._id}</p>
                    </div>
                    <span 
                      className={`urgency-badge urgency-${referral.urgency}`}
                    >
                      {(referral.urgency || 'routine').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="doc-card-details">
                    <div className="detail-row">
                      <span>Hospital:</span>
                      <span>
                        {referral.hospitals && referral.hospitals.length > 0
                          ? referral.hospitals[0].hospitalName
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Date Submitted:</span>
                      <span>
                        {referral.createdAt
                          ? new Date(referral.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Status:</span>
                      <span 
                        className={`status-badge status-${currentStatus}`}
                      >
                        {currentStatus.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </div>
                  </div>

                  <div className="status-timeline">
                    {statusSteps.map((step) => {
                      const stepIndex = statusSteps.indexOf(step);
                      const currentIndex = statusSteps.indexOf(currentStatus);
                      const isActive = step === currentStatus;
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
            })
          )}
        </div>

        {onSubmit && (
          <div className="button-group" style={{ marginTop: '20px' }}>
            <button className="btn" onClick={handleSubmit}>
              Complete Referral
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackReferralsTab;
