# Guide des Conventions de Nommage pour KSP Rocket Builder

Ce document présente les conventions de nommage standardisées pour le projet KSP Rocket Builder.

## Conventions Adoptées

Les conventions suivantes ont été mises en place pour assurer la cohérence du code à travers l'ensemble du projet:

### 1. Variables et fonctions

```javascript
// Utiliser camelCase
const rocketMass = calculateTotalMass();
function calculateDeltaV() { ... }
```

### 2. Classes

```javascript
// Utiliser PascalCase
class RocketEngine { ... }
class PartFactory { ... }
```

### 3. Constantes

```javascript
// Utiliser UPPER_SNAKE_CASE
const KERBIN_GRAVITY = 9.81;
const MAX_PARTS_COUNT = 100;
```

### 4. Méthodes privées

```javascript
// Préfixer avec un underscore (_)
class Calculator {
  _calculateDryMass() { ... }
  _getPartById(id) { ... }
}
```

### 5. Booléens

```javascript
// Préfixer avec is, has, should, ou can
const isVisible = true;
function hasChildren() { ... }
let shouldUpdate = false;
```

### 6. Énumérations

```javascript
// Clés en UPPER_SNAKE_CASE
const NUMERIC_OPERATORS = {
  EQUALS: 'eq',
  NOT_EQUALS: 'ne',
  GREATER_THAN: 'gt'
};

const ERROR_TYPES = {
  WARNING: 'warning',
  ERROR: 'error'
};
```

## Vérification Automatique

Pour faciliter le respect de ces conventions, nous avons mis en place des règles ESLint. Pour exécuter la vérification:

```bash
npm run lint
```

Pour corriger automatiquement les problèmes simples:

```bash
npm run lint:fix
```

## Intégration dans Votre Workflow

Voici quelques conseils pour intégrer ces conventions dans votre workflow de développement:

1. Configurez votre éditeur pour utiliser ESLint (la plupart des IDE modernes prennent en charge ESLint via des plugins).
2. Exécutez `npm run lint` avant chaque commit pour vous assurer que votre code respecte les conventions.
3. Pensez aux conventions pendant que vous codez, pas seulement lors de la revue de code.

## Questions Fréquentes

### Pourquoi utiliser des préfixes pour les booléens?

Les préfixes comme `is`, `has`, `should` rendent le code plus lisible et auto-documenté. Quand vous voyez `isVisible` ou `hasChildren`, vous savez immédiatement que ce sont des booléens.

### Pourquoi utiliser un underscore pour les méthodes privées?

JavaScript n'avait traditionnellement pas de concept de méthodes véritablement privées (bien que les champs privés avec `#` soient maintenant disponibles). L'utilisation du préfixe `_` est une convention largement adoptée qui indique clairement qu'une méthode est destinée à un usage interne.

### Pourquoi UPPER_SNAKE_CASE pour les constantes?

Cette convention permet de distinguer visuellement les constantes des variables régulières, ce qui est particulièrement utile pour identifier rapidement les valeurs qui ne devraient pas changer.

## Ressources Complémentaires

Pour plus de détails sur les modifications effectuées pour standardiser les conventions de nommage, consultez le [rapport de standardisation](STANDARDISATION_REPORT.md).
