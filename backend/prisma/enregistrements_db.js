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

  // 1. CAMPUS
  console.log("🏫 Création des campus...")
  const [insaCvl, iutBourges, univOrleans] = await Promise.all([
    prisma.campus.create({ data: { nom: 'INSA CVL', ville: 'Bourges', etablissement: 'INSA Centre Val de Loire' } }),
    prisma.campus.create({ data: { nom: 'IUT Bourges', ville: 'Bourges', etablissement: 'Université de Bourges' } }),
    prisma.campus.create({ data: { nom: "Université d'Orléans", ville: 'Orléans', etablissement: "Université d'Orléans" } }),
  ])

  // 2. MATIÈRES
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

  // 3. UTILISATEURS
  const utilisateurs = await prisma.utilisateur.findMany()
  if (utilisateurs.length === 0) { console.error("❌ Pas d'utilisateur."); process.exit(1) }
  
  const campus = [insaCvl, iutBourges, univOrleans]
  for (let i = 0; i < utilisateurs.length; i++) {
    await prisma.utilisateur.update({
      where: { id: utilisateurs[i].id },
      data: { id_campus: campus[i % campus.length].id }
    })
  }
  const users = await prisma.utilisateur.findMany()
  const u = (i) => users[i % users.length]

  // 4. ANNONCES EXERCICE (champ 'description' utilisé)
  const exercices = await Promise.all([
    prisma.annonceExercice.create({ data: { description: "Récursivité algo ?", annee: 'L1', id_matiere: algo.id, id_utilisateur: u(0).id } }),
    prisma.annonceExercice.create({ data: { description: "Corrigé SQL Join", annee: 'L2', id_matiere: bdd.id, id_utilisateur: u(1).id } }),
    prisma.annonceExercice.create({ data: { description: "Intégrales TD2", annee: 'L1', id_matiere: maths.id, id_utilisateur: u(2).id } }),
  ])

<<<<<<< HEAD
  // ---------------------------------------------------------
  // 1.bis CRÉATION D'UN DÉPARTEMENT + FORMATION (requis pour rattacher un utilisateur)
  // ---------------------------------------------------------
  let departement = await prisma.departement.findFirst({ where: { nom: 'Informatique', id_campus: premierCampus.id } })
  if (!departement) {
    departement = await prisma.departement.create({
      data: { nom: 'Informatique', id_campus: premierCampus.id }
    })
    console.log(`✅ Département créé : ${departement.nom}`)
  }

  let formation = await prisma.formation.findFirst({ where: { nom: 'Informatique L2', id_departement: departement.id } })
  if (!formation) {
    formation = await prisma.formation.create({
      data: { nom: 'Informatique L2', niveau: 'L2', id_departement: departement.id }
    })
    console.log(`✅ Formation créée : ${formation.nom}`)
  }

  // ---------------------------------------------------------
  // 2. CRÉATION DES MATIÈRES (Requises pour Tutorat et Exercice)
  // ---------------------------------------------------------
  const matieresALancer = [
    { titre: 'Développement Web' },
    { titre: 'Algorithmique' },
    { titre: 'Bases de données' }
  ]
=======
  // 5. ANNONCES BON PLAN (champ 'description' utilisé)
  const bonsPlans = await Promise.all([
    prisma.annonceBonPlan.create({ data: { titre: 'Job étudiant', description: "Animateur périscolaire", sousType: 'JOB_ETUDIANT', id_utilisateur: u(0).id } }),
    prisma.annonceBonPlan.create({ data: { titre: 'Colocation', description: "Chambre 12m² centre ville", sousType: 'COLOCATION', id_utilisateur: u(1).id } }),
  ])
>>>>>>> 86a724616ad343b42fc1fc78bcde41bd24283357

  // 6. ANNONCES TUTORAT
  const tutorats = await Promise.all([
    prisma.annonceTutorat.create({ data: { description: "Tutorat algo L1", nbCandidatsVoulus: 4, annee: 'L1', id_matiere: algo.id, id_utilisateur: u(0).id } }),
    prisma.annonceTutorat.create({ data: { description: "Tutorat BDD L2", nbCandidatsVoulus: 3, annee: 'L2', id_matiere: bdd.id, id_utilisateur: u(1).id } }),
  ])

  // 7. ANNONCES PROJET
  const projets = await Promise.all([
    prisma.annonceProjet.create({ data: { titre: "App Covoiturage", description: "React Native stack", id_utilisateur: u(0).id } }),
    prisma.annonceProjet.create({ data: { titre: "Bot Discord", description: "Node.js + Webhooks", id_utilisateur: u(1).id } }),
  ])

