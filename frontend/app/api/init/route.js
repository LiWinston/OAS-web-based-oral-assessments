// Database initialization endpoint
// This endpoint now returns status about external database service

export async function GET() {
  try {
    // Check if we can reach the external database service
    // In a real setup, this would check your separate database service
    const timestamp = new Date().toISOString();
    
    return Response.json({
      success: true,
      message: "Frontend service is running. Database is managed externally.",
      data: {
        frontendConnected: true,
        timestamp,
        environment: process.env.NODE_ENV,
        databaseNote: "Database service runs separately in /database/ directory"
      }
    });
  } catch (error) {
    console.error('Init endpoint error:', error);
    return Response.json(
      {
        success: false,
        message: "Frontend service error",
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // In a microservices setup, this would call your backend API
    // For now, we'll return a success message
    return Response.json({
      success: true,
      message: "Database initialization should be handled by the separate database service",
      data: {
        initialized: true,
        timestamp: new Date().toISOString(),
        note: "Run 'cd database && docker-compose up -d' to start the database service"
      }
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return Response.json(
      {
        success: false,
        message: "Initialization failed",
        error: error.message
      },
      { status: 500 }
    );
  }
}