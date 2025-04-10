# Déploiement GitHub pour KSP Rocket Builder

Ce document fournit les instructions pour configurer et déployer le projet KSP Rocket Builder sur GitHub.

## Étape 1: Créer un nouveau dépôt GitHub

1. Connectez-vous à votre compte GitHub
2. Créez un nouveau dépôt nommé `ksp_rocket_builder`
3. Ne cochez pas l'option "Initialize this repository with a README"
4. Cliquez sur "Create repository"

## Étape 2: Configuration locale du dépôt Git

```bash
# Depuis le répertoire racine du projet
git init
git add .
git commit -m "Initial commit: KSP Rocket Builder v0.2.1"
git branch -M main
git remote add origin https://github.com/redgrunt/ksp_rocket_builder.git
git push -u origin main
```

## Étape 3: Vérification du déploiement

Après avoir poussé le code, rendez-vous sur https://github.com/redgrunt/ksp_rocket_builder pour vérifier que votre code est bien déployé.

## Étape 4: Configuration des branches

Selon les conventions mentionnées dans la documentation, configurez les branches suivantes:

```bash
# Créer la branche develop
git checkout -b develop
git push -u origin develop

# Créer une branche feature pour les validateurs manquants
git checkout -b feature/resource-validator
git push -u origin feature/resource-validator
```

## Étape 5: Configuration de GitHub Pages (optionnel)

Si vous souhaitez déployer une version de démonstration:

1. Allez dans "Settings" > "Pages"
2. Dans "Source", sélectionnez la branche "main" et le dossier "/ (root)"
3. Cliquez sur "Save"

## Structure du dépôt

Le dépôt suit la structure décrite dans le README.md, avec une organisation modulaire:

```
ksp_rocket_builder/
├── assets/
│   └── images/
├── docs/                      # Documentation complète
├── src/
│   ├── components/            # Composants UI (futurs)
│   ├── engine/                # Moteur 3D (RocketEngine.js)
│   ├── api/                   # API de données
│   │   └── utils/
│   │       └── datavalidator/ # Système modulaire de validation
│   └── utils/                 # Utilitaires et calculs physiques
├── index.html                 # Page d'accueil
└── app.html                   # Application principale
```

## Bonnes pratiques pour les commits

- Utilisez des messages de commit descriptifs suivant le format: `type(scope): message`
- Exemples de types: feat, fix, docs, style, refactor, test, chore
- Exemples de scopes: validator, ui, engine, api, physics

Exemples:
- `feat(validator): Add resource validator module`
- `fix(physics): Correct delta-v calculation for atmospheric engines`
- `docs(readme): Update installation instructions`

## Gestion des branches

- `main`: Code stable de production
- `develop`: Branche de développement principale
- `feature/xxx`: Pour les nouvelles fonctionnalités
- `bugfix/xxx`: Pour les corrections de bugs
- `release/x.x.x`: Pour la préparation des releases

## Issues et Pull Requests

- Créez des issues pour chaque tâche ou bug
- Liez vos commits et pull requests aux issues correspondantes
- Utilisez les références #XX dans les messages pour lier automatiquement

## Actions automatisées (pour les versions futures)

Le projet pourrait bénéficier de workflows GitHub Actions pour:
- Tests automatisés
- Validation du linting
- Déploiements automatiques vers GitHub Pages

Ces configurations seront ajoutées dans une version ultérieure.
