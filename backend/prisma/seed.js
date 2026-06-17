import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // 1. Création du Campus avec ses Départements et Formations (Nested Writes)
  await prisma.campus.create({
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

  console.log('✅ Campus INSA CVL, Départements et Formations créés avec succès.');

  // 2. Récupération de quelques formations pour y lier des matières
  // On utilise findFirstOrThrow pour s'assurer qu'elles ont bien été créées
  const stpi1A = await prisma.formation.findFirstOrThrow({ where: { niveau: "1A", nom: { contains: "Prépa" } } });
  const stpi2A = await prisma.formation.findFirstOrThrow({ where: { niveau: "2A", nom: { contains: "Prépa" } } });
  const sti3A = await prisma.formation.findFirstOrThrow({ where: { niveau: "3A", nom: { contains: "Architecture" } } });
  const sti4A = await prisma.formation.findFirstOrThrow({ where: { niveau: "4A", nom: { contains: "Cybersécurité" } } });
  const sti5A = await prisma.formation.findFirstOrThrow({ where: { niveau: "5A", nom: { contains: "Ingénierie" } } });
  const mri5A = await prisma.formation.findFirstOrThrow({ where: { niveau: "5A", nom: { contains: "Sûreté" } } });

  // 3. Préparation des données des matières avec leurs formations associées
  const matieresData = [
    { 
      titre: "Algorithmique et Structures de Données", 
      // Matière présente en STPI 1A, 2A et revue en STI 3A
      formations: [stpi1A.id, stpi2A.id, sti3A.id] 
    },
    { 
      titre: "Mathématiques pour l'ingénieur", 
      formations: [stpi1A.id, stpi2A.id] 
    },
    { 
      titre: "Développement Web et Base de données", 
      formations: [sti3A.id] 
    },
    { 
      titre: "Programmation Orientée Objet (Java/C++)", 
      formations: [sti3A.id] 
    },
    { 
      titre: "Sécurité des applications web", 
      formations: [sti4A.id] 
    },
    { 
      titre: "Cryptographie appliquée", 
      formations: [sti4A.id] 
    },
    { 
      titre: "Droit du travail et management", 
      // Parfait exemple de l'Option 2 : Matière "Tronc commun" partagée entre STI et MRI en 5ème année !
      formations: [sti5A.id, mri5A.id] 
    }
  ];

  // 4. Insertion des matières et création des liaisons
  // On utilise une boucle avec `connect` pour créer les relations m:n
  for (const matiere of matieresData) {
    await prisma.matiere.create({
      data: {
        titre: matiere.titre,
        formations: {
          connect: matiere.formations.map(id => ({ id: id }))
        }
      }
    });
  }

  console.log('✅ Matières créées et liées aux formations avec succès.');
  console.log('🎉 Seeding terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Une erreur est survenue lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });