import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'oas_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool for better performance
let pool;

export async function getConnection() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Test database connection
export async function testConnection() {
  try {
    // First test if we can connect to MySQL server at all
    const connectionWithoutDB = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    
    const [rows] = await connectionWithoutDB.execute('SELECT 1 as test');
    await connectionWithoutDB.end();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database and create tables if they don't exist
export async function initializeDatabase() {
  try {
    // First connect without specifying a database to create it
    const connectionWithoutDB = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    
    // Create database if it doesn't exist
    await connectionWithoutDB.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`✅ Database '${dbConfig.database}' ready`);
    await connectionWithoutDB.end();
    
    // Now get regular connection to the database
    const connection = await getConnection();
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('STUDENT', 'EXAMINER', 'COURSE_ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'STUDENT',
        department VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.execute(createUsersTable);
    console.log('✅ Users table ready');
    
    // Create sessions table for JWT token blacklisting (optional)
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.execute(createSessionsTable);
    console.log('✅ User sessions table ready');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// Helper function to execute queries safely
export async function executeQuery(query, params = []) {
  try {
    const connection = await getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    
    // Provide more specific error messages
    if (error.code === 'ECONNREFUSED') {
      const newError = new Error('MySQL server is not running. Please start MySQL server first.');
      newError.code = 'DATABASE_CONNECTION_REFUSED';
      throw newError;
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      const newError = new Error('MySQL authentication failed. Please check your database credentials.');
      newError.code = 'DATABASE_AUTH_FAILED';
      throw newError;
    }
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      const newError = new Error('Database does not exist. It will be created automatically on first initialization.');
      newError.code = 'DATABASE_NOT_FOUND';
      throw newError;
    }
    
    throw error;
  }
}

// Helper function to get a single row
export async function executeQuerySingle(query, params = []) {
  const results = await executeQuery(query, params);
  return results[0] || null;
}

// Cleanup function for graceful shutdown
export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

// Export the pool for direct access if needed
export { pool };