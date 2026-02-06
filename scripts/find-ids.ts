
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const domains = await prisma.domain.findMany({
    where: { name: { contains: 'FullStack', mode: 'insensitive' } },
    include: {
      subjects: {
        where: { name: { contains: 'Front End', mode: 'insensitive' } },
        include: {
          topics: {
            where: { name: { contains: 'JavaScript', mode: 'insensitive' } }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(domains, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
