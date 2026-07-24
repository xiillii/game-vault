import { prisma } from "@/lib/prisma";

async function main() {
  await prisma.game.upsert({
    where: { id: "asteroides" },
    update: {},
    create: {
      id: "asteroides",
      title: "ASTEROIDES",
      short: "Sobrevive al campo de rocas a la deriva.",
      long: "Pilota tu nave triangular entre esquirlas de roca que giran sin control. Rota, propulsa y dispara para fragmentarlas antes de que te embistan. Cada nivel suma más rocas y menos espacio para respirar.",
      cat: "SHOOTER",
      cover: "cover-rocas",
      color: "yellow",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
