const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const websites = await prisma.website.findMany();
    console.log('Registered Websites:');
    websites.forEach(w => {
        console.log(`- ${w.name}: ${w.domain || w.subdomain + '.antigravity.run'}`);
    });
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
