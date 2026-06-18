-- =============================================================================
-- 1. NETTOYAGE DES TABLES (Ordre FK-Safe pour pouvoir relancer le script)
-- =============================================================================
DROP TABLE IF EXISTS "VerificationEmail" CASCADE;
DROP TABLE IF EXISTS "Candidature" CASCADE;
DROP TABLE IF EXISTS "Jaime" CASCADE;
DROP TABLE IF EXISTS "Commentaire" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "AnnonceProjet" CASCADE;
DROP TABLE IF EXISTS "AnnonceTutorat" CASCADE;
DROP TABLE IF EXISTS "AnnonceBonPlan" CASCADE;
DROP TABLE IF EXISTS "AnnonceExercice" CASCADE;
DROP TABLE IF EXISTS "Blocage" CASCADE;
DROP TABLE IF EXISTS "_FormationToMatiere" CASCADE;
DROP TABLE IF EXISTS "Matiere" CASCADE;
DROP TABLE IF EXISTS "Utilisateur" CASCADE;
DROP TABLE IF EXISTS "Formation" CASCADE;
DROP TABLE IF EXISTS "Departement" CASCADE;
DROP TABLE IF EXISTS "Campus" CASCADE;

DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "TypeAnnonce" CASCADE;
DROP TYPE IF EXISTS "StatutCandidature" CASCADE;
DROP TYPE IF EXISTS "SousTypeBonPlan" CASCADE;
DROP TYPE IF EXISTS "CentreInteret" CASCADE;
DROP TYPE IF EXISTS "Visibilite" CASCADE;

-- =============================================================================
-- 2. CRÉATION DES ENUMS
-- =============================================================================
CREATE TYPE "Role" AS ENUM ('ETUDIANT', 'PROFESSEUR', 'ADMIN');
CREATE TYPE "TypeAnnonce" AS ENUM ('EXERCICE', 'BON_PLAN', 'TUTORAT', 'PROJET');
CREATE TYPE "StatutCandidature" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');
CREATE TYPE "SousTypeBonPlan" AS ENUM ('JOB_ETUDIANT', 'ALTERNANCE', 'COLOCATION', 'FETE', 'EVENEMENT', 'RESTAURANT', 'BOURSE', 'HACKATHON');
CREATE TYPE "CentreInteret" AS ENUM ('PROJET', 'EXERCICE', 'BON_PLAN', 'ENTRAIDE', 'MATIERE');
CREATE TYPE "Visibilite" AS ENUM ('PUBLIQUE', 'PROMOTION', 'PROFESSEUR', 'ETUDIANT', 'PROMO_SUPERIEUR');

-- =============================================================================
-- 3. CRÉATION DES TABLES
-- =============================================================================

CREATE TABLE "Campus" (
    "id" BIGSERIAL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "etablissement" TEXT NOT NULL
);

CREATE TABLE "Departement" (
    "id" BIGSERIAL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "id_campus" BIGINT NOT NULL REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Formation" (
    "id" BIGSERIAL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "id_departement" BIGINT NOT NULL REFERENCES "Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Utilisateur" (
    "id" BIGSERIAL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "dateInscription" DATE NOT NULL DEFAULT CURRENT_DATE,
    "photoProfil" TEXT,
    "centresInteret" "CentreInteret"[],
    "bio" VARCHAR(500),
    "id_formation" BIGINT REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Blocage" (
    "id_utilisateur_bloquant" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_utilisateur_bloque" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id_utilisateur_bloquant", "id_utilisateur_bloque")
);

CREATE TABLE "Matiere" (
    "id" BIGSERIAL PRIMARY KEY,
    "titre" TEXT NOT NULL
);

-- Table de jointure implicite Prisma pour la relation Many-to-Many entre Formation et Matiere
CREATE TABLE "_FormationToMatiere" (
    "A" BIGINT NOT NULL REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "B" BIGINT NOT NULL REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("A", "B")
);
CREATE INDEX "_FormationToMatiere_B_index" ON "_FormationToMatiere"("B");

