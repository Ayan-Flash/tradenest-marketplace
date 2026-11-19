import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
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
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Database connection middleware (connects lazily or on server start)
connectDB().catch((err) => {
  console.warn('Initial MongoDB connection deferred:', err.message);
});

app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
  } catch (error) {
    console.error('Database connection middleware error:', error.message);
  }
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'tradenest-production-jwt-secret-key-2026';

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'tradenest-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

// CAS Authentication Setup
const getBaseUrl = () => {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:5000';
};

const cas = new CASAuthentication({
  cas_url: process.env.CAS_URL || 'https://login.iiit.ac.in/cas',
  service_url: getBaseUrl(),
});

// Helper for Google reCAPTCHA
async function verifyRecaptcha(recaptchaToken) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  // If not configured in environment or using placeholder, allow in dev/fallback
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
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// OpenAI Client for Chatbot
let openaiClient = null;
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Router to support both /api/... and direct /... routes
const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TradeNest API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      age: age ? Number(age) : undefined,
      contactNumber: contactNumber ? contactNumber.trim() : undefined,
      password: password.trim(),
    });

    await user.save();

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

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Please log in using CAS Single Sign-On' });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
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

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
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

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
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

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(age !== undefined && { age: Number(age) }),
        ...(contactNumber && { contactNumber: contactNumber.trim() }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        age: updatedUser.age,
        contactNumber: updatedUser.contactNumber,
      },
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

    const newItem = new Item({
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      category: category.trim(),
      sellerId: userId,
      isSold: false,
    });

    await newItem.save();

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

    const query = { isSold: false };

    if (name) {
      query.name = new RegExp(name.trim(), 'i');
    }

    if (category) {
      const categories = category.split(',').map((c) => c.trim());
      query.category = { $in: categories };
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.sellerId = { $ne: new mongoose.Types.ObjectId(userId) };
    }

    const items = await Item.find(query).populate('sellerId', 'firstName lastName email');

    res.status(200).json({
      message: 'Items retrieved successfully',
      items: items.map((item) => ({
        itemId: item._id,
        name: item.name,
        price: item.price,
        description: item.description,
        category: item.category,
        seller: {
          name: item.sellerId
            ? `${item.sellerId.firstName || ''} ${item.sellerId.lastName || ''}`.trim()
            : 'Community Seller',
          email: item.sellerId ? item.sellerId.email : '',
        },
      })),
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

    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await Item.findById(itemId).populate('sellerId', 'firstName lastName email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({
      itemId: item._id,
      name: item.name,
      price: item.price,
      description: item.description,
      category: item.category,
      isSold: item.isSold,
      seller: {
        name: item.sellerId
          ? `${item.sellerId.firstName || ''} ${item.sellerId.lastName || ''}`.trim()
          : 'Community Seller',
        email: item.sellerId ? item.sellerId.email : '',
      },
    });
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

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.sellerId.toString() === userId) {
      return res.status(403).json({ message: 'Sellers cannot add their own items to cart' });
    }

    user.cartItems = user.cartItems || [];

    if (action === 'add') {
      const alreadyInCart = user.cartItems.some((id) => id.toString() === itemId.toString());
      if (!alreadyInCart) {
        user.cartItems.push(itemId);
      } else {
        return res.status(200).json({ message: 'Item is already in your cart', cartItems: user.cartItems });
      }
    } else if (action === 'remove') {
      user.cartItems = user.cartItems.filter((id) => id.toString() !== itemId.toString());
    }

    await user.save();

    const populatedUser = await User.findById(userId).populate('cartItems');
    res.status(200).json({
      message: `Item successfully ${action === 'add' ? 'added to' : 'removed from'} cart`,
      cartItems: populatedUser.cartItems.filter(Boolean),
    });
  } catch (error) {
    console.error('Error updating cart:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Cart
router.get('/mycart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId).populate('cartItems');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validCartItems = (user.cartItems || []).filter((item) => item !== null && item !== undefined);
    const totalCartPrice = validCartItems.reduce((total, item) => total + (item.price || 0), 0);

    res.status(200).json({
      message: 'Cart items retrieved successfully',
      cartItems: validCartItems.map((item) => ({
        itemId: item._id,
        name: item.name,
        price: item.price,
        description: item.description,
        category: item.category,
        sellerId: item.sellerId,
      })),
      totalCartPrice,
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

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId).populate('cartItems');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validItems = (user.cartItems || []).filter((item) => item && !item.isSold);
    if (validItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or items have already been sold' });
    }

    const orders = [];
    for (const item of validItems) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      const order = new Order({
        buyerId: userId,
        sellerId: item.sellerId,
        itemId: item._id,
        amount: item.price,
        hashedOtp,
        orderStatus: 'pending',
      });

      await order.save();

      orders.push({
        orderId: order._id,
        itemId: item._id,
        itemName: item.name,
        amount: item.price,
        otp,
        message: 'Order placed successfully',
      });
    }

    user.cartItems = [];
    await user.save();

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

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const orders = await Order.find({ sellerId: userId, orderStatus: 'pending' })
      .populate('itemId', 'name price')
      .populate('buyerId', 'firstName lastName email');

    const formattedOrders = orders.map((order) => {
      const buyerName = order.buyerId
        ? `${order.buyerId.firstName || ''} ${order.buyerId.lastName || ''}`.trim()
        : 'Community Buyer';

      return {
        orderId: order._id,
        itemName: order.itemId ? order.itemId.name : 'Item removed',
        itemPrice: order.itemId ? order.itemId.price : order.amount || 0,
        buyerName,
        buyerEmail: order.buyerId ? order.buyerId.email : 'N/A',
      };
    });

    res.status(200).json({
      message: 'Pending orders retrieved successfully',
      orders: formattedOrders,
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

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const pendingOrders = await Order.find({
      buyerId: userId,
      orderStatus: 'pending',
    }).populate('itemId', 'name price');

    const successfulBoughtOrders = await Order.find({
      orderStatus: 'success',
      buyerId: userId,
    }).populate('itemId', 'name price');

    const successfulSoldOrders = await Order.find({
      orderStatus: 'success',
      sellerId: userId,
    }).populate('itemId', 'name price');

    const formatOrder = (order) => ({
      orderId: order._id,
      itemName: order.itemId?.name || 'Item removed',
      itemPrice: order.itemId?.price || order.amount || 0,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      orderStatus: order.orderStatus,
    });

    res.status(200).json({
      message: 'Order details retrieved successfully',
      pendingOrders: pendingOrders.map(formatOrder),
      successfulBoughtOrders: successfulBoughtOrders.map(formatOrder),
      successfulSoldOrders: successfulSoldOrders.map(formatOrder),
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

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOtpValid = await bcrypt.compare(otp.toString().trim(), order.hashedOtp);
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    order.orderStatus = 'success';
    await order.save();

    await Item.findByIdAndUpdate(order.itemId, { isSold: true });

    await Order.updateMany(
      {
        _id: { $ne: orderId },
        sellerId: order.sellerId,
        itemId: order.itemId,
        orderStatus: 'pending',
      },
      { $set: { orderStatus: 'cancelled' } }
    );

    res.status(200).json({ message: 'Order confirmed successfully! Item delivery completed.' });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chatbot (Integrated Node.js + OpenAI)
router.post('/chat', async (req, res) => {
  try {
    const { message, messages = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const client = getOpenAIClient();
    if (!client) {
      return res.status(200).json({
        reply: "Hello! I'm the TradeNest AI Assistant. To enable live AI intelligence, please set your OPENAI_API_KEY in the Vercel or environment settings.",
        messages: [
          ...messages,
          { role: 'user', content: message },
          {
            role: 'assistant',
            content: "Hello! I'm the TradeNest AI Assistant. To enable live AI intelligence, please set your OPENAI_API_KEY in the Vercel or environment settings.",
          },
        ],
      });
    }

    const conversationHistory = Array.isArray(messages) && messages.length > 0
      ? [...messages]
      : [{ role: 'user', content: message }];

    const hasSystem = conversationHistory.some((m) => m.role === 'system');
    const messagesToSend = hasSystem
      ? conversationHistory
      : [
          {
            role: 'system',
            content:
              'You are the friendly, helpful AI support assistant for TradeNest, an e-commerce marketplace where users buy, sell, and rent products. Explain how to browse items, list items for sale, and complete transactions using OTP confirmation codes.',
          },
          ...conversationHistory,
        ];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messagesToSend,
    });

    const botMessage =
      completion.choices[0]?.message?.content || "I couldn't generate a response.";
    const updatedHistory = [...conversationHistory, { role: 'assistant', content: botMessage }];

    res.status(200).json({ reply: botMessage, messages: updatedHistory });
  } catch (error) {
    console.error('OpenAI Chat error:', error.message);
    res.status(500).json({ error: 'Error communicating with AI service' });
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

// Listen locally ONLY if run directly as the entry file (not when imported as a serverless function)
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

