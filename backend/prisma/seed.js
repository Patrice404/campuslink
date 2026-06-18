import { PrismaClient, Role, SousTypeBonPlan, Visibilite, StatutCandidature, CentreInteret } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // ==========================================
  // 0. NETTOYAGE (ordre FK-safe) — rend le seed relançable
  // ==========================================
  await prisma.jaime.deleteMany();
  await prisma.commentaire.deleteMany();
  await prisma.candidature.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.annonceExercice.deleteMany();
  await prisma.annonceBonPlan.deleteMany();
  await prisma.annonceTutorat.deleteMany();
  await prisma.annonceProjet.deleteMany();
  await prisma.blocage.deleteMany();
  await prisma.verificationEmail.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.matiere.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.departement.deleteMany();
  await prisma.campus.deleteMany();
  console.log('🧹 Tables vidées.');

  // ==========================================
  // 1. CAMPUS, DÉPARTEMENTS, FORMATIONS
  // ==========================================
  const campus = await prisma.campus.create({
    data: {
      nom: "Campus de Bourges",
      ville: "Bourges",
      etablissement: "INSA Centre Val de Loire",
      departements: {
        create: [
          {
            nom: "STI (Sécurité et Technologies Informatiques)",
            formations: {
              create: [
                { nom: "Architecture logicielle et sécurité", niveau: "3A" },
                { nom: "Cybersécurité et réseaux", niveau: "4A" },
                { nom: "Ingénierie de la sécurité informatique", niveau: "5A" }
              ]
            }
          },
          {
            nom: "MRI (Maîtrise des Risques Industriels)",
            formations: {
              create: [
                { nom: "Génie industriel et risques", niveau: "3A" },
                { nom: "Management des risques", niveau: "4A" },
                { nom: "Sûreté de fonctionnement", niveau: "5A" }
              ]
            }
          },
          {
            nom: "STPI (Sciences et Techniques Pour l'Ingénieur)",
            formations: {
              create: [
                { nom: "Prépa Intégrée - Tronc Commun", niveau: "1A" },
                { nom: "Prépa Intégrée - Tronc Commun", niveau: "2A" }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('✅ Campus, Départements et Formations créés.');

  // Récupération des formations
  const stpi1A = await prisma.formation.findFirstOrThrow({ where: { niveau: "1A" } });
  const stpi2A = await prisma.formation.findFirstOrThrow({ where: { niveau: "2A" } });
  const sti3A  = await prisma.formation.findFirstOrThrow({ where: { niveau: "3A", nom: { contains: "Architecture" } } });
  const sti4A  = await prisma.formation.findFirstOrThrow({ where: { niveau: "4A", nom: { contains: "Cybersécurité" } } });
  const sti5A  = await prisma.formation.findFirstOrThrow({ where: { niveau: "5A", nom: { contains: "Ingénierie" } } });
  const mri3A  = await prisma.formation.findFirstOrThrow({ where: { niveau: "3A", nom: { contains: "Génie" } } });
  const mri5A  = await prisma.formation.findFirstOrThrow({ where: { niveau: "5A", nom: { contains: "Sûreté" } } });

  // ==========================================
  // 2. MATIÈRES
  // ==========================================
  const matieresData = [
    { titre: "Algorithmique et Structures de Données", formations: [stpi1A.id, stpi2A.id, sti3A.id] },
    { titre: "Mathématiques pour l'ingénieur",         formations: [stpi1A.id, stpi2A.id] },
    { titre: "Développement Web et Base de données",   formations: [sti3A.id] },
    { titre: "Programmation Orientée Objet (Java/C++)",formations: [sti3A.id] },
    { titre: "Sécurité des applications web",          formations: [sti4A.id] },
    { titre: "Cryptographie appliquée",                formations: [sti4A.id] },
    { titre: "Droit du travail et management",         formations: [sti5A.id, mri5A.id] },
    { titre: "Réseaux et protocoles",                  formations: [sti3A.id, sti4A.id] },
    { titre: "Systèmes d'exploitation",                formations: [stpi2A.id, sti3A.id] },
    { titre: "Gestion des risques industriels",        formations: [mri3A.id, mri5A.id] },
  ];

  const matieres = {};
  for (const m of matieresData) {
    const created = await prisma.matiere.create({
      data: {
        titre: m.titre,
        formations: { connect: m.formations.map(id => ({ id })) }
      }
    });
    matieres[m.titre] = created.id;
  }

  console.log('✅ Matières créées et liées aux formations.');

  // ==========================================
  // 3. UTILISATEURS
  // ==========================================
  const motDePasse = await bcrypt.hash('Password123!', 10);

  // Étudiants
  const alice = await prisma.utilisateur.create({ data: {
    nom: 'Dupont', prenom: 'Alice', email: 'alice.dupont@insa-cvl.fr',
    motDePasse, role: Role.ADMIN, id_formation: sti3A.id,
    bio: 'Passionnée de cybersécurité et de développement web.',
    centresInteret: [CentreInteret.PROJET, CentreInteret.EXERCICE, CentreInteret.ENTRAIDE],
  }});

  const bob = await prisma.utilisateur.create({ data: {
    nom: 'Martin', prenom: 'Bob', email: 'bob.martin@insa-cvl.fr',
    motDePasse, role: Role.ETUDIANT, id_formation: sti4A.id,
    bio: 'Fan de CTF et de cryptographie.',
    centresInteret: [CentreInteret.EXERCICE, CentreInteret.BON_PLAN],
  }});

  const clara = await prisma.utilisateur.create({ data: {
    nom: 'Bernard', prenom: 'Clara', email: 'clara.bernard@insa-cvl.fr',
    motDePasse, role: Role.ETUDIANT, id_formation: stpi1A.id,
    bio: 'En 1A, je cherche de l\'aide en maths et algo !',
    centresInteret: [CentreInteret.ENTRAIDE, CentreInteret.MATIERE],
  }});

  const david = await prisma.utilisateur.create({ data: {
    nom: 'Leroy', prenom: 'David', email: 'david.leroy@insa-cvl.fr',
    motDePasse, role: Role.ETUDIANT, id_formation: sti5A.id,
    bio: 'En 5A, je cherche une alternance en sécu.',
    centresInteret: [CentreInteret.BON_PLAN, CentreInteret.PROJET],
  }});

  const emma = await prisma.utilisateur.create({ data: {
    nom: 'Petit', prenom: 'Emma', email: 'emma.petit@insa-cvl.fr',
    motDePasse, role: Role.ETUDIANT, id_formation: stpi2A.id,
    bio: 'Curieuse de tout, surtout des systèmes d\'exploitation.',
    centresInteret: [CentreInteret.EXERCICE, CentreInteret.ENTRAIDE],
  }});

  const fabien = await prisma.utilisateur.create({ data: {
    nom: 'Moreau', prenom: 'Fabien', email: 'fabien.moreau@insa-cvl.fr',
    motDePasse, role: Role.ETUDIANT, id_formation: mri3A.id,
    bio: 'Étudiant MRI passionné par la gestion des risques.',
    centresInteret: [CentreInteret.PROJET, CentreInteret.BON_PLAN],
  }});

  // Professeurs
  const profLaurent = await prisma.utilisateur.create({ data: {
    nom: 'Laurent', prenom: 'Jean', email: 'jean.laurent@insa-cvl.fr',
    motDePasse, role: Role.PROFESSEUR,
    bio: 'Professeur de cryptographie et sécurité des systèmes.',
    centresInteret: [CentreInteret.MATIERE, CentreInteret.EXERCICE],
  }});

  const profSophie = await prisma.utilisateur.create({ data: {
    nom: 'Garnier', prenom: 'Sophie', email: 'sophie.garnier@insa-cvl.fr',
    motDePasse, role: Role.PROFESSEUR,
    bio: 'Professeure de mathématiques et algorithmique.',
    centresInteret: [CentreInteret.MATIERE, CentreInteret.ENTRAIDE],
  }});

  console.log('✅ Utilisateurs créés.');

  // ==========================================
  // 4. BLOCAGES
  // ==========================================
  await prisma.blocage.create({ data: {
    id_utilisateur_bloquant: bob.id,
    id_utilisateur_bloque: fabien.id
  }});

  console.log('✅ Blocages créés.');

  // ==========================================
  // 5. ANNONCES EXERCICE
  // ==========================================
  const exercice1 = await prisma.annonceExercice.create({ data: {
    description: "J'ai du mal avec les arbres AVL en algo, quelqu'un peut m'expliquer les rotations ?",
    annee: "2024",
    visibilite: Visibilite.PUBLIQUE,
    id_utilisateur: clara.id,
    id_matiere: matieres["Algorithmique et Structures de Données"],
    nbJaime: 5,
  }});

  const exercice2 = await prisma.annonceExercice.create({ data: {
    description: "Exercice corrigé sur les suites de Fourier — exam 2023 disponible en lien.",
    annee: "2023",
    visibilite: Visibilite.PROMOTION,
    lien: "https://github.com/insa-cvl/maths-fourier",
    id_utilisateur: profSophie.id,
    id_matiere: matieres["Mathématiques pour l'ingénieur"],
    nbJaime: 12,
  }});

  const exercice3 = await prisma.annonceExercice.create({ data: {
    description: "TP noté sur les injections SQL — pensez à tester vos requêtes préparées !",
    annee: "2024",
    visibilite: Visibilite.ETUDIANT,
    id_utilisateur: alice.id,
    id_matiere: matieres["Développement Web et Base de données"],
    nbJaime: 8,
  }});

  const exercice4 = await prisma.annonceExercice.create({ data: {
    description: "Partage de mes notes de cours sur la cryptographie asymétrique (RSA, ECC).",
    annee: "2024",
    visibilite: Visibilite.PUBLIQUE,
    lien: "https://github.com/bob-martin/crypto-notes",
    id_utilisateur: bob.id,
    id_matiere: matieres["Cryptographie appliquée"],
    nbJaime: 20,
  }});

  const exercice5 = await prisma.annonceExercice.create({ data: {
    description: "Aide sur les processus et threads en OS — je bloque sur les deadlocks.",
    annee: "2024",
    visibilite: Visibilite.PUBLIQUE,
    id_utilisateur: emma.id,
    id_matiere: matieres["Systèmes d'exploitation"],
    nbJaime: 3,
  }});

  console.log('✅ Annonces Exercice créées.');

  // ==========================================
  // 6. ANNONCES BON PLAN
  // ==========================================
  const bonPlan1 = await prisma.annonceBonPlan.create({ data: {
    titre: "Job étudiant – Moniteur informatique INSA",
    description: "Le service informatique de l'INSA recrute un moniteur pour aider les étudiants. 10h/semaine, 12€/h. Postulez avant le 30/06.",
    sousType: SousTypeBonPlan.JOB_ETUDIANT,
    visibilite: Visibilite.ETUDIANT,
    id_utilisateur: david.id,
    nbJaime: 15,
  }});

  const bonPlan2 = await prisma.annonceBonPlan.create({ data: {
    titre: "Alternance Cybersécurité – Thales Bourges",
    description: "Thales recrute en alternance pour un poste d'analyste SOC. Niveau 4A/5A requis. Lien de candidature ci-dessous.",
    sousType: SousTypeBonPlan.ALTERNANCE,
    visibilite: Visibilite.PROMO_SUPERIEUR,
    lien: "https://www.thalesgroup.com/fr/carrieres",
    id_utilisateur: profLaurent.id,
    nbJaime: 34,
  }});

  const bonPlan3 = await prisma.annonceBonPlan.create({ data: {
    titre: "Colocation disponible – Centre Bourges",
    description: "Chambre meublée disponible dans un T3 proche du campus. 380€/mois charges comprises. Ambiance calme et studieuse.",
    sousType: SousTypeBonPlan.COLOCATION,
    visibilite: Visibilite.PUBLIQUE,
    id_utilisateur: emma.id,
    nbJaime: 7,
  }});

  const bonPlan4 = await prisma.annonceBonPlan.create({ data: {
    titre: "Soirée intégration INSA – Vendredi 20h",
    description: "La BDE organise la soirée d'intégration des 1A vendredi soir à la salle des fêtes du campus. Entrée gratuite !",
    sousType: SousTypeBonPlan.FETE,
    visibilite: Visibilite.PUBLIQUE,
    id_utilisateur: alice.id,
    nbJaime: 42,
  }});

  const bonPlan5 = await prisma.annonceBonPlan.create({ data: {
    titre: "Hackathon Sécurité – 48h pour hacker éthiquement",
    description: "Hackathon organisé par l'INSA en partenariat avec Orange Cyberdefense. Équipes de 3 à 5 personnes. Prix à gagner !",
    sousType: SousTypeBonPlan.HACKATHON,
    visibilite: Visibilite.PUBLIQUE,
    lien: "https://hackathon-insa-cvl.fr",
    id_utilisateur: profLaurent.id,
    nbJaime: 28,
  }});

  const bonPlan6 = await prisma.annonceBonPlan.create({ data: {
    titre: "Bourse Région Centre – Dossiers à déposer avant le 15/07",
    description: "La région Centre-Val de Loire propose des bourses d'excellence pour les étudiants en ingénierie. Critères et formulaire sur le lien.",
    sousType: SousTypeBonPlan.BOURSE,
    visibilite: Visibilite.ETUDIANT,
    lien: "https://www.regioncentre-valdeloire.fr/bourses",
    id_utilisateur: profSophie.id,
    nbJaime: 19,
  }});

  console.log('✅ Annonces Bon Plan créées.');

  // ==========================================
  // 7. ANNONCES TUTORAT
  // ==========================================
  const tutorat1 = await prisma.annonceTutorat.create({ data: {
    description: "Je propose des séances de tutorat en algo pour les 1A et 2A. 1h/semaine en présentiel ou visio. Niveau licence confirmé.",
    annee: "2024",
    visibilite: Visibilite.PUBLIQUE,
    nbCandidatsVoulus: 3,
    id_utilisateur: alice.id,
    id_matiere: matieres["Algorithmique et Structures de Données"],
    nbJaime: 6,
  }});

  const tutorat2 = await prisma.annonceTutorat.create({ data: {
    description: "Tutorat en cryptographie appliquée pour les 4A. Je peux aider sur RSA, AES et les protocoles TLS.",
    annee: "2024",
    visibilite: Visibilite.PROMOTION,
    nbCandidatsVoulus: 2,
    id_utilisateur: bob.id,
    id_matiere: matieres["Cryptographie appliquée"],
    nbJaime: 9,
  }});

  const tutorat3 = await prisma.annonceTutorat.create({ data: {
    description: "Aide en maths pour les 1A — suites, intégrales, équations différentielles. Sessions le mercredi après-midi.",
    annee: "2024",
    visibilite: Visibilite.PUBLIQUE,
    nbCandidatsVoulus: 5,
    id_utilisateur: profSophie.id,
    id_matiere: matieres["Mathématiques pour l'ingénieur"],
    nbJaime: 22,
  }});

  const tutorat4 = await prisma.annonceTutorat.create({ data: {
    description: "Tutorat en sécurité web (OWASP Top 10, pentesting basique). Pour les 3A qui veulent prendre de l'avance.",
    annee: "2024",
    visibilite: Visibilite.ETUDIANT,
    nbCandidatsVoulus: 4,
    id_utilisateur: david.id,
    id_matiere: matieres["Sécurité des applications web"],
    nbJaime: 11,
  }});

  console.log('✅ Annonces Tutorat créées.');

  // ==========================================
  // 8. ANNONCES PROJET
  // ==========================================
  const projet1 = await prisma.annonceProjet.create({ data: {
    titre: "CampusLink – Réseau social étudiant",
    description: "On cherche 2 développeurs pour rejoindre notre projet de réseau social étudiant. Stack : Vue.js, Node.js, PostgreSQL. Rejoignez-nous !",
    visibilite: Visibilite.PUBLIQUE,
    lien: "https://github.com/campuslink/campuslink",
    id_utilisateur: alice.id,
    nbJaime: 18,
  }});

  const projet2 = await prisma.annonceProjet.create({ data: {
    titre: "Outil de détection d'intrusion réseau",
    description: "Projet de fin d'études : développement d'un IDS basé sur du machine learning. Cherche 1 profil réseau + 1 profil ML.",
    visibilite: Visibilite.PROMO_SUPERIEUR,
    id_utilisateur: bob.id,
    nbJaime: 14,
  }});

  const projet3 = await prisma.annonceProjet.create({ data: {
    titre: "Application mobile de gestion des risques industriels",
    description: "Projet MRI : créer une app mobile pour cartographier les risques sur site industriel. Cherche dev mobile (Flutter ou React Native).",
    visibilite: Visibilite.PUBLIQUE,
    lien: "https://github.com/fabien-moreau/risk-mapper",
    id_utilisateur: fabien.id,
    nbJaime: 8,
  }});

  const projet4 = await prisma.annonceProjet.create({ data: {
    titre: "Bot Discord pour la communauté INSA",
    description: "Création d'un bot Discord pour gérer les annonces, les sondages et les rappels d'événements INSA. Stack : Python + discord.py.",
    visibilite: Visibilite.PUBLIQUE,
    id_utilisateur: emma.id,
    nbJaime: 25,
  }});

  console.log('✅ Annonces Projet créées.');

  // ==========================================
  // 9. CANDIDATURES TUTORAT
  // ==========================================
  await prisma.candidature.create({ data: {
    messageMotivation: "Bonjour Alice, je suis en 1A et j'ai du mal avec les arbres binaires. Votre aide serait précieuse !",
    statut: StatutCandidature.EN_ATTENTE,
    id_tutorat: tutorat1.id,
  }});

  await prisma.candidature.create({ data: {
    messageMotivation: "Je suis intéressé par vos sessions algo, je prépare les partiels de janvier.",
    statut: StatutCandidature.ACCEPTEE,
    id_tutorat: tutorat1.id,
  }});

  await prisma.candidature.create({ data: {
    messageMotivation: "J'aimerais comprendre RSA en profondeur pour mon projet de fin d'études.",
    statut: StatutCandidature.EN_ATTENTE,
    id_tutorat: tutorat2.id,
  }});

  await prisma.candidature.create({ data: {
    messageMotivation: "Les maths c'est ma bête noire, vos sessions du mercredi m'arrangeraient parfaitement.",
    statut: StatutCandidature.ACCEPTEE,
    id_tutorat: tutorat3.id,
  }});

  await prisma.candidature.create({ data: {
    messageMotivation: "Je veux me préparer pour le hackathon sécurité, le pentesting basique m'intéresse.",
    statut: StatutCandidature.REFUSEE,
    id_tutorat: tutorat4.id,
  }});

  console.log('✅ Candidatures créées.');

  // ==========================================
  // 10. COMMENTAIRES
  // ==========================================
  const comm1 = await prisma.commentaire.create({ data: {
    texte: "Merci pour le partage ! Les rotations AVL c'est effectivement compliqué au début.",
    id_utilisateur: alice.id,
    id_exercice: exercice1.id,
  }});

  // Réponse au commentaire
  await prisma.commentaire.create({ data: {
    texte: "Exactement ! Je recommande cette vidéo YouTube qui explique très bien les cas de rotation.",
    id_utilisateur: bob.id,
    id_exercice: exercice1.id,
    id_parent: comm1.id,
  }});

  await prisma.commentaire.create({ data: {
    texte: "Super ressource sur Fourier, ça m'a sauvé pour les partiels !",
    id_utilisateur: emma.id,
    id_exercice: exercice2.id,
  }});

  const comm3 = await prisma.commentaire.create({ data: {
    texte: "Le hackathon a l'air incroyable, vous cherchez encore des équipes ?",
    id_utilisateur: clara.id,
    id_bonplan: bonPlan5.id,
  }});

  await prisma.commentaire.create({ data: {
    texte: "Oui ! Contactez-moi en DM pour former une équipe.",
    id_utilisateur: profLaurent.id,
    id_bonplan: bonPlan5.id,
    id_parent: comm3.id,
  }});

  await prisma.commentaire.create({ data: {
    texte: "Je suis intéressé par le projet CampusLink, j'ai de l'expérience en Vue.js !",
    id_utilisateur: david.id,
    id_projet: projet1.id,
  }});

  await prisma.commentaire.create({ data: {
    texte: "Le bot Discord c'est une super idée, on en a besoin depuis longtemps !",
    id_utilisateur: fabien.id,
    id_projet: projet4.id,
  }});

  await prisma.commentaire.create({ data: {
    texte: "Je suis disponible pour le tutorat maths le mercredi, comment on s'inscrit ?",
    id_utilisateur: clara.id,
    id_tutorat: tutorat3.id,
  }});

  console.log('✅ Commentaires créés.');

  // ==========================================
  // 11. JAIMES
  // ==========================================
  const jaimesData = [
    // Exercices
    { id_utilisateur: bob.id,        id_exercice: exercice1.id },
    { id_utilisateur: david.id,      id_exercice: exercice1.id },
    { id_utilisateur: emma.id,       id_exercice: exercice2.id },
    { id_utilisateur: alice.id,      id_exercice: exercice4.id },
    { id_utilisateur: clara.id,      id_exercice: exercice4.id },
    { id_utilisateur: fabien.id,     id_exercice: exercice3.id },
    // Bon Plans
    { id_utilisateur: alice.id,      id_bonplan: bonPlan2.id },
    { id_utilisateur: bob.id,        id_bonplan: bonPlan2.id },
    { id_utilisateur: david.id,      id_bonplan: bonPlan5.id },
    { id_utilisateur: emma.id,       id_bonplan: bonPlan4.id },
    { id_utilisateur: clara.id,      id_bonplan: bonPlan4.id },
    { id_utilisateur: fabien.id,     id_bonplan: bonPlan1.id },
    // Tutorats
    { id_utilisateur: clara.id,      id_tutorat: tutorat1.id },
    { id_utilisateur: emma.id,       id_tutorat: tutorat3.id },
    { id_utilisateur: bob.id,        id_tutorat: tutorat3.id },
    { id_utilisateur: david.id,      id_tutorat: tutorat2.id },
    // Projets
    { id_utilisateur: bob.id,        id_projet: projet1.id },
    { id_utilisateur: clara.id,      id_projet: projet4.id },
    { id_utilisateur: fabien.id,     id_projet: projet1.id },
    { id_utilisateur: emma.id,       id_projet: projet4.id },
    { id_utilisateur: david.id,      id_projet: projet2.id },
  ];

  for (const jaime of jaimesData) {
    await prisma.jaime.create({ data: jaime });
  }

  console.log('✅ Jaimes créés.');

  // ==========================================
  // 12. NOTIFICATIONS
  // ==========================================
  await prisma.notification.createMany({ data: [
    { contenu: "Alice a commenté votre exercice sur les arbres AVL.", id_utilisateur: clara.id, lue: false },
    { contenu: "Nouvelle candidature reçue pour votre tutorat en algorithmique.", id_utilisateur: alice.id, lue: false },
    { contenu: "Votre candidature au tutorat de cryptographie est en attente.", id_utilisateur: david.id, lue: true },
    { contenu: "Bob a liké votre partage de notes sur la cryptographie.", id_utilisateur: bob.id, lue: true },
    { contenu: "Nouveau bon plan : Alternance Cybersécurité chez Thales !", id_utilisateur: alice.id, lue: false },
    { contenu: "David est intéressé par votre projet CampusLink.", id_utilisateur: alice.id, lue: false },
    { contenu: "Votre candidature au tutorat sécurité web a été refusée.", id_utilisateur: emma.id, lue: false },
    { contenu: "Prof. Garnier a publié un nouvel exercice de maths.", id_utilisateur: clara.id, lue: false },
    { contenu: "Le hackathon sécurité approche — inscrivez-vous vite !", id_utilisateur: bob.id, lue: true },
  ]});

  console.log('✅ Notifications créées.');

  // ==========================================
  // 13. VÉRIFICATIONS EMAIL (tokens expirés pour tests)
  // ==========================================
  await prisma.verificationEmail.createMany({ data: [
    {
      email: 'test.inscription@insa-cvl.fr',
      code: '482910',
      expiration: new Date(Date.now() - 1000 * 60 * 60), // expiré il y a 1h
      nom: 'Durand', prenom: 'Lucas',
      motDePasse: await bcrypt.hash('Password123!', 10),
      role: Role.ETUDIANT,
      id_formation: sti3A.id,
    },
    {
      email: 'prof.test@insa-cvl.fr',
      code: '751234',
      expiration: new Date(Date.now() + 1000 * 60 * 15), // expire dans 15min
      nom: 'Renard', prenom: 'Marie',
      motDePasse: await bcrypt.hash('Password123!', 10),
      role: Role.PROFESSEUR,
    }
  ]});

  console.log('✅ VerificationEmails créées.');
  console.log('');
  console.log('🎉 Seeding terminé ! Voici les comptes de test :');
  console.log('');
  console.log('👩 alice.dupont@insa-cvl.fr     | Password123! | ETUDIANT 3A STI');
  console.log('👨 bob.martin@insa-cvl.fr       | Password123! | ETUDIANT 4A STI');
  console.log('👩 clara.bernard@insa-cvl.fr    | Password123! | ETUDIANT 1A STPI');
  console.log('👨 david.leroy@insa-cvl.fr      | Password123! | ETUDIANT 5A STI');
  console.log('👩 emma.petit@insa-cvl.fr       | Password123! | ETUDIANT 2A STPI');
  console.log('👨 fabien.moreau@insa-cvl.fr    | Password123! | ETUDIANT 3A MRI');
  console.log('👨 jean.laurent@insa-cvl.fr     | Password123! | PROFESSEUR');
  console.log('👩 sophie.garnier@insa-cvl.fr   | Password123! | PROFESSEUR');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });