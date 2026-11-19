import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API_BASE_URL from '../api';

function ConfirmOrder() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('orderId');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId) {
      setMessage('No Order ID provided in URL');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/cnfm_order?orderId=${orderId}`,
        { otp: otp.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsSuccess(true);
      setMessage(response.data.message || 'Order confirmed successfully!');
      setTimeout(() => {
        navigate('/recd_orders');
      }, 1500);
    } catch (error) {
      console.error('Error confirming order:', error);
      setIsSuccess(false);
      setMessage(error.response?.data?.message || 'Failed to confirm order. Please check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center py-4">
      <div className="col-12 col-md-6 col-lg-5">
        <div className="card shadow-sm border-0 p-4">
          <h3 className="fw-bold mb-3 text-center">Confirm Order Delivery</h3>
          <p className="text-muted small text-center mb-4">
            Order Reference: <code>{orderId || 'N/A'}</code>
          </p>

          {message && (
            <div
              className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'} py-2 mb-3`}
              role="alert"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="otp" className="form-label fw-semibold">
                Enter 6-Digit Buyer OTP
              </label>
              <input
                type="text"
                id="otp"
                className="form-control form-control-lg text-center"
                placeholder="123456"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-success w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? 'Confirming...' : 'Verify & Complete Delivery'}
            </button>
          </form>

          <hr className="my-3" />
          <div className="text-center">
            <Link to="/recd_orders" className="text-decoration-none small">
              &larr; Back to Pending Deliveries
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmOrder;
