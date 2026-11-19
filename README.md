# TradeNest – Buy, Sell & Rent Marketplace

<p align="center">
  <strong>One Platform. Buy, Sell, Rent. Powered by React, Express, MySQL & Vercel.</strong>
</p>

<p align="center">
  A unified, modern full-stack digital marketplace connecting buyers and sellers to purchase, sell, and rent items with OTP verification security and 24/7 AI-powered customer support.
</p>

---

## 🚀 Highlights & Production Status

- **100% Vercel Ready:** Deploys completely on Vercel as a multi-service project (`backend` + `frontend`).
- **Database:** Migrated to **MySQL** with connection pooling and automatic schema initialization (`users`, `items`, `cart_items`, `orders`).
- **High-Performance Frontend:** React 18 + Vite with Bootstrap 5 UI, building in under 2 seconds.
- **Integrated AI Support:** Built-in OpenAI customer assistant directly in the Node.js API (`/api/chat`).
- **OTP Delivery Verification:** Secure handoff verification using bcrypt-hashed 6-digit one-time passwords.
- **Zero Vulnerabilities:** Clean production dependency graph.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Bootstrap 5, React Router 7, Axios |
| **Backend & Serverless** | Node.js, Express.js, Vercel Serverless Functions |
| **Database** | MySQL (with mysql2 connection pooling & auto-migration) |
| **Authentication & Security** | JWT (JSON Web Tokens), bcryptjs, Google reCAPTCHA |
| **AI Integration** | OpenAI API (gpt-4o-mini / gpt-4o) |
| **Deployment Platform** | Vercel (Multi-Service Project) |

---

## Project Structure

```text
tradenest-marketplace/
├── api/
│   └── index.js              # Serverless entrypoint
├── backend/
│   ├── config/
│   │   └── db.js             # MySQL connection pool & automatic table schema creation
│   ├── models/
│   │   ├── cart.model.js     # Cart items queries
│   │   ├── item.model.js     # Marketplace items queries
│   │   ├── order.model.js    # Order & OTP verification queries
│   │   └── user.model.js     # User registration & authentication queries
│   ├── chatbot.py            # Legacy standalone Python Flask chatbot
│   ├── index.js              # Backend entrypoint bridge
│   ├── package.json          # Backend dependencies
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
├── .env.example              # Sample environment variables with generated secrets
├── .gitignore                # Git ignore configuration
├── package.json              # Root project scripts & backend dependencies
├── vercel.json               # Vercel multi-service project routing
└── README.md                 # Project documentation
```

---

## 🔑 Generated Production Secrets

Use these pre-generated cryptographically secure secrets in your `.env` or Vercel Environment Variables:

```env
JWT_SECRET=4cc385478345b6af501171cf632f9a1ceaf16e010565fe8f0ee881a2eb779659
SESSION_SECRET=9e01f99a6daba1af335a3db1e4945979f53bdd6b0a30142a5d8a7bb265cb4b13
```

---

## 🗄️ How to Get a MySQL Connection String

A standard MySQL connection URI follows this format:
```text
mysql://<username>:<password>@<host>:<port>/<database>
```

You can obtain a free cloud MySQL database in 2 minutes from any of these providers:

### Option 1: TiDB Cloud (Recommended - 100% MySQL Compatible & Free Tier)
1. Sign up for free at [tidbcloud.com](https://tidbcloud.com).
2. Click **Create Cluster** and select the free **Serverless** tier.
3. Once created, click **Connect** in your cluster dashboard.
4. Choose **Node.js** or **General connection string**.
5. Copy the connection string. It looks like:
   ```text
   mysql://<user>.<prefix>:<password>@gateway01.<region>.prod.aws.tidbcloud.com:4000/<database>?ssl={"rejectUnauthorized":true}
   ```

### Option 2: Aiven for MySQL (Free Tier)
1. Sign up at [aiven.io](https://aiven.io).
2. Create a new service and choose **MySQL**.
3. Under the **Overview** tab, copy the **Service URI**:
   ```text
   mysql://avnadmin:<password>@<host>.aivencloud.com:<port>/defaultdb?ssl-mode=REQUIRED
   ```

### Option 3: Railway (Instant MySQL)
1. Sign up at [railway.com](https://railway.com).
2. Click **New Project** ➔ **Provision MySQL**.
3. Under the MySQL service, click **Variables** ➔ copy `MYSQL_URL`.

### Option 4: Local MySQL (for development)
If running MySQL locally (e.g., MySQL Server, XAMPP, or Docker):
```text
mysql://root:yourpassword@localhost:3306/tradenest
```
*(Ensure you have created the database first with `CREATE DATABASE tradenest;`)*

---

## 🌐 Deploying to Vercel

### Step 1: Push Repository to GitHub
Ensure all your project files are pushed to GitHub:
```bash
git add .
git commit -m "Migrate from MongoDB to MySQL"
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New...** ➔ **Project**.
2. Select your repository (`tradenest-marketplace`).
3. Vercel will automatically detect the `vercel.json` Multi-Service Project configuration:
   - **backend:** `root: backend, framework: express`
   - **frontend:** `root: frontend, framework: vite`

### Step 3: Configure Environment Variables in Vercel
In the Vercel project setup (under **Environment Variables**), add:

| Variable | Value |
|---|---|
| `MYSQL_URI` | Your MySQL connection string (from TiDB, Aiven, Railway, etc.) |
| `JWT_SECRET` | `4cc385478345b6af501171cf632f9a1ceaf16e010565fe8f0ee881a2eb779659` |
| `SESSION_SECRET` | `9e01f99a6daba1af335a3db1e4945979f53bdd6b0a30142a5d8a7bb265cb4b13` |
| `OPENAI_API_KEY` | *(Optional)* Your OpenAI key for AI chatbot responses |
| `RECAPTCHA_SECRET_KEY` | *(Optional)* Your Google reCAPTCHA secret key |

### Step 4: Deploy
Click **Deploy**. Vercel will build both services in parallel and your full-stack MySQL-powered marketplace will be live!

---

## 💻 Local Development Setup

### 1. Install Dependencies
```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

### 2. Configure Local Environment
Create `.env` in the root directory:
```bash
cp .env.example .env
```
Update `MYSQL_URI` with your MySQL database credentials.

### 3. Run Locally
Run the backend:
```bash
npm run dev
# Starts on http://localhost:5000
```

In another terminal, run the frontend:
```bash
npm run frontend
# Starts on http://localhost:3000
```

---

## 📋 API Endpoints Reference

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health check & MySQL status | No |
| `POST` | `/api/signup` | Register a new user | No |
| `POST` | `/api/login` | Authenticate user & get JWT | No |
| `GET` | `/api/user` | Get profile details | Yes |
| `POST` | `/api/updateUser` | Update profile information | Yes |
| `GET` | `/api/search` | Search & filter items | Yes |
| `GET` | `/api/items` | Get item details | Yes |
| `POST` | `/api/sell` | List an item for sale | Yes |
| `POST` | `/api/cart` | Add/remove items from cart | Yes |
| `GET` | `/api/mycart` | Get cart items & subtotal | Yes |
| `POST` | `/api/checkout` | Checkout cart & generate OTP | Yes |
| `GET` | `/api/recd_orders` | Incoming orders for delivery | Yes |
| `POST` | `/api/cnfm_order` | Confirm handover with OTP | Yes |
| `GET` | `/api/order_details` | Order history (pending, bought, sold) | Yes |
| `POST` | `/api/chat` | AI chatbot customer assistant | No |
| `POST` | `/api/new-session` | Reset AI chatbot session | No |
