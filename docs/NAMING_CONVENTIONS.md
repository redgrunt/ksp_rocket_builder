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

## Outils de standardisation

Pour faciliter le respect de ces conventions, nous avons mis en place plusieurs outils :

### ESLint

Une configuration ESLint complète est disponible à la racine du projet (`.eslintrc.js`). Pour utiliser ESLint :

```bash
# Installation des dépendances
npm install

# Vérification du code
npm run lint

# Correction automatique des problèmes simples
npm run lint:fix
```

### EditorConfig

Un fichier `.editorconfig` est présent à la racine du projet pour assurer une cohérence des styles de code même sans ESLint. La plupart des IDE modernes supportent EditorConfig nativement ou via des plugins.

## Tests et validation

Après avoir modifié un fichier pour respecter les conventions de nommage, assurez-vous que :

1. Les tests unitaires passent toujours : `npm test`
2. ESLint ne signale pas d'erreurs : `npm run lint`
3. Le comportement fonctionnel n'a pas été modifié (tests manuels)

Si vous renommez des fonctions ou variables qui sont référencées dans d'autres fichiers, assurez-vous de mettre à jour toutes les références.

## Intégration dans Votre Workflow

Voici quelques conseils pour intégrer ces conventions dans votre workflow de développement:

1. Configurez votre éditeur pour utiliser ESLint et EditorConfig
2. Exécutez `npm run lint` avant chaque commit pour vous assurer que votre code respecte les conventions
3. Configurez votre IDE pour appliquer le formatage automatiquement à la sauvegarde
4. Incluez la vérification des conventions dans vos revues de code

## Extension au-delà des conventions de nommage

Ces conventions font partie d'un ensemble plus large de bonnes pratiques de codage. Elles devraient être complétées par :

- Des conventions de formatage (indentation, espaces, etc.)
- Des pratiques de documentation (JSDoc, commentaires)
- Des standards pour la gestion des erreurs
- Des directives pour l'organisation des fichiers et modules

## Questions Fréquentes

### Pourquoi utiliser des préfixes pour les booléens?

Les préfixes comme `is`, `has`, `should` rendent le code plus lisible et auto-documenté. Quand vous voyez `isVisible` ou `hasChildren`, vous savez immédiatement que ce sont des booléens.

### Pourquoi utiliser un underscore pour les méthodes privées?

JavaScript n'avait traditionnellement pas de concept de méthodes véritablement privées (bien que les champs privés avec `#` soient maintenant disponibles). L'utilisation du préfixe `_` est une convention largement adoptée qui indique clairement qu'une méthode est destinée à un usage interne.

### Pourquoi UPPER_SNAKE_CASE pour les constantes?

Cette convention permet de distinguer visuellement les constantes des variables régulières, ce qui est particulièrement utile pour identifier rapidement les valeurs qui ne devraient pas changer.

### Comment gérer les noms longs en camelCase?

Pour les noms très longs, assurez-vous que chaque mot composant le nom est clairement identifiable. Par exemple : `calculateTotalRocketMassWithPayload` est plus lisible que `calctotrcktmasswithpld`.

### Comment traiter les acronymes dans les noms?

Pour les acronymes comme "API", "HTTP", "URL", etc. :
- Dans camelCase, gardez l'acronyme en majuscules s'il est au début, sinon en minuscules : `apiRequest`, `getApiUrl`
- Dans PascalCase, gardez les acronymes en majuscules : `HTTPRequest`, `APIController`
- Dans UPPER_SNAKE_CASE, tout est en majuscules : `API_REQUEST_TIMEOUT`

## Ressources Complémentaires

Pour plus de détails sur les modifications effectuées pour standardiser les conventions de nommage, consultez le [rapport de standardisation](STANDARDISATION_REPORT.md).
