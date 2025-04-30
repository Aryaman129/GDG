const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testPrismaConnection() {
  console.log('Testing Prisma connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('DIRECT_URL:', process.env.DIRECT_URL);
  
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connection successful!');
    
    // Try a simple query
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Query result:', users);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    await prisma.$disconnect();
  }
}

testPrismaConnection();
