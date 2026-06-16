/*
  Warnings:

  - You are about to drop the column `image` on the `AnnonceBonPlan` table. All the data in the column will be lost.
  - You are about to drop the column `lien` on the `AnnonceBonPlan` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `AnnonceExercice` table. All the data in the column will be lost.
  - You are about to drop the column `lien` on the `AnnonceExercice` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `AnnonceProjet` table. All the data in the column will be lost.
  - You are about to drop the column `lien` on the `AnnonceProjet` table. All the data in the column will be lost.
  - You are about to drop the column `nbJaime` on the `AnnonceProjet` table. All the data in the column will be lost.
  - You are about to drop the column `annee` on the `AnnonceTutorat` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `AnnonceTutorat` table. All the data in the column will be lost.
  - You are about to drop the column `lien` on the `AnnonceTutorat` table. All the data in the column will be lost.
  - You are about to drop the column `nbJaime` on the `AnnonceTutorat` table. All the data in the column will be lost.
  - You are about to drop the column `datePostulation` on the `Candidature` table. All the data in the column will be lost.
  - You are about to drop the column `dateCreation` on the `Commentaire` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Jaime` table. All the data in the column will be lost.
  - You are about to drop the column `dateCreation` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `id_campus` on the `Utilisateur` table. All the data in the column will be lost.
  - You are about to drop the `VerificationEmail` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CentreInteret" AS ENUM ('PROJET', 'EXERCICE', 'BON_PLAN', 'ENTRAIDE', 'MATIERE');

-- CreateEnum
CREATE TYPE "Visibilite" AS ENUM ('PUBLIQUE', 'PROMOTION', 'PROFESSEUR', 'ETUDIANT', 'PROMO_SUPERIEUR');

-- DropForeignKey
ALTER TABLE "Utilisateur" DROP CONSTRAINT "Utilisateur_id_campus_fkey";

-- AlterTable
ALTER TABLE "AnnonceBonPlan" DROP COLUMN "image",
DROP COLUMN "lien",
ADD COLUMN     "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE';

-- AlterTable
ALTER TABLE "AnnonceExercice" DROP COLUMN "image",
DROP COLUMN "lien",
ADD COLUMN     "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE';

-- AlterTable
ALTER TABLE "AnnonceProjet" DROP COLUMN "image",
DROP COLUMN "lien",
DROP COLUMN "nbJaime",
ADD COLUMN     "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE';

-- AlterTable
ALTER TABLE "AnnonceTutorat" DROP COLUMN "annee",
DROP COLUMN "image",
DROP COLUMN "lien",
DROP COLUMN "nbJaime",
ADD COLUMN     "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE';

-- AlterTable
ALTER TABLE "Candidature" DROP COLUMN "datePostulation";

-- AlterTable
ALTER TABLE "Commentaire" DROP COLUMN "dateCreation";

-- AlterTable
ALTER TABLE "Jaime" DROP COLUMN "date";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "dateCreation";

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "id_campus",
ADD COLUMN     "bio" VARCHAR(500),
ADD COLUMN     "centresInteret" "CentreInteret"[],
ADD COLUMN     "id_formation" BIGINT;

-- DropTable
DROP TABLE "VerificationEmail";

-- CreateTable
CREATE TABLE "Departement" (
    "id" BIGSERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "id_campus" BIGINT NOT NULL,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" BIGSERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "id_departement" BIGINT NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blocage" (
    "id_utilisateur_bloquant" BIGINT NOT NULL,
    "id_utilisateur_bloque" BIGINT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blocage_pkey" PRIMARY KEY ("id_utilisateur_bloquant","id_utilisateur_bloque")
);

-- AddForeignKey
ALTER TABLE "Departement" ADD CONSTRAINT "Departement_id_campus_fkey" FOREIGN KEY ("id_campus") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_id_departement_fkey" FOREIGN KEY ("id_departement") REFERENCES "Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_id_formation_fkey" FOREIGN KEY ("id_formation") REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocage" ADD CONSTRAINT "Blocage_id_utilisateur_bloquant_fkey" FOREIGN KEY ("id_utilisateur_bloquant") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocage" ADD CONSTRAINT "Blocage_id_utilisateur_bloque_fkey" FOREIGN KEY ("id_utilisateur_bloque") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
