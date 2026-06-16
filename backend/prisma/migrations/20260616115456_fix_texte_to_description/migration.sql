/*
  Warnings:

  - You are about to drop the column `texte` on the `AnnonceBonPlan` table. All the data in the column will be lost.
  - You are about to drop the column `texte` on the `AnnonceExercice` table. All the data in the column will be lost.
  - You are about to drop the column `texte` on the `AnnonceProjet` table. All the data in the column will be lost.
  - Added the required column `description` to the `AnnonceBonPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `AnnonceExercice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AnnonceBonPlan" DROP COLUMN "texte",
ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AnnonceExercice" DROP COLUMN "texte",
ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AnnonceProjet" DROP COLUMN "texte";
