# Validateur de Ressources

Ce document détaille l'implémentation et l'utilisation du validateur de ressources dans le système modulaire de validation des données du projet KSP Rocket Builder.

## Vue d'ensemble

Le validateur de ressources (`resource.js`) est responsable de la validation des entités de type ressource dans le système. Il s'assure que chaque ressource définie dans le jeu respecte le schéma attendu et contient toutes les propriétés obligatoires avec les valeurs appropriées.

## Emplacement dans le système

Le validateur se trouve dans :
```
src/api/utils/datavalidator/validators/resource.js
```

Il est intégré au système de validation via le fichier principal `DataValidator.js` et est accessible via le point d'entrée `index.js`.

## Schéma de validation

Une ressource valide doit respecter le schéma suivant :

```javascript
{
  id: String,              // Identifiant unique de la ressource
  name: String,            // Nom d'affichage de la ressource
  abbreviation: String,    // Abréviation (ex: "LF" pour "Liquid Fuel")
  density: Number,         // Densité en kg/m³ (utilisée pour les calculs de masse)
  unitCost: Number,        // Coût par unité
  transferable: Boolean,   // Si la ressource peut être transférée entre vaisseaux
  resourceType: String,    // Type de ressource (PROPELLANT, ELECTRIC, LIFE_SUPPORT, etc.)
  color: String,           // Code couleur hexadécimal pour l'interface utilisateur
  visible: Boolean         // Si la ressource est visible dans l'interface utilisateur
}
```

## Règles de validation spécifiques

Le validateur de ressources implémente les règles spécifiques suivantes :

1. **Identifiant unique** : Chaque ressource doit avoir un identifiant unique
2. **Propriétés obligatoires** : Toutes les propriétés du schéma sont requises
3. **Formats spécifiques** :
   - `color` doit être un code hexadécimal valide (ex: "#FF0000")
   - `abbreviation` ne doit pas dépasser 5 caractères
4. **Valeurs numériques** :
   - `density` doit être strictement positif
   - `unitCost` doit être positif ou nul
5. **Types d'énumération** :
   - `resourceType` doit être l'une des valeurs définies dans les constantes

## Codes d'erreur

Le validateur génère des codes d'erreur spécifiques pour différents types de validation échouée :

- `RESOURCE_INVALID_ID` : L'identifiant de la ressource est invalide
- `RESOURCE_MISSING_REQUIRED` : Une propriété obligatoire est manquante
- `RESOURCE_INVALID_TYPE` : Le type d'une propriété ne correspond pas au schéma
- `RESOURCE_INVALID_COLOR` : Le format de couleur est invalide
- `RESOURCE_INVALID_ABBR` : L'abréviation est trop longue ou invalide
- `RESOURCE_INVALID_DENSITY` : La densité est négative ou nulle
- `RESOURCE_INVALID_RESOURCE_TYPE` : Le type de ressource n'est pas reconnu

## Utilisation

Le validateur de ressources peut être utilisé de deux façons :

### 1. Via le système DataValidator principal

```javascript
import { DataValidator } from '../api/utils/datavalidator';

const validator = DataValidator.getInstance();
const validationResult = validator.validateResource(resourceObject);

if (!validationResult.isValid) {
  console.error('Erreurs de validation:', validationResult.errors);
}
```

### 2. Directement via le module du validateur de ressources

```javascript
import { validateResource } from '../api/utils/datavalidator/validators/resource';

const validationResult = validateResource(resourceObject);

if (!validationResult.isValid) {
  console.error('Erreurs de validation:', validationResult.errors);
}
```

## Exemples

### Exemple de ressource valide

```javascript
const liquidFuel = {
  id: "liquidFuel",
  name: "Liquid Fuel",
  abbreviation: "LF",
  density: 5.0,
  unitCost: 0.8,
  transferable: true,
  resourceType: "PROPELLANT",
  color: "#FFCC00",
  visible: true
};
```

### Exemple de validation

```javascript
const result = validator.validateResource(liquidFuel);
console.log(result.isValid); // true
```

## Intégration avec le système de validation

Le validateur de ressources est automatiquement intégré au système DataValidator principal et peut être utilisé dans les contextes suivants :

1. **Validation individuelle** : Pour valider une seule entité ressource
2. **Validation par lot** : Pour valider un ensemble de ressources
3. **Validation de relations** : Pour vérifier les relations entre ressources et autres entités

## Notes d'implémentation

Le validateur utilise le pattern de validation commun défini dans le système modulaire, garantissant la cohérence avec les autres validateurs. Il utilise les utilitaires de formatage et d'accès sécurisé pour une gestion robuste des erreurs.

## Maintenance et extension

Pour étendre les fonctionnalités du validateur de ressources :

1. Ajoutez de nouvelles règles de validation dans la fonction `validateResource`
2. Définissez de nouveaux codes d'erreur dans `constants.js`
3. Mettez à jour ce document pour refléter les changements