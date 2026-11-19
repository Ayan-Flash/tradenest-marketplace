import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

export const Order = {
  async create({ buyerId, sellerId, itemId, amount, hashedOtp }) {
    const result = await query(
      `INSERT INTO orders (buyerId, sellerId, itemId, amount, hashedOtp, orderStatus)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [buyerId, sellerId, itemId, Number(amount), hashedOtp]
    );

    return {
      id: result.insertId,
      orderId: result.insertId,
      buyerId,
      sellerId,
      itemId,
      amount,
      orderStatus: 'pending',
    };
  },

  async findById(id) {
    const rows = await query('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async getPendingBySeller(sellerId) {
    const sql = `
      SELECT o.id as orderId, o.amount as itemPrice, i.name as itemName,
             u.firstName, u.lastName, u.email as buyerEmail
      FROM orders o
      JOIN items i ON o.itemId = i.id
      JOIN users u ON o.buyerId = u.id
      WHERE o.sellerId = ? AND o.orderStatus = 'pending'
      ORDER BY o.createdAt DESC
    `;
    const rows = await query(sql, [sellerId]);

    return rows.map((r) => ({
      orderId: r.orderId,
      itemName: r.itemName || 'Unknown Item',
      itemPrice: Number(r.itemPrice || 0),
      buyerName: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Community Buyer',
      buyerEmail: r.buyerEmail || 'N/A',
    }));
  },

  async getOrderDetails(userId) {
    const baseSql = `
      SELECT o.id as orderId, o.amount as itemPrice, o.buyerId, o.sellerId, o.orderStatus,
             i.name as itemName
      FROM orders o
      LEFT JOIN items i ON o.itemId = i.id
    `;

    const pendingOrders = await query(
      `${baseSql} WHERE o.buyerId = ? AND o.orderStatus = 'pending' ORDER BY o.createdAt DESC`,
      [userId]
    );

    const successfulBoughtOrders = await query(
      `${baseSql} WHERE o.buyerId = ? AND o.orderStatus = 'success' ORDER BY o.createdAt DESC`,
      [userId]
    );

    const successfulSoldOrders = await query(
      `${baseSql} WHERE o.sellerId = ? AND o.orderStatus = 'success' ORDER BY o.createdAt DESC`,
      [userId]
    );

    const formatOrder = (r) => ({
      orderId: r.orderId,
      itemName: r.itemName || 'Item removed',
      itemPrice: Number(r.itemPrice || 0),
      buyerId: r.buyerId,
      sellerId: r.sellerId,
      orderStatus: r.orderStatus,
    });

    return {
      pendingOrders: pendingOrders.map(formatOrder),
      successfulBoughtOrders: successfulBoughtOrders.map(formatOrder),
      successfulSoldOrders: successfulSoldOrders.map(formatOrder),
    };
  },

  async confirmOrder(orderId, otp) {
    const order = await this.findById(orderId);
    if (!order) {
      return { success: false, status: 404, message: 'Order not found' };
    }

    const isOtpValid = await bcrypt.compare(otp.toString().trim(), order.hashedOtp);
    if (!isOtpValid) {
      return { success: false, status: 400, message: 'Invalid OTP' };
    }

    // Mark current order as success
    await query("UPDATE orders SET orderStatus = 'success' WHERE id = ?", [orderId]);

    // Mark item as sold
    await query('UPDATE items SET isSold = TRUE WHERE id = ?', [order.itemId]);

    // Cancel other pending orders for the same item
    await query(
      "UPDATE orders SET orderStatus = 'cancelled' WHERE itemId = ? AND id != ? AND orderStatus = 'pending'",
      [order.itemId, orderId]
    );

    return { success: true, message: 'Order confirmed successfully! Item delivery completed.' };
  },
};

export default Order;
