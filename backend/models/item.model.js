import { query } from '../config/db.js';

export const Item = {
  async create({ name, price, description, category, sellerId }) {
    const result = await query(
      `INSERT INTO items (name, price, description, category, sellerId, isSold)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [name.trim(), Number(price), description.trim(), category.trim(), sellerId]
    );

    return {
      id: result.insertId,
      name,
      price: Number(price),
      description,
      category,
      sellerId,
      isSold: false,
    };
  },

  async findById(id) {
    const rows = await query(
      `SELECT i.*, u.firstName, u.lastName, u.email as sellerEmail
       FROM items i
       LEFT JOIN users u ON i.sellerId = u.id
       WHERE i.id = ? LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    return {
      id: row.id,
      itemId: row.id,
      name: row.name,
      price: Number(row.price),
      description: row.description,
      category: row.category,
      sellerId: row.sellerId,
      isSold: Boolean(row.isSold),
      seller: {
        name: row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : 'Community Seller',
        email: row.sellerEmail || '',
      },
    };
  },

  async search({ name, category, excludeSellerId }) {
    let sql = `
      SELECT i.*, u.firstName, u.lastName, u.email as sellerEmail
      FROM items i
      LEFT JOIN users u ON i.sellerId = u.id
      WHERE i.isSold = FALSE
    `;
    const params = [];

    if (name) {
      sql += ' AND i.name LIKE ?';
      params.push(`%${name.trim()}%`);
    }

    if (category) {
      const categories = category.split(',').map((c) => c.trim()).filter(Boolean);
      if (categories.length > 0) {
        const placeholders = categories.map(() => '?').join(',');
        sql += ` AND i.category IN (${placeholders})`;
        params.push(...categories);
      }
    }

    if (excludeSellerId) {
      sql += ' AND i.sellerId != ?';
      params.push(excludeSellerId);
    }

    sql += ' ORDER BY i.createdAt DESC';

    const rows = await query(sql, params);

    return rows.map((row) => ({
      id: row.id,
      itemId: row.id,
      name: row.name,
      price: Number(row.price),
      description: row.description,
      category: row.category,
      sellerId: row.sellerId,
      isSold: Boolean(row.isSold),
      seller: {
        name: row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : 'Community Seller',
        email: row.sellerEmail || '',
      },
    }));
  },

  async markAsSold(id) {
    await query('UPDATE items SET isSold = TRUE WHERE id = ?', [id]);
  },
};

export default Item;
