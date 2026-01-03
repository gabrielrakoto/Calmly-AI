# 🚀 Déploiement sur Render - Guide Complet

## 📋 Prérequis

1. Compte GitHub
2. Compte Render (gratuit)
3. Tes clés API prêtes

## 🔐 Variables d'environnement à configurer sur Render

Dans les paramètres de ton service Render (onglet **Environment**), ajoute ces variables :

```text
GROQ_API_KEY=ta_cle_groq_ici
MONGODB_URI=ton_uri_mongodb_ici
NODE_ENV=production
HOST=0.0.0.0
PORT=5000
```

## 📝 Étapes de déploiement

### 1. Préparer le repository GitHub

Assure-toi que tes fichiers de configuration contenant des secrets (comme `config.env` ou `.env`) ne sont pas suivis par Git.

### 2. Créer un service sur Render

1. Va sur [render.com](https://render.com)
2. Clique sur "New +" → "Web Service"
3. Connecte ton repository GitHub
4. Configure :
   - **Name**: calmly-ai
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Ajouter les variables d'environnement sur Render

Dans l'onglet "Environment" du service Render, ajoute les clés et valeurs définies ci-dessus.

## 🔄 Mises à jour

Pour déployer des changements :
```bash
git add .
git commit -m "Update: description du changement"
git push origin main
```

Render redéploiera automatiquement !
