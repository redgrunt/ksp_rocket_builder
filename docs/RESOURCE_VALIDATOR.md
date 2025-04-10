# Validateur de Ressources

Ce document décrit le fonctionnement et l'utilisation du validateur de ressources, qui fait partie du système modulaire de validation des données du projet KSP Rocket Builder.

## Vue d'ensemble

Le validateur de ressources (`resource.js`) est chargé de valider les objets représentant les ressources dans Kerbal Space Program. Il vérifie les propriétés obligatoires, les types de données, les plages de valeurs valides et la cohérence logique des ressources.

## Structure d'une ressource valide

Une ressource valide doit avoir la structure suivante :

```javascript
{
  // Propriétés obligatoires
  id: "LiquidFuel",          // Identifiant unique (string)
  name: "Carburant Liquide", // Nom d'affichage (string)
  density: 0.8,              // Densité en tonnes/unité (number)
  unitCost: 0.8,             // Coût par unité (number)
  
  // Propriétés optionnelles
  transferable: true,        // Si la ressource peut être transférée (boolean)
  flowMode: "STAGE_PRIORITY_FLOW", // Mode de flux (string, voir ci-dessous)
  color: [0.5, 0.2, 0.9, 1], // Couleur RGBA (array, chaque valeur 0-1)
  specificEnergy: 1.0        // Énergie spécifique (number, pour ElectricCharge)
}
```

## Modes de flux valides

Les modes de flux suivants sont valides pour les ressources :

- `NO_FLOW` : La ressource ne circule pas entre les pièces
- `ALL_VESSEL` : La ressource circule entre toutes les pièces du vaisseau
- `STAGE_PRIORITY_FLOW` : La ressource circule en priorité dans l'étage courant
- `STAGE_STACK_FLOW` : La ressource circule dans la pile d'étages
- `STAGE_LOCKED` : La ressource est verrouillée à son étage

## Types de ressources reconnus

Le validateur reconnaît et applique des règles spécifiques pour certains types de ressources :

- `ElectricCharge` : Devrait avoir `specificEnergy` et `flowMode` défini sur `ALL_VESSEL`
- Propergols (`LiquidFuel`, `Oxidizer`, `MonoPropellant`, `SolidFuel`) : Vérification de densité réaliste
- `SolidFuel` : Devrait avoir `transferable` défini sur `false`

## Utilisation du validateur

### Import et utilisation directe

```javascript
import { validateResource } from './validators/resource.js';

// Validation avec options par défaut
const result = validateResource(
  resourceObject,  
  validationCache,
  defaultOptions,
  applyCustomRules,
  validateType
);

// Vérification du résultat
if (result.valid) {
  console.log("La ressource est valide");
} else {
  console.log("Erreurs de validation:", result.errors);
  console.log("Avertissements:", result.warnings);
}
```

### Utilisation via DataValidator

```javascript
import DataValidator from '../api/utils/datavalidator/DataValidator.js';

const validator = new DataValidator();

// Validation d'une ressource
const result = validator.validateResource(resourceObject);

// Vérification du résultat
if (result.valid) {
  console.log("La ressource est valide");
} else {
  console.log("Erreurs de validation:", result.errors);
}
```

### Utilisation via l'API singleton

```javascript
import dataValidator from '../api/utils/datavalidator';
import { VALIDATION_TYPES } from '../api/utils/datavalidator/constants.js';

// Validation directe
const result = dataValidator.validateResource(resourceObject);

// Ou avec la fonction générique validate
const result = dataValidator.validate(resourceObject, VALIDATION_TYPES.RESOURCE);
```

## Options de validation

Le validateur accepte les options suivantes :

- `enableCache` (boolean) : Utilise un cache pour optimiser les performances lors de validations répétées
- `strictMode` (boolean) : Traite tous les avertissements comme des erreurs
- `autoFix` (boolean) : Tente de corriger automatiquement les problèmes simples
- `maxErrors` (number) : Limite le nombre d'erreurs à collecter
- `includeWarnings` (boolean) : Inclut les avertissements dans le résultat
- `includeInfo` (boolean) : Inclut les informations dans le résultat

## Codes d'erreur

Le validateur utilise les codes d'erreur définis dans `constants.js` :

### Erreurs
- `REQUIRED_FIELD_MISSING` : Un champ obligatoire est manquant
- `INVALID_TYPE` : Le type d'un champ est incorrect
- `INVALID_VALUE` : La valeur d'un champ est invalide
- `CONSTRAINT_VIOLATION` : Une contrainte logique entre champs est violée

### Avertissements
- `UNUSUAL_VALUE` : Une valeur inhabituelle a été détectée
- `RECOMMENDED_FIELD_MISSING` : Un champ recommandé est manquant

## Points de validation

Le validateur de ressources effectue les vérifications suivantes :

1. **Validation des champs obligatoires** : `id`, `name`, `density`, `unitCost`
2. **Validation des types** : Vérifie que chaque champ a le type attendu
3. **Validation des valeurs numériques** : Vérifie que les valeurs numériques sont dans des plages valides
4. **Validation des propriétés de flux** : Vérifie la cohérence entre `transferable` et `flowMode`
5. **Validation de la couleur** : Vérifie le format et les valeurs des composantes de couleur
6. **Validation spécifique au type de ressource** : Applique des règles spécifiques selon l'ID de la ressource

## Exemples de résultats de validation

### Ressource valide

```javascript
{
  valid: true,
  errors: [],
  warnings: [],
  infos: []
}
```

### Ressource avec erreurs

```javascript
{
  valid: false,
  errors: [
    {
      message: "Champ obligatoire manquant: density",
      path: "density",
      code: "required_field_missing",
      type: "error",
      timestamp: "2025-04-10T12:34:56.789Z"
    }
  ],
  warnings: [],
  infos: []
}
```

### Ressource avec avertissements

```javascript
{
  valid: true,
  errors: [],
  warnings: [
    {
      message: "La densité est à zéro, ce qui est inhabituel pour une ressource",
      path: "density",
      code: "unusual_value",
      type: "warning",
      timestamp: "2025-04-10T12:34:56.789Z"
    }
  ],
  infos: []
}
```

## Règles de validation personnalisées

Il est possible d'ajouter des règles de validation personnalisées via DataValidator :

```javascript
validator.addCustomValidationRule('resource', 'checkSpecialResource', (resource) => {
  if (resource.id === 'SpecialResource' && !resource.specialProperty) {
    return {
      valid: false,
      message: "La ressource 'SpecialResource' doit avoir une propriété 'specialProperty'",
      path: 'specialProperty',
      code: 'required_field_missing'
    };
  }
  return { valid: true };
});
```

## Intégration avec d'autres validateurs

Le validateur de ressources fait partie d'un écosystème modulaire de validateurs qui comprend également :

- Validateur de pièces (`part.js`)
- Validateur de corps célestes (`celestialBody.js`)
- Validateur de technologies (`tech.js`, à implémenter)

Ces validateurs partagent une interface commune et des utilitaires, ce qui facilite leur utilisation cohérente dans l'application.
