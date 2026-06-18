# Rapport de projet — CampusLink

> Plateforme sociale et académique pour étudiants : fil d'actualité, entraide, bons plans, projets, opportunités, profils et modération.
> Document généré à partir d'un parcours complet du dépôt (monorepo `campuslink-monorepo`).

---

## 1. Présentation générale

**CampusLink** est un réseau social universitaire qui centralise, autour d'un campus et d'une formation, plusieurs types de publications :

- **Exercices** (entraide pédagogique sur une matière),
- **Bons plans** (jobs étudiants, alternance, colocation, événements, bourses, hackathons…),
- **Tutorat** (recherche de tuteurs / candidatures),
- **Projets** (recherche de collaborateurs).

Les utilisateurs s'inscrivent en sélectionnant leur campus → département → formation, vérifient leur email par code, publient, commentent, répondent (threads), aiment, suivent leurs notifications, gèrent leur profil et peuvent bloquer d'autres utilisateurs. Une couche d'**administration** et de **modération par IA** complète l'ensemble.

---

## 2. Architecture & infrastructure

### Monorepo
```
campuslink-monorepo/
├── backend/          # API Node/Express/TypeScript + Prisma
├── frontend/         # SPA Vue 3 + Vite + Tailwind
├── docs/API.md       # Documentation des routes pour le front
├── docker-compose.yml         # Stack de dev (db + backend + frontend)
├── docker-compose.dev.yml
└── .github/workflows/deploy.yml  # CI/CD vers Azure
```

### Conteneurisation (dev — `docker-compose.yml`)
| Service | Conteneur | Image / build | Port | Rôle |
|---|---|---|---|---|
| `database` | `campuslink-db` | `postgres:15-alpine` | interne | Base PostgreSQL (volume `pg_data`) |
| `backend` | `campuslink-api` | build `./backend/Dockerfile` | `3000:3000` | API REST (nodemon + ts-node) |
| `frontend` | `campuslink-web` | build `./frontend/Dockerfile` | `5173:5173` | SPA servie via Nginx |

- Réseau Docker dédié `campus_net` (bridge).
- Le backend crée automatiquement le dossier `uploads/` au démarrage.
- **Note dev importante :** la compose n'utilise **pas** de volume de code monté → toute modification back/front nécessite un `docker compose up -d --build <service>` pour être prise en compte.

### Déploiement (prod — Azure)
- **CI/CD GitHub Actions** (`.github/workflows/deploy.yml`) : sur push `main`, build des images via `Dockerfile.prod`, push vers **Azure Container Registry** (`acrcampuslink.azurecr.io`), puis redémarrage des **Azure App Services** (`rg-campuslink-prod`).
- Stockage des images d'annonces en prod : **Azure Blob Storage**.
- Variables sensibles (`AZURE_CREDENTIALS`, `VITE_API_URL`, etc.) via les secrets GitHub.

---

## 3. Stack technique

