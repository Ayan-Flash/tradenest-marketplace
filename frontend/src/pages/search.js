import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api';

function Search() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      const response = await axios.get(`${API_BASE_URL}/search`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          name: name.trim() || undefined,
          category: category || undefined,
        },
      });

      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error retrieving items:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setErrorMessage('Failed to fetch marketplace items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [name, category, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    handleSearch();
  }, [handleSearch, navigate]);

  const handleItemClick = (itemId) => {
    navigate(`/items?itemId=${itemId}`);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Marketplace Listings</h2>
          <p className="text-muted mb-0">Browse items available for purchase or rental</p>
        </div>
        <button
          onClick={() => navigate('/sell')}
          className="btn btn-success fw-semibold"
        >
          + List an Item for Sale
        </button>
      </div>

      <div className="card shadow-sm border-0 p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <input
              type="text"
              placeholder="Search by item name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="form-control"
            />
          </div>
          <div className="col-12 col-md-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="">All Categories</option>
              <option value="clothing">Clothing</option>
              <option value="grocery">Grocery</option>
              <option value="electronics">Electronics</option>
              <option value="furniture">Furniture</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-12 col-md-2">
            <button
              onClick={handleSearch}
              className="btn btn-primary w-100 fw-semibold"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger py-2" role="alert">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary mb-2" role="status"></div>
          <div>Loading items...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center my-4">
          <h4>No items found</h4>
          <p className="text-muted">Try adjusting your search criteria or check back later.</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {items.map((item) => (
            <div key={item.itemId} className="col">
              <div
                className="card h-100 border-0 shadow-sm item-card cursor-pointer"
                onClick={() => handleItemClick(item.itemId)}
                style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              >
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary-subtle text-primary text-uppercase px-2 py-1">
                      {item.category}
                    </span>
                    <span className="fw-bold text-success fs-5">
                      Rs. {item.price}
                    </span>
                  </div>

                  <h5 className="card-title fw-bold text-dark mb-2">{item.name}</h5>
                  <p className="card-text text-muted small flex-grow-1">
                    {item.description?.length > 100
                      ? `${item.description.substring(0, 100)}...`
                      : item.description}
                  </p>

                  <hr className="my-2" />

                  <div className="d-flex justify-content-between align-items-center text-secondary small">
                    <span>
                      Seller: <strong>{item.seller?.name || 'Community Member'}</strong>
                    </span>
                    <button className="btn btn-sm btn-outline-primary">
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Search;
