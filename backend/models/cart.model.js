import { query } from '../config/db.js';

export const Cart = {
  async getCartByUser(userId) {
    const sql = `
      SELECT c.id as cartEntryId, i.id, i.name, i.price, i.description, i.category, i.sellerId, i.isSold
      FROM cart_items c
      JOIN items i ON c.itemId = i.id
      WHERE c.userId = ?
      ORDER BY c.createdAt DESC
    `;
    const rows = await query(sql, [userId]);

    const validItems = rows.filter((r) => !r.isSold);
    const totalCartPrice = validItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

    return {
      cartItems: validItems.map((item) => ({
        id: item.id,
        itemId: item.id,
        name: item.name,
        price: Number(item.price),
        description: item.description,
        category: item.category,
        sellerId: item.sellerId,
      })),
      totalCartPrice,
    };
  },

  async addItem(userId, itemId) {
    const existing = await query(
      'SELECT id FROM cart_items WHERE userId = ? AND itemId = ? LIMIT 1',
      [userId, itemId]
    );

    if (existing.length > 0) {
      return { message: 'Item is already in your cart', alreadyInCart: true };
    }

    await query('INSERT INTO cart_items (userId, itemId) VALUES (?, ?)', [userId, itemId]);
    return { message: 'Item successfully added to cart', alreadyInCart: false };
  },

  async removeItem(userId, itemId) {
    await query('DELETE FROM cart_items WHERE userId = ? AND itemId = ?', [userId, itemId]);
    return { message: 'Item successfully removed from cart' };
  },

  async clearCart(userId) {
    await query('DELETE FROM cart_items WHERE userId = ?', [userId]);
  },
};

export default Cart;