### Backend
- **Node.js + Express 4** en **TypeScript** (point d'entrée `src/main.ts`, exécuté par `nodemon`/`ts-node`).
- **Prisma ORM 6** sur **PostgreSQL**.
- **JWT** (`jsonwebtoken`) pour l'authentification, **bcrypt/bcryptjs** pour le hachage des mots de passe.
- **Multer** pour l'upload de fichiers (images).
- **Nodemailer** (SMTP Gmail) pour les emails.
- **OpenAI** (`openai`) pour la modération de contenu.
- **@azure/storage-blob** pour le stockage d'images en prod.

### Frontend
- **Vue 3** (`<script setup lang="ts">`) + **Vite**.
- **Vue Router 4** (navigation SPA).
- **Pinia** + `pinia-plugin-persistedstate` (store d'auth persistant).
- **Tailwind CSS 4**.
- Configuration via `import.meta.env.VITE_API_URL`.

---

## 4. Modèle de données (Prisma / PostgreSQL)

### Enums
`Role` (ETUDIANT, PROFESSEUR, ADMIN) · `TypeAnnonce` (EXERCICE, BON_PLAN, TUTORAT, PROJET) · `StatutCandidature` (EN_ATTENTE, ACCEPTEE, REFUSEE) · `SousTypeBonPlan` (JOB_ETUDIANT, ALTERNANCE, COLOCATION, FETE, EVENEMENT, RESTAURANT, BOURSE, HACKATHON) · `CentreInteret` · `Visibilite` (PUBLIQUE, PROMOTION, PROFESSEUR, ETUDIANT, PROMO_SUPERIEUR).

### Hiérarchie académique
`Campus` → `Departement` → `Formation` → `Utilisateur`.
`Matiere` est reliée en **many-to-many** aux `Formation`.

### Utilisateur & social
- **`Utilisateur`** : identité (nom, prénom, email unique, mot de passe haché), `uuid` public, rôle, photo, bio, centres d'intérêt, formation. Relations vers annonces, commentaires, jaimes, notifications, blocages.
- **`Blocage`** : table de liaison auto-référente (`bloquant` / `bloqué`), clé composite, suppression en cascade.

### Annonces (modèle polymorphe)
4 tables concrètes partageant une structure commune (`visibilite`, `datePublication`, `nbJaime`, `image`, `lien`, auteur) :
- **`AnnonceExercice`** : `annee`, `description`, `matiere`.
- **`AnnonceBonPlan`** : `titre`, `description`, `sousType`.
- **`AnnonceTutorat`** : `nbCandidatsVoulus`, `annee`, `description`, `matiere`, `candidatures`.
- **`AnnonceProjet`** : `titre`, `description`.

### Interactions
- **`Commentaire`** : référence polymorphe (id_exercice / id_bonplan / id_tutorat / id_projet) **+ auto-relation `parent`/`reponses`** pour les **réponses en thread (façon Instagram)**.
- **`Jaime`** : like polymorphe (mêmes 4 clés étrangères).
- **`Candidature`** : candidature à un tutorat (statut, message de motivation).
- **`Notification`** : contenu, état `lue`, **`lien`** (URL relative vers la publication concernée → deep-link).

### Inscription en 2 temps
- **`VerificationEmail`** : stocke **toutes** les infos du futur compte + un code à 6 chiffres + expiration. Le compte `Utilisateur` n'est créé qu'**après validation du code**.

### Migrations
Migrations Prisma versionnées dans `backend/prisma/migrations/`. Seed idempotent (`prisma/seed.js`) qui recrée campus → départements → formations → matières → utilisateurs de test → annonces.

---

## 5. Fonctionnalités backend (API REST)

Base : `http://localhost:3000/api`. La plupart des routes sont protégées par le middleware `auth` (JWT), certaines par `isAdmin`.

### 🔐 Authentification — `/api/auth`
| Méthode | Route | Rôle |
|---|---|---|
| POST | `/send-verification` | Reçoit toutes les infos d'inscription, génère et **envoie un code par email**, stocke en attente |
| POST | `/verify-and-register` | Valide le code et **crée réellement le compte** |
| POST | `/connexion` | Connexion → renvoie un **JWT** (la connexion n'est pas bloquée par la vérification) |
| GET | `/me` | Profil de l'utilisateur connecté |

### 👤 Utilisateurs — `/api/utilisateurs`
- `GET /profile` — mon profil · `PUT /profile` — édition (+ upload photo) · `DELETE /profile` — suppression du compte.
- `GET /profile/:uuid` — profil public d'un autre utilisateur.
- `POST /profile/block/:uuid` — **bloquer / débloquer** (toggle).

### 📢 Annonces — `/api/annonces`
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/` | **Fil d'actualité** avec filtres de visibilité, exclusion des bloqués, tri par préférences |
| GET | `/mes` | Mes annonces |
| GET | `/recherche` | **Recherche à tags** (type, matière, année, auteur, has=image/lien, date/avant/après, q) — **exclut les bloqués** |
| GET | `/:id` | Détail d'une annonce (auteur + matière) |
| GET | `/bonplan/soustypes` | Liste des sous-types de bons plans |
| POST | `/exercice` `/bonplan` `/tutorat` `/projet` | Création par type (+ upload image, **modération IA**) |
| PUT | `/:type/:id` | Modification (propriétaire uniquement) |
| DELETE | `/:type/:id` | Suppression (propriétaire uniquement) |
| POST | `/:type/:id/like` & `/:id/jaime` | **Like / unlike** (toggle, met à jour `nbJaime`) |
| GET | `/:id/commentaires` | Commentaires d'une annonce (avec réponses imbriquées) |

### 💬 Commentaires — `/api/commentaires`
- `POST /` — créer un commentaire **ou une réponse** (`id_parent`), avec **mentions** (notification + lien) et **modération IA**.
- `PUT /:id` — modifier · `DELETE /:id` — supprimer.

### 🤝 Entraide — `/api/entraide`
- `GET /` — flux fusionné **Exercices + Tutorats** avec filtres de visibilité (rôle, formation, niveau/PROMO_SUPERIEUR), exclusion des bloqués, état `isLikedByMe`.

### 🎓 Autres flux thématiques
- **`/api/projets`** `GET /` — liste des projets.
- **`/api/opportunites`** `GET /` — opportunités.
- **`/api/campus-vie`** `GET /` — vie de campus.
- **`/api/matieres`** `GET /` — matières.

### 🗺️ Académique — `/api`
- `GET /campus/:campusId/departements` — départements d'un campus.
- `GET /departements/:departementId/formations` — formations d'un département.
- **`/api/campus`** `GET /` — liste des campus (ids convertis en string).

### 🔔 Notifications — `/api/notifications`
- `GET /` — mes notifications · `PUT /:id/lire` — marquer comme lue.
- Chaque notification porte un **`lien`** permettant, au clic, d'ouvrir la publication concernée.

### ⚙️ Paramètres — `/api/settings`
- `GET /blocked` — liste des utilisateurs bloqués · `DELETE /blocked/:id` — débloquer.

### 🛡️ Administration — `/api/admin` (rôle ADMIN)
- `GET /statistiques` — statistiques · `GET /utilisateurs` — tous les utilisateurs · `DELETE /utilisateurs/:id` — supprimer un utilisateur.

### Routes prévues (controllers à finaliser)
- **`/api/candidatures`** (postuler / changer le statut / annuler) — définies mais pas encore branchées.

---

## 6. Fonctionnalités transversales

### Sécurité & visibilité
- **JWT** sur l'essentiel des routes, identité injectée dans `req.utilisateur`.
- **Mots de passe hachés** (bcrypt) — jamais renvoyés.
- **Système de blocage réciproque** : un utilisateur bloqué (dans les deux sens) **disparaît du fil ET de la recherche**.
- **Visibilité graduée** des annonces : PUBLIQUE, selon le rôle, par PROMOTION (même formation), ou PROMO_SUPERIEUR (auteurs de niveau ≤ celui du lecteur).

### Modération par IA
- **`moderation.service.ts`** (`verifierContenuAvecIA`) : modération via **OpenAI** (gpt-4o / gpt-4o-mini), analyse texte **et images** (URLs Blob), prompt orienté plateforme universitaire francophone, **permissif par défaut** (`SAFE`/`REJECT`).
- Appliquée à la **publication d'annonces** et à la **création de commentaires/réponses**.
- Repli sûr : sans clé OpenAI → `SAFE` ; en cas d'erreur → `REJECT` (fail-closed).

### Emails
- **`mailer.ts`** : Nodemailer via **SMTP Gmail**, transporter mutualisé. Génère un **code à 6 chiffres** (valable 10 min) pour l'inscription / réinitialisation. **Repli dev Ethereal** (aperçu dans les logs) si pas d'identifiants.

### Stockage des images
- **`storage.service.ts`** : upload / suppression vers **Azure Blob Storage** (URL publique permanente). En dev, fallback possible sur le dossier local `uploads/` servi statiquement.

### Sérialisation
- **`serialize.ts`** (`toJSON`) : conversion récursive **BigInt → string** pour tous les `id` Prisma avant l'envoi JSON.

---

## 7. Fonctionnalités frontend (Vue 3 SPA)

### Routage (`router/index.ts`)
| Chemin | Vue | Description |
|---|---|---|
| `/` | `CampusSelectView` | Sélection du campus (entrée de l'app) |
| `/login` | `LoginView` | Connexion |
| `/register` | `RegisterView` | Inscription (vérification par code) |
| `/home` | `HomeView` | Fil d'actualité + recherche |
| `/projets` | `ProjectsView` | Projets |
| `/entraide` | `EntraideView` | Entraide (exercices + tutorat) |
| `/opportunites` | `OpportunitesView` | Opportunités |
| `/campus` | `CampusView` | Vie de campus |
| `/profil/:uuid?` | `ProfileView` | Mon profil / profil d'un autre |
| `/settings` | `SettingsView` | Paramètres (gestion des blocages) |
| `/admin` | `AdminDashboardView` | Tableau de bord admin (lazy-load) |

### Composants clés
- **`TopNav.vue`** — barre supérieure avec **cloche de notifications unique** (badge non-lues, clic → marque lue + redirige vers la publication via `lien`) et avatar/initiales.
- **`SmartSearch.vue`** — **recherche à tags façon Discord** : autocomplétion dynamique, suggestions filtrées selon la saisie, tags `type / matiere / annee / auteur / has / date / avant / après` + texte libre.
- **`AnnonceCard.vue`**, **`AnnoncesCommentaires.vue`**, **`CreatePostModal.vue`** (création/édition), **`SidebarNav.vue`**, **`CampusCard.vue`**, **`AnnonceFeedLayout.vue`**, **`BaseButton.vue`**.
- **`stores/authStore.ts`** — store Pinia persistant (token + user).

### Parcours utilisateur principal
Sélection campus → inscription/connexion → fil d'actualité (avec recherche intelligente) → création/édition de publications (avec modération) → commentaires & réponses → likes → notifications (deep-link) → profil & blocages.

---

## 8. Ce qui est fait — synthèse

✅ Authentification JWT + **inscription en 2 étapes avec code par email**
✅ Hiérarchie académique complète (campus / département / formation / matière) + endpoints en cascade
✅ Profils (consultation, édition + photo, suppression de compte)
✅ **Blocage** d'utilisateurs (toggle, liste, déblocage) — appliqué au **fil ET à la recherche**
✅ **Annonces polymorphes** (4 types) : CRUD complet, upload d'image, visibilité graduée
✅ **Recherche intelligente à tags** (multi-critères, autocomplétion front)
✅ **Like / unlike** avec compteur et état `isLikedByMe`
✅ **Commentaires + réponses en thread** avec mentions
✅ **Modération IA** (OpenAI) sur annonces, commentaires et images
✅ **Notifications** avec deep-link vers la publication
✅ Flux thématiques : entraide, projets, opportunités, vie de campus
✅ **Administration** (stats, gestion des utilisateurs)
✅ Emails (Nodemailer/Gmail, fallback Ethereal en dev)
✅ Stockage d'images (Azure Blob)
✅ **Dockerisation** complète (dev) + **CI/CD Azure** (ACR + App Services)
✅ Sérialisation BigInt, migrations Prisma + seed idempotent
✅ **Documentation d'API** pour le front (`docs/API.md`)

### Reste / pistes
- ⏳ **Candidatures aux tutorats** : routes définies, controllers à brancher dans `main.ts`.
- 🧹 Fichiers doublons à nettoyer (`annonce2.controller.ts`, `modereration2.service.ts`, `server.js`, `notification.controller.t`).
- 🧪 Pas de suite de tests automatisés à ce stade.

---

*Stack : Vue 3 / Vite / Tailwind · Node / Express / TypeScript · Prisma / PostgreSQL · Docker · Azure (ACR, App Service, Blob Storage) · OpenAI · Nodemailer.*
