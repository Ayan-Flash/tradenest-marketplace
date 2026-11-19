# TradeNest – Full-Stack Buy, Sell & Rent Digital Marketplace

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-6.0.11-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Google%20Gemini-3.8%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Vercel-Ready-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Ready" />
</p>

<p align="center">
  <strong>One unified platform to Buy, Sell, and Rent items with cryptographically secure OTP handovers and 24/7 intelligent assistance powered by Google Gemini 3.8 Flash.</strong>
</p>

---

## 🌟 Overview & Key Highlights

**TradeNest** is a full-stack digital marketplace engineered for seamless campus and community commerce. It eliminates the friction and risk of peer-to-peer exchanges through verified accounts, encrypted token sessions, automated inventory synchronization, and one-time password (OTP) delivery confirmations.

- **⚡ Lightning-Fast Frontend:** Built with React 18, Vite, and Bootstrap 5. Compiles production assets in ~1.2s.
- **🧠 24/7 AI Support:** Powered by Google's flagship **Gemini 3.8 Flash** model with intelligent context management, dynamic turn alternating, and resilient multi-model failover (`gemini-3.8-flash` ➔ `gemini-3.5-flash-lite` ➔ `gemini-3.1-flash-lite` ➔ `gemini-4-argon`).
- **🛡️ Secure OTP Handoff Verification:** Prevents payment and item disputes by generating unique 6-digit verification codes per transaction that sellers must validate before closing an order.
- **🐬 Modern MySQL Architecture:** Fast, reliable data persistence with connection pooling (`mysql2`) and automatic table schema generation (`users`, `items`, `cart_items`, `orders`).
- **🔐 Multi-Strategy Authentication:** Supports native JWT authentication with salted `bcrypt` password hashing as well as CAS (Central Authentication Service) Single Sign-On.
- **🤖 Bot & Fraud Protection:** Integrated Google reCAPTCHA verification to prevent automated spam and credential stuffing.
- **☁️ Cloud & Serverless Ready:** Seamless one-click deployment for Vercel, Render, Railway, or containerized Docker platforms.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite)"]
        UI["Bootstrap 5 UI Components"]
        Router["React Router 7"]
        ChatWidget["AI Support Chatbot View"]
    end

    subgraph API["Backend API (Express.js / Vercel Serverless)"]
        AuthMiddleware["JWT & CAS SSO Middleware"]
        MarketController["Items, Cart & Orders Controller"]
        OTPModule["OTP Generator & Bcrypt Validator"]
        GeminiService["Google Gemini 3.8 Flash Engine"]
    end

    subgraph Data["Database & External Services"]
        MySQL[("MySQL Database (Pool & Auto-Schema)")]
        GoogleAI["Google Gemini API (Generative Language)"]
        RecaptchaAPI["Google reCAPTCHA Verification"]
        CASServer["Institutional CAS Server"]
    end

    UI --> Router
    Router --> MarketController
    ChatWidget --> GeminiService
    AuthMiddleware --> API
    MarketController --> MySQL
    OTPModule --> MySQL
    GeminiService --> GoogleAI
    AuthMiddleware --> CASServer
    AuthMiddleware --> RecaptchaAPI
