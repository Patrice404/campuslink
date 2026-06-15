# CampusLink — Documentation API (pour le Frontend)

Toutes les routes du backend, leur rôle, ce qu'elles attendent et ce qu'elles renvoient.

- **URL de base (dev)** : `http://localhost:3000`
- **Préfixe** : toutes les routes commencent par `/api`
- **Format** : JSON (sauf upload de fichier → `multipart/form-data`)

## Conventions importantes

- **Les `id` sont des chaînes de caractères** (`"1"`, `"42"`) et non des nombres. (Côté backend ce sont des `BigInt`, convertis en string dans le JSON.) Pensez-y pour vos comparaisons et vos URLs.
- **Authentification** : les routes protégées 🔒 exigent un token JWT dans l'en-tête :
  ```
  Authorization: Bearer <token>
  ```
  Le token est obtenu via `/api/auth/inscription` ou `/api/auth/connexion`.
- **Erreurs** : toujours au format `{ "message": "..." }` avec un code HTTP adapté :
  | Code | Sens |
  |------|------|
  | 400 | Données invalides / champ manquant |
  | 401 | Token absent / invalide / identifiants incorrects |
  | 403 | Action non autorisée (pas le propriétaire) |
  | 404 | Ressource introuvable |
  | 409 | Conflit (ex : email déjà utilisé) |
  | 500 | Erreur serveur |

## Statut des endpoints

| 🟢 Prêt | À utiliser dès maintenant |
|---------|---------------------------|
| 🟡 À venir | Route définie, **controller pas encore écrit** — la forme exacte des données peut changer |

## Valeurs énumérées (enums)

- **Role** : `ETUDIANT`, `PROFESSEUR`
- **TypeAnnonce** : `EXERCICE`, `BON_PLAN`, `TUTORAT`, `PROJET`
- **StatutCandidature** : `EN_ATTENTE`, `ACCEPTEE`, `REFUSEE`
- **SousTypeBonPlan** : `JOB_ETUDIANT`, `ALTERNANCE`, `COLOCATION`, `FETE`, `EVENEMENT`, `RESTAURANT`, `BOURSE`, `HACKATHON`

---

# 🟢 Authentification — `/api/auth`

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| POST | `/api/auth/inscription` | — | Créer un compte |
| POST | `/api/auth/connexion` | — | Se connecter |
| GET | `/api/auth/me` | 🔒 | Récupérer l'utilisateur connecté |

### POST `/api/auth/inscription`
Crée un compte et renvoie directement un token (connexion automatique).

**Body :**
```json
{
  "nom": "Diallo",
  "prenom": "Alioune",
  "email": "alioune@esp.sn",
  "motDePasse": "password123",
  "role": "ETUDIANT",
  "id_campus": "1"
}
```
> `id_campus` est optionnel. `role` doit valoir `ETUDIANT` ou `PROFESSEUR`.

**Réponse `201` :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "utilisateur": {
    "id": "1",
    "nom": "Diallo",
    "prenom": "Alioune",
    "email": "alioune@esp.sn",
    "role": "ETUDIANT",
    "dateInscription": "2026-06-15T00:00:00.000Z",
    "photoProfil": null,
    "id_campus": "1"
  }
}
```
**Erreurs :** `400` (champ manquant), `409` (email déjà pris).

### POST `/api/auth/connexion`
**Body :**
```json
{ "email": "alioune@esp.sn", "motDePasse": "password123" }
```
**Réponse `200` :** identique à l'inscription (`{ token, utilisateur }`).
**Erreurs :** `400` (champ manquant), `401` (identifiants incorrects).

### GET `/api/auth/me` 🔒
Renvoie l'objet `utilisateur` du token (même forme que ci-dessus).

---

# 🟢 Utilisateurs — `/api/utilisateurs`

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| GET | `/api/utilisateurs/profil` | 🔒 | Mon profil (complet, avec campus) |
| PUT | `/api/utilisateurs/profil` | 🔒 | Modifier mon profil (+ photo) |
| GET | `/api/utilisateurs/:id` | 🔒 | Profil public d'un autre utilisateur |

### GET `/api/utilisateurs/profil` 🔒
**Réponse `200` :**
```json
{
  "id": "1",
  "nom": "Diallo",
  "prenom": "Alioune",
  "email": "alioune@esp.sn",
  "role": "ETUDIANT",
  "dateInscription": "2026-06-15T00:00:00.000Z",
  "photoProfil": "1718445600000.png",
  "id_campus": "1",
  "campus": { "id": "1", "nom": "Campus Centre", "ville": "Dakar", "etablissement": "ESP" }
}
```
> `photoProfil` est un nom de fichier. L'image est servie sur `http://localhost:3000/uploads/<photoProfil>`.

### PUT `/api/utilisateurs/profil` 🔒
**Type de body : `multipart/form-data`** (à cause de la photo).

| Champ | Type | Obligatoire |
|-------|------|-------------|
| `nom` | texte | non |
| `prenom` | texte | non |
| `id_campus` | texte | non |
| `photo` | fichier (image, max 2 Mo) | non |

**Réponse `200` :** l'objet `utilisateur` mis à jour.

