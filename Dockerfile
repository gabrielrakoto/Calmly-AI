# Utilise l'image Node 20 Alpine
FROM node:20.19.0-alpine

# Définit le dossier de travail
WORKDIR /app

# Copie package.json et package-lock.json et installe les dépendances
COPY package*.json ./
RUN npm ci

# Copie le reste du projet
COPY . .

# Construis l'application
RUN npm run build

# Expose le port 3000
EXPOSE 3000

# Lance le serveur Node
CMD ["node", "dist/index.js"]
