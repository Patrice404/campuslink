const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // La liste des campus à insérer
  const campusALancer = [
    { nom: 'INSA CVL', ville: 'Bourges' },
    { nom: 'IUT Bourges', ville: 'Bourges' },
    { nom: "Université d'Orléans", ville: 'Orléans' }
  ]

  for (const campus of campusALancer) {
    // 1. On cherche en BDD s'il existe déjà un campus avec ce nom
    const existeDeja = await prisma.campus.findFirst({
      where: { nom: campus.nom }
    })
  
    // 2. S'il n'existe pas, on le crée ! 
    // PostgreSQL va générer l'ID auto-incrémenté (1, 2, 3...) proprement.
    if (!existeDeja) {
      await prisma.campus.create({
        data: campus
      })
      console.log(`✅ Campus créé : ${campus.nom}`)
    } else {
      console.log(`ℹ️ Le campus ${campus.nom} existe déjà, ignoré.`)
    }
  }

  console.log("🌱 Script de seed exécuté avec succès !");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })