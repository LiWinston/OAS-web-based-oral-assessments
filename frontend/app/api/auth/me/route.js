// Current user endpoint - now uses JWT token verification
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Get token from cookie or Authorization header
    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    
    let token = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies['auth-token'];
    }
    
    if (!token && authHeader) {
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return Response.json(
        { success: false, message: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // In production, this would call your backend user service
    // For now, we'll return the user data from the token
    const userData = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      // These would typically come from a user service call
      name: getNameFromEmail(decoded.email),
      department: 'Computer Science',
      isActive: true,
      lastLogin: new Date().toISOString()
    };

    return Response.json({
      success: true,
      data: { user: userData }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return Response.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error.name === 'TokenExpiredError') {
      return Response.json(
        { success: false, message: 'Token expired' },
        { status: 401 }
      );
    }

    return Response.json(
      { 
        success: false, 
        message: 'Failed to get user information',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get user name from email (temporary)
function getNameFromEmail(email) {
  const nameMap = {
    'superadmin@example.com': 'Super Administrator',
    'admin@example.com': 'Course Administrator',
    'examiner@example.com': 'Dr. Jane Examiner',
    'student@example.com': 'John Student'
  };
  return nameMap[email] || email.split('@')[0];
}