import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || null;

  if (!adminUsername || !adminPassword) {
    console.log('Skipping admin seed: ADMIN_USERNAME or ADMIN_PASSWORD not set.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (existing) {
    console.log(`Admin user '${adminUsername}' already exists. Nothing to do.`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
      imageLimit: null,  // Admin has unlimited image generations
      imageCount: 0,
    },
  });
  console.log(`Seeded admin user '${adminUsername}'.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
