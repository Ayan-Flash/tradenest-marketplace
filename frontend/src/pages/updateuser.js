import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

function UpdateUser({ user, onUpdate }) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [age, setAge] = useState(user.age || '');
  const [contactNumber, setContactNumber] = useState(user.contactNumber || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to update your information.');
        return;
      }

      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/updateUser`,
        {
          firstName,
          lastName,
          age: Number(age) || undefined,
          contactNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message || 'Profile updated successfully!');
      if (onUpdate && response.data.user) {
        onUpdate(response.data.user);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="fw-bold mb-3">Update Details</h4>

      {message && <div className="alert alert-danger py-2">{message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">First Name</label>
          <input
            type="text"
            className="form-control"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Last Name</label>
          <input
            type="text"
            className="form-control"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Age</label>
          <input
            type="number"
            className="form-control"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold">Contact Number</label>
          <input
            type="text"
            className="form-control"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-success w-100 fw-semibold"
          disabled={loading}
        >
          {loading ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}

export default UpdateUser;
