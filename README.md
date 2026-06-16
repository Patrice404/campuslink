Contextes 1 : Tu viens de récupérer le code de l'équipe (git pull)
Le problème : Tes collègues ont peut-être modifié la structure de la base de données ou ajouté de nouveaux modèles dans le code. Ton Docker n'est pas au courant.
 # 1. Met à jour les fichiers de code dans Docker (évite l'erreur 'undefined')
    docker compose exec backend npx prisma generate

# 2. Applique les nouvelles tables à ta base de données Docker
docker compose exec backend npx prisma migrate dev

# 3. Synchronise TypeScript (pour que VS Code n'affiche pas de rouge)
npm run sync-types


Contexte 2 : Ta base de données est vide et tu veux les données de test
Le problème : Tu as lancé Docker mais il n'y a aucun campus (INSA, IUT...), aucun utilisateur, le site est désert.
La commande à taper :
# Exécute le script 'enregistrements_db.js' à l'intérieur du serveur Docker
docker compose exec backend npx prisma db seed


Contexte 3 : Tu veux voir ou modifier les données à la main (Prisma Studio)
Le problème : Tu veux vérifier si un utilisateur s'est bien inscrit ou modifier un statut sans faire de requêtes SQL complexes.
La commande à taper :
# Lance l'interface visuelle directement depuis le réseau Docker
docker compose exec backend npx prisma studio

Contexte 4 : C'est TOI qui modifies le fichier schema.prisma
Le problème : Tu as ajouté un champ ou une nouvelle table dans le fichier de configuration et tu veux que ça prenne effet dans la vraie base de données.
La commande à taper :
# Enregistre ta modif et met à jour la BDD Docker d'un coup
docker compose exec backend npx prisma migrate dev --name ajouter_nouveau_champ


Contexte 5 : Le gros bug, tout est cassé (Le bouton Reset)
Le problème : Tu as fait trop de tests, les ID sont emmêlés, les données n'ont plus de sens et tu veux nettoyer ta base locale pour repartir sur du propre.
La commande à taper :
# Supprime TOUTES les données et remet la base à neuf (vide)
docker compose exec backend npx prisma migrate reset


docker compose exec database psql -U campuslink_dev -d campuslink_db -c 'SELECT id, titre, annee FROM "Matiere";'
docker compose logs database --tail=20
docker compose exec backend npx prisma studio
 sudo lsof -i :5173
docker compose exec backend npx prisma migrate dev --name add_verification_email


npm install nodemailer
docker compose exec backend npm install nodemailer
