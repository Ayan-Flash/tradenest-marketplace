import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import UpdateUser from './updateuser';
import API_BASE_URL from '../api';

function User() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleUpdate = (updatedUser) => {
    setUser(updatedUser);
    setShowEdit(false);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card shadow-sm border-0 p-5 text-center my-4">
        <h4>User not found</h4>
        <Link to="/login" className="btn btn-primary mt-3 align-self-center">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="row justify-content-center py-3">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="card shadow-sm border-0 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fw-bold mb-0">User Profile</h3>
            <span className="badge bg-success-subtle text-success px-3 py-2">
              Verified Member
            </span>
          </div>

          <div className="p-3 bg-light rounded-3 mb-4">
            <div className="row g-2">
              <div className="col-sm-6">
                <span className="text-muted small">First Name:</span>
                <p className="fw-semibold mb-2">{user.firstName || 'N/A'}</p>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Last Name:</span>
                <p className="fw-semibold mb-2">{user.lastName || 'N/A'}</p>
              </div>
              <div className="col-12">
                <span className="text-muted small">Email Address:</span>
                <p className="fw-semibold mb-2">{user.email}</p>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Age:</span>
                <p className="fw-semibold mb-2">{user.age || 'Not specified'}</p>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Contact Number:</span>
                <p className="fw-semibold mb-2">{user.contactNumber || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={() => setShowEdit(!showEdit)}
              className="btn btn-primary flex-grow-1 fw-semibold"
            >
              {showEdit ? 'Cancel Editing' : 'Edit Profile'}
            </button>
            <button onClick={handleLogout} className="btn btn-outline-danger">
              Logout
            </button>
          </div>
        </div>

        {showEdit && (
          <div className="card shadow-sm border-0 p-4">
            <UpdateUser user={user} onUpdate={handleUpdate} />
          </div>
        )}
      </div>
    </div>
  );
}

export default User;
