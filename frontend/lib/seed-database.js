import bcrypt from 'bcryptjs';
import { executeQuery, initializeDatabase } from './database.js';

// Seed data for testing
const seedUsers = [
  {
    email: 'admin@example.com',
    password: 'Admin123!',
    name: 'John Admin',
    role: 'COURSE_ADMIN',
    department: 'Computer Science'
  },
  {
    email: 'student@example.com',
    password: 'Student123!',
    name: 'Jane Student',
    role: 'STUDENT',
    department: null
  },
  {
    email: 'examiner@example.com',
    password: 'Examiner123!',
    name: 'Bob Examiner',
    role: 'EXAMINER',
    department: 'Computer Science'
  },
  {
    email: 'superadmin@example.com',
    password: 'SuperAdmin123!',
    name: 'Alice SuperAdmin',
    role: 'SUPER_ADMIN',
    department: 'Administration'
  }
];

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize database and tables first
    await initializeDatabase();
    
    // Check if users already exist
    const existingUsers = await executeQuery('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('📋 Users already exist, skipping seed');
      return;
    }
    
    // Hash passwords and insert users
    for (const user of seedUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await executeQuery(
        `INSERT INTO users (email, password, name, role, department) 
         VALUES (?, ?, ?, ?, ?)`,
        [user.email, hashedPassword, user.name, user.role, user.department]
      );
      
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Test accounts:');
    console.log('- admin@example.com / Admin123! (Course Admin)');
    console.log('- student@example.com / Student123! (Student)');
    console.log('- examiner@example.com / Examiner123! (Examiner)');
    console.log('- superadmin@example.com / SuperAdmin123! (Super Admin)');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}