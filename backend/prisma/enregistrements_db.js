const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Lancement du script de seed...\n")

  // ---------------------------------------------------------
  // 1. CRÉATION DES CAMPUS
  // ---------------------------------------------------------
  const campusALancer = [
    { nom: 'INSA CVL', ville: 'Bourges', etablissement: 'INSA' },
    { nom: 'IUT Bourges', ville: 'Bourges', etablissement: 'IUT' },
    { nom: "Université d'Orléans", ville: 'Orléans', etablissement: 'Université' }
  ]

  for (const campus of campusALancer) {
    const existeDeja = await prisma.campus.findFirst({ where: { nom: campus.nom } })
    if (!existeDeja) {
      await prisma.campus.create({ data: campus })
      console.log(`✅ Campus créé : ${campus.nom}`)
    } else {
      console.log(`ℹ️ Le campus ${campus.nom} existe déjà, ignoré.`)
    }
  }

  // On récupère le premier campus pour l'attribuer à nos faux utilisateurs
  const premierCampus = await prisma.campus.findFirst()

  // ---------------------------------------------------------
  // 2. CRÉATION DES MATIÈRES (Requises pour Tutorat et Exercice)
  // ---------------------------------------------------------
  const matieresALancer = [
    { titre: 'Développement Web', annee: 'L2' },
    { titre: 'Algorithmique', annee: 'L1' },
    { titre: 'Bases de données', annee: 'L3' }
  ]

  for (const matiere of matieresALancer) {
    const existeDeja = await prisma.matiere.findFirst({ where: { titre: matiere.titre } })
    if (!existeDeja) {
      await prisma.matiere.create({ data: matiere })
      console.log(`✅ Matière créée : ${matiere.titre}`)
    }
  }

  // On récupère quelques matières pour les lier aux annonces
  const matiereWeb = await prisma.matiere.findFirst({ where: { titre: 'Développement Web' } })
  const matiereAlgo = await prisma.matiere.findFirst({ where: { titre: 'Algorithmique' } })

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
      id_campus: premierCampus.id
    }
  })
  console.log(`✅ Utilisateur créé : ${user1.prenom} ${user1.nom}`)

  const user2 = await prisma.utilisateur.upsert({
    where: { email: 'prof.martin@univ.fr' },
    update: {},
    create: {
      prenom: 'Jean',
      nom: 'Martin',
      email: 'prof.martin@univ.fr',
      motDePasse: 'motdepasse123',
      role: 'PROFESSEUR',
      id_campus: premierCampus.id
    }
  })
  console.log(`✅ Utilisateur créé : ${user2.prenom} ${user2.nom}`)

  // ---------------------------------------------------------
  // 4. CRÉATION DES ANNONCES
  // ---------------------------------------------------------
  console.log("\n📝 Création des annonces...")

  // --- 4.1 Annonce Bon Plan ---
  const existBonPlan = await prisma.annonceBonPlan.findFirst({ where: { titre: "Réduction Crous" }})
  if (!existBonPlan) {
    await prisma.annonceBonPlan.create({
      data: {
        titre: "Réduction Crous",
        texte: "Profitez de 50% sur vos repas cette semaine avec votre carte étudiante !",
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
        texte: "Nous montons une équipe pour créer l'appli officielle de l'école.",
        description: "Recherche un développeur React Native et un UI Designer.",
        id_utilisateur: user1.id,
        nbJaime: 8
      }
    })
    console.log(`✅ Annonce Projet créée.`)
  }

  // --- 4.4 Annonce Exercice ---
  const existExercice = await prisma.annonceExercice.findFirst({ where: { texte: "Corrigé du TP1 de Dev Web" }})
  if (!existExercice) {
    await prisma.annonceExercice.create({
      data: {
        texte: "Corrigé du TP1 de Dev Web",
        annee: "L2",
        id_utilisateur: user2.id,
        id_matiere: matiereWeb.id,
        nbJaime: 24
      }
    })
    console.log(`✅ Annonce Exercice créée.`)
  }

  console.log("\n🌱 Script de seed exécuté avec succès ! Tu peux tester ton frontend.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })