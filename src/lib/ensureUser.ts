import { prisma } from './prisma.js';

/**
 * MVP mono-usuário: garante que exista um usuário padrão com Settings.
 * Em fases futuras (auth) isto será substituído por sessões reais.
 */
export async function ensureDefaultUser() {
  const existing = await prisma.user.findFirst({ include: { settings: true } });
  if (existing) {
    if (!existing.settings) {
      await prisma.settings.create({ data: { userId: existing.id } });
    }
    return prisma.user.findFirstOrThrow({ include: { settings: true } });
  }

  return prisma.user.create({
    data: {
      name: 'Eduardo',
      settings: { create: {} },
    },
    include: { settings: true },
  });
}

/** Retorna o id do usuário padrão (cria se necessário). */
export async function getDefaultUserId(): Promise<string> {
  const user = await ensureDefaultUser();
  return user.id;
}
