import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active fw-bold text-primary' : 'nav-link';

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary d-flex align-items-center" to="/">
          <span className="me-2 fs-4">🪺</span>
          <span>TradeNest</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className={isActive('/search')} to="/search">Marketplace</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/sell')} to="/sell">Sell Item</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/mycart')} to="/mycart">My Cart</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/recd_orders')} to="/recd_orders">Delivery</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/order_details')} to="/order_details">Orders</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/chatbot')} to="/chatbot">AI Assistant</Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            {token ? (
              <>
                <Link to="/user" className="btn btn-outline-primary btn-sm">
                  Profile
                </Link>
                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary btn-sm">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
