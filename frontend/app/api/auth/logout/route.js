// Logout endpoint - simplified without database dependency

export async function POST() {
  try {
    // In a microservices setup, this would call your backend auth service
    // to invalidate the token in the database
    
    // For now, we'll just clear the client-side cookie
    const response = Response.json({
      success: true,
      message: 'Logout successful'
    });

    // Clear the auth cookie
    response.headers.set('Set-Cookie', 'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { 
        success: false, 
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}