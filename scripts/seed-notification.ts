import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found.");
        return;
    }

    const notification = await prisma.notification.create({
        data: {
            userId: user.id,
            title: 'Welcome to Seoptima',
            message: 'Your account has been set up successfully. Start by adding your first website.',
            type: 'SUCCESS',
            read: false
        }
    });

    console.log("Created test notification:", notification);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
