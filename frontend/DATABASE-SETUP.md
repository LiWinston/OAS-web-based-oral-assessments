# Database Setup Instructions

## Prerequisites

1. **Install MySQL Server** (if not already installed):
   ```bash
   # macOS (using Homebrew)
   brew install mysql
   brew services start mysql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server
   sudo systemctl start mysql
   
   # Windows - Download from https://dev.mysql.com/downloads/mysql/
   ```

2. **Secure MySQL Installation** (recommended):
   ```bash
   sudo mysql_secure_installation
   ```

## Setup Steps

### 1. Configure MySQL Connection

Update your `.env.local` file with your MySQL credentials:

```bash
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=oas_database
DB_USER=root
DB_PASSWORD=your_mysql_password_here

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. Create Database (Optional - will be created automatically)

If you want to create the database manually:

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE oas_database;

-- Create a dedicated user (optional but recommended for production)
CREATE USER 'oas_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON oas_database.* TO 'oas_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Initialize Database via API

Start the Next.js development server:

```bash
npm run dev
```

Then make a POST request to initialize the database:

```bash
# Using curl
curl -X POST http://localhost:3000/api/init

# Or visit http://localhost:3000/api/init in your browser (POST requests won't work via browser)
```

### 4. Alternative: Initialize via Script

```bash
npm run db:init
```

## Test Accounts

After initialization, you can use these test accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `Admin123!` | Course Admin |
| `student@example.com` | `Student123!` | Student |
| `examiner@example.com` | `Examiner123!` | Examiner |
| `superadmin@example.com` | `SuperAdmin123!` | Super Admin |

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('STUDENT', 'EXAMINER', 'COURSE_ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'STUDENT',
  department VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);
```

### User Sessions Table (for token blacklisting)

```sql
CREATE TABLE user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/init` - Initialize database and seed data
- `GET /api/init` - Test database connection

## Testing Login

1. Start the development server: `npm run dev`
2. Go to http://localhost:3000/login
3. Use any of the test accounts above
4. The app should now connect to your MySQL database instead of using mock data

## Troubleshooting

### Common Issues

1. **Connection refused error**:
   - Make sure MySQL server is running
   - Check if the port (3306) is correct
   - Verify host (localhost vs 127.0.0.1)

2. **Authentication failed**:
   - Check username and password in `.env.local`
   - Make sure the database user has proper permissions

3. **Database doesn't exist**:
   - The system will create it automatically, but make sure the user has CREATE privileges

4. **Module not found errors**:
   - Run `npm install` to ensure all dependencies are installed

### Verify Setup

Test your database connection:

```bash
# Test connection
curl http://localhost:3000/api/init

# Should return something like:
# {"success":true,"message":"Database connection successful","data":{"connected":true,"timestamp":"..."}}
```

### Environment Variables Check

Make sure your `.env.local` has:
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api`
- `NEXT_PUBLIC_USE_MOCK_API=false`
- All database configuration variables set correctly