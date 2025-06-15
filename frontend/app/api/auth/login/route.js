import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuerySingle, executeQuery } from '../../../../lib/database.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await executeQuerySingle(
      'SELECT * FROM users WHERE email = ? AND is_active = true',
      [email]
    );

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Update last login
    await executeQuery(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Provide more specific error messages for debugging
    let errorMessage = 'Internal server error';
    if (error.code === 'DATABASE_CONNECTION_REFUSED') {
      errorMessage = 'Database connection failed. Please check if MySQL is running.';
    } else if (error.code === 'DATABASE_AUTH_FAILED') {
      errorMessage = 'Database authentication failed. Please check database credentials.';
    } else if (error.message.includes('JWT')) {
      errorMessage = 'JWT configuration error. Please check JWT_SECRET environment variable.';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}