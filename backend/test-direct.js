const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testDirectConnection() {
  console.log('Testing direct connection...');
  
  // Create a Prisma client with only the direct URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL
      }
    }
  });
  
  try {
    console.log('Connecting to database using DIRECT_URL...');
    await prisma.$connect();
    console.log('Direct database connection successful!');
    
    // Try a simple query
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Query result:', users);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Direct database connection failed:', error);
    await prisma.$disconnect();
  }
}

testDirectConnection();
