#!/bin/bash

# Affiche les commandes en cours
set -e

echo "--- 1. Arrêt des conteneurs ---"
docker-compose down

echo "--- 2. Suppression des volumes de node_modules (si existants) ---"
# Cela force Docker à recréer les dossiers node_modules propres
docker volume prune -f

echo "--- 3. Nettoyage du cache Docker (Builder) ---"
docker builder prune -f

echo "--- 4. Reconstruction des images sans cache ---"
docker-compose build --no-cache

echo "--- 5. Démarrage des services ---"
docker-compose up -d

echo "--- Nettoyage et reconstruction terminés avec succès ! ---"
