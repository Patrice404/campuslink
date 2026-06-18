-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ETUDIANT', 'PROFESSEUR');

-- CreateEnum
CREATE TYPE "TypeAnnonce" AS ENUM ('EXERCICE', 'BON_PLAN', 'TUTORAT', 'PROJET');

-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "SousTypeBonPlan" AS ENUM ('JOB_ETUDIANT', 'ALTERNANCE', 'COLOCATION', 'FETE', 'EVENEMENT', 'RESTAURANT', 'BOURSE', 'HACKATHON');

-- CreateEnum
CREATE TYPE "CentreInteret" AS ENUM ('PROJET', 'EXERCICE', 'BON_PLAN', 'ENTRAIDE', 'MATIERE');

-- CreateEnum
CREATE TYPE "Visibilite" AS ENUM ('PUBLIQUE', 'PROMOTION', 'PROFESSEUR', 'ETUDIANT', 'PROMO_SUPERIEUR');

-- CreateTable
CREATE TABLE "Campus" (
    "id" BIGSERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "etablissement" TEXT NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Utilisateur" (
    "id" BIGSERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "dateInscription" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoProfil" TEXT,
    "centresInteret" "CentreInteret"[],
    "bio" VARCHAR(500),
    "id_formation" BIGINT,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blocage" (
    "id_utilisateur_bloquant" BIGINT NOT NULL,
    "id_utilisateur_bloque" BIGINT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blocage_pkey" PRIMARY KEY ("id_utilisateur_bloquant","id_utilisateur_bloque")
);

-- CreateTable
CREATE TABLE "AnnonceExercice" (
    "id" BIGSERIAL NOT NULL,
    "type" "TypeAnnonce" NOT NULL DEFAULT 'EXERCICE',
    "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbJaime" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "lien" TEXT,
    "annee" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "id_utilisateur" BIGINT NOT NULL,
    "id_matiere" BIGINT NOT NULL,

    CONSTRAINT "AnnonceExercice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnonceBonPlan" (
    "id" BIGSERIAL NOT NULL,
    "type" "TypeAnnonce" NOT NULL DEFAULT 'BON_PLAN',
    "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbJaime" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "lien" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sousType" "SousTypeBonPlan" NOT NULL,
    "id_utilisateur" BIGINT NOT NULL,

    CONSTRAINT "AnnonceBonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnonceTutorat" (
    "id" BIGSERIAL NOT NULL,
    "type" "TypeAnnonce" NOT NULL DEFAULT 'TUTORAT',
    "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbJaime" INTEGER NOT NULL DEFAULT 0,
    "nbCandidatsVoulus" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "lien" TEXT,
    "annee" TEXT NOT NULL,
    "id_utilisateur" BIGINT NOT NULL,
    "id_matiere" BIGINT NOT NULL,

    CONSTRAINT "AnnonceTutorat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnonceProjet" (
    "id" BIGSERIAL NOT NULL,
    "type" "TypeAnnonce" NOT NULL DEFAULT 'PROJET',
    "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbJaime" INTEGER NOT NULL DEFAULT 0,
    "titre" TEXT NOT NULL,
    "lien" TEXT,
    "image" TEXT,
    "description" TEXT NOT NULL,
    "id_utilisateur" BIGINT NOT NULL,

    CONSTRAINT "AnnonceProjet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matiere" (
    "id" BIGSERIAL NOT NULL,
    "titre" TEXT NOT NULL,

    CONSTRAINT "Matiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" BIGSERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "id_utilisateur" BIGINT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commentaire" (
    "id" BIGSERIAL NOT NULL,
    "texte" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_utilisateur" BIGINT NOT NULL,
    "id_exercice" BIGINT,
    "id_bonplan" BIGINT,
    "id_tutorat" BIGINT,
    "id_projet" BIGINT,
    "id_parent" BIGINT,

    CONSTRAINT "Commentaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jaime" (
    "id" BIGSERIAL NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_utilisateur" BIGINT NOT NULL,
    "id_exercice" BIGINT,
    "id_bonplan" BIGINT,
    "id_tutorat" BIGINT,
    "id_projet" BIGINT,

    CONSTRAINT "Jaime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidature" (
    "id" BIGSERIAL NOT NULL,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'EN_ATTENTE',
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageMotivation" TEXT NOT NULL,
    "id_tutorat" BIGINT NOT NULL,

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEmail" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "id_formation" BIGINT,

    CONSTRAINT "VerificationEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FormationToMatiere" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_FormationToMatiere_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationEmail_email_key" ON "VerificationEmail"("email");

-- CreateIndex
CREATE INDEX "_FormationToMatiere_B_index" ON "_FormationToMatiere"("B");

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

-- AddForeignKey
ALTER TABLE "AnnonceExercice" ADD CONSTRAINT "AnnonceExercice_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnonceExercice" ADD CONSTRAINT "AnnonceExercice_id_matiere_fkey" FOREIGN KEY ("id_matiere") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnonceBonPlan" ADD CONSTRAINT "AnnonceBonPlan_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnonceTutorat" ADD CONSTRAINT "AnnonceTutorat_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnonceTutorat" ADD CONSTRAINT "AnnonceTutorat_id_matiere_fkey" FOREIGN KEY ("id_matiere") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnonceProjet" ADD CONSTRAINT "AnnonceProjet_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_id_exercice_fkey" FOREIGN KEY ("id_exercice") REFERENCES "AnnonceExercice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_id_bonplan_fkey" FOREIGN KEY ("id_bonplan") REFERENCES "AnnonceBonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_id_tutorat_fkey" FOREIGN KEY ("id_tutorat") REFERENCES "AnnonceTutorat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_id_projet_fkey" FOREIGN KEY ("id_projet") REFERENCES "AnnonceProjet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_id_parent_fkey" FOREIGN KEY ("id_parent") REFERENCES "Commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jaime" ADD CONSTRAINT "Jaime_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jaime" ADD CONSTRAINT "Jaime_id_exercice_fkey" FOREIGN KEY ("id_exercice") REFERENCES "AnnonceExercice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jaime" ADD CONSTRAINT "Jaime_id_bonplan_fkey" FOREIGN KEY ("id_bonplan") REFERENCES "AnnonceBonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jaime" ADD CONSTRAINT "Jaime_id_tutorat_fkey" FOREIGN KEY ("id_tutorat") REFERENCES "AnnonceTutorat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jaime" ADD CONSTRAINT "Jaime_id_projet_fkey" FOREIGN KEY ("id_projet") REFERENCES "AnnonceProjet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_id_tutorat_fkey" FOREIGN KEY ("id_tutorat") REFERENCES "AnnonceTutorat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FormationToMatiere" ADD CONSTRAINT "_FormationToMatiere_A_fkey" FOREIGN KEY ("A") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FormationToMatiere" ADD CONSTRAINT "_FormationToMatiere_B_fkey" FOREIGN KEY ("B") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;
