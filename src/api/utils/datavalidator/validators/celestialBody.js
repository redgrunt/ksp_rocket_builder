/**
 * @fileoverview Validateur pour les corps célestes
 * @module api/utils/datavalidator/validators/celestialBody
 */

import { getNestedValue, validateRequiredProps, applyDefaults } from '../../../../utils/SafeAccess.js';
import { ERROR_CODES, ERROR_TYPES } from '../constants.js';
import { formatError } from '../formatters.js';

/**
 * Valide un corps céleste
 * @param {Object} body - Corps céleste à valider
 * @param {Map} validationCache - Cache de validation
 * @param {Object} defaultOptions - Options par défaut
 * @param {Function} applyCustomRules - Fonction pour appliquer les règles personnalisées
 * @param {Function} validateType - Fonction de validation de type
 * @param {Object} options - Options spécifiques à cette validation
 * @returns {Object} - Résultat de la validation {valid, errors, warnings, infos}
 */
export function validateCelestialBody(body, validationCache, defaultOptions, applyCustomRules, validateType, options = {}) {
  // Fusion avec les options par défaut
  const opts = { ...defaultOptions, ...options };
  
  // Vérifier le cache si activé
  const cacheKey = body ? `celestialBody_${body.id || 'undefined'}` : 'celestialBody_undefined';
  if (opts.enableCache && validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }

  const errors = [];
  const warnings = [];
  const infos = [];
  
  if (!body) {
    errors.push(formatError(
      'Corps céleste non défini',
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
  let validatedBody = body;
  if (opts.autoFix) {
    validatedBody = applyDefaults(body, {
      name: `Body_${body.id || 'unknown'}`,
      type: 'planet',
      physical: { radius: 0, mass: 0, gravity: 0 }
    });
  }
  
  // Validation des champs obligatoires
  const requiredFields = ['id', 'name', 'type', 'physical'];
  const requiredProps = validateRequiredProps(validatedBody, requiredFields);
  
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
  validateType(validatedBody, 'id', 'string', errors);
  validateType(validatedBody, 'name', 'string', errors);
  validateType(validatedBody, 'type', 'string', errors);
  
  // Validation des propriétés physiques
  validatePhysicalProperties(validatedBody, errors);
  
  // Validation de l'orbite (sauf pour l'étoile centrale)
  const type = getNestedValue(validatedBody, 'type', '');
  const parent = getNestedValue(validatedBody, 'parent', null);
  
  if (type !== 'star' && parent) {
    validateOrbit(validatedBody, errors);
  }
  
  // Validation de l'atmosphère si présente
  validateAtmosphere(validatedBody, errors);
  
  // Appliquer les règles de validation personnalisées
  applyCustomRules(validatedBody, 'celestial_body', errors, warnings, infos);
  
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
  if (opts.enableCache && body && body.id) {
    validationCache.set(cacheKey, result);
  }
  
  return result;
}

/**
 * Valide les propriétés physiques d'un corps céleste
 * @private
 * @param {Object} body - Corps céleste à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
function validatePhysicalProperties(body, errors) {
  const physical = getNestedValue(body, 'physical', null);
  
  if (physical === null) {
    errors.push(formatError(
      "Champ 'physical' manquant",
      'physical',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (typeof physical !== 'object') {
    errors.push(formatError(
      "Le champ 'physical' doit être un objet",
      'physical',
      ERROR_CODES.INVALID_TYPE
    ));
  } else {
    const physicalFields = ['radius', 'mass', 'gravity'];
      
    physicalFields.forEach(field => {
      const value = getNestedValue(physical, field, null);
      
      if (value === null) {
        errors.push(formatError(
          `Champ physique obligatoire manquant: '${field}'`,
          `physical.${field}`,
          ERROR_CODES.REQUIRED_FIELD_MISSING
        ));
      } else if (typeof value !== 'number') {
        errors.push(formatError(
          `Le champ physique '${field}' doit être un nombre`,
          `physical.${field}`,
          ERROR_CODES.INVALID_TYPE
        ));
      } else if (value < 0) {
        errors.push(formatError(
          `Le champ physique '${field}' ne peut pas être négatif`,
          `physical.${field}`,
          ERROR_CODES.INVALID_VALUE
        ));
      }
    });
  }
}

/**
 * Valide l'orbite d'un corps céleste
 * @private
 * @param {Object} body - Corps céleste à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
function validateOrbit(body, errors) {
  const orbit = getNestedValue(body, 'orbit', null);
  
  if (orbit === null) {
    errors.push(formatError(
      "Champ 'orbit' manquant pour un corps orbital",
      'orbit',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (typeof orbit !== 'object') {
    errors.push(formatError(
      "Le champ 'orbit' doit être un objet",
      'orbit',
      ERROR_CODES.INVALID_TYPE
    ));
  } else {
    const orbitFields = ['semiMajorAxis', 'eccentricity', 'inclination', 'orbitalPeriod'];
    
    orbitFields.forEach(field => {
      const value = getNestedValue(orbit, field, null);
      
      if (value === null) {
        errors.push(formatError(
          `Champ orbital obligatoire manquant: '${field}'`,
          `orbit.${field}`,
          ERROR_CODES.REQUIRED_FIELD_MISSING
        ));
      } else if (typeof value !== 'number') {
        errors.push(formatError(
          `Le champ orbital '${field}' doit être un nombre`,
          `orbit.${field}`,
          ERROR_CODES.INVALID_TYPE
        ));
      }
    });
  }
}

/**
 * Valide l'atmosphère d'un corps céleste
 * @private
 * @param {Object} body - Corps céleste à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
function validateAtmosphere(body, errors) {
  const atmosphere = getNestedValue(body, 'atmosphere', null);
  
  if (atmosphere && getNestedValue(atmosphere, 'present', false) === true) {
    if (typeof atmosphere !== 'object') {
      errors.push(formatError(
        "Le champ 'atmosphere' doit être un objet",
        'atmosphere',
        ERROR_CODES.INVALID_TYPE
      ));
    } else {
      const atmosphereFields = ['height', 'pressure', 'temperatureASL'];
      
      atmosphereFields.forEach(field => {
        const value = getNestedValue(atmosphere, field, null);
        
        if (value === null) {
          errors.push(formatError(
            `Champ atmosphérique obligatoire manquant: '${field}'`,
            `atmosphere.${field}`,
            ERROR_CODES.REQUIRED_FIELD_MISSING
          ));
        } else if (typeof value !== 'number') {
          errors.push(formatError(
            `Le champ atmosphérique '${field}' doit être un nombre`,
            `atmosphere.${field}`,
            ERROR_CODES.INVALID_TYPE
          ));
        }
      });
    }
  }
}