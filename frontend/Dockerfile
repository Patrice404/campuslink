# ==========================================
# ENVIRONNEMENT DE DÉVELOPPEMENT : FRONTEND (Vue + Vite)
# ==========================================
FROM node:20-alpine

# Définition du dossier de travail dans le conteneur
WORKDIR /app

# 1. Copie des fichiers de dépendances
# (L'astérisque permet de copier package.json ET package-lock.json s'il existe)
COPY package*.json ./

# 2. Installation des dépendances (version dev)
RUN npm install

# 3. Copie du reste du code source
COPY . .

# 4. Exposition du port de Vite
EXPOSE 5173

# 5. Démarrage du serveur de développement
# (La configuration de Vite devra autoriser l'écoute sur le réseau Docker)
CMD ["npm", "run", "dev"]