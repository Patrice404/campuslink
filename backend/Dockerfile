# ==========================================
# ENVIRONNEMENT DE DÉVELOPPEMENT : BACKEND (Node + Prisma)
# ==========================================
FROM node:20-alpine

WORKDIR /app

# 1. Installation d'OpenSSL (requis par Prisma sur Alpine Linux)
RUN apk add --no-cache openssl

# 2. Copie des fichiers de configuration
COPY package*.json ./
COPY prisma ./prisma/

# 3. Installation de toutes les dépendances
RUN npm install

# 4. Génération du client de base de données
RUN npx prisma generate

# 5. Copie du code source
COPY . .

# 6. Exposition du port de l'API
EXPOSE 3000

# 7. Démarrage du serveur Node
CMD ["npm", "run", "dev"]