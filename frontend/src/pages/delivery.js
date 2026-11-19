import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';

function Delivery() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [orderIdToConfirm, setOrderIdToConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const navigate = useNavigate();

  const fetchPendingOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/recd_orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error retrieving orders:', error);
      setMessage('Failed to retrieve incoming orders.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  const handleConfirmClick = (orderId) => {
    setOrderIdToConfirm(orderId);
    setShowOtpModal(true);
  };

  const confirmOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (!otp.trim()) {
        alert('Please enter the 6-digit OTP provided by the buyer.');
        return;
      }

      setSubmittingOtp(true);
      const response = await axios.post(
        `${API_BASE_URL}/cnfm_order?orderId=${orderIdToConfirm}`,
        { otp: otp.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message || 'Order confirmed and completed!');
      setShowOtpModal(false);
      setOtp('');
      fetchPendingOrders();
    } catch (error) {
      console.error('Error confirming order:', error);
      alert(error.response?.data?.message || 'Failed to confirm order. Please verify the OTP.');
    } finally {
      setSubmittingOtp(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Incoming Seller Orders</h2>
        <p className="text-muted mb-0">
          Verify buyer pickup with OTP to complete sales and release payment
        </p>
      </div>

      {message && <div className="alert alert-danger py-2">{message}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Checking for orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center my-4">
          <h4>No pending delivery orders</h4>
          <p className="text-muted">When a buyer orders one of your listings, it will appear here for OTP verification.</p>
        </div>
      ) : (
        <div className="row g-3">
          {orders.map((order) => (
            <div key={order.orderId} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-warning-subtle text-warning-emphasis">
                      Pending Handover
                    </span>
                    <span className="fw-bold text-success fs-5">
                      Rs. {order.itemPrice}
                    </span>
                  </div>

                  <h5 className="card-title fw-bold mb-3">{order.itemName}</h5>

                  <div className="p-2 bg-light rounded text-secondary small mb-3 flex-grow-1">
                    <div><strong>Buyer:</strong> {order.buyerName}</div>
                    <div><strong>Email:</strong> {order.buyerEmail}</div>
                  </div>

                  <button
                    onClick={() => handleConfirmClick(order.orderId)}
                    className="btn btn-primary w-100 fw-semibold"
                  >
                    Verify & Confirm Handover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Verify Buyer OTP</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowOtpModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small">
                  Ask the buyer for the 6-digit OTP displayed on their order screen to confirm item handover:
                </p>
                <div className="mb-3">
                  <label className="form-label fw-semibold">6-Digit OTP</label>
                  <input
                    type="text"
                    className="form-control form-control-lg text-center letter-spacing-2"
                    placeholder="123456"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOtpModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmOrder}
                  className="btn btn-success fw-semibold"
                  disabled={submittingOtp}
                >
                  {submittingOtp ? 'Verifying...' : 'Submit OTP & Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Delivery;
