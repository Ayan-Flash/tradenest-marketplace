# TradeNest – Buy, Sell & Rent Marketplace

<p align="center">
  <strong>One Platform. Buy, Sell, Rent. Ready for 100% Serverless Vercel Deployment.</strong>
</p>

<p align="center">
  A unified, modern full-stack digital marketplace connecting buyers and sellers to purchase, sell, and rent items with OTP verification security and 24/7 AI-powered customer support.
</p>

---

## 🚀 Highlights & Production Status

- **100% Vercel Ready:** Deploys completely on Vercel as a single project with zero external Python servers required.
- **Serverless API:** Express.js backend running via Vercel Serverless Functions (`/api/*`).
- **High-Performance Frontend:** Upgraded to React 18 + Vite with Bootstrap 5 UI, building in under 2 seconds.
- **Integrated AI Support:** Built-in OpenAI customer assistant directly in the Node.js API.
- **OTP Delivery Verification:** Secure handoff verification using bcrypt-hashed 6-digit one-time passwords.
- **Zero Vulnerabilities:** Clean production dependency graph.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Bootstrap 5, React Router 7, Axios |
| **Backend & Serverless** | Node.js, Express.js, Vercel Serverless Functions |
| **Database** | MongoDB with Mongoose ODM (connection caching enabled) |
| **Authentication & Security** | JWT (JSON Web Tokens), bcryptjs, Google reCAPTCHA |
| **AI Integration** | OpenAI API (gpt-4o-mini / gpt-4o) |
| **Deployment Platform** | Vercel (Frontend Static Assets + Serverless API Functions) |

---

## Project Structure

```text
tradenest-marketplace/
├── api/
│   └── index.js              # Vercel serverless entrypoint for Express API
├── backend/
│   ├── config/
│   │   └── db.js             # Mongoose connection with serverless caching
│   ├── models/
│   │   ├── item.model.js     # Marketplace items schema
│   │   ├── order.model.js    # Order & OTP schema
│   │   └── user.model.js     # User authentication schema
│   ├── chatbot.py            # Legacy standalone Python Flask chatbot
│   ├── requirements.txt      # Python dependencies (optional)
│   └── server.js             # Express API server & routes
├── frontend/
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js     # Shared marketplace navigation
│   │   ├── pages/            # Marketplace views & workflows
│   │   ├── api.js            # Unified dynamic API base configuration
│   │   ├── App.js            # Main application router
│   │   ├── index.css         # Custom styling
│   │   └── index.js          # React DOM entrypoint
│   ├── index.html            # Vite HTML template with Bootstrap 5
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.js        # Vite configuration & dev proxy
├── .env.example              # Sample environment variables
├── .gitignore                # Git ignore configuration
├── package.json              # Root project scripts & backend dependencies
├── vercel.json               # Vercel deployment & routing configuration
└── README.md                 # Project documentation
```

---

## 🌐 Complete Vercel Deployment Guide

TradeNest is pre-configured with `vercel.json` to deploy both frontend static assets and backend serverless API routes within a single Vercel project.

### Step 1: Push Repository to GitHub
Ensure all your project files are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Production ready TradeNest for Vercel"
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository (`tradenest-marketplace`).
4. Keep the **Framework Preset** as **Other** (or Vite).
5. Vercel will automatically read `vercel.json` for the build settings:
   - **Build Command:** `npm --prefix frontend install && npm --prefix frontend run build`
   - **Output Directory:** `frontend/dist`

### Step 3: Configure Environment Variables in Vercel
In the Vercel project setup (or under **Settings** -> **Environment Variables**), add the following:

| Variable | Description | Example / Default |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/tradenest` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `your_secure_32_character_jwt_secret` |
| `SESSION_SECRET` | Session secret for express sessions | `your_secure_session_secret` |
| `OPENAI_API_KEY` | OpenAI API key for AI assistant | `sk-...` |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret key | *(Optional in dev, recommended for prod)* |

### Step 4: Deploy
Click **Deploy**. In under a minute, your full-stack TradeNest marketplace will be live on a `*.vercel.app` domain!

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v18 or above recommended)
- MongoDB running locally or a MongoDB Atlas connection string

### 2. Install Dependencies
Install root and backend packages:
```bash
npm install
```

Install frontend packages:
```bash
npm --prefix frontend install
```

### 3. Configure Local Environment
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Fill in your `MONGODB_URI` and `JWT_SECRET`.

### 4. Run the Application Locally
Run the backend API:
```bash
npm run dev
# Starts backend server on http://localhost:5000
```

In a second terminal, run the frontend:
```bash
npm run frontend
# Starts Vite dev server on http://localhost:3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser. All API requests made to `/api/*` are automatically proxied to `http://localhost:5000`.

---

## 🔒 Security Architecture

- **JWT Authentication:** Stateful token verification with expiration checks on protected endpoints.
- **Bcrypt Password Hashing:** Automatically hashes passwords before saving to MongoDB.
- **OTP Delivery Verification:** Checkout produces a 6-digit OTP stored as a bcrypt hash in MongoDB. The seller cannot complete the transaction without entering the buyer's matching OTP.
- **reCAPTCHA Protection:** Protects login endpoints against automated bots with development fallback.
- **Input Sanitization & Validation:** Prevents common injection attacks and verifies MongoDB ObjectIDs before queries.

---

## 📋 API Endpoints Reference

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health check & database connection status | No |
| `POST` | `/api/signup` | Register a new user account | No |
| `POST` | `/api/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/user` | Retrieve user profile information | Yes |
| `POST` | `/api/updateUser` | Update user profile details | Yes |
| `GET` | `/api/search` | Search & filter active marketplace listings | Yes |
| `GET` | `/api/items` | Retrieve specific product details | Yes |
| `POST` | `/api/sell` | List a new item for sale | Yes |
| `POST` | `/api/cart` | Add or remove items from cart | Yes |
| `GET` | `/api/mycart` | Get current user's cart and subtotal | Yes |
| `POST` | `/api/checkout` | Checkout cart and generate OTPs | Yes |
| `GET` | `/api/recd_orders` | Incoming orders for seller delivery | Yes |
| `POST` | `/api/cnfm_order` | Confirm order handover with OTP | Yes |
| `GET` | `/api/order_details` | Order history (pending, bought, sold) | Yes |
| `POST` | `/api/chat` | AI chatbot customer assistant | No |
| `POST` | `/api/new-session` | Reset AI chatbot session | No |

---

## Project Information

**Project Name:** TradeNest  
**Category:** Full-Stack Web Application / E-Commerce Marketplace  
**Maintainer:** Faisal Imtiaz  
**GitHub:** [finefigo](https://github.com/finefigo)
