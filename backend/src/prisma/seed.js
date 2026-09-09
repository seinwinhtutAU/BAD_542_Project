const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com', name: 'Admin', role: 'ADMIN', password,
    },
  });
  console.log(`Seeded dev admin user: ${user.email} / admin123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
