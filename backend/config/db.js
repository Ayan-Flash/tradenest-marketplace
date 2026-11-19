import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
let initialized = false;

export function getPool() {
  if (pool) return pool;

  const connectionUri =
    process.env.MYSQL_URI ||
    process.env.MYSQL_URL ||
    process.env.DATABASE_URL;

  const requiresSsl =
    process.env.MYSQL_SSL === 'true' ||
    (connectionUri && (connectionUri.includes('ssl') || connectionUri.includes('aiven') || connectionUri.includes('tidb') || connectionUri.includes('planetscale')));

  const sslOption = requiresSsl ? { rejectUnauthorized: false } : undefined;

  if (connectionUri) {
    pool = mysql.createPool({
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: sslOption,
    });
  } else {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'tradenest',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: sslOption,
    });
  }

  return pool;
}

export async function query(sql, params = []) {
  const p = getPool();
  const [results] = await p.execute(sql, params);
  return results;
}

export async function initDB() {
  if (initialized) return;

  const connectionUri =
    process.env.MYSQL_URI ||
    process.env.MYSQL_URL ||
    process.env.DATABASE_URL;

  if (!connectionUri && !process.env.MYSQL_HOST && !process.env.MYSQL_DATABASE) {
    console.warn('⚠️ Warning: No MySQL connection string or host specified in environment variables.');
    return;
  }

  try {
    const p = getPool();

    // Verify connection
    const connection = await p.getConnection();
    console.log('✅ Connected to MySQL database successfully');
    connection.release();

    // Create Tables if they don't exist
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        age INT NULL,
        contactNumber VARCHAR(50) NULL,
        password VARCHAR(255) NULL,
        sellerReviews JSON NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        sellerId INT NOT NULL,
        isSold BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        itemId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_item (userId, itemId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyerId INT NOT NULL,
        sellerId INT NOT NULL,
        itemId INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        hashedOtp VARCHAR(255) NOT NULL,
        orderStatus ENUM('pending', 'success', 'cancelled') DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (buyerId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    initialized = true;
    console.log('✅ MySQL schema synchronized: all tables ready (users, items, cart_items, orders)');
  } catch (error) {
    console.error('❌ MySQL initialization error:', error.message);
  }
}

export default { getPool, query, initDB };
