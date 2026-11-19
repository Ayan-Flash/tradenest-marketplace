import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../api';

function Sell() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('clothing');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to sell an item.');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/sell`,
        {
          name,
          price: Number(price),
          description,
          category,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsSuccess(true);
      setMessage(response.data.message || 'Item listed for sale successfully!');
      setName('');
      setPrice('');
      setDescription('');
      setCategory('clothing');
    } catch (error) {
      console.error('Error listing item for sale:', error);
      setIsSuccess(false);
      setMessage(error.response?.data?.message || 'Failed to list item for sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center py-3">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="card shadow-sm border-0 p-4">
          <h2 className="fw-bold mb-1">List an Item for Sale</h2>
          <p className="text-muted mb-4">Post your product or rental item to the TradeNest marketplace</p>

          {message && (
            <div
              className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'} py-2 mb-4`}
              role="alert"
            >
              {message}
              {isSuccess && (
                <div className="mt-2">
                  <Link to="/search" className="btn btn-sm btn-outline-success">
                    View in Marketplace &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Item Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Scientific Calculator FX-991EX"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Price (Rs.)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="form-control"
                placeholder="e.g., 500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="clothing">Clothing</option>
                <option value="grocery">Grocery</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Item Description</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Describe condition, specifications, usage duration, and pickup details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? 'Submitting Listing...' : 'Publish Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Sell;
