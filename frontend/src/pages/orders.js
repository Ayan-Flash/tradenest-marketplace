import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../api';

function Orders() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [successfulBoughtOrders, setSuccessfulBoughtOrders] = useState([]);
  const [successfulSoldOrders, setSuccessfulSoldOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();

  const fetchOrderDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/order_details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const {
        pendingOrders = [],
        successfulBoughtOrders = [],
        successfulSoldOrders = [],
      } = response.data;

      setPendingOrders(pendingOrders);
      setSuccessfulBoughtOrders(successfulBoughtOrders);
      setSuccessfulSoldOrders(successfulSoldOrders);
    } catch (error) {
      console.error('Error retrieving order details:', error);
      setMessage('Failed to retrieve order details.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const renderOrderList = (list, emptyText, badgeColor = 'primary') => {
    if (list.length === 0) {
      return (
        <div className="card shadow-sm border-0 p-5 text-center my-3">
          <p className="text-muted mb-0">{emptyText}</p>
        </div>
      );
    }

    return (
      <div className="row g-3">
        {list.map((order) => (
          <div key={order.orderId} className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className={`badge bg-${badgeColor} text-uppercase`}>
                    {order.orderStatus}
                  </span>
                  <span className="fw-bold text-success fs-5">
                    Rs. {order.itemPrice}
                  </span>
                </div>
                <h5 className="card-title fw-bold mb-2">{order.itemName}</h5>
                <p className="text-muted small mb-0">
                  Order ID: <code>{order.orderId}</code>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Orders & Purchases</h2>
          <p className="text-muted mb-0">Track pending transactions and your purchase history</p>
        </div>
        <Link to="/search" className="btn btn-outline-primary">
          Marketplace &rarr;
        </Link>
      </div>

      {message && <div className="alert alert-danger py-2">{message}</div>}

      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Orders ({pendingOrders.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'bought' ? 'active' : ''}`}
            onClick={() => setActiveTab('bought')}
          >
            Purchased ({successfulBoughtOrders.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'sold' ? 'active' : ''}`}
            onClick={() => setActiveTab('sold')}
          >
            Sold Items ({successfulSoldOrders.length})
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading orders...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'pending' &&
            renderOrderList(
              pendingOrders,
              'No pending orders right now.',
              'warning'
            )}
          {activeTab === 'bought' &&
            renderOrderList(
              successfulBoughtOrders,
              'You have not completed any purchases yet.',
              'success'
            )}
          {activeTab === 'sold' &&
            renderOrderList(
              successfulSoldOrders,
              'You have not completed any sales yet.',
              'success'
            )}
        </div>
      )}
    </div>
  );
}

export default Orders;