### GET `/api/utilisateurs/:id` 🔒
Profil **public** (sans l'email) d'un autre utilisateur.
**Réponse `200` :**
```json
{
  "id": "2",
  "nom": "Sow",
  "prenom": "Awa",
  "role": "PROFESSEUR",
  "photoProfil": null,
  "dateInscription": "2026-06-15T00:00:00.000Z",
  "campus": { "id": "1", "nom": "Campus Centre", "ville": "Dakar", "etablissement": "ESP" }
}
```

---

# 🟢 Campus — `/api/campus`

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| GET | `/api/campus` | — | Liste de tous les campus |

**Réponse `200` :**
```json
[
  { "id": "1", "nom": "Campus Centre", "ville": "Dakar", "etablissement": "ESP" },
  { "id": "2", "nom": "Campus Nord", "ville": "Saint-Louis", "etablissement": "UGB" }
]
```
> Utile pour remplir un menu déroulant à l'inscription / édition de profil.

---

# 🟡 Annonces — `/api/annonces`

> ⚠️ Controllers pas encore implémentés. Les formes ci-dessous sont **indicatives** (basées sur le schéma) et peuvent évoluer.

Les annonces ont **4 types** (champ `type`), chacun avec ses propres champs :
- `EXERCICE` : `annee`, `texte`, `id_matiere`
- `BON_PLAN` : `titre`, `texte`, `sousType`
- `TUTORAT` : `nbCandidatsVoulus`, `annee`, `description`, `id_matiere`
- `PROJET` : `titre`, `texte`, `description`

Champs communs à toutes : `id`, `type`, `datePublication`, `nbJaime`, `image`, `lien`, `id_utilisateur`.

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| GET | `/api/annonces` | — | Lister toutes les annonces (tous types) |
| GET | `/api/annonces/mes` | 🔒 | Mes annonces |
| GET | `/api/annonces/:id` | — | Détail d'une annonce |
| POST | `/api/annonces` | 🔒 | Créer une annonce (+ image) |
| PUT | `/api/annonces/:id` | 🔒 | Modifier (auteur uniquement) |
| DELETE | `/api/annonces/:id` | 🔒 | Supprimer (auteur uniquement) |
| POST | `/api/annonces/:id/jaime` | 🔒 | Liker / unliker (toggle) |

- **Création** : body en `multipart/form-data`, champ fichier `image` (max 5 Mo) + les champs du type choisi (dont `type`).
- Comme les `id` ne sont pas uniques entre les 4 tables, certaines routes accepteront un paramètre `?type=BON_PLAN` pour lever l'ambiguïté.

---

# 🟡 Commentaires — `/api/commentaires`

> ⚠️ Controllers pas encore implémentés.

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| POST | `/api/commentaires` | 🔒 | Commenter une annonce |
| PUT | `/api/commentaires/:id` | 🔒 | Modifier son commentaire |
| DELETE | `/api/commentaires/:id` | 🔒 | Supprimer son commentaire |

Body de création (indicatif) : `{ "texte": "...", "type": "BON_PLAN", "id_annonce": "3" }`.

---

# 🟡 Candidatures (tutorat) — `/api/candidatures`

> ⚠️ Controllers pas encore implémentés.

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| POST | `/api/candidatures` | 🔒 | Postuler à un tutorat |
| PUT | `/api/candidatures/:id/statut` | 🔒 | Accepter / refuser (auteur du tutorat) |
| DELETE | `/api/candidatures/:id` | 🔒 | Annuler une candidature |

- Postuler (indicatif) : `{ "id_tutorat": "5", "messageMotivation": "..." }`
- Changer le statut : `{ "statut": "ACCEPTEE" }` (`EN_ATTENTE` / `ACCEPTEE` / `REFUSEE`).

---

# 🟡 Notifications — `/api/notifications`

> ⚠️ Controllers pas encore implémentés.

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| GET | `/api/notifications` | 🔒 | Mes notifications |
| PUT | `/api/notifications/lire-tout` | 🔒 | Tout marquer comme lu |
| PUT | `/api/notifications/:id/lue` | 🔒 | Marquer une notification comme lue |

---

# 🟡 Matières — `/api/matieres`

> ⚠️ Controller pas encore implémenté.

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| GET | `/api/matieres` | — | Liste des matières (pour les annonces Exercice/Tutorat) |

Forme attendue : `[ { "id": "1", "titre": "Algorithmique", "annee": "L1" } ]`.

---

# 🟡 Hashtags — `/api/hashtags`

> ⚠️ Aucun modèle `Hashtag` dans la base pour l'instant → renverra une liste vide (`[]`) tant que le modèle n'est pas ajouté.

| Méthode | Route | 🔒 | Rôle |
|---------|-------|----|------|
| GET | `/api/hashtags` | — | Liste des hashtags |

---

## Récap rapide — exemple d'appel depuis le front

```js
// Connexion
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/connexion`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, motDePasse }),
});
const { token, utilisateur } = await res.json();

// Appel d'une route protégée
const profil = await fetch(`${import.meta.env.VITE_API_URL}/api/utilisateurs/profil`, {
  headers: { Authorization: `Bearer ${token}` },
}).then((r) => r.json());
```
