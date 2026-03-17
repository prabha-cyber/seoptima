import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { email: true, name: true }
    });
    if (admin) {
      console.log('--- ADMIN FOUND ---');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
    } else {
      console.log('No admin user found in the database.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