<<<<<<< HEAD
  // ---------------------------------------------------------
  // 3. CRÉATION DES UTILISATEURS
  // ---------------------------------------------------------
  // Note: On utilise 'upsert' car 'email' est @unique dans ton schéma
  const user1 = await prisma.utilisateur.upsert({
    where: { email: 'alice.dupont@etudiant.fr' },
    update: {},
    create: {
      prenom: 'Alice',
      nom: 'Dupont',
      email: 'alice.dupont@etudiant.fr',
      motDePasse: 'motdepasse123', // Pense à hasher avec bcrypt dans ton vrai backend !
      role: 'ETUDIANT',
      id_formation: formation.id
    }
=======
  // 8. COMMENTAIRES
  await prisma.commentaire.createMany({
    data: [
      { texte: "Merci !", id_utilisateur: u(1).id, id_exercice: exercices[0].id },
      { texte: "Intéressé !", id_utilisateur: u(2).id, id_tutorat: tutorats[0].id }
    ]
>>>>>>> 86a724616ad343b42fc1fc78bcde41bd24283357
  })

<<<<<<< HEAD
  const user2 = await prisma.utilisateur.upsert({
    where: { email: 'prof.martin@univ.fr' },
    update: {},
    create: {
      prenom: 'Jean',
      nom: 'Martin',
      email: 'prof.martin@univ.fr',
      motDePasse: 'motdepasse123',
      role: 'PROFESSEUR',
      id_formation: formation.id
    }
  })
  console.log(`✅ Utilisateur créé : ${user2.prenom} ${user2.nom}`)
=======
  // 9. CANDIDATURES
  await prisma.candidature.create({ data: { messageMotivation: "Motivé !", datePostulation: new Date(), id_tutorat: tutorats[0].id } })
>>>>>>> 86a724616ad343b42fc1fc78bcde41bd24283357

  // 10. NOTIFICATIONS
  await prisma.notification.create({ data: { contenu: "Candidature acceptée", id_utilisateur: u(0).id } })

<<<<<<< HEAD
  // --- 4.1 Annonce Bon Plan ---
  const existBonPlan = await prisma.annonceBonPlan.findFirst({ where: { titre: "Réduction Crous" }})
  if (!existBonPlan) {
    await prisma.annonceBonPlan.create({
      data: {
        titre: "Réduction Crous",
        description: "Profitez de 50% sur vos repas cette semaine avec votre carte étudiante !",
        sousType: "RESTAURANT",
        id_utilisateur: user1.id,
        nbJaime: 42
      }
    })
    console.log(`✅ Annonce Bon Plan créée.`)
  }

  // --- 4.2 Annonce Tutorat ---
  const existTutorat = await prisma.annonceTutorat.findFirst({ where: { description: "Cours de soutien en Algo" }})
  if (!existTutorat) {
    await prisma.annonceTutorat.create({
      data: {
        description: "Cours de soutien en Algo pour bien préparer les partiels.",
        annee: "L1",
        nbCandidatsVoulus: 3,
        id_utilisateur: user2.id, // Le prof propose du tutorat
        id_matiere: matiereAlgo.id,
        nbJaime: 15
      }
    })
    console.log(`✅ Annonce Tutorat créée.`)
  }

  // --- 4.3 Annonce Projet ---
  const existProjet = await prisma.annonceProjet.findFirst({ where: { titre: "Création d'App Mobile" }})
  if (!existProjet) {
    await prisma.annonceProjet.create({
      data: {
        titre: "Création d'App Mobile",
        description: "Recherche un développeur React Native et un UI Designer.",
        id_utilisateur: user1.id,
        nbJaime: 8
      }
    })
    console.log(`✅ Annonce Projet créée.`)
  }

  // --- 4.4 Annonce Exercice ---
  const existExercice = await prisma.annonceExercice.findFirst({ where: { description: "Corrigé du TP1 de Dev Web" }})
  if (!existExercice) {
    await prisma.annonceExercice.create({
      data: {
        description: "Corrigé du TP1 de Dev Web",
        annee: "L2",
        id_utilisateur: user2.id,
        id_matiere: matiereWeb.id,
        nbJaime: 24
      }
    })
    console.log(`✅ Annonce Exercice créée.`)
  }

  console.log("\n🌱 Script de seed exécuté avec succès ! Tu peux tester ton frontend.");
=======
  console.log("\n🌱 Seed terminé avec succès !")
>>>>>>> 86a724616ad343b42fc1fc78bcde41bd24283357
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => await prisma.$disconnect())