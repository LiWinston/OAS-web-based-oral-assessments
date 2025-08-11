import { NextResponse } from 'next/server';
import { testConnection, initializeDatabase } from '../../../lib/database.js';
import { seedDatabase } from '../../../lib/seed-database.js';

export async function POST(request) {
  try {
    console.log('🚀 Starting database initialization...');

    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection failed. Please check your MySQL server and configuration.' 
        },
        { status: 500 }
      );
    }

    // Initialize database schema
    await initializeDatabase();

    // Seed initial data
    await seedDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        testAccounts: [
          { email: 'admin@example.com', password: 'Admin123!', role: 'COURSE_ADMIN' },
          { email: 'student@example.com', password: 'Student123!', role: 'STUDENT' },
          { email: 'examiner@example.com', password: 'Examiner123!', role: 'EXAMINER' },
          { email: 'superadmin@example.com', password: 'SuperAdmin123!', role: 'SUPER_ADMIN' }
        ]
      }
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Database initialization failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Just test the connection
    const isConnected = await testConnection();
    
    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'Database connection successful' : 'Database connection failed',
      data: {
        connected: isConnected,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Database test failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
}