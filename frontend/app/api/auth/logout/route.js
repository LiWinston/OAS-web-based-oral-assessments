import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../../../../lib/database.js';

export async function POST(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: true,
        message: 'Logout successful' // Return success even without token
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Decode token to get user info
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Optionally, add token to blacklist table for extra security
      // This is useful for immediate token invalidation
      const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
      
      await executeQuery(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
         ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
        [decoded.userId, tokenHash]
      );

    } catch (tokenError) {
      // Token is invalid or expired, which is fine for logout
      console.log('Token verification failed during logout:', tokenError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    // Always return success for logout to ensure user can log out
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });
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