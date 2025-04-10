# Guide de reprise du travail sur GitHub

Ce guide fournit les instructions pour reprendre le travail sur le projet KSP Rocket Builder déployé sur GitHub.

## Structure du dépôt

Le projet est hébergé sur GitHub à l'adresse suivante : [github.com/redgrunt/ksp_rocket_builder](https://github.com/redgrunt/ksp_rocket_builder).

La structure des branches est la suivante :
- `main` : Code stable de production
- `develop` : Branche de développement principale
- `feature/xxx` : Pour les nouvelles fonctionnalités (ex: `feature/resource-validator`)
- `bugfix/xxx` : Pour les corrections de bugs
- `release/x.x.x` : Pour la préparation des releases

## Comment reprendre le travail

### 1. Cloner le dépôt

Si ce n'est pas déjà fait, clonez le dépôt sur votre machine :

```bash
git clone https://github.com/redgrunt/ksp_rocket_builder.git
cd ksp_rocket_builder
```

### 2. Mise à jour du code

Mettez à jour votre code local avec les dernières modifications :

```bash
git checkout develop
git pull origin develop
```

### 3. Créer une nouvelle branche fonctionnelle

Pour travailler sur une nouvelle fonctionnalité :

```bash
git checkout -b feature/nom-de-la-fonctionnalite
```

Ou pour corriger un bug :

```bash
git checkout -b bugfix/nom-du-bugfix
```

### 4. Développement et commit

Développez vos modifications et committez régulièrement :

```bash
git add .
git commit -m "type(scope): description concise"
```

Suivez les conventions de nommage pour les commits :
- `feat(scope): message` pour les nouvelles fonctionnalités
- `fix(scope): message` pour les corrections de bugs
- `docs(scope): message` pour la documentation
- `refactor(scope): message` pour les refactorisations
- `test(scope): message` pour les tests
- `chore(scope): message` pour les tâches diverses

### 5. Pousser les modifications

Poussez votre branche sur GitHub :

```bash
git push origin feature/nom-de-la-fonctionnalite
```

### 6. Créer une Pull Request

1. Allez sur [github.com/redgrunt/ksp_rocket_builder](https://github.com/redgrunt/ksp_rocket_builder)
2. Cliquez sur "Pull requests" puis "New pull request"
3. Sélectionnez votre branche (source) et `develop` comme branche cible
4. Ajoutez un titre et une description détaillée
5. Soumettez la Pull Request

## Tâches actuelles et prochaines étapes

### Version actuelle

**v0.2.1** - Modularisation du DataValidator

### Prochaine version

**v0.3.0** - Correction des bugs et admin (prévue pour le 15/04/2025)

### Tâches en cours

- [x] Implémentation du validateur de ressources (PR #1)
- [ ] Implémentation du validateur de technologies
- [ ] Développement de la page d'administration
- [ ] Correction des bugs listés dans docs/BUGS_LIST.md

### Conventions de code

- camelCase pour les variables et fonctions
- PascalCase pour les classes
- UPPER_SNAKE_CASE pour les constantes
- Documentation JSDoc pour les fonctions et classes
- Modules ES6 pour l'organisation du code

## Structure des fichiers

### Validateurs
Les validateurs se trouvent dans `src/api/utils/datavalidator/validators/`.

Structure pour chaque validateur :
```javascript
/**
 * @fileoverview Description du validateur
 * @module chemin/du/module
 */

// Imports

/**
 * Fonction principale du validateur
 * @param {Object} entity - Entité à valider
 * @param {Map} validationCache - Cache de validation
 * @param {Object} defaultOptions - Options par défaut
 * @param {Function} applyCustomRules - Fonction pour appliquer les règles personnalisées
 * @param {Function} validateType - Fonction de validation de type
 * @param {Object} options - Options spécifiques
 * @returns {Object} Résultat de la validation
 */
export function validateEntity(...) { ... }

// Fonctions privées pour la validation
```

### Le Point d'entrée

Le système de validation est accessible via le point d'entrée `src/api/utils/datavalidator/index.js`.

### Documentation

Chaque nouvelle fonctionnalité doit être documentée dans le dossier `docs/`.

## Exemples de reprise pour des tâches spécifiques

### Exemple 1: Implémenter le validateur de technologies

```bash
git checkout develop
git pull origin develop
git checkout -b feature/tech-validator
# Développer le validateur en se basant sur l'exemple du validateur de ressources
git add .
git commit -m "feat(validator): Implement technology validator"
git push origin feature/tech-validator
# Créer une Pull Request sur GitHub
```

### Exemple 2: Corriger un bug dans le calculateur physique

```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/delta-v-calculation
# Corriger le bug dans src/utils/rocketPhysics.js
git add .
git commit -m "fix(physics): Correct delta-v calculation for atmospheric engines"
git push origin bugfix/delta-v-calculation
# Créer une Pull Request sur GitHub
```

## Résolution de problèmes

### Conflits de fusion

Si vous rencontrez des conflits lors d'un merge ou d'un rebase :

1. Résoudre les conflits manuellement
   ```bash
   git status # Voir les fichiers en conflit
   # Éditer les fichiers pour résoudre les conflits
   git add . # Marquer les conflits comme résolus
   git commit # Finaliser la résolution
   ```

### Revenir à un état stable

Si vous êtes bloqué et voulez revenir à un état stable :

```bash
git stash # Sauvegarder vos modifications en cours
git checkout develop # Revenir à la branche principale
# Plus tard, pour récupérer vos modifications :
git checkout votre-branche
git stash apply
```

## Ressources utiles

- [Documentation GitHub](https://docs.github.com/en)
- [Conventions de commit](https://www.conventionalcommits.org/)
- [Documentation JSDoc](https://jsdoc.app/)
- [Documentation du projet](docs/README.md)
