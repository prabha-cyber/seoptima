const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    if (users.length > 0) {
        const user = users[0];
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' },
        });
        console.log(`User ${user.email} promoted to ADMIN.`);
    } else {
        console.log('No users found in database.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
