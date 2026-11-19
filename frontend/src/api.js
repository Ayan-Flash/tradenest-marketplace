// Central API base URL configuration
// When hosted on Vercel, requests to /api are routed to Vercel serverless functions.
// In local development, /api is proxied by Vite to the backend on http://localhost:5000.
const getApiBaseUrl = () => {
  let url = '/api';
  if (typeof window !== 'undefined' && window.__API_URL__) {
    url = window.__API_URL__;
  } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL;
  }
  return url.replace(/\/+$/, '');
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
