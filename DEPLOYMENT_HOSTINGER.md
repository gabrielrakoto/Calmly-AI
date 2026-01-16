# Déploiement sur un VPS Hostinger (Ubuntu/Debian)

Contrairement à Render (PaaS) où tout est géré, sur un VPS vous devez configurer le serveur vous-même. Voici la procédure pas à pas.

## 1. Accès au serveur (SSH)

Connectez-vous à votre VPS via le terminal :
```bash
ssh root@votre_ip_vps
```

## 2. Installation des prérequis (Node.js & Git)

Mettez à jour le système et installez Node.js (version 20 recommandée) :

```bash
# Mise à jour
apt update && apt upgrade -y

# Installation de curl et git
apt install -y curl git ufw

# Installation de Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Vérification
node -v
npm -v
```

## 3. Cloner le projet

```bash
cd /var/www
git clone https://github.com/ton-username/ton-repo.git calmly-ai
cd calmly-ai
```

*(Si ton repo est privé, tu devras configurer une clé SSH ou utiliser un token d'accès)*

## 4. Installation et Build

```bash
# Installer les dépendances
npm install

# Construire l'application (Frontend + Backend)
npm run build
```

## 5. Configuration des variables d'environnement

Créez un fichier `.env` à la racine :

```bash
nano .env
```

Collez-y vos variables (comme sur Render) :
```env
# Adaptez les valeurs
PORT=5000
NODE_ENV=production
GROQ_API_KEY=votre_cle_ici
MONGODB_URI=votre_uri_mongo_ici
# etc...
```
*Ctrl+X, puis Y, puis Entrée pour sauvegarder.*

## 6. Lancer l'application avec PM2

PM2 permet de garder l'application active même si vous fermez la console.

```bash
# Installer PM2 globalement
npm install -g pm2

# Lancer l'application
pm2 start dist/index.js --name "calmly-ai"

# Configurer le démarrage automatique au reboot
pm2 startup
# (Exécutez la commande que PM2 vous donne ensuite)
pm2 save
```

## 7. Configurer Nginx (Reverse Proxy)

Pour rendre l'app accessible sur le port 80 (HTTP) au lieu du 5000.

```bash
apt install -y nginx
```

Créez une config Nginx :
```bash
nano /etc/nginx/sites-available/calmly-ai
```

Contenu :
```nginx
server {
    listen 80;
    server_name votre_domaine.com www.votre_domaine.com; # Ou votre IP si pas de domaine

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez le site :
```bash
ln -s /etc/nginx/sites-available/calmly-ai /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t # Vérifier la syntaxe
systemctl restart nginx
```

## 8. Sécuriser avec SSL (HTTPS) - *Optionnel mais recommandé*

Si vous avez un nom de domaine :

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d votre_domaine.com -d www.votre_domaine.com
```

---

## 🚀 Résumé des commandes de mise à jour

Quand vous pushez une mise à jour sur GitHub :

```bash
cd /var/www/calmly-ai
git pull
npm install # Si nouvelles dépendances
npm run build
pm2 restart calmly-ai
```
