/**
 * @fileoverview Validateur spécifique pour les moteurs
 * @module api/utils/datavalidator/helpers/engineValidator
 */

import { getNestedValue } from '../../../../utils/SafeAccess.js';
import { ERROR_CODES, ERROR_TYPES } from '../constants.js';
import { formatError } from '../formatters.js';

/**
 * Valide un moteur
 * @param {Object} engine - Moteur à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 * @param {Array} infos - Tableau des informations à remplir
 */
export function validateEngine(engine, errors, warnings, infos) {
  // Champs spécifiques aux moteurs
  validateEngineType(engine, errors);
  validateEngineThrust(engine, errors);
  validateEngineIsp(engine, errors);
  validateEnginePropellants(engine, errors, warnings);
}

/**
 * Valide le type de moteur
 * @param {Object} engine - Moteur à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
export function validateEngineType(engine, errors) {
  const engineType = getNestedValue(engine, 'engineType', null);
  
  if (engineType === null) {
    errors.push(formatError(
      "Moteur: Champ 'engineType' manquant",
      'engineType',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (typeof engineType !== 'string') {
    errors.push(formatError(
      "Moteur: Le champ 'engineType' doit être une chaîne de caractères",
      'engineType',
      ERROR_CODES.INVALID_TYPE
    ));
  }
}

/**
 * Valide la poussée du moteur
 * @param {Object} engine - Moteur à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
export function validateEngineThrust(engine, errors) {
  const thrust = getNestedValue(engine, 'thrust', null);
  
  if (thrust === null) {
    errors.push(formatError(
      "Moteur: Champ 'thrust' manquant",
      'thrust',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (typeof thrust !== 'object') {
    errors.push(formatError(
      "Moteur: Le champ 'thrust' doit être un objet",
      'thrust',
      ERROR_CODES.INVALID_TYPE
    ));
  } else {
    const vacuum = getNestedValue(thrust, 'vacuum', null);
    
    if (vacuum === null) {
      errors.push(formatError(
        "Moteur: Champ 'thrust.vacuum' manquant",
        'thrust.vacuum',
        ERROR_CODES.REQUIRED_FIELD_MISSING
      ));
    } else if (typeof vacuum !== 'number') {
      errors.push(formatError(
        "Moteur: Le champ 'thrust.vacuum' doit être un nombre",
        'thrust.vacuum',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (vacuum <= 0) {
      errors.push(formatError(
        "Moteur: Le champ 'thrust.vacuum' doit être positif",
        'thrust.vacuum',
        ERROR_CODES.INVALID_VALUE
      ));
    }
    
    const atmosphere = getNestedValue(thrust, 'atmosphere', null);
    
    if (atmosphere === null) {
      errors.push(formatError(
        "Moteur: Champ 'thrust.atmosphere' manquant",
        'thrust.atmosphere',
        ERROR_CODES.REQUIRED_FIELD_MISSING
      ));
    } else if (typeof atmosphere !== 'number') {
      errors.push(formatError(
        "Moteur: Le champ 'thrust.atmosphere' doit être un nombre",
        'thrust.atmosphere',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (atmosphere < 0) {
      errors.push(formatError(
        "Moteur: Le champ 'thrust.atmosphere' ne peut pas être négatif",
        'thrust.atmosphere',
        ERROR_CODES.INVALID_VALUE
      ));
    }
  }
}

/**
 * Valide l'ISP du moteur
 * @param {Object} engine - Moteur à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
export function validateEngineIsp(engine, errors) {
  const isp = getNestedValue(engine, 'isp', null);
  
  if (isp === null) {
    errors.push(formatError(
      "Moteur: Champ 'isp' manquant",
      'isp',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (typeof isp !== 'object') {
    errors.push(formatError(
      "Moteur: Le champ 'isp' doit être un objet",
      'isp',
      ERROR_CODES.INVALID_TYPE
    ));
  } else {
    const vacuum = getNestedValue(isp, 'vacuum', null);
    
    if (vacuum === null) {
      errors.push(formatError(
        "Moteur: Champ 'isp.vacuum' manquant",
        'isp.vacuum',
        ERROR_CODES.REQUIRED_FIELD_MISSING
      ));
    } else if (typeof vacuum !== 'number') {
      errors.push(formatError(
        "Moteur: Le champ 'isp.vacuum' doit être un nombre",
        'isp.vacuum',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (vacuum <= 0) {
      errors.push(formatError(
        "Moteur: Le champ 'isp.vacuum' doit être positif",
        'isp.vacuum',
        ERROR_CODES.INVALID_VALUE
      ));
    }
    
    const atmosphere = getNestedValue(isp, 'atmosphere', null);
    
    if (atmosphere === null) {
      errors.push(formatError(
        "Moteur: Champ 'isp.atmosphere' manquant",
        'isp.atmosphere',
        ERROR_CODES.REQUIRED_FIELD_MISSING
      ));
    } else if (typeof atmosphere !== 'number') {
      errors.push(formatError(
        "Moteur: Le champ 'isp.atmosphere' doit être un nombre",
        'isp.atmosphere',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (atmosphere < 0) {
      errors.push(formatError(
        "Moteur: Le champ 'isp.atmosphere' ne peut pas être négatif",
        'isp.atmosphere',
        ERROR_CODES.INVALID_VALUE
      ));
    }
  }
}

/**
 * Valide les propergols du moteur
 * @param {Object} engine - Moteur à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validateEnginePropellants(engine, errors, warnings) {
  const propellants = getNestedValue(engine, 'propellants', null);
  
  if (propellants === null) {
    errors.push(formatError(
      "Moteur: Champ 'propellants' manquant",
      'propellants',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (!Array.isArray(propellants)) {
    errors.push(formatError(
      "Moteur: Le champ 'propellants' doit être un tableau",
      'propellants',
      ERROR_CODES.INVALID_TYPE
    ));
  } else if (propellants.length === 0) {
    errors.push(formatError(
      "Moteur: Le tableau 'propellants' ne peut pas être vide",
      'propellants',
      ERROR_CODES.INVALID_VALUE
    ));
  } else {
    propellants.forEach((propellant, index) => {
      if (!propellant) {
        warnings.push(formatError(
          `Moteur: Propergol à l'index ${index} est null ou undefined`,
          `propellants[${index}]`,
          ERROR_CODES.INVALID_VALUE,
          ERROR_TYPES.WARNING
        ));
        return;
      }
      
      const type = getNestedValue(propellant, 'type', null);
      
      if (type === null) {
        errors.push(formatError(
          `Moteur: Propergol à l'index ${index}: Champ 'type' manquant`,
          `propellants[${index}].type`,
          ERROR_CODES.REQUIRED_FIELD_MISSING
        ));
      } else if (typeof type !== 'string') {
        errors.push(formatError(
          `Moteur: Propergol à l'index ${index}: Le champ 'type' doit être une chaîne de caractères`,
          `propellants[${index}].type`,
          ERROR_CODES.INVALID_TYPE
        ));
      }
      
      const ratio = getNestedValue(propellant, 'ratio', null);
      
      if (ratio === null) {
        errors.push(formatError(
          `Moteur: Propergol à l'index ${index}: Champ 'ratio' manquant`,
          `propellants[${index}].ratio`,
          ERROR_CODES.REQUIRED_FIELD_MISSING
        ));
      } else if (typeof ratio !== 'number') {
        errors.push(formatError(
          `Moteur: Propergol à l'index ${index}: Le champ 'ratio' doit être un nombre`,
          `propellants[${index}].ratio`,
          ERROR_CODES.INVALID_TYPE
        ));
      } else if (ratio <= 0) {
        errors.push(formatError(
          `Moteur: Propergol à l'index ${index}: Le champ 'ratio' doit être positif`,
          `propellants[${index}].ratio`,
          ERROR_CODES.INVALID_VALUE
        ));
      }
    });
    
    // Vérifier que la somme des ratios est égale à 1
    const totalRatio = propellants.reduce((sum, propellant) => {
      const ratio = getNestedValue(propellant, 'ratio', 0);
      return sum + (typeof ratio === 'number' ? ratio : 0);
    }, 0);
    
    if (Math.abs(totalRatio - 1) > 0.001) {
      warnings.push(formatError(
        `Moteur: La somme des ratios de propergols (${totalRatio.toFixed(3)}) devrait être égale à 1`,
        'propellants',
        ERROR_CODES.CONSTRAINT_VIOLATION,
        ERROR_TYPES.WARNING
      ));
    }
  }
}