import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API_BASE_URL from '../api';

function Items() {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const itemId = queryParams.get('itemId');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/items`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { itemId },
        });

        setItem(response.data);
      } catch (error) {
        console.error('Error retrieving item details:', error);
        setMessage('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItemDetails();
    } else {
      setLoading(false);
      setMessage('No item ID provided.');
    }
  }, [itemId, navigate]);

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setAddingToCart(true);
      const response = await axios.post(
        `${API_BASE_URL}/cart`,
        { itemId, action: 'add' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message || 'Item added to your cart!');
      navigate('/mycart');
    } catch (error) {
      console.error('Error adding item to cart:', error);
      const msg = error.response?.data?.message || 'Failed to add item to cart';
      alert(msg);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading product details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="card shadow-sm border-0 p-5 text-center my-4">
        <h4 className="text-danger">{message || 'Item not found'}</h4>
        <Link to="/search" className="btn btn-primary mt-3 align-self-center">
          &larr; Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="row justify-content-center py-3">
      <div className="col-12 col-lg-8">
        <Link to="/search" className="btn btn-outline-secondary btn-sm mb-3">
          &larr; Back to Marketplace
        </Link>

        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
            <span className="badge bg-primary text-uppercase px-3 py-2">
              {item.category}
            </span>
            <span className="fs-3 fw-bold text-success">
              Rs. {item.price}
            </span>
          </div>

          <div className="card-body p-4">
            <h2 className="fw-bold mb-3">{item.name}</h2>
            <div className="p-3 bg-light rounded-3 mb-4">
              <h6 className="fw-bold text-secondary mb-2">Description</h6>
              <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-line' }}>
                {item.description}
              </p>
            </div>

            <div className="border rounded-3 p-3 mb-4 bg-white">
              <h6 className="fw-bold text-secondary mb-2">Seller Information</h6>
              <p className="mb-1">
                <strong>Name:</strong> {item.seller?.name || 'Community Seller'}
              </p>
              <p className="mb-0 text-muted small">
                <strong>Contact Email:</strong> {item.seller?.email || 'Available upon order'}
              </p>
            </div>

            <div className="d-flex gap-3">
              <button
                onClick={handleAddToCart}
                className="btn btn-primary btn-lg flex-grow-1 fw-semibold"
                disabled={addingToCart}
              >
                {addingToCart ? 'Adding to Cart...' : '🛒 Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Items;
