import React from 'react';
import '../style/General/MobileRestriction.css';

const MobileRestriction = () => {
  return (
    <div className="mobile-restriction">
      <div className="mobile-restriction-content">
        <div className="mobile-restriction-icon">📱❌</div>
        <h2>System Not Available on Mobile</h2>
        <p>This system is not yet supported on mobile devices. Please access this application using a desktop or PC computer.</p>
        <p>We apologize for any inconvenience.</p>
      </div>
    </div>
  );
};

export default MobileRestriction;