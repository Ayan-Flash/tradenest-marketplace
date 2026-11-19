import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../api';

function MyCart() {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  const fetchCartItems = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/mycart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartItems(response.data.cartItems || []);
      setTotalPrice(response.data.totalCartPrice || 0);
    } catch (error) {
      console.error('Error retrieving cart items:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const handleRemoveFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/cart`,
        { itemId, action: 'remove' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message || 'Item removed from cart');
      fetchCartItems();
    } catch (error) {
      console.error('Error removing item from cart:', error);
      alert('Failed to remove item from cart');
    }
  };

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to proceed with checkout.');
        navigate('/login');
        return;
      }

      setCheckingOut(true);
      const response = await axios.post(
        `${API_BASE_URL}/checkout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(response.data.orders || []);
      setShowModal(true);
      setCartItems([]);
      setTotalPrice(0);
    } catch (error) {
      console.error('Error during checkout:', error);
      const msg = error.response?.data?.message || 'Failed to complete checkout';
      alert(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Shopping Cart</h2>
          <p className="text-muted mb-0">Review items before checkout</p>
        </div>
        <Link to="/search" className="btn btn-outline-primary">
          &larr; Continue Shopping
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading cart items...</p>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center my-4">
          <h4 className="fw-bold">Your cart is empty</h4>
          <p className="text-muted mb-4">Explore items available in the marketplace to add to your cart.</p>
          <Link to="/search" className="btn btn-primary align-self-center px-4">
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="list-group list-group-flush">
                {cartItems.map((item) => (
                  <div key={item.itemId} className="list-group-item p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="fw-bold mb-1">{item.name}</h5>
                        <span className="badge bg-secondary-subtle text-secondary text-uppercase mb-2">
                          {item.category}
                        </span>
                        <p className="text-muted small mb-0">{item.description}</p>
                      </div>
                      <div className="text-end">
                        <div className="fs-5 fw-bold text-success mb-2">
                          Rs. {item.price}
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.itemId)}
                          className="btn btn-sm btn-outline-danger"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card shadow-sm border-0 p-4">
              <h5 className="fw-bold mb-3">Order Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total Items:</span>
                <span className="fw-semibold">{cartItems.length}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Subtotal:</span>
                <span className="fw-bold text-success fs-5">Rs. {totalPrice}</span>
              </div>
              <hr />
              <div className="p-2 bg-light rounded text-muted small mb-3">
                🛡️ <strong>OTP Protected:</strong> When you checkout, a unique 6-digit OTP is generated for each seller. Share the OTP only upon receiving the item.
              </div>
              <button
                onClick={handleCheckout}
                className="btn btn-success w-100 py-2 fw-semibold"
                disabled={checkingOut}
              >
                {checkingOut ? 'Processing Checkout...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Success Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">🎉 Checkout Successful!</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted">
                  Your order has been placed. Please save your verification OTP codes below. Provide the OTP to the seller when collecting each item.
                </p>
                <div className="list-group">
                  {orders.map((order) => (
                    <div key={order.orderId} className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{order.itemName}</strong>
                          <div className="text-muted small">Rs. {order.amount}</div>
                        </div>
                        <div className="badge bg-primary fs-6 px-3 py-2">
                          OTP: {order.otp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-0">
                <Link to="/order_details" className="btn btn-primary">
                  View My Orders
                </Link>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyCart;
