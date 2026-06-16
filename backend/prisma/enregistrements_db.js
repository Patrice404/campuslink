const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Nettoyage des tables (hors Utilisateur)...\n");

  // 1. Nettoyage dans l'ordre des dépendances (FK)
  await prisma.jaime.deleteMany();
  await prisma.commentaire.deleteMany();
  await prisma.candidature.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.blocage.deleteMany();
  await prisma.annonceExercice.deleteMany();
  await prisma.annonceBonPlan.deleteMany();
  await prisma.annonceTutorat.deleteMany();
  await prisma.annonceProjet.deleteMany();
  await prisma.matiere.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.departement.deleteMany();
  await prisma.campus.deleteMany();

  // 2. RÉCRÉATION DE LA HIÉRARCHIE ACADÉMIQUE
  console.log("🏫 Création de la hiérarchie académique...");
  
  const campus = await prisma.campus.create({
    data: { nom: 'INSA CVL', ville: 'Bourges', etablissement: 'INSA Centre Val de Loire' }
  });

  const dep = await prisma.departement.create({
    data: { nom: 'Informatique', id_campus: campus.id }
  });

  const formations = await prisma.formation.createManyAndReturn({
    data: [
      { nom: 'Licence Informatique', niveau: 'L1', id_departement: dep.id },
      { nom: 'Licence Informatique', niveau: 'L2', id_departement: dep.id },
      { nom: 'Master SI', niveau: 'M1', id_departement: dep.id }
    ]
  });

  // 3. MATIÈRES
  console.log("📚 Création des matières...");
  const matieres = await prisma.matiere.createManyAndReturn({
    data: [
      { titre: 'Algorithmique', annee: 'L1' },
      { titre: 'Bases de données', annee: 'L2' },
      { titre: 'Intelligence Artificielle', annee: 'M1' }
    ]
  });

  // 4. RÉCUPÉRATION DES UTILISATEURS EXISTANTS
  const users = await prisma.utilisateur.findMany();
  if (users.length === 0) {
    console.error("❌ Aucun utilisateur trouvé. Veuillez en créer un via l'interface d'abord.");
    process.exit(1);
  }
  const u = (i) => users[i % users.length];

  // 5. GÉNÉRATION MASSIF D'ANNONCES (100+)
  console.log("📝 Génération des annonces et interactions...");
  const vis = ['PUBLIQUE', 'PROMOTION', 'ETUDIANT'];
  const sousTypes = ['JOB_ETUDIANT', 'ALTERNANCE', 'COLOCATION', 'FETE', 'RESTAURANT', 'HACKATHON'];

  const allAnnonces = [];

  for (let i = 0; i < 100; i++) {
    const user = u(i);
    const v = vis[i % 3];
    const m = matieres[i % matieres.length];

    if (i % 4 === 0) {
      allAnnonces.push(await prisma.annonceExercice.create({ data: { description: `Exercice ${i} : Analyse de complexité`, annee: 'L1', id_matiere: m.id, id_utilisateur: user.id, visibilite: v } }));
    } else if (i % 4 === 1) {
      allAnnonces.push(await prisma.annonceBonPlan.create({ data: { titre: `Bon plan ${i}`, description: "Réduction resto", sousType: sousTypes[i % sousTypes.length], id_utilisateur: user.id, visibilite: v } }));
    } else if (i % 4 === 2) {
      allAnnonces.push(await prisma.annonceTutorat.create({ data: { description: `Tutorat ${i}`, nbCandidatsVoulus: 3, id_matiere: m.id, id_utilisateur: user.id, visibilite: v } }));
    } else {
      allAnnonces.push(await prisma.annonceProjet.create({ data: { titre: `Projet ${i}`, description: "Recherche co-équipier", id_utilisateur: user.id, visibilite: v } }));
    }
  }

  // 6. COMMENTAIRES ET JAIMES (Interaction)
  for (let i = 0; i < 50; i++) {
    const randomUser = u(i);
    const randomAnnonce = allAnnonces[i % allAnnonces.length];
    
    await prisma.commentaire.create({
      data: {
        texte: `Ceci est le commentaire n°${i}`,
        id_utilisateur: randomUser.id,
        id_exercice: randomAnnonce.type === 'EXERCICE' ? randomAnnonce.id : null,
        id_bonplan: randomAnnonce.type === 'BON_PLAN' ? randomAnnonce.id : null,
        id_tutorat: randomAnnonce.type === 'TUTORAT' ? randomAnnonce.id : null,
        id_projet: randomAnnonce.type === 'PROJET' ? randomAnnonce.id : null,
      }
    });

    if (i % 3 === 0) {
        await prisma.jaime.create({
            data: {
              id_utilisateur: randomUser.id,
              id_exercice: randomAnnonce.type === 'EXERCICE' ? randomAnnonce.id : null,
              id_bonplan: randomAnnonce.type === 'BON_PLAN' ? randomAnnonce.id : null,
              id_tutorat: randomAnnonce.type === 'TUTORAT' ? randomAnnonce.id : null,
              id_projet: randomAnnonce.type === 'PROJET' ? randomAnnonce.id : null,
            }
          });
    }
  }

  console.log("\n🌱 Seed terminé avec succès !");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());