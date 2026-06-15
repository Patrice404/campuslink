import { prisma } from './prismaClient';

// Les annonces sont réparties sur 4 tables concrètes. Cette config relie chaque
// type au delegate Prisma correspondant et à la clé étrangère utilisée par les
// modèles Jaime / Commentaire pour référencer ce type d'annonce.
export type AnnonceType = 'EXERCICE' | 'BON_PLAN' | 'TUTORAT' | 'PROJET';

export const ANNONCE_CONFIG: Record<AnnonceType, { delegate: any; fk: string }> = {
  EXERCICE: { delegate: prisma.annonceExercice, fk: 'id_exercice' },
  BON_PLAN: { delegate: prisma.annonceBonPlan, fk: 'id_bonplan' },
  TUTORAT: { delegate: prisma.annonceTutorat, fk: 'id_tutorat' },
  PROJET: { delegate: prisma.annonceProjet, fk: 'id_projet' },
};

// Recherche une annonce par id à travers les 4 tables (les ids ne sont pas
// uniques entre tables : on peut restreindre via `type` pour lever l'ambiguïté).
export async function findAnnonceById(
  id: bigint,
  type?: AnnonceType
): Promise<{ type: AnnonceType; record: any } | null> {
  const types: AnnonceType[] = type ? [type] : ['EXERCICE', 'BON_PLAN', 'TUTORAT', 'PROJET'];
  for (const t of types) {
    const record = await ANNONCE_CONFIG[t].delegate.findUnique({ where: { id } });
    if (record) return { type: t, record };
  }
  return null;
}
