#!/bin/bash

# Vérification des droits d'administrateur
if [ "$EUID" -ne 0 ]; then
  echo "Veuillez lancer ce script avec sudo : sudo ./nuke_docker.sh"
  exit
fi

echo "=== 💥 DÉMARRAGE DU NETTOYAGE FORCÉ === "

# Fonction pour tuer un conteneur par son nom
kill_container() {
    CONTAINER_NAME=$1
    echo "-> Analyse de $CONTAINER_NAME..."
    
    # Récupère le PID en ignorant les erreurs si le conteneur n'existe plus
    PID=$(docker inspect --format='{{.State.Pid}}' "$CONTAINER_NAME" 2>/dev/null)

    if [ -z "$PID" ]; then
        echo "   [i] Le conteneur $CONTAINER_NAME est introuvable."
    elif [ "$PID" -eq 0 ]; then
        echo "   [i] Le conteneur $CONTAINER_NAME est déjà arrêté (PID 0)."
    else
        echo "   [!] PID trouvé : $PID. Exécution du tir de précision (kill -9)..."
        kill -9 "$PID" 2>/dev/null
        echo "   [v] $CONTAINER_NAME a été neutralisé."
    fi
}

# 1. Tuer les processus informatiques
kill_container "campuslink-web"
kill_container "campuslink-api"

# 2. Redémarrer le cerveau Docker pour débloquer les fichiers (AppArmor/Daemon)
echo "-> Redémarrage du daemon Docker..."
systemctl restart docker
systemctl restart containerd

# 3. Supprimer les conteneurs morts
echo "-> Suppression des cadavres de conteneurs..."
docker rm -f campuslink-web campuslink-api 2>/dev/null

# 4. Faire table rase (Volumes et Images)
echo "-> Destruction de l'environnement Docker Compose (Volumes et Images)..."
docker compose down -v --rmi all

echo "=== ✅ TERMINÉ ! L'environnement est 100% vierge. ==="
echo "Tu peux relancer la compilation avec : sudo docker compose up --build"