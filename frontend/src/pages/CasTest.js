import React, { useEffect } from 'react';
import API_BASE_URL from '../api';

function CasTest() {
  useEffect(() => {
    // Redirect user to backend CAS endpoint
    window.location.href = `${API_BASE_URL}/cas`;
  }, []);

  return (
    <div className="card shadow-sm border-0 p-5 text-center my-4">
      <div className="spinner-border text-primary mb-3" role="status"></div>
      <h4 className="fw-bold">Redirecting to CAS Single Sign-On...</h4>
      <p className="text-muted">
        Please wait while we connect to institutional authentication.
      </p>
    </div>
  );
}

export default CasTest;
