const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { email: true }
    });
    if (admin) {
      console.log('ADMIN_EMAIL:' + admin.email);
    } else {
      console.log('NO_ADMIN_FOUND');
    }
  } catch (error) {
    console.error('ERROR:' + error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
