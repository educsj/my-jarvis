import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'eduardo@meujarvis.local' },
    update: {},
    create: {
      name: 'Eduardo',
      email: 'eduardo@meujarvis.local',
      settings: { create: { humorLevel: 70, empathyLevel: 60 } },
      reminders: {
        create: [
          { title: 'Testar o assistente de voz', description: 'Primeiro teste do MVP' },
          {
            title: 'Configurar Ollama',
            description: 'Baixar o modelo llama3.1:8b',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        ],
      },
    },
    include: { settings: true, reminders: true },
  });

  console.log(`✅ Seed concluído. Usuário: ${user.name} (${user.id})`);
  console.log(`   Personalidade → Humor: ${user.settings?.humorLevel} | Empatia: ${user.settings?.empathyLevel}`);
  console.log(`   Lembretes criados: ${user.reminders.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
