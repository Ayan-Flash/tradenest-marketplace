import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

export const User = {
  async findByEmail(email) {
    const normalized = email.toLowerCase().trim();
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalized]);
    return rows[0] || null;
  },

  async findById(id) {
    const rows = await query(
      'SELECT id, firstName, lastName, email, age, contactNumber, sellerReviews, createdAt FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ firstName, lastName, email, age, contactNumber, password }) {
    const normalized = email.toLowerCase().trim();
    const hashedPassword = password ? await bcrypt.hash(password.trim(), 10) : null;

    const result = await query(
      `INSERT INTO users (firstName, lastName, email, age, contactNumber, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        firstName.trim(),
        lastName.trim(),
        normalized,
        age !== undefined && age !== '' ? Number(age) : null,
        contactNumber ? contactNumber.trim() : null,
        hashedPassword,
      ]
    );

    return {
      id: result.insertId,
      firstName,
      lastName,
      email: normalized,
      age,
      contactNumber,
    };
  },

  async update(id, fields) {
    const setClauses = [];
    const values = [];

    if (fields.firstName) {
      setClauses.push('firstName = ?');
      values.push(fields.firstName.trim());
    }
    if (fields.lastName) {
      setClauses.push('lastName = ?');
      values.push(fields.lastName.trim());
    }
    if (fields.age !== undefined) {
      setClauses.push('age = ?');
      values.push(Number(fields.age));
    }
    if (fields.contactNumber) {
      setClauses.push('contactNumber = ?');
      values.push(fields.contactNumber.trim());
    }

    if (setClauses.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    await query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  },

  async comparePassword(candidatePassword, hashedPassword) {
    if (!candidatePassword || !hashedPassword) return false;
    return await bcrypt.compare(candidatePassword.trim(), hashedPassword);
  },
};

export default User;