CREATE TABLE "AnnonceExercice" (
    "id" BIGSERIAL PRIMARY KEY,
    "type" "TypeAnnonce" NOT NULL DEFAULT 'EXERCICE',
    "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbJaime" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "lien" TEXT,
    "annee" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "id_utilisateur" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_matiere" BIGINT NOT NULL REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AnnonceBonPlan" (
    "id" BIGSERIAL PRIMARY KEY,
    "type" "TypeAnnonce" NOT NULL DEFAULT 'BON_PLAN',
    "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbJaime" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "lien" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sousType" "SousTypeBonPlan" NOT NULL,
    "id_utilisateur" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AnnonceTutorat" (
    "id" BIGSERIAL PRIMARY KEY,
    "type" "TypeAnnonce" NOT NULL DEFAULT 'TUTORAT',
    "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbJaime" INTEGER NOT NULL DEFAULT 0,
    "nbCandidatsVoulus" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "lien" TEXT,
    "annee" TEXT NOT NULL,
    "id_utilisateur" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_matiere" BIGINT NOT NULL REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AnnonceProjet" (
    "id" BIGSERIAL PRIMARY KEY,
    "type" "TypeAnnonce" NOT NULL DEFAULT 'PROJET',
    "visibilite" "Visibilite" NOT NULL DEFAULT 'PUBLIQUE',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbJaime" INTEGER NOT NULL DEFAULT 0,
    "titre" TEXT NOT NULL,
    "lien" TEXT,
    "image" TEXT,
    "description" TEXT NOT NULL,
    "id_utilisateur" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Notification" (
    "id" BIGSERIAL PRIMARY KEY,
    "contenu" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "lien" TEXT,
    "id_utilisateur" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Commentaire" (
    "id" BIGSERIAL PRIMARY KEY,
    "texte" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_utilisateur" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_exercice" BIGINT REFERENCES "AnnonceExercice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_bonplan" BIGINT REFERENCES "AnnonceBonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_tutorat" BIGINT REFERENCES "AnnonceTutorat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_projet" BIGINT REFERENCES "AnnonceProjet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_parent" BIGINT REFERENCES "Commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Jaime" (
    "id" BIGSERIAL PRIMARY KEY,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "id_utilisateur" BIGINT NOT NULL REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_exercice" BIGINT REFERENCES "AnnonceExercice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_bonplan" BIGINT REFERENCES "AnnonceBonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_tutorat" BIGINT REFERENCES "AnnonceTutorat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "id_projet" BIGINT REFERENCES "AnnonceProjet"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Candidature" (
    "id" BIGSERIAL PRIMARY KEY,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'EN_ATTENTE',
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "messageMotivation" TEXT NOT NULL,
    "id_tutorat" BIGINT NOT NULL REFERENCES "AnnonceTutorat"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VerificationEmail" (
    "id" BIGSERIAL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "code" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "id_formation" BIGINT
);

-- =============================================================================
-- 4. INSERTION DES DONNÉES DE TEST (SEED)
-- =============================================================================

-- Campus
INSERT INTO "Campus" (id, nom, ville, etablissement) VALUES (1, 'Campus de Bourges', 'Bourges', 'INSA Centre Val de Loire');

-- Departements
INSERT INTO "Departement" (id, nom, id_campus) VALUES 
(1, 'STI (Sécurité et Technologies Informatiques)', 1),
(2, 'MRI (Maîtrise des Risques Industriels)', 1),
(3, 'STPI (Sciences et Techniques Pour l''Ingénieur)', 1);

-- Formations
INSERT INTO "Formation" (id, nom, niveau, id_departement) VALUES 
(1, 'Architecture logicielle et sécurité', '3A', 1),
(2, 'Cybersécurité et réseaux', '4A', 1),
(3, 'Ingénierie de la sécurité informatique', '5A', 1),
(4, 'Génie industriel et risques', '3A', 2),
(5, 'Management des risques', '4A', 2),
(6, 'Sûreté de fonctionnement', '5A', 2),
(7, 'Prépa Intégrée - Tronc Commun', '1A', 3),
(8, 'Prépa Intégrée - Tronc Commun', '2A', 3);

-- Matieres
INSERT INTO "Matiere" (id, titre) VALUES 
(1, 'Algorithmique et Structures de Données'),
(2, 'Mathématiques pour l''ingénieur'),
(3, 'Développement Web et Base de données'),
(4, 'Programmation Orientée Objet (Java/C++)'),
(5, 'Sécurité des applications web'),
(6, 'Cryptographie appliquée'),
(7, 'Droit du travail et management'),
(8, 'Réseaux et protocoles'),
(9, 'Systèmes d''exploitation'),
(10, 'Gestion des risques industriels');

-- Liens Formations <-> Matieres (_FormationToMatiere)
INSERT INTO "_FormationToMatiere" ("A", "B") VALUES 
(7, 1), (8, 1), (1, 1), -- Algo
(7, 2), (8, 2),         -- Math
(1, 3),                 -- Web
(1, 4),                 -- POO
(2, 5),                 -- Sec Web
(2, 6),                 -- Crypto
(3, 7), (6, 7),         -- Management
(1, 8), (2, 8),         -- Réseaux
(8, 9), (1, 9),         -- OS
(4, 10), (6, 10);       -- Risques

-- Utilisateurs (Le hash correspond à la chaîne 'Password123!')
-- Note syntaxique pour les tableaux PG natifs : '{"PROJET", "EXERCICE"}'
INSERT INTO "Utilisateur" (id, nom, prenom, email, "motDePasse", role, bio, "centresInteret", id_formation) VALUES 
(1, 'Dupont', 'Alice', 'alice.dupont@insa-cvl.fr', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'ADMIN', 'Passionnée de cybersécurité et de développement web.', '{"PROJET", "EXERCICE", "ENTRAIDE"}', 1),
(2, 'Martin', 'Bob', 'bob.martin@insa-cvl.fr', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'ETUDIANT', 'Fan de CTF et de cryptographie.', '{"EXERCICE", "BON_PLAN"}', 2),
(3, 'Bernard', 'Clara', 'clara.bernard@insa-cvl.fr', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'ETUDIANT', 'En 1A, je cherche de l''aide en maths et algo !', '{"ENTRAIDE", "MATIERE"}', 7),
(4, 'Leroy', 'David', 'david.leroy@insa-cvl.fr', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'ETUDIANT', 'En 5A, je cherche une alternance en sécu.', '{"BON_PLAN", "PROJET"}', 3),
(5, 'Petit', 'Emma', 'emma.petit@insa-cvl.fr', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'ETUDIANT', 'Curieuse de tout, surtout des systèmes d''exploitation.', '{"EXERCICE", "ENTRAIDE"}', 8),
(6, 'Moreau', 'Fabien', 'fabien.moreau@insa-cvl.fr', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'ETUDIANT', 'Étudiant MRI passionné par la gestion des risques.', '{"PROJET", "BON_PLAN"}', 4),
(7, 'Laurent', 'Jean', 'jean.laurent@insa-cvl.fr', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'PROFESSEUR', 'Professeur de cryptographie et sécurité des systèmes.', '{"MATIERE", "EXERCICE"}', NULL),
(8, 'Garnier', 'Sophie', 'sophie.garnier@insa-cvl.fr', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'PROFESSEUR', 'Professeure de mathématiques et algorithmique.', '{"MATIERE", "ENTRAIDE"}', NULL);

-- Blocages
INSERT INTO "Blocage" (id_utilisateur_bloquant, id_utilisateur_bloque) VALUES (2, 6);

-- Annonces Exercice
INSERT INTO "AnnonceExercice" (id, description, annee, visibilite, id_utilisateur, id_matiere, "nbJaime") VALUES 
(1, 'J''ai du mal avec les arbres AVL en algo, quelqu''un peut m''expliquer les rotations ?', '2024', 'PUBLIQUE', 3, 1, 5),
(2, 'Exercice corrigé sur les suites de Fourier — exam 2023 disponible en lien.', '2023', 'PROMOTION', 8, 2, 12),
(3, 'TP noté sur les injections SQL — pensez à tester vos requêtes préparées !', '2024', 'ETUDIANT', 1, 3, 8),
(4, 'Partage de mes notes de cours sur la cryptographie asymétrique (RSA, ECC).', '2024', 'PUBLIQUE', 2, 6, 20),
(5, 'Aide sur les processus et threads en OS — je bloque sur les deadlocks.', '2024', 'PUBLIQUE', 5, 9, 3);

-- Annonces Bon Plan
INSERT INTO "AnnonceBonPlan" (id, titre, description, "sousType", visibilite, id_utilisateur, "nbJaime", lien) VALUES 
(1, 'Job étudiant – Moniteur informatique INSA', 'Le service informatique de l''INSA recrute un moniteur pour aider les étudiants. 10h/semaine, 12€/h. Postulez avant le 30/06.', 'JOB_ETUDIANT', 'ETUDIANT', 4, 15, NULL),
(2, 'Alternance Cybersécurité – Thales Bourges', 'Thales recrute en alternance pour un poste d''analyste SOC. Niveau 4A/5A requis. Lien de candidature ci-dessous.', 'ALTERNANCE', 'PROMO_SUPERIEUR', 7, 34, 'https://www.thalesgroup.com/fr/carrieres'),
(3, 'Colocation disponible – Centre Bourges', 'Chambre meublée disponible dans un T3 proche du campus. 380€/mois charges comprises. Ambiance calme et studieuse.', 'COLOCATION', 'PUBLIQUE', 5, 7, NULL),
(4, 'Soirée intégration INSA – Vendredi 20h', 'La BDE organise la soirée d''intégration des 1A vendredi soir à la salle des fêtes du campus. Entrée gratuite !', 'FETE', 'PUBLIQUE', 1, 42, NULL),
(5, 'Hackathon Sécurité – 48h pour hacker éthiquement', 'Hackathon organisé par l''INSA en partenariat avec Orange Cyberdefense. Équipes de 3 à 5 personnes. Prix à gagner !', 'HACKATHON', 'PUBLIQUE', 7, 28, 'https://hackathon-insa-cvl.fr'),
(6, 'Bourse Région Centre – Dossiers à déposer avant le 15/07', 'La région Centre-Val de Loire propose des bourses d''excellence pour les étudiants en ingénierie. Critères et formulaire sur le lien.', 'BOURSE', 'ETUDIANT', 8, 19, 'https://www.regioncentre-valdeloire.fr/bourses');

-- Annonces Tutorat
INSERT INTO "AnnonceTutorat" (id, description, annee, visibilite, "nbCandidatsVoulus", id_utilisateur, id_matiere, "nbJaime") VALUES 
(1, 'Je propose des séances de tutorat en algo pour les 1A et 2A. 1h/semaine en présentiel ou visio. Niveau licence confirmé.', '2024', 'PUBLIQUE', 3, 1, 1, 6),
(2, 'Tutorat en cryptographie appliquée pour les 4A. Je peux aider sur RSA, AES et les protocoles TLS.', '2024', 'PROMOTION', 2, 2, 6, 9),
(3, 'Aide en maths pour les 1A — suites, intégrales, équations différentielles. Sessions le mercredi après-midi.', '2024', 'PUBLIQUE', 5, 8, 2, 22),
(4, 'Tutorat en sécurité web (OWASP Top 10, pentesting basique). Pour les 3A qui veulent prendre de l''avance.', '2024', 'ETUDIANT', 4, 4, 5, 11);

-- Annonces Projet
INSERT INTO "AnnonceProjet" (id, titre, description, visibilite, id_utilisateur, "nbJaime", lien) VALUES 
(1, 'CampusLink – Réseau social étudiant', 'On cherche 2 développeurs pour rejoindre notre projet de réseau social étudiant. Stack : Vue.js, Node.js, PostgreSQL. Rejoignez-nous !', 'PUBLIQUE', 1, 18, 'https://github.com/campuslink/campuslink'),
(2, 'Outil de détection d''intrusion réseau', 'Projet de fin d''études : développement d''un IDS basé sur du machine learning. Cherche 1 profil réseau + 1 profil ML.', 'PROMO_SUPERIEUR', 2, 14, NULL),
(3, 'Application mobile de gestion des risques industriels', 'Projet MRI : créer une app mobile pour cartographier les risques sur site industriel. Cherche dev mobile (Flutter ou React Native).', 'PUBLIQUE', 6, 8, 'https://github.com/fabien-moreau/risk-mapper'),
(4, 'Bot Discord pour la communauté INSA', 'Création d''un bot Discord pour gérer les annonces, les sondages et les rappels d''événements INSA. Stack : Python + discord.py.', 'PUBLIQUE', 5, 25, NULL);

-- Candidatures
INSERT INTO "Candidature" (id, "messageMotivation", statut, id_tutorat) VALUES 
(1, 'Bonjour Alice, je suis en 1A et j''ai du mal avec les arbres binaires. Votre aide serait précieuse !', 'EN_ATTENTE', 1),
(2, 'Je suis intéressé par vos sessions algo, je prépare les partiels de janvier.', 'ACCEPTEE', 1),
(3, 'J''aimerais comprendre RSA en profondeur pour mon projet de fin d''études.', 'EN_ATTENTE', 2),
(4, 'Les maths c''est ma bête noire, vos sessions du mercredi m''arrangeraient parfaitement.', 'ACCEPTEE', 3),
(5, 'Je veux me préparer pour le hackathon sécurité, le pentesting basique m''intéresse.', 'REFUSEE', 4);

-- Commentaires
INSERT INTO "Commentaire" (id, texte, id_utilisateur, id_exercice, id_bonplan, id_tutorat, id_projet, id_parent) VALUES 
(1, 'Merci pour le partage ! Les rotations AVL c''est effectivement compliqué au début.', 1, 1, NULL, NULL, NULL, NULL),
(2, 'Exactement ! Je recommande cette vidéo YouTube qui explique très bien les cas de rotation.', 2, 1, NULL, NULL, NULL, 1),
(3, 'Super ressource sur Fourier, ça m''a sauvé pour les partiels !', 5, 2, NULL, NULL, NULL, NULL),
(4, 'Le hackathon a l'’air incroyable, vous cherchez encore des équipes ?', 3, NULL, 5, NULL, NULL, NULL),
(5, 'Oui ! Contactez-moi en DM pour former une équipe.', 7, NULL, 5, NULL, NULL, 4),
(6, 'Je suis intéressé par le projet CampusLink, j''ai de l''expérience en Vue.js !', 4, NULL, NULL, NULL, 1, NULL),
(7, 'Le bot Discord c''est une super idée, on en a besoin depuis longtemps !', 6, NULL, NULL, NULL, 4, NULL),
(8, 'Je suis disponible pour le tutorat maths le mercredi, comment on s''inscrit ?', 3, NULL, NULL, 3, NULL, NULL);

-- Jaimes
INSERT INTO "Jaime" (id_utilisateur, id_exercice, id_bonplan, id_tutorat, id_projet) VALUES 
(2, 1, NULL, NULL, NULL), (4, 1, NULL, NULL, NULL), (5, 2, NULL, NULL, NULL),
(1, 4, NULL, NULL, NULL), (3, 4, NULL, NULL, NULL), (6, 3, NULL, NULL, NULL),
(1, NULL, 2, NULL, NULL), (2, NULL, 2, NULL, NULL), (4, NULL, 5, NULL, NULL),
(5, NULL, 4, NULL, NULL), (3, NULL, 4, NULL, NULL), (6, NULL, 1, NULL, NULL),
(3, NULL, NULL, 1, NULL), (5, NULL, NULL, 3, NULL), (2, NULL, NULL, 3, NULL),
(4, NULL, NULL, 2, NULL), (2, NULL, NULL, NULL, 1), (3, NULL, NULL, NULL, 4),
(6, NULL, NULL, NULL, 1), (5, NULL, NULL, NULL, 4), (4, NULL, NULL, NULL, 2);

-- Notifications
INSERT INTO "Notification" (contenu, id_utilisateur, lue) VALUES 
('Alice a commenté votre exercice sur les arbres AVL.', 3, false),
('Nouvelle candidature reçue pour votre tutorat en algorithmique.', 1, false),
('Votre candidature au tutorat de cryptographie est en attente.', 4, true),
('Bob a liké votre partage de notes sur la cryptographie.', 2, true),
('Nouveau bon plan : Alternance Cybersécurité chez Thales !', 1, false),
('David est intéressé par votre projet CampusLink.', 1, false),
('Votre candidature au tutorat sécurité web a été refusée.', 5, false),
('Prof. Garnier a publié un nouvel exercice de maths.', 3, false),
('Le hackathon sécurité approche — inscrivez-vous vite !', 2, true);

-- Verification Emails (Tokens de test)
INSERT INTO "VerificationEmail" (email, code, expiration, nom, prenom, "motDePasse", role, id_formation) VALUES 
('test.inscription@insa-cvl.fr', '482910', NOW() - INTERVAL '1 hour', 'Durand', 'Lucas', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'ETUDIANT', 1),
('prof.test@insa-cvl.fr', '751234', NOW() + INTERVAL '15 minutes', 'Renard', 'Marie ', '$2b$10$wR6L7L1gZlZ7ZlzV7z7z7eZ0rZ1V2z3z4z5z6z7z8z9z0z1z2z3z4', 'PROFESSEUR', NULL);

-- =============================================================================
-- 5. AJUSTEMENT DES SÉQUENCES (Nécessaire après des insertions d'ID forcés)
-- =============================================================================
SELECT setval(pg_get_serial_sequence('"Campus"', 'id'), COALESCE(MAX(id), 1)) FROM "Campus";
SELECT setval(pg_get_serial_sequence('"Departement"', 'id'), COALESCE(MAX(id), 1)) FROM "Departement";
SELECT setval(pg_get_serial_sequence('"Formation"', 'id'), COALESCE(MAX(id), 1)) FROM "Formation";
SELECT setval(pg_get_serial_sequence('"Utilisateur"', 'id'), COALESCE(MAX(id), 1)) FROM "Utilisateur";
SELECT setval(pg_get_serial_sequence('"Matiere"', 'id'), COALESCE(MAX(id), 1)) FROM "Matiere";
SELECT setval(pg_get_serial_sequence('"AnnonceExercice"', 'id'), COALESCE(MAX(id), 1)) FROM "AnnonceExercice";
SELECT setval(pg_get_serial_sequence('"AnnonceBonPlan"', 'id'), COALESCE(MAX(id), 1)) FROM "AnnonceBonPlan";
SELECT setval(pg_get_serial_sequence('"AnnonceTutorat"', 'id'), COALESCE(MAX(id), 1)) FROM "AnnonceTutorat";
SELECT setval(pg_get_serial_sequence('"AnnonceProjet"', 'id'), COALESCE(MAX(id), 1)) FROM "AnnonceProjet";
SELECT setval(pg_get_serial_sequence('"Commentaire"', 'id'), COALESCE(MAX(id), 1)) FROM "Commentaire";
SELECT setval(pg_get_serial_sequence('"Candidature"', 'id'), COALESCE(MAX(id), 1)) FROM "Candidature";
SELECT setval(pg_get_serial_sequence('"VerificationEmail"', 'id'), COALESCE(MAX(id), 1)) FROM "VerificationEmail";