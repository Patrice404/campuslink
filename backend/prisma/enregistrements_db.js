const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("🧹 Nettoyage des tables (sauf Utilisateur)...\n")

  // Ordre important : supprimer d'abord les tables qui ont des FK vers les autres
  await prisma.jaime.deleteMany()
  await prisma.commentaire.deleteMany()
  await prisma.candidature.deleteMany()
  await prisma.annonceExercice.deleteMany()
  await prisma.annonceBonPlan.deleteMany()
  await prisma.annonceTutorat.deleteMany()
  await prisma.annonceProjet.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.matiere.deleteMany()
  await prisma.campus.deleteMany()
  console.log("✅ Tables vidées.\n")

  // -------------------------------------------------------
  // 1. CAMPUS
  // -------------------------------------------------------
  console.log("🏫 Création des campus...")

  const [insaCvl, iutBourges, univOrleans] = await Promise.all([
    prisma.campus.create({ data: { nom: 'INSA CVL', ville: 'Bourges', etablissement: 'INSA Centre Val de Loire' } }),
    prisma.campus.create({ data: { nom: 'IUT Bourges', ville: 'Bourges', etablissement: 'Université de Bourges' } }),
    prisma.campus.create({ data: { nom: "Université d'Orléans", ville: 'Orléans', etablissement: "Université d'Orléans" } }),
  ])
  console.log(`  ✅ ${insaCvl.nom} | ${iutBourges.nom} | ${univOrleans.nom}`)

  // -------------------------------------------------------
  // 2. MATIÈRES — variées, plusieurs années
  // -------------------------------------------------------
  console.log("\n📚 Création des matières...")

  const [maths, algo, devWeb, bdd, physique, anglais, droit, reseaux, ia, gestion] = await Promise.all([
    prisma.matiere.create({ data: { titre: 'Mathématiques', annee: 'L1' } }),
    prisma.matiere.create({ data: { titre: 'Algorithmique', annee: 'L1' } }),
    prisma.matiere.create({ data: { titre: 'Développement Web', annee: 'L2' } }),
    prisma.matiere.create({ data: { titre: 'Bases de données', annee: 'L2' } }),
    prisma.matiere.create({ data: { titre: 'Physique appliquée', annee: 'L1' } }),
    prisma.matiere.create({ data: { titre: 'Anglais technique', annee: 'L3' } }),
    prisma.matiere.create({ data: { titre: 'Droit du numérique', annee: 'L3' } }),
    prisma.matiere.create({ data: { titre: 'Réseaux & Sécurité', annee: 'M1' } }),
    prisma.matiere.create({ data: { titre: 'Intelligence Artificielle', annee: 'M1' } }),
    prisma.matiere.create({ data: { titre: 'Gestion de projet', annee: 'M2' } }),
  ])
  console.log(`  ✅ ${[maths, algo, devWeb, bdd, physique, anglais, droit, reseaux, ia, gestion].map(m => m.titre).join(', ')}`)

  // -------------------------------------------------------
  // 3. UTILISATEURS — on récupère ceux qui existent déjà
  // -------------------------------------------------------
  console.log("\n👤 Récupération des utilisateurs existants...")

  const utilisateurs = await prisma.utilisateur.findMany()
  if (utilisateurs.length === 0) {
    console.error("  ❌ Aucun utilisateur trouvé. Lance d'abord le seed utilisateurs.")
    process.exit(1)
  }

  // On rattache chaque utilisateur à un campus si ce n'est pas encore fait
  // (les campus viennent d'être recréés, les ids changent — on met à jour)
  const campus = [insaCvl, iutBourges, univOrleans]
  for (let i = 0; i < utilisateurs.length; i++) {
    const campusChoisi = campus[i % campus.length]
    await prisma.utilisateur.update({
      where: { id: utilisateurs[i].id },
      data: { id_campus: campusChoisi.id }
    })
  }
  console.log(`  ✅ ${utilisateurs.length} utilisateur(s) rattaché(s) aux campus.`)

  // On récupère les utilisateurs mis à jour
  const users = await prisma.utilisateur.findMany()
  const u = (i) => users[i % users.length]

  // -------------------------------------------------------
  // 4. ANNONCES EXERCICE
  // -------------------------------------------------------
  console.log("\n📝 Création des annonces Exercice...")

  const exercices = await Promise.all([
    prisma.annonceExercice.create({ data: {
      texte: "Bonjour, j'ai du mal à comprendre la notion de récursivité en algorithmique. Est-ce que quelqu'un peut m'expliquer avec un exemple concret ?",
      annee: 'L1', id_matiere: algo.id, id_utilisateur: u(0).id, nbJaime: 12
    }}),
    prisma.annonceExercice.create({ data: {
      texte: "Je partage le corrigé du TD3 sur les requêtes SQL JOIN. J'ai vérifié avec le prof, toutes les réponses sont correctes.",
      annee: 'L2', id_matiere: bdd.id, id_utilisateur: u(1).id, nbJaime: 34
    }}),
    prisma.annonceExercice.create({ data: {
      texte: "Quelqu'un a-t-il réussi l'exercice 4 sur les intégrales du TD2 ? Je bloque sur la méthode de substitution.",
      annee: 'L1', id_matiere: maths.id, id_utilisateur: u(2).id, nbJaime: 7
    }}),
    prisma.annonceExercice.create({ data: {
      texte: "Voici mes notes de cours sur les protocoles TCP/IP et le modèle OSI, avec des schémas explicatifs. Libre de partage.",
      annee: 'M1', id_matiere: reseaux.id, id_utilisateur: u(0).id, nbJaime: 56
    }}),
    prisma.annonceExercice.create({ data: {
      texte: "Je cherche de l'aide sur le projet Vue.js du cours de Dev Web. Mon composant parent ne communique pas bien avec l'enfant via les props.",
      annee: 'L2', id_matiere: devWeb.id, id_utilisateur: u(1).id, nbJaime: 19
    }}),
    prisma.annonceExercice.create({ data: {
      texte: "Annale de l'examen de Physique 2023 avec corrections détaillées. Idéal pour réviser les partiels de janvier.",
      annee: 'L1', id_matiere: physique.id, id_utilisateur: u(2).id, nbJaime: 88
    }}),
  ])
  console.log(`  ✅ ${exercices.length} annonces Exercice créées.`)

  // -------------------------------------------------------
  // 5. ANNONCES BON PLAN
  // -------------------------------------------------------
  console.log("\n💡 Création des annonces Bon Plan...")

  const bonsPlans = await Promise.all([
    prisma.annonceBonPlan.create({ data: {
      titre: 'Job étudiant : animateur périscolaire',
      texte: "La mairie de Bourges recrute des animateurs pour les mercredis après-midi. 12€/h, pas besoin de BAFA. Contactez rh@mairie-bourges.fr",
      sousType: 'JOB_ETUDIANT', id_utilisateur: u(0).id, nbJaime: 45
    }}),
    prisma.annonceBonPlan.create({ data: {
      titre: 'Coloc dispo dès le 1er septembre — Bourges centre',
      texte: "Chambre meublée de 12m² dans appartement T4 en plein centre. 350€/mois CC. On est 3 étudiants sympas, ambiance calme. Dispo pour visite le week-end.",
      sousType: 'COLOCATION', id_utilisateur: u(1).id, nbJaime: 23
    }}),
    prisma.annonceBonPlan.create({ data: {
      titre: 'Alternance développeur fullstack — startup FinTech',
      texte: "Startup cherche alternant Bac+4/5 pour 2 jours école / 3 jours entreprise. Stack : React + Node.js + PostgreSQL. Télétravail partiel possible. Envoyer CV sur jobs@fintech-cvl.fr",
      sousType: 'ALTERNANCE', id_utilisateur: u(2).id, nbJaime: 67
    }}),
    prisma.annonceBonPlan.create({ data: {
      titre: '-20% au restaurant Le Méridien sur présentation carte étudiant',
      texte: "Le resto Le Méridien (rue des Arènes) offre 20% de réduction à tous les étudiants le midi en semaine. Menu étudiant à 8€. À faire valider à la caisse.",
      sousType: 'RESTAURANT', id_utilisateur: u(0).id, nbJaime: 102
    }}),
    prisma.annonceBonPlan.create({ data: {
      titre: 'Hackathon 48h — "IA & Santé" — Orléans',
      texte: "L'association NumériSanté organise un hackathon de 48h sur le thème IA & Santé. Équipes de 3 à 5 personnes. Prix : 3000€ pour le 1er. Inscription avant le 30 juin.",
      sousType: 'HACKATHON', id_utilisateur: u(1).id, nbJaime: 89
    }}),
    prisma.annonceBonPlan.create({ data: {
      titre: 'Bourse Excellence INSA CVL — candidatez avant le 15 juillet',
      texte: "L'INSA propose 10 bourses Excellence de 2000€ pour les étudiants en M1/M2 avec mention. Dossier à déposer au secrétariat ou par mail avant le 15 juillet.",
      sousType: 'BOURSE', id_utilisateur: u(2).id, nbJaime: 77
    }}),
    prisma.annonceBonPlan.create({ data: {
      titre: 'Soirée de rentrée BDE — vendredi 6 septembre',
      texte: "Le BDE organise la soirée de rentrée au Bistro des Arts. Entrée gratuite avec la carte étudiante avant 22h. DJ et animations toute la nuit.",
      sousType: 'FETE', id_utilisateur: u(0).id, nbJaime: 134
    }}),
    prisma.annonceBonPlan.create({ data: {
      titre: 'Forum des métiers du numérique — IUT Bourges',
      texte: "Le forum annuel des métiers du numérique aura lieu le 12 octobre à l'IUT. 30 entreprises présentes. Apportez vos CV, des entretiens sur place sont possibles.",
      sousType: 'EVENEMENT', id_utilisateur: u(1).id, nbJaime: 58
    }}),
  ])
  console.log(`  ✅ ${bonsPlans.length} annonces Bon Plan créées.`)

  // -------------------------------------------------------
  // 6. ANNONCES TUTORAT
  // -------------------------------------------------------
  console.log("\n🎓 Création des annonces Tutorat...")

  const tutorats = await Promise.all([
    prisma.annonceTutorat.create({ data: {
      description: "Je propose des séances de tutorat en algorithmique pour les L1. On travaille sur les exercices du TD, j'explique la logique pas à pas. Séances de 1h30 le jeudi soir.",
      annee: 'L1', nbCandidatsVoulus: 4, id_matiere: algo.id, id_utilisateur: u(0).id, nbJaime: 28
    }}),
    prisma.annonceTutorat.create({ data: {
      description: "Tutorat SQL & modélisation de bases de données. Je peux vous aider à préparer l'exam de BDD, on refait les annales ensemble. Groupe de max 3 personnes.",
      annee: 'L2', nbCandidatsVoulus: 3, id_matiere: bdd.id, id_utilisateur: u(1).id, nbJaime: 15
    }}),
    prisma.annonceTutorat.create({ data: {
      description: "Aide en mathématiques L1 : dérivées, intégrales, suites numériques. Je suis en L3 et j'ai eu 17 en maths. Disponible le mercredi après-midi ou le samedi matin.",
      annee: 'L1', nbCandidatsVoulus: 5, id_matiere: maths.id, id_utilisateur: u(2).id, nbJaime: 41
    }}),
    prisma.annonceTutorat.create({ data: {
      description: "Tutorat développement web : HTML/CSS/JS et initiation à Vue.js. Je fais des corrections de projets et j'explique les erreurs. Sessions de 2h en visio ou en présentiel.",
      annee: 'L2', nbCandidatsVoulus: 3, id_matiere: devWeb.id, id_utilisateur: u(0).id, nbJaime: 33
    }}),
    prisma.annonceTutorat.create({ data: {
      description: "Préparation à l'exam d'anglais technique : rédaction de rapports, vocabulaire spécialisé en informatique et ingénierie. J'ai eu TOEIC 930, je peux vous coacher.",
      annee: 'L3', nbCandidatsVoulus: 2, id_matiere: anglais.id, id_utilisateur: u(1).id, nbJaime: 22
    }}),
  ])
  console.log(`  ✅ ${tutorats.length} annonces Tutorat créées.`)

  // -------------------------------------------------------
  // 7. ANNONCES PROJET
  // -------------------------------------------------------
  console.log("\n🚀 Création des annonces Projet...")

  const projets = await Promise.all([
    prisma.annonceProjet.create({ data: {
      titre: "Application mobile de covoiturage inter-campus",
      texte: "On cherche des coéquipiers pour développer une app de covoiturage entre les campus INSA, IUT et Université d'Orléans.",
      description: "Stack envisagée : React Native + Node.js + PostgreSQL. On a déjà le cahier des charges et les maquettes Figma. Recherche 1 dev back et 1 designer UI/UX. Projet sur 3 mois.",
      id_utilisateur: u(0).id, nbJaime: 47
    }}),
    prisma.annonceProjet.create({ data: {
      titre: "Bot Discord pour gérer les annonces CampusLink",
      texte: "Projet de créer un bot Discord qui poste automatiquement les nouvelles annonces CampusLink dans les serveurs de promo.",
      description: "On utilise l'API CampusLink + discord.js. Projet court (1 mois), idéal pour un L2/L3 qui veut s'initier aux bots et aux webhooks. Une personne suffit en plus de moi.",
      id_utilisateur: u(1).id, nbJaime: 31
    }}),
    prisma.annonceProjet.create({ data: {
      titre: "Jeu vidéo 2D en Python — thème : campus fantôme",
      texte: "Je développe un petit jeu d'aventure 2D avec Pygame, dans un campus hanté. Je cherche quelqu'un pour les sprites et les niveaux.",
      description: "Pas besoin d'être expert en Python, je gère le code. J'ai besoin d'un(e) graphiste pixel art et d'un(e) game designer pour concevoir les maps et les énigmes. Projet fun et créatif.",
      id_utilisateur: u(2).id, nbJaime: 63
    }}),
    prisma.annonceProjet.create({ data: {
      titre: "Dashboard de suivi de notes pour étudiants",
      texte: "Application web pour suivre ses notes par matière, calculer sa moyenne et prévoir les résultats aux rattrapages.",
      description: "Vue.js 3 + Express + PostgreSQL. Fonctionnalités : saisie des notes, graphiques d'évolution, export PDF. Recherche 1 dev fullstack motivé. Projet à valoriser dans un portfolio.",
      id_utilisateur: u(0).id, nbJaime: 55
    }}),
    prisma.annonceProjet.create({ data: {
      titre: "Podcast étudiant — interviews de professionnels du numérique",
      texte: "On monte un podcast pour interviewer des pros du secteur tech (devs, chefs de projet, data scientists) et partager leurs parcours.",
      description: "Pas un projet de code ! On cherche quelqu'un pour le montage audio (Audacity/Adobe Audition), et un(e) autre pour gérer les réseaux sociaux. 2 épisodes par mois, ambiance détendue.",
      id_utilisateur: u(1).id, nbJaime: 29
    }}),
  ])
  console.log(`  ✅ ${projets.length} annonces Projet créées.`)

  // -------------------------------------------------------
  // 8. COMMENTAIRES
  // -------------------------------------------------------
  console.log("\n💬 Création des commentaires...")

  await Promise.all([
    prisma.commentaire.create({ data: { texte: "Merci beaucoup, c'est exactement ce qu'il me fallait !", id_utilisateur: u(1).id, id_exercice: exercices[0].id }}),
    prisma.commentaire.create({ data: { texte: "J'ai la même question, le prof n'a pas été très clair en cours.", id_utilisateur: u(2).id, id_exercice: exercices[0].id }}),
    prisma.commentaire.create({ data: { texte: "Super corrigé ! Par contre attention à la question 3, je pense qu'il manque un INNER JOIN.", id_utilisateur: u(0).id, id_exercice: exercices[1].id }}),
    prisma.commentaire.create({ data: { texte: "Je suis intéressé pour le tutorat, tu es dispo quand ?", id_utilisateur: u(2).id, id_tutorat: tutorats[0].id }}),
    prisma.commentaire.create({ data: { texte: "Est-ce que les séances sont en présentiel ou en visio ?", id_utilisateur: u(0).id, id_tutorat: tutorats[1].id }}),
    prisma.commentaire.create({ data: { texte: "Toujours disponible cette offre ? Je suis en L1 et j'en aurais bien besoin.", id_utilisateur: u(1).id, id_tutorat: tutorats[2].id }}),
    prisma.commentaire.create({ data: { texte: "Je partage ! Le menu à 8€ est vraiment bien pour le quartier.", id_utilisateur: u(2).id, id_bonplan: bonsPlans[3].id }}),
    prisma.commentaire.create({ data: { texte: "J'ai postulé hier, l'ambiance a l'air super !", id_utilisateur: u(0).id, id_bonplan: bonsPlans[0].id }}),
    prisma.commentaire.create({ data: { texte: "Intéressé par le projet ! J'ai déjà fait du React Native en stage.", id_utilisateur: u(1).id, id_projet: projets[0].id }}),
    prisma.commentaire.create({ data: { texte: "Bonne idée le dashboard de notes, j'aurais bien besoin de ça pour mes partiels.", id_utilisateur: u(2).id, id_projet: projets[3].id }}),
  ])
  console.log(`  ✅ 10 commentaires créés.`)

  // -------------------------------------------------------
  // 9. CANDIDATURES (sur les tutorats)
  // -------------------------------------------------------
  console.log("\n📋 Création des candidatures...")

  await Promise.all([
    prisma.candidature.create({ data: {
      messageMotivation: "Bonjour, je suis en L1 info et j'ai vraiment du mal avec la récursivité. Vos explications m'intéresseraient beaucoup !",
      datePostulation: new Date('2024-09-15'),
      statut: 'ACCEPTEE',
      id_tutorat: tutorats[0].id
    }}),
    prisma.candidature.create({ data: {
      messageMotivation: "Salut, je cherche de l'aide pour les TP d'algo, est-ce que votre groupe a encore de la place ?",
      datePostulation: new Date('2024-09-16'),
      statut: 'EN_ATTENTE',
      id_tutorat: tutorats[0].id
    }}),
    prisma.candidature.create({ data: {
      messageMotivation: "Je suis en L2 et la BDD c'est ma bête noire. J'ai raté l'exam de juin, je veux vraiment progresser.",
      datePostulation: new Date('2024-09-18'),
      statut: 'ACCEPTEE',
      id_tutorat: tutorats[1].id
    }}),
    prisma.candidature.create({ data: {
      messageMotivation: "Bonjour, j'aurais besoin d'aide sur les intégrales et les suites, surtout pour les partiels de janvier.",
      datePostulation: new Date('2024-09-20'),
      statut: 'EN_ATTENTE',
      id_tutorat: tutorats[2].id
    }}),
    prisma.candidature.create({ data: {
      messageMotivation: "Je candidate pour préparer le TOEIC. Mon niveau est B1 mais je vise le 800. Je suis motivée !",
      datePostulation: new Date('2024-09-22'),
      statut: 'REFUSEE',
      id_tutorat: tutorats[4].id
    }}),
  ])
  console.log(`  ✅ 5 candidatures créées.`)

  // -------------------------------------------------------
  // 10. NOTIFICATIONS
  // -------------------------------------------------------
  console.log("\n🔔 Création des notifications...")

  await Promise.all([
    prisma.notification.create({ data: { contenu: "Votre candidature au tutorat d'algorithmique a été acceptée !", id_utilisateur: u(0).id, lue: false }}),
    prisma.notification.create({ data: { contenu: "Quelqu'un a commenté votre annonce de tutorat SQL.", id_utilisateur: u(1).id, lue: false }}),
    prisma.notification.create({ data: { contenu: "Nouvelle annonce Bon Plan dans votre campus : 'Soirée de rentrée BDE'", id_utilisateur: u(2).id, lue: true }}),
    prisma.notification.create({ data: { contenu: "Votre annonce 'Corrigé TP1 Dev Web' a reçu 24 j'aimes !", id_utilisateur: u(0).id, lue: true }}),
  ])
  console.log(`  ✅ 4 notifications créées.`)

  console.log("\n🌱 Seed terminé avec succès !")
  console.log("   Campus      :", 3)
  console.log("   Matières    :", 10)
  console.log("   Exercices   :", exercices.length)
  console.log("   Bon Plans   :", bonsPlans.length)
  console.log("   Tutorats    :", tutorats.length)
  console.log("   Projets     :", projets.length)
  console.log("   Commentaires:", 10)
  console.log("   Candidatures:", 5)
  console.log("   Notifications:", 4)
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })