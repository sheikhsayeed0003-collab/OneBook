import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "Facbook@123";
  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  const owner = await prisma.user.upsert({
    where: { email: "mursalin@facbook.app" },
    update: { role: "owner", status: "active", verified: true },
    create: {
      email: "mursalin@facbook.app",
      username: "mursalin",
      name: "Mursalin",
      passwordHash,
      bio: "Building products. Coffee, cameras, and late-night feeds.",
      about: "Software engineer.",
      location: "Dhaka, Bangladesh",
      website: "https://facbook.app/mursalin",
      role: "owner",
      status: "active",
      verified: true,
      emailVerified: true,
    },
  });

  const aya = await prisma.user.upsert({
    where: { email: "aya@facbook.app" },
    update: { status: "active" },
    create: {
      email: "aya@facbook.app",
      username: "aya.rahman",
      name: "Aya Rahman",
      passwordHash: await bcrypt.hash("Password@123", 12),
      bio: "Designer · city walks",
      location: "Chattogram",
      role: "user",
      status: "active",
      verified: true,
      emailVerified: true,
    },
  });

  const sara = await prisma.user.upsert({
    where: { email: "sara@facbook.app" },
    update: { role: "admin", status: "active" },
    create: {
      email: "sara@facbook.app",
      username: "sara.n",
      name: "Sara Noor",
      passwordHash: await bcrypt.hash("Password@123", 12),
      bio: "Chef · home kitchen",
      location: "Khulna",
      role: "admin",
      status: "active",
    },
  });

  await prisma.siteSetting.upsert({
    where: { id: "site" },
    update: { name: "OneBook" },
    create: { id: "site", name: "OneBook" },
  });

  const existing = await prisma.post.count();
  if (existing === 0) {
    await prisma.post.create({
      data: {
        authorId: aya.id,
        text: "Golden hour on the river. Sometimes you just have to stop scrolling and look up.",
        images: JSON.stringify(["https://picsum.photos/seed/river-1/900/560"]),
        feeling: "feeling grateful",
        location: "Buriganga River",
        privacy: "public",
      },
    });
    await prisma.post.create({
      data: {
        authorId: owner.id,
        text: "Shipping a new layout this week. Feedback welcome.",
        images: JSON.stringify(["https://picsum.photos/seed/desk-1/1000/540"]),
        privacy: "public",
      },
    });
    await prisma.product.create({
      data: {
        sellerId: aya.id,
        title: "Vintage film camera",
        price: "৳12,500",
        location: "Dhanmondi",
        image: "https://picsum.photos/seed/cam/600/600",
        category: "Electronics",
      },
    });
    await prisma.notification.create({
      data: {
        userId: owner.id,
        text: "Welcome to OneBook. Your account is ready.",
        type: "system",
      },
    });
    await prisma.conversation.create({
      data: {
        title: "",
        isGroup: false,
        members: { create: [{ userId: owner.id }, { userId: aya.id }] },
        messages: {
          create: [{ senderId: aya.id, text: "Hey — can you review the cover crop?" }],
        },
      },
    });
  }

  console.log("Seeded owner:", owner.email, "admin:", sara.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
