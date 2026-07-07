const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_SKILLUP } }
});

(async () => {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: 'anujoshi@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:', user.email, 'ID:', user.id);
    
    // Find role
    const role = await prisma.role.findFirst({
      where: {
        name: { in: ['user', 'USER', 'student', 'STUDENT'] }
      }
    });
    
    if (!role) {
      console.log('❌ No user/student role found in database');
      process.exit(1);
    }
    
    console.log('✅ Role found:', role.name, 'ID:', role.id);
    
    // Check if already assigned
    const existing = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: role.id
      }
    });
    
    if (existing) {
      console.log('✅ Role already assigned');
    } else {
      // Assign role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id
        }
      });
      console.log('✅✅✅ Role assigned successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
