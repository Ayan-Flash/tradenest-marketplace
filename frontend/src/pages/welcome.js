import React from 'react';
import { Link } from 'react-router-dom';

function Welcome() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return (
    <div className="py-5 text-center">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="display-4 fw-bold text-primary mb-3">
            <span className="me-2">🪺</span>TradeNest
          </div>
          <p className="lead text-secondary mb-4">
            A unified digital marketplace to <strong>Buy</strong>, <strong>Sell</strong>, and <strong>Rent</strong> items with ease, verified security, and built-in AI assistance.
          </p>

          <div className="d-flex justify-content-center gap-3 mb-5 flex-wrap">
            {token ? (
              <>
                <Link to="/search" className="btn btn-primary btn-lg px-4">
                  Explore Marketplace
                </Link>
                <Link to="/sell" className="btn btn-outline-primary btn-lg px-4">
                  Sell an Item
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-lg px-4">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-outline-primary btn-lg px-4">
                  Create an Account
                </Link>
                <Link to="/search" className="btn btn-light border btn-lg px-4">
                  Browse Marketplace
                </Link>
              </>
            )}
          </div>

          <div className="row g-4 text-start">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm p-3">
                <div className="fs-1 text-primary mb-2">🛍️</div>
                <h5 className="fw-bold">Buy & Explore</h5>
                <p className="text-muted small">
                  Discover electronics, furniture, books, clothing, and everyday items listed by verified community members.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm p-3">
                <div className="fs-1 text-success mb-2">💰</div>
                <h5 className="fw-bold">Sell with OTP Security</h5>
                <p className="text-muted small">
                  List items in seconds. Close deals securely with one-time verification codes (OTP) upon item handoff.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm p-3">
                <div className="fs-1 text-info mb-2">🤖</div>
                <h5 className="fw-bold">AI Support Assistant</h5>
                <p className="text-muted small">
                  Integrated chatbot powered by OpenAI to assist you 24/7 with questions and marketplace navigation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
