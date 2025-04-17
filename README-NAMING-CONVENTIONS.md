# Refactorisation des Conventions de Nommage

Ce dépôt contient les modifications visant à standardiser les conventions de nommage dans le projet KSP Rocket Builder. L'objectif est d'améliorer la lisibilité, la maintenabilité et la cohérence du code.

## Contenu de la branche

Cette branche `refactor/naming-conventions` contient :

1. **Modifications du code source** :
   - Standardisation des opérateurs dans `SearchEngine.js`
   - Ajout du préfixe `_` aux méthodes privées dans `rocketPhysics.js`
   - Uniformisation des préfixes booléens dans `RocketAssembler.js`
   - Conversion de `frustum_culling` en `frustumCulling` dans `RocketEngine.js`
   - Vérification des constantes dans `RocketConfig.js`

2. **Configuration et outils** :
   - Configuration ESLint avec des règles pour chaque convention
   - Configuration EditorConfig pour standardisation dans les IDE
   - Mise à jour du package.json avec les dépendances nécessaires

3. **Documentation** :
   - Rapport détaillé des modifications : `docs/STANDARDISATION_REPORT.md`
   - Guide des conventions de nommage : `docs/NAMING_CONVENTIONS.md`

4. **Tests** :
   - Tests unitaires pour vérifier les conventions et le fonctionnement : `tests/naming-conventions.test.js`

## Comment tester les modifications

### 1. Vérifier les règles de conventions

```bash
# Installer les dépendances
npm install

# Exécuter ESLint
npm run lint

# Pour voir quelles règles sont respectées et lesquelles sont violées
npm run lint -- --format table
```

### 2. Exécuter les tests

```bash
# Exécuter tous les tests
npm test

# Exécuter uniquement les tests de conventions de nommage
npm test -- -t "Conventions de nommage"
```

### 3. Vérification manuelle

Pour vérifier manuellement les modifications :

1. Ouvrez les fichiers modifiés et comparez avec la version précédente
2. Vérifiez que tous les renommages ont préservé la sémantique du code
3. Testez les fonctionnalités principales pour vous assurer qu'elles fonctionnent toujours

## Résumé des Conventions Standardisées

- **Variables et fonctions** : camelCase
- **Classes** : PascalCase
- **Constantes** : UPPER_SNAKE_CASE
- **Méthodes privées** : Préfixe `_`
- **Booléens** : Préfixe `is`, `has`, `should`, ou `can`
- **Énumérations** : Clés en UPPER_SNAKE_CASE

## Prochaines étapes après fusion

- Mettre en place un hook pre-commit pour vérifier automatiquement les conventions
- Ajouter la vérification ESLint au pipeline CI/CD
- Organiser une session d'information pour l'équipe sur les nouvelles conventions
- Créer un template de pull request qui inclut la vérification des conventions

## Informations techniques supplémentaires

### Fichiers modifiés

- `src/api/SearchEngine.js`
- `src/utils/rocketPhysics.js`
- `src/engine/modules/assembly/RocketAssembler.js`
- `src/engine/RocketEngine.js`
- `src/engine/modules/core/RocketConfig.js`

### Fichiers ajoutés

- `.eslintrc.js`
- `.editorconfig`
- `docs/STANDARDISATION_REPORT.md`
- `docs/NAMING_CONVENTIONS.md`
- `tests/naming-conventions.test.js`

### Dépendances ajoutées

- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint`

Pour plus de détails, consultez le [rapport de standardisation](docs/STANDARDISATION_REPORT.md).
