/**
 * @fileoverview Validateur pour les ressources
 * @module api/utils/datavalidator/validators/resource
 */

import { getNestedValue, validateRequiredProps, applyDefaults } from '../../../../utils/SafeAccess.js';
import { ERROR_CODES, ERROR_TYPES } from '../constants.js';
import { formatError } from '../formatters.js';

/**
 * Valide une ressource
 * @param {Object} resource - Ressource à valider
 * @param {Map} validationCache - Cache de validation
 * @param {Object} defaultOptions - Options par défaut
 * @param {Function} applyCustomRules - Fonction pour appliquer les règles personnalisées
 * @param {Function} validateType - Fonction de validation de type
 * @param {Object} options - Options spécifiques à cette validation
 * @returns {Object} - Résultat de la validation {valid, errors, warnings, infos}
 */
export function validateResource(resource, validationCache, defaultOptions, applyCustomRules, validateType, options = {}) {
  // Fusion avec les options par défaut
  const opts = { ...defaultOptions, ...options };
  
  // Vérifier le cache si activé
  const cacheKey = resource ? `resource_${resource.id || 'undefined'}` : 'resource_undefined';
  if (opts.enableCache && validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }

  const errors = [];
  const warnings = [];
  const infos = [];
  
  if (!resource) {
    errors.push(formatError(
      'Ressource non définie',
      '',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
    
    const result = { valid: false, errors, warnings, infos };
    
    if (opts.enableCache) {
      validationCache.set(cacheKey, result);
    }
    
    return result;
  }

  // Appliquer les valeurs par défaut si demandé
  let validatedResource = resource;
  if (opts.autoFix) {
    validatedResource = applyDefaults(resource, {
      name: `Resource_${resource.id || 'unknown'}`,
      density: 0,
      unitCost: 0,
      transferable: true,
      flowMode: 'STAGE_PRIORITY_FLOW',
      color: [1, 1, 1, 1] // RGBA format blanc par défaut
    });
  }
  
  // Validation des champs obligatoires
  const requiredFields = ['id', 'name', 'density', 'unitCost'];
  const requiredProps = validateRequiredProps(validatedResource, requiredFields);
  
  if (!requiredProps.valid) {
    requiredProps.missing.forEach(field => {
      errors.push(formatError(
        `Champ obligatoire manquant: ${field}`,
        field,
        ERROR_CODES.REQUIRED_FIELD_MISSING
      ));
    });
  }
  
  // Validation des types
  validateType(validatedResource, 'id', 'string', errors);
  validateType(validatedResource, 'name', 'string', errors);
  validateType(validatedResource, 'density', 'number', errors);
  validateType(validatedResource, 'unitCost', 'number', errors);
  
  // Validation des valeurs numériques
  validateNumericValues(validatedResource, errors, warnings);
  
  // Validation des propriétés de flux et de transfert
  validateFlowProperties(validatedResource, errors, warnings);
  
  // Validation de la couleur
  validateColor(validatedResource, errors, warnings);
  
  // Validation des propriétés spécifiques au type de ressource
  validateResourceTypeSpecifics(validatedResource, errors, warnings);
  
  // Appliquer les règles de validation personnalisées
  applyCustomRules(validatedResource, 'resource', errors, warnings, infos);
  
  // Limiter le nombre d'erreurs si demandé
  if (opts.maxErrors > 0 && errors.length > opts.maxErrors) {
    const exceededCount = errors.length - opts.maxErrors;
    errors.length = opts.maxErrors;
    
    warnings.unshift(formatError(
      `${exceededCount} erreurs supplémentaires non affichées`,
      '',
      'MAX_ERRORS_EXCEEDED',
      ERROR_TYPES.WARNING
    ));
  }
  
  // Construire le résultat final
  const result = {
    valid: errors.length === 0,
    errors,
    warnings: opts.includeWarnings ? warnings : [],
    infos: opts.includeInfo ? infos : []
  };
  
  // Mettre en cache si demandé
  if (opts.enableCache && validatedResource && validatedResource.id) {
    validationCache.set(cacheKey, result);
  }
  
  return result;
}

/**
 * Valide les valeurs numériques d'une ressource
 * @private
 * @param {Object} resource - Ressource à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
function validateNumericValues(resource, errors, warnings) {
  // Vérification de la densité
  const density = getNestedValue(resource, 'density', null);
  
  if (density !== null) {
    if (typeof density !== 'number') {
      errors.push(formatError(
        "Le champ 'density' doit être un nombre",
        'density',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (density < 0) {
      errors.push(formatError(
        "Le champ 'density' ne peut pas être négatif",
        'density',
        ERROR_CODES.INVALID_VALUE
      ));
    } else if (density === 0) {
      warnings.push(formatError(
        "La densité est à zéro, ce qui est inhabituel pour une ressource",
        'density',
        ERROR_CODES.UNUSUAL_VALUE,
        ERROR_TYPES.WARNING
      ));
    }
  }
  
  // Vérification du coût unitaire
  const unitCost = getNestedValue(resource, 'unitCost', null);
  
  if (unitCost !== null) {
    if (typeof unitCost !== 'number') {
      errors.push(formatError(
        "Le champ 'unitCost' doit être un nombre",
        'unitCost',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (unitCost < 0) {
      errors.push(formatError(
        "Le champ 'unitCost' ne peut pas être négatif",
        'unitCost',
        ERROR_CODES.INVALID_VALUE
      ));
    }
  }
  
  // Vérification de la valeur spécifique d'énergie (si présente)
  const specificEnergy = getNestedValue(resource, 'specificEnergy', null);
  
  if (specificEnergy !== null) {
    if (typeof specificEnergy !== 'number') {
      errors.push(formatError(
        "Le champ 'specificEnergy' doit être un nombre",
        'specificEnergy',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (specificEnergy < 0) {
      errors.push(formatError(
        "Le champ 'specificEnergy' ne peut pas être négatif",
        'specificEnergy',
        ERROR_CODES.INVALID_VALUE
      ));
    }
  }
}

/**
 * Valide les propriétés de flux d'une ressource
 * @private
 * @param {Object} resource - Ressource à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
function validateFlowProperties(resource, errors, warnings) {
  // Vérification de la transférabilité
  const transferable = getNestedValue(resource, 'transferable', null);
  
  if (transferable !== null && typeof transferable !== 'boolean') {
    errors.push(formatError(
      "Le champ 'transferable' doit être un booléen",
      'transferable',
      ERROR_CODES.INVALID_TYPE
    ));
  }
  
  // Vérification du mode de flux
  const flowMode = getNestedValue(resource, 'flowMode', null);
  const validFlowModes = [
    'NO_FLOW', 
    'ALL_VESSEL', 
    'STAGE_PRIORITY_FLOW', 
    'STAGE_STACK_FLOW', 
    'STAGE_LOCKED'
  ];
  
  if (flowMode !== null) {
    if (typeof flowMode !== 'string') {
      errors.push(formatError(
        "Le champ 'flowMode' doit être une chaîne de caractères",
        'flowMode',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (!validFlowModes.includes(flowMode)) {
      errors.push(formatError(
        `Le flowMode '${flowMode}' n'est pas valide. Valeurs acceptées: ${validFlowModes.join(', ')}`,
        'flowMode',
        ERROR_CODES.INVALID_VALUE
      ));
    }
  }
  
  // Vérification de la cohérence entre transférabilité et mode de flux
  if (transferable === false && flowMode && flowMode !== 'NO_FLOW' && flowMode !== 'STAGE_LOCKED') {
    warnings.push(formatError(
      `Incohérence: ressource non transférable avec flowMode '${flowMode}'`,
      'flowMode',
      ERROR_CODES.CONSTRAINT_VIOLATION,
      ERROR_TYPES.WARNING
    ));
  }
}

/**
 * Valide la couleur d'une ressource
 * @private
 * @param {Object} resource - Ressource à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
function validateColor(resource, errors, warnings) {
  const color = getNestedValue(resource, 'color', null);
  
  if (color !== null) {
    if (!Array.isArray(color)) {
      errors.push(formatError(
        "Le champ 'color' doit être un tableau",
        'color',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (color.length !== 3 && color.length !== 4) {
      errors.push(formatError(
        "Le champ 'color' doit contenir 3 (RGB) ou 4 (RGBA) valeurs",
        'color',
        ERROR_CODES.INVALID_VALUE
      ));
    } else {
      // Vérification de chaque composante
      color.forEach((component, index) => {
        if (typeof component !== 'number') {
          errors.push(formatError(
            `La composante de couleur à l'index ${index} doit être un nombre`,
            `color[${index}]`,
            ERROR_CODES.INVALID_TYPE
          ));
        } else if (component < 0 || component > 1) {
          errors.push(formatError(
            `La composante de couleur à l'index ${index} doit être entre 0 et 1`,
            `color[${index}]`,
            ERROR_CODES.INVALID_VALUE
          ));
        }
      });
    }
  }
}

/**
 * Valide les propriétés spécifiques au type de ressource
 * @private
 * @param {Object} resource - Ressource à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
function validateResourceTypeSpecifics(resource, errors, warnings) {
  const id = getNestedValue(resource, 'id', '');
  
  // Propriétés spécifiques pour l'électricité
  if (id === 'ElectricCharge') {
    if (!getNestedValue(resource, 'specificEnergy', null)) {
      warnings.push(formatError(
        "La ressource 'ElectricCharge' devrait avoir une propriété 'specificEnergy'",
        'specificEnergy',
        ERROR_CODES.RECOMMENDED_FIELD_MISSING,
        ERROR_TYPES.WARNING
      ));
    }
    
    // Vérifier que ElectricCharge a les bonnes propriétés de flux
    if (getNestedValue(resource, 'flowMode', '') !== 'ALL_VESSEL') {
      warnings.push(formatError(
        "La ressource 'ElectricCharge' devrait avoir un 'flowMode' défini sur 'ALL_VESSEL'",
        'flowMode',
        ERROR_CODES.UNUSUAL_VALUE,
        ERROR_TYPES.WARNING
      ));
    }
  }
  
  // Propriétés spécifiques pour les propergols
  if (['LiquidFuel', 'Oxidizer', 'MonoPropellant', 'SolidFuel'].includes(id)) {
    // Vérifier que les propergols ont une densité réaliste
    const density = getNestedValue(resource, 'density', 0);
    
    if (density > 0 && density < 0.1) {
      warnings.push(formatError(
        `La densité (${density}) semble très faible pour un propergol`,
        'density',
        ERROR_CODES.UNUSUAL_VALUE,
        ERROR_TYPES.WARNING
      ));
    } else if (density > 10) {
      warnings.push(formatError(
        `La densité (${density}) semble très élevée pour un propergol`,
        'density',
        ERROR_CODES.UNUSUAL_VALUE,
        ERROR_TYPES.WARNING
      ));
    }
  }
  
  // Vérification des ressources non transférables
  if (id === 'SolidFuel' && getNestedValue(resource, 'transferable', true) !== false) {
    warnings.push(formatError(
      "La ressource 'SolidFuel' devrait avoir 'transferable' défini sur false",
      'transferable',
      ERROR_CODES.UNUSUAL_VALUE,
      ERROR_TYPES.WARNING
    ));
  }
}
