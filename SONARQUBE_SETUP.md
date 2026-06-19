# Configuration SonarQube pour CampusLink

Ce document explique comment configurer et utiliser SonarQube pour l'analyse statique de code du projet CampusLink.

## Options de Déploiement

### Option 1: SonarCloud (Recommandé pour les repos publics)

SonarCloud est la solution hébergée de Sonar, idéale pour les projets open-source.

#### Étapes de configuration:

1. **Créer un compte SonarCloud**
   - Accédez à https://sonarcloud.io/
   - Connectez-vous avec votre compte GitHub
   - Autorisez l'accès à vos repositories

2. **Importer le projet**
   - Allez dans "My Projects" → "Create Project"
   - Sélectionnez le repository `Patrice404/campuslink`
   - Choisissez "GitHub Actions" comme CI/CD

3. **Ajouter les Secrets GitHub**
   ```
   Accédez à: Settings → Secrets and variables → Actions
   
   Ajoutez:
   - SONAR_TOKEN: (généré depuis SonarCloud)
   - SONAR_HOST_URL: https://sonarcloud.io
   ```

4. **Lancer l'analyse**
   - Pushez vers la branche `main` ou créez une PR
   - GitHub Actions exécutera automatiquement l'analyse

#### Dashboard SonarCloud:
```
https://sonarcloud.io/dashboard?id=campuslink
```

---

### Option 2: SonarQube Server (Auto-hébergé)

Pour un contrôle complet et une infrastructure interne.

#### Installation avec Docker:

```bash
# Démarrer SonarQube localement
docker run -d --name sonarqube \
  -p 9000:9000 \
  -e SONAR_JDBC_URL=jdbc:postgresql://db:5432/sonar \
  -e SONAR_JDBC_USERNAME=sonar \
  -e SONAR_JDBC_PASSWORD=sonar \
  sonarqube:latest
```

#### Configuration initiale:
1. Accédez à `http://localhost:9000`
2. Connectez-vous (admin/admin par défaut)
3. Allez dans Administration → Security → Tokens
4. Générez un token
5. Copiez le token dans les secrets GitHub

#### Variables GitHub requises:
```
SONAR_HOST_URL: http://your-sonarqube-server.com:9000
SONAR_TOKEN: votre_token_genere
```

---

## Configuration des Secrets GitHub

### Allez à:
```
Settings → Secrets and variables → Actions → New repository secret
```

### Secrets à ajouter:

**Pour SonarCloud:**
```
SONAR_HOST_URL = https://sonarcloud.io
SONAR_TOKEN = [votre token SonarCloud]
```

**Pour SonarQube auto-hébergé:**
```
SONAR_HOST_URL = https://votre-domaine.com:9000
SONAR_TOKEN = [votre token SonarQube]
```

---

## Métriques Analysées

Le pipeline SonarQube analyse les éléments suivants:

### Qualité du Code
- **Code Smells**: Mauvaises pratiques
- **Bugs**: Erreurs détectées
- **Vulnerabilities**: Failles de sécurité
- **Security Hotspots**: Points sensibles en sécurité

### Couverture de Code
- Pourcentage de code testé
- Lignes couvertes vs non couvertes

### Duplication de Code
- Détection des blocs de code dupliqués
- Suggestions de refactorisation

### Maintenabilité
- Complexité cyclomatique
- Dépendances de modules
- Lisibilité du code

---

## Accéder aux Résultats

### SonarCloud Dashboard:
```
https://sonarcloud.io/dashboard?id=campuslink
```

### SonarQube Local:
```
http://localhost:9000/dashboard?id=campuslink
```

### Dans GitHub:
- Les résultats s'affichent automatiquement dans les PR
- Vérifiez l'onglet "Checks" de votre pull request

---

## Configuration Personnalisée

### Ajouter des Rules personnalisées:

Éditez `.sonarcloud.properties` ou `sonar-project.properties`:

```properties
# Exclure certains fichiers
sonar.exclusions=**/migrations/**,**/generated/**

# Inclure uniquement certains répertoires
sonar.inclusions=src/**

# Configurer les règles TypeScript
sonar.typescript.lcov.reportPaths=coverage/lcov.info
```

### Configurer Quality Gates:

1. Allez dans SonarCloud/SonarQube
2. Quality Gates → Créer/Éditer
3. Définissez des conditions:
   - Code Coverage ≥ 80%
   - Bugs = 0
   - Security Rating = A
   - Maintainability Rating = A

---

## Commandes Locales

### Analyser localement avec SonarQube Scanner:

```bash
# Installation du scanner
npm install -g sonarqube-scanner

# Lancer l'analyse
sonar-scanner \
  -Dsonar.projectKey=campuslink \
  -Dsonar.sources=backend/src,frontend/src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=votre_token
```

---

## Troubleshooting

### Les résultats ne s'affichent pas?
1. Vérifiez les secrets GitHub (Settings → Secrets)
2. Consultez les logs GitHub Actions
3. Vérifiez la connexion à SonarCloud/SonarQube

### Erreur de token?
1. Régénérez le token dans SonarCloud/SonarQube
2. Mettez à jour le secret GitHub

### Échec du Quality Gate?
1. Consultez le dashboard SonarCloud/SonarQube
2. Corrigez les issues identifiées
3. Pushez à nouveau

---

## Ressources

- [SonarCloud Documentation](https://docs.sonarsource.com/sonarcloud/)
- [SonarQube Documentation](https://docs.sonarsource.com/sonarqube/latest/)
- [GitHub Actions SonarQube](https://github.com/SonarSource/sonarqube-scan-action)
- [SonarQube Docker](https://hub.docker.com/_/sonarqube)
