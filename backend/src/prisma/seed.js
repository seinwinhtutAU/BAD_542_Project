const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// Test accounts for the dev-login form. These match the "Quick Dev Fill"
// buttons on the login page — keep the two in sync if you change them.
const TEST_USERS = [
  { email: 'admin@au.edu', name: 'Admin', role: 'ADMIN', password: 'admin123' },
  { email: 'doctor@au.edu', name: 'Dr. Aung Kyaw', role: 'DOCTOR', password: 'doctor123' },
  { email: 'student@au.edu', name: 'Test Student', role: 'STUDENT', password: 'student123' },
];

// Without at least one doctor the student booking form has an empty dropdown,
// so a fresh database can't demo the core flow.
const DOCTORS = [
  { id: 1, name: 'Aung Kyaw', specialty: 'General Practice', room: '101-A' },
  { id: 2, name: 'Su Myat', specialty: 'Dermatology', room: '204-B' },
  { id: 3, name: 'Thant Zin', specialty: 'Sports Medicine', room: '112-C' },
];

async function main() {
  for (const { email, name, role, password } of TEST_USERS) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      // Reset the password on re-seed so a forgotten local change can't leave
      // the documented credentials broken.
      update: { name, role, password: hashed },
      create: {
        email, name, role, password: hashed,
      },
    });
    console.log(`Seeded ${role.toLowerCase()} account: ${email} / ${password}`);
  }

  for (const doctor of DOCTORS) {
    await prisma.doctor.upsert({
      where: { id: doctor.id },
      update: {},
      create: doctor,
    });
  }
  console.log(`Seeded ${DOCTORS.length} doctors.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
