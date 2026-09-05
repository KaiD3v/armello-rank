import { PrismaClient } from "@prisma/client";

const PLAYERS = [
  { slug: "kaique", name: "Kaique" },
  { slug: "pedro", name: "Pedro" },
  { slug: "henrique", name: "Henrique" },
  { slug: "afonso", name: "Afonso" },
] as const;

const prisma = new PrismaClient();

async function main() {
  for (const player of PLAYERS) {
    await prisma.player.upsert({
      where: { slug: player.slug },
      create: { ...player, points: 0 },
      update: { name: player.name },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
