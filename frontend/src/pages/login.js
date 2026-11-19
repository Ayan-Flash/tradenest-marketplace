import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate, Link, useParams } from 'react-router-dom';
import API_BASE_URL from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      navigate('/user');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
        recaptchaToken: recaptchaToken || 'BYPASS_LOCAL_TEST',
      });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/search');
      } else {
        setErrorMessage('Login failed: Token not received.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      const msg = error.response?.data?.message || 'Invalid email or password';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const onRecaptchaChange = (value) => {
    setRecaptchaToken(value);
  };

  return (
    <div className="row justify-content-center py-4">
      <div className="col-12 col-md-6 col-lg-5">
        <div className="card shadow-sm border-0 p-4">
          <h2 className="text-center fw-bold mb-4">Welcome Back</h2>

          {errorMessage && (
            <div className="alert alert-danger py-2" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3 d-flex justify-content-center">
              <ReCAPTCHA
                sitekey="6LfQxs0qAAAAAJD5Vvr2rgPdG8Gsixta_JfBL9Z8"
                onChange={onRecaptchaChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <hr className="my-4" />

          <div className="text-center">
            <p className="mb-2 text-muted">
              Don't have an account?{' '}
              <Link to="/signup" className="fw-semibold text-decoration-none">
                Sign up
              </Link>
            </p>
            <Link to="/cas" className="btn btn-outline-secondary btn-sm">
              Login with CAS SSO
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
