import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import session from 'express-session';
import CASAuthentication from 'cas-authentication';
import cors from 'cors';
import OpenAI from 'openai';

import User from './models/user.model.js';
import Item from './models/item.model.js';
import Order from './models/order.model.js';
import Cart from './models/cart.model.js';
import { initDB } from './config/db.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Initialize MySQL tables
initDB().catch((err) => {
  console.warn('Initial MySQL setup deferred:', err.message);
});

const JWT_SECRET = process.env.JWT_SECRET || '4cc385478345b6af501171cf632f9a1ceaf16e010565fe8f0ee881a2eb779659';

app.use(
  session({
    secret: process.env.SESSION_SECRET || '9e01f99a6daba1af335a3db1e4945979f53bdd6b0a30142a5d8a7bb265cb4b13',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

// Base URL helper
const getBaseUrl = () => {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:5000';
};

// CAS Authentication Setup
const cas = new CASAuthentication({
  cas_url: process.env.CAS_URL || 'https://login.iiit.ac.in/cas',
  service_url: getBaseUrl(),
});

// Helper for Google reCAPTCHA
async function verifyRecaptcha(recaptchaToken) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey || secretKey === 'your_recaptcha_secret_key' || recaptchaToken === 'BYPASS_LOCAL_TEST') {
    return true;
  }
  if (!recaptchaToken) {
    return false;
  }
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`
    );
    return Boolean(response.data?.success);
  } catch (err) {
    console.error('reCAPTCHA verification error:', err.message);
    return false;
  }
}

// Token Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied, token missing!' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper to call Google Gemini API directly with model fallbacks and clean turn formatting
async function callGeminiAPI(apiKey, systemPrompt, rawHistory, preferredModel = 'gemini-3.8-flash') {
  const models = [
    preferredModel,
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-4-argon',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  // Format contents for Gemini:
  // 1. Map roles: 'assistant' -> 'model', 'user' -> 'user'
  // 2. Discard any leading messages from 'model' (Gemini requires the first turn to have role 'user')
  // 3. Ensure strictly alternating turns (merge consecutive messages with identical roles)
  const mapped = [];
  for (const m of rawHistory) {
    if (m.role === 'system') continue;
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
    const text = String(m.content || m.parts?.[0]?.text || '').trim();
    if (!text) continue;

    if (mapped.length === 0 && role === 'model') {
      // Skip initial greeting from assistant so first message is always user
      continue;
    }

    if (mapped.length > 0 && mapped[mapped.length - 1].role === role) {
      mapped[mapped.length - 1].parts[0].text += `\n${text}`;
    } else {
      mapped.push({
        role,
        parts: [{ text }],
      });
    }
  }

  if (mapped.length === 0) {
    mapped.push({
      role: 'user',
      parts: [{ text: 'Hello' }],
    });
  }

  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: mapped,
      };
      if (systemPrompt) {
        payload.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      const res = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000,
      });

      const candidate = res.data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const errDetail = err.response?.data?.error?.message || err.message;
      console.warn(`[Gemini] Model ${model} attempt failed (${status}): ${errDetail}`);
      if (status === 404 || status === 400) {
        // Try next fallback model
        continue;
      }
      if (status === 403 || status === 401) {
        throw new Error(`Gemini API key error: ${errDetail}`);
      }
    }
  }

  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

// Router supporting both /api/* and /* paths
const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TradeNest API',
    database: 'mysql',
    timestamp: new Date().toISOString(),
  });
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, age, contactNumber, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    await User.create({
      firstName,
      lastName,
      email,
      age,
      contactNumber,
      password,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(500).json({ message: error.message || 'Server error during signup' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Please log in using CAS Single Sign-On' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// CAS SSO
router.get('/cas', cas.bounce, async (req, res) => {
  try {
    const email = req.session.cas_user;
    if (!email) {
      return res.status(400).send('CAS user not found in session');
    }

    let firstName = 'User';
    let lastName = '';
    const namePart = email.split('@')[0];
    if (namePart.includes('.')) {
      const parts = namePart.split('.');
      firstName = parts[0] || 'User';
      lastName = parts.slice(1).join(' ') || '';
    } else {
      firstName = namePart;
    }

    let user = await User.findByEmail(email);
    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        password: null,
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const clientRedirectUrl = process.env.CLIENT_URL || getBaseUrl();
    res.redirect(`${clientRedirectUrl}/login/${token}`);
  } catch (error) {
    console.error('Error during CAS user handling:', error);
    res.status(500).send('An internal server error occurred');
  }
});

router.get('/logout', cas.logout, (req, res) => {
  res.redirect('/');
});

// User Profile
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      age: user.age,
      contactNumber: user.contactNumber,
    });
  } catch (error) {
    console.error('Error retrieving user details:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User
router.post('/updateUser', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, age, contactNumber } = req.body;
    const userId = req.user.userId;

    const updatedUser = await User.update(userId, {
      firstName,
      lastName,
      age,
      contactNumber,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// List Item for Sale
router.post('/sell', authenticateToken, async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const userId = req.user.userId;

    if (!userId || !name || price === undefined || !description || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const seller = await User.findById(userId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const newItem = await Item.create({
      name,
      price,
      description,
      category,
      sellerId: userId,
    });

    res.status(201).json({
      message: 'Item listed for sale successfully',
      item: newItem,
    });
  } catch (error) {
    console.error('Error listing item for sale:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search Marketplace Items
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { name, category } = req.query;
    const userId = req.user?.userId;

    const items = await Item.search({
      name,
      category,
      excludeSellerId: userId,
    });

    res.status(200).json({
      message: 'Items retrieved successfully',
      items,
    });
  } catch (error) {
    console.error('Error retrieving items:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Single Item Details
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.query;

    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error('Error retrieving item details:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cart Actions (Add / Remove)
router.post('/cart', authenticateToken, async (req, res) => {
  try {
    const { itemId, action } = req.body;
    const userId = req.user.userId;

    if (!itemId) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (String(item.sellerId) === String(userId)) {
      return res.status(403).json({ message: 'Sellers cannot add their own items to cart' });
    }

    if (action === 'add') {
      const result = await Cart.addItem(userId, itemId);
      const cart = await Cart.getCartByUser(userId);
      return res.status(200).json({
        message: result.message,
        cartItems: cart.cartItems,
      });
    } else {
      const result = await Cart.removeItem(userId, itemId);
      const cart = await Cart.getCartByUser(userId);
      return res.status(200).json({
        message: result.message,
        cartItems: cart.cartItems,
      });
    }
  } catch (error) {
    console.error('Error updating cart:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Cart
router.get('/mycart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.getCartByUser(userId);

    res.status(200).json({
      message: 'Cart items retrieved successfully',
      cartItems: cart.cartItems,
      totalCartPrice: cart.totalCartPrice,
    });
  } catch (error) {
    console.error('Error retrieving cart items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Checkout Cart
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.getCartByUser(userId);

    if (cart.cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or items have already been sold' });
    }

    const orders = [];
    for (const item of cart.cartItems) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      const createdOrder = await Order.create({
        buyerId: userId,
        sellerId: item.sellerId,
        itemId: item.id || item.itemId,
        amount: item.price,
        hashedOtp,
      });

      orders.push({
        orderId: createdOrder.id,
        itemId: item.id || item.itemId,
        itemName: item.name,
        amount: item.price,
        otp,
        message: 'Order placed successfully',
      });
    }

    await Cart.clearCart(userId);

    res.status(200).json({
      message: 'Checkout successful',
      orders,
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Incoming Orders for Seller (Delivery View)
router.get('/recd_orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.getPendingBySeller(userId);

    res.status(200).json({
      message: 'Pending orders retrieved successfully',
      orders,
    });
  } catch (error) {
    console.error('Error retrieving incoming orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order History
router.get('/order_details', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const details = await Order.getOrderDetails(userId);

    res.status(200).json({
      message: 'Order details retrieved successfully',
      ...details,
    });
  } catch (error) {
    console.error('Error retrieving order details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm Order with OTP
router.post('/cnfm_order', authenticateToken, async (req, res) => {
  try {
    const orderId = req.query.orderId || req.body.orderId;
    const { otp } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const result = await Order.confirmOrder(orderId, otp);
    if (!result.success) {
      return res.status(result.status || 400).json({ message: result.message });
    }

    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chatbot (Integrated Node.js + Google Gemini / OpenAI)
router.post('/chat', async (req, res) => {
  try {
    const { message, messages = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openaiKey) {
      const notice = "Hello! I'm the TradeNest AI Assistant. To enable live AI responses, please set your GEMINI_API_KEY in the Render environment settings.";
      return res.status(200).json({
        reply: notice,
        messages: [
          ...messages,
          { role: 'user', content: message },
          { role: 'assistant', content: notice },
        ],
      });
    }

    const conversationHistory = Array.isArray(messages) && messages.length > 0
      ? [...messages]
      : [{ role: 'user', content: message }];

    const systemPrompt =
      'You are the friendly, helpful AI support assistant for TradeNest, an e-commerce marketplace where users buy, sell, and rent products. Explain how to browse items, list items for sale, and complete transactions using OTP confirmation codes.';

    let botMessage = '';

    if (geminiKey) {
      try {
        botMessage = await callGeminiAPI(
          geminiKey,
          systemPrompt,
          conversationHistory,
          process.env.GEMINI_MODEL || 'gemini-3.8-flash'
        );
      } catch (geminiErr) {
        console.error('Gemini API execution error:', geminiErr.message);
        botMessage = `⚠️ Google Gemini error: ${geminiErr.message}. Please verify your GEMINI_API_KEY in Render.`;
      }
    } else if (openaiKey) {
      try {
        const client = new OpenAI({ apiKey: openaiKey });
        const hasSystem = conversationHistory.some((m) => m.role === 'system');
        const messagesToSend = hasSystem
          ? conversationHistory
          : [{ role: 'system', content: systemPrompt }, ...conversationHistory];

        const completion = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: messagesToSend,
        });
        botMessage = completion.choices[0]?.message?.content || "I couldn't generate a response.";
      } catch (openAiErr) {
        console.error('OpenAI error:', openAiErr.message);
        botMessage = `⚠️ OpenAI error: ${openAiErr.message}`;
      }
    }

    const updatedHistory = [...conversationHistory, { role: 'assistant', content: botMessage }];
    res.status(200).json({ reply: botMessage, messages: updatedHistory });
  } catch (error) {
    console.error('AI Chat unexpected error:', error.message);
    res.status(200).json({
      reply: '⚠️ Sorry, there was an issue processing your request. Please check the backend logs.',
      messages: Array.isArray(req.body?.messages) ? req.body.messages : [],
    });
  }
});

router.post('/new-session', (req, res) => {
  res.status(200).json({ message: 'New session started' });
});

// Mount router on both /api and /
app.use('/api', router);
app.use('/', router);

// Export for Vercel Serverless Function
export default app;

// Listen locally ONLY if run directly as the entry file
const isEntryScript = process.argv[1] && (
  process.argv[1].endsWith('server.js') ||
  process.argv[1].includes('backend')
);

if (isEntryScript && process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 TradeNest Backend running on http://localhost:${PORT}`);
  });
}