```

---

## 💻 Tech Stack

| Domain | Technology / Library | Purpose |
|---|---|---|
| **Frontend Framework** | React 18.3 | Component-driven, responsive user interface |
| **Build Tool** | Vite 6.0 | Ultra-fast HMR and optimized production bundles |
| **Styling & Icons** | Bootstrap 5.3 & Bootstrap Icons | Modern, mobile-responsive layout and typography |
| **Client Routing** | React Router 7.1 | Declarative single-page routing |
| **API Client** | Axios 1.7 | Promise-based HTTP requests with dynamic baseURL |
| **Backend Framework** | Node.js 22 & Express 4.21 | RESTful API server & serverless function bridge |
| **Database** | MySQL 8.0 (`mysql2`) | Relational data persistence with connection pooling |
| **AI Intelligence** | Google Gemini 3.8 Flash | Natural language customer support & marketplace guide |
| **Authentication** | JWT (`jsonwebtoken`) & `bcryptjs` | Stateless session management & password hashing |
| **Enterprise SSO** | `cas-authentication` | Institutional Central Authentication Service integration |
| **Bot Mitigation** | `react-google-recaptcha` | Human verification on sensitive routes |

---

## 📁 Repository Directory Layout

```text
tradenest-marketplace/
├── api/
│   └── index.js              # Serverless entrypoint for Vercel functions
├── backend/
│   ├── config/
│   │   └── db.js             # MySQL pool setup & automatic schema migration
│   ├── models/
│   │   ├── cart.model.js     # Shopping cart relational queries
│   │   ├── item.model.js     # Item listing, search, and category queries
│   │   ├── order.model.js    # Order lifecycle, status & OTP verification
│   │   └── user.model.js     # User registration, authentication & profiles
│   ├── chatbot.py            # Legacy standalone Python Flask chatbot
│   ├── index.js              # Backend entrypoint export
│   ├── package.json          # Backend-specific package manifest
│   ├── requirements.txt      # Python dependencies for legacy chatbot
│   └── server.js             # Core Express API server & routes
├── frontend/
│   ├── public/               # Public assets and favicon
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js     # Responsive marketplace header navigation
│   │   ├── pages/            # View components (Buy, Sell, Orders, Cart, Chatbot)
│   │   ├── api.js            # Unified dynamic API base configuration
│   │   ├── App.js            # Client router configuration
│   │   ├── index.css         # Application-level styling
│   │   └── index.js          # React DOM entrypoint
│   ├── index.html            # Vite HTML template with Bootstrap 5
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.js        # Vite config with preserveSymlinks & proxy
├── .env.example              # Environment variables template & pre-generated secrets
├── .gitignore                # Git ignore patterns
├── package.json              # Root project scripts & orchestrator
├── vercel.json               # Vercel multi-service routing definition
└── README.md                 # Complete project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher, v22 recommended)
- **npm** (v9.0.0 or higher)
- **MySQL Database** (Local instance or Cloud provider like TiDB Cloud, Aiven, or Railway)
- **Google Gemini API Key** (Get free from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/Ayan-Flash/tradenest-marketplace.git
cd tradenest-marketplace
```

### 2. Install Dependencies
Install all root, backend, and frontend dependencies:
```bash
npm install
npm --prefix frontend install
```

### 3. Configure Environment Variables
Copy the `.env.example` file to create your `.env` in the project root:
```bash
cp .env.example .env
```

Open `.env` and fill in your connection details:
```env
# Database: MySQL Connection String (URL Format)
MYSQL_URI=mysql://root:yourpassword@localhost:3306/tradenest

# Authentication Secrets (Pre-generated secure defaults provided)
JWT_SECRET=4cc385478345b6af501171cf632f9a1ceaf16e010565fe8f0ee881a2eb779659
SESSION_SECRET=9e01f99a6daba1af335a3db1e4945979f53bdd6b0a30142a5d8a7bb265cb4b13

# AI Chatbot: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# Optional: Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
```

### 4. Run the Project Locally
You can run the full stack simultaneously:

**Terminal 1 (Backend API):**
```bash
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run frontend
# Vite dev server starts at http://localhost:3000
```

Visit `http://localhost:3000` in your browser.

---

## 🗄️ Database Options (MySQL)

TradeNest features automated schema management. When the backend starts up, it automatically initializes all necessary tables (`users`, `items`, `cart_items`, `orders`) if they do not exist.

### Free Cloud Database Providers:

| Provider | Type | Free Tier Summary | Connection String Format |
|---|---|---|---|
| **[TiDB Cloud](https://tidbcloud.com)** *(Recommended)* | Serverless MySQL | 5 GB storage, generous query quota | `mysql://<user>.<prefix>:<password>@gateway01.<region>.prod.aws.tidbcloud.com:4000/<db>?ssl={"rejectUnauthorized":true}` |
| **[Aiven for MySQL](https://aiven.io)** | Managed MySQL | Free trial / Starter tier | `mysql://avnadmin:<password>@<host>.aivencloud.com:<port>/defaultdb?ssl-mode=REQUIRED` |
| **[Railway](https://railway.com)** | Containerized MySQL | $5 free monthly credit | `mysql://root:<password>@<host>:<port>/railway` |
| **Local MySQL / Docker** | Self-hosted | Local development | `mysql://root:password@localhost:3306/tradenest` |

> [!TIP]
> If using local MySQL, create the database before starting the backend:
> ```sql
> CREATE DATABASE tradenest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> ```

---

## 🤖 Google Gemini AI Chatbot Integration

TradeNest features an intelligent customer support assistant embedded directly in the marketplace:
- **Primary Engine:** `gemini-3.8-flash` delivers sub-second streaming answers with 1M token context capacity.
- **Failover Strategy:** If a quota or upstream limit is encountered, the backend automatically cascades across the latest supported models:
  1. `gemini-3.8-flash`
  2. `gemini-3.5-flash-lite`
  3. `gemini-3.1-flash-lite`
  4. `gemini-4-argon`
- **Alternating Turn Normalization:** Automatically conforms incoming chat history to Gemini's strict role rules (stripping orphaned assistant openings and merging consecutive turns).
- **Graceful Degradation:** In development environments without an active key, the assistant informs the user gracefully without crashing the application.

---

## 🌐 Production Deployment

### Deploying to Vercel (Recommended)

TradeNest is pre-configured with a multi-service `vercel.json` descriptor:

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New... ➔ Project**.
3. Import your `tradenest-marketplace` repository.
4. Add your **Environment Variables** in the Vercel dashboard:
   - `MYSQL_URI`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (set to `gemini-3.8-flash`)
5. Click **Deploy**. Vercel will build the frontend and configure the serverless Express backend automatically.

### Deploying to Render / Railway / Virtual Machines

To deploy the full-stack server as a single Node.js service:
```bash
# Build the production frontend bundle
npm run build

# Start the Node.js production server
npm start
```

---

## 📡 REST API Reference

### Public Routes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status, database engine, and timestamp |
| `POST` | `/api/signup` | Register a new user account |
| `POST` | `/api/login` | Authenticate user, verify reCAPTCHA, and receive JWT |
| `POST` | `/api/chat` | Chat with the Google Gemini 3.8 Flash AI Assistant |
| `POST` | `/api/new-session` | Clear or reset assistant conversation session |

### Authenticated Routes (`Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user` | Fetch current authenticated user's profile |
| `POST` | `/api/updateUser` | Update profile information |
| `GET` | `/api/search` | Search and filter marketplace listings |
| `GET` | `/api/items` | Fetch all active marketplace items |
| `POST` | `/api/sell` | Create a new listing (for sale or rent) |
| `POST` | `/api/cart` | Add, update, or remove an item in the user's cart |
| `GET` | `/api/mycart` | Retrieve current cart items and computed subtotal |
| `POST` | `/api/checkout` | Process order checkout and generate seller verification OTP |
| `GET` | `/api/recd_orders` | List incoming orders waiting for handoff/delivery |
| `POST` | `/api/cnfm_order` | Validate 6-digit OTP code to finalize order completion |
| `GET` | `/api/order_details` | Retrieve historical order logs (pending, bought, sold) |

---

## 🧪 Testing & Verification

Run the test suite and verify the build pipeline:
```bash
# Run test suite
npm test

# Verify backend JavaScript syntax
node --check backend/server.js

# Build production frontend assets
npm --prefix frontend run build
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

<p align="center">
  Built with ❤️ for secure, community-driven commerce.
</p>
