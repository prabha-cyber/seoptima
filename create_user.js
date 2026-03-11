const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'prabhavathi.t@venpep.com';
    const password = 'Password@123'; // Temporary password for the user
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
        },
        create: {
            email,
            name: 'Prabhavathi',
            password: hashedPassword,
            role: 'ADMIN',
            subscription: {
                create: { plan: 'FREE' },
            },
            aiCredits: {
                create: { total: 50 },
            },
        },
    });

    console.log(`User ${user.email} created/updated with role ${user.role}.`);
    console.log(`Temporary password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
