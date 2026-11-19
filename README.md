# TradeNest – Buy, Sell & Rent Marketplace

<p align="center">
  <strong>One Platform. Buy, Sell, Rent.</strong>
</p>

<p align="center">
  A unified digital marketplace that connects buyers and sellers, making it easier to purchase, sell, and rent products through a single platform.
</p>

---

## About the Project

**TradeNest** is a full-stack e-commerce marketplace designed to simplify the way people buy, sell, and rent products.

The platform provides a convenient environment where users can explore available products, list their own items for sale or rent, manage orders, and receive assistance through an AI-powered customer support chatbot.

By combining multiple transaction models into one application, TradeNest aims to provide a flexible and accessible marketplace experience.

## Key Features

### Authentication & User Management

- User registration and login using email and password.
- JWT-based authentication.
- Institutional CAS-based Single Sign-On (SSO) integration.
- Google reCAPTCHA protection.
- User profile management.

### Product Marketplace

- Browse products available for purchase or rental.
- Explore available marketplace listings.
- View product information.
- Access buying and renting options.

### Sell & Rent

- List products for sale.
- Make products available for rental.
- Manage product listings.

### Order Management

- Place product orders.
- Complete the checkout process.
- Track order information and status.

### AI-Powered Customer Support

- Integrated AI chatbot for customer assistance.
- Natural language interaction.
- OpenAI API integration.
- Dedicated Python-based chatbot service.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Bootstrap |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | JWT, bcrypt, CAS |
| Security | Google reCAPTCHA |
| AI Integration | Python, Flask, OpenAI API |

## System Architecture

TradeNest follows a multi-tier architecture consisting of a frontend application, backend server, database, and an independent AI chatbot service.

```text
                 TRADENEST
                     |
          +----------+----------+
          |                     |
       FRONTEND              BACKEND
       React.js           Node.js + Express
          |                     |
          +------ API ----------+
                                |
                         MongoDB Database
                                |
                       Python Chatbot Service
                                |
                            OpenAI API
```

### Architecture Components

- **Frontend:** Handles user interactions, product browsing, and marketplace operations.
- **Backend:** Manages application logic, authentication, API requests, and order operations.
- **Database:** MongoDB stores user, product, and order-related information.
- **Chatbot Service:** A separate Python service handles AI-powered customer support using the OpenAI API.

## Project Structure

```text
TradeNest/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── item.model.js
│   │   ├── order.model.js
│   │   └── user.model.js
│   │
│   ├── chatbot.py
│   ├── requirements.txt
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Installation & Setup

Follow the instructions below to run TradeNest on your local machine.

### Prerequisites

Make sure you have installed:

- Node.js (v16 or above)
- npm
- Python (v3.8 or above)
- MongoDB account or connection string
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/finefigo/tradenest-marketplace.git
```

Navigate to the project directory:

```bash
cd tradenest-marketplace
```

### 2. Install Node.js Dependencies

From the project root directory:

```bash
npm install
```

### 3. Install Python Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Configure Environment Variables

TradeNest requires environment variables for database connectivity, authentication, security, and AI chatbot integration.

Create two separate `.env` files.

**Root directory `.env`**

```env
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

**Backend directory `backend/.env`**

```env
OPENAI_API_KEY=your_openai_api_key
```

Replace the placeholder values with your actual credentials.

**Security Notice:**

- Never upload `.env` files to GitHub.
- Never expose API keys, database credentials, or JWT secrets.
- Use environment variables for sensitive configuration.

### 5. Start the Backend Server

From the root directory:

```bash
npm run dev
```

### 6. Start the AI Chatbot Service

Open a new terminal:

```bash
python backend/chatbot.py
```

The chatbot service runs on port `5001`.

### 7. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

Once all services are running, access the application using the local URL displayed by the frontend development server.

## Security Implementation

The application incorporates several security measures:

- JWT-based user authentication.
- Password hashing using bcrypt.
- Google reCAPTCHA protection against automated requests.
- Environment-based secret management.
- Input validation and sanitization.

## Future Enhancements

The following features are potential areas for future development:

- Advanced product search and filtering.
- Wishlist and saved products.
- Product ratings and customer reviews.
- Enhanced seller dashboard.
- Rental duration and pricing calculator.
- Real-time buyer-seller communication.
- Secure online payment gateway.
- Admin dashboard and marketplace analytics.
- Enhanced AI-powered customer assistance.

*These are planned improvements and are not claimed as existing functionality.*

## Project Information

**Project Name:** TradeNest

**Category:** Full-Stack Web Application / E-Commerce Marketplace

**Developer & Maintainer:** Faisal Imtiaz

**GitHub:** [finefigo](https://github.com/finefigo)

---

<p align="center">
  <strong>TradeNest</strong>
  <br/>
  One Platform. Buy, Sell, Rent.
  <br/><br/>
  Built using React, Node.js, MongoDB and Python.
</p>
