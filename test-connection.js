// Test database connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test if we can query the database
    const productCount = await prisma.product.count();
    console.log(`✅ Database query successful! Found ${productCount} products.`);
    
    // Test if we can create a test product
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        category: 'Laptops',
        description: 'Test product for connection verification',
        price: 999.99,
        stock: 1,
        images: []
      }
    });
    console.log('✅ Product creation successful! Product ID:', testProduct.id);
    
    // Clean up test product
    await prisma.product.delete({
      where: { id: testProduct.id }
    });
    console.log('✅ Test product cleaned up successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
