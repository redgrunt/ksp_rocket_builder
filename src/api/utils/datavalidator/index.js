/**
 * @fileoverview Point d'entrée du système de validation de données
 * @module api/utils/datavalidator
 */

import DataValidator from './DataValidator.js';
import { ERROR_CODES, ERROR_TYPES, VALIDATION_TYPES } from './constants.js';
import { formatError, formatValidationResult, formatReferenceError, validationResultToString } from './formatters.js';

// Exporter une instance singleton du DataValidator
const dataValidator = new DataValidator();

export {
  dataValidator as default,
  DataValidator,
  ERROR_CODES,
  ERROR_TYPES,
  VALIDATION_TYPES,
  formatError,
  formatValidationResult,
  formatReferenceError,
  validationResultToString
};

/**
 * Initialise et configure une instance de DataValidator avec les options par défaut
 * @param {Object} options - Options de configuration
 * @returns {DataValidator} Instance configurée du DataValidator
 */
export function createDataValidator(options = {}) {
  const validator = new DataValidator();
  
  // Configurer les options par défaut
  if (options.enableCache !== undefined) {
    validator.defaultOptions.enableCache = !!options.enableCache;
  }
  
  if (options.validateReferences !== undefined) {
    validator.defaultOptions.validateReferences = !!options.validateReferences;
  }
  
  if (options.strictMode !== undefined) {
    validator.defaultOptions.strictMode = !!options.strictMode;
  }
  
  if (options.autoFix !== undefined) {
    validator.defaultOptions.autoFix = !!options.autoFix;
  }
  
  if (options.maxErrors !== undefined && typeof options.maxErrors === 'number') {
    validator.defaultOptions.maxErrors = Math.max(0, options.maxErrors);
  }
  
  if (options.includeWarnings !== undefined) {
    validator.defaultOptions.includeWarnings = !!options.includeWarnings;
  }
  
  if (options.includeInfo !== undefined) {
    validator.defaultOptions.includeInfo = !!options.includeInfo;
  }
  
  return validator;
}

/**
 * Fonction utilitaire pour valider un objet selon son type
 * @param {Object} obj - Objet à valider
 * @param {string} type - Type de l'objet (voir VALIDATION_TYPES)
 * @param {Object} [options={}] - Options de validation
 * @returns {Object} Résultat de la validation
 */
export function validate(obj, type, options = {}) {
  switch (type) {
    case VALIDATION_TYPES.PART:
      return dataValidator.validatePart(obj, options);
    
    case VALIDATION_TYPES.CELESTIAL_BODY:
      return dataValidator.validateCelestialBody(obj, options);
    
    case VALIDATION_TYPES.RESOURCE:
      return dataValidator.validateResource(obj, options);
    
    case VALIDATION_TYPES.TECH:
      return dataValidator.validateTech(obj, options);
    
    default:
      return {
        valid: false,
        errors: [
          formatError(
            `Type de validation non pris en charge: ${type}`,
            '',
            ERROR_CODES.INVALID_VALUE
          )
        ],
        warnings: [],
        infos: []
      };
  }
}

/**
 * Fonction utilitaire pour valider un tableau d'objets selon leur type
 * @param {Array} objects - Tableau d'objets à valider
 * @param {string} type - Type des objets (voir VALIDATION_TYPES)
 * @param {Object} [options={}] - Options de validation
 * @returns {Object} Résultat de la validation avec agrégation des erreurs
 */
export function validateMany(objects, type, options = {}) {
  if (!Array.isArray(objects)) {
    return {
      valid: false,
      errors: [
        formatError(
          'Le paramètre "objects" doit être un tableau',
          '',
          ERROR_CODES.INVALID_TYPE
        )
      ],
      warnings: [],
      infos: []
    };
  }
  
  const allErrors = [];
  const allWarnings = [];
  const allInfos = [];
  let valid = true;
  
  objects.forEach((obj, index) => {
    const result = validate(obj, type, options);
    
    if (!result.valid) {
      valid = false;
    }
    
    // Ajouter l'index à chaque erreur pour identifier l'objet source
    result.errors.forEach(error => {
      const path = error.path ? `[${index}].${error.path}` : `[${index}]`;
      
      allErrors.push({
        ...error,
        path,
        details: {
          ...error.details,
          index
        }
      });
    });
    
    // Même chose pour les avertissements
    if (options.includeWarnings !== false) {
      result.warnings.forEach(warning => {
        const path = warning.path ? `[${index}].${warning.path}` : `[${index}]`;
        
        allWarnings.push({
          ...warning,
          path,
          details: {
            ...warning.details,
            index
          }
        });
      });
    }
    
    // Et pour les informations
    if (options.includeInfo !== false) {
      result.infos.forEach(info => {
        const path = info.path ? `[${index}].${info.path}` : `[${index}]`;
        
        allInfos.push({
          ...info,
          path,
          details: {
            ...info.details,
            index
          }
        });
      });
    }
  });
  
  return {
    valid,
    errors: allErrors,
    warnings: allWarnings,
    infos: allInfos,
    totalCount: objects.length,
    timestamp: new Date().toISOString()
  };
}
