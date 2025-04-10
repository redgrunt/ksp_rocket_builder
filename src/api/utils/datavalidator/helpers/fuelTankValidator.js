/**
 * @fileoverview Validateur spécifique pour les réservoirs de carburant
 * @module api/utils/datavalidator/helpers/fuelTankValidator
 */

import { getNestedValue } from '../../../../utils/SafeAccess.js';
import { ERROR_CODES, ERROR_TYPES } from '../constants.js';
import { formatError } from '../formatters.js';

/**
 * Valide un réservoir de carburant
 * @param {Object} tank - Réservoir à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 * @param {Array} infos - Tableau des informations à remplir
 */
export function validateFuelTank(tank, errors, warnings, infos) {
  validateTankType(tank, errors);
  validateTankResources(tank, errors, warnings);
  validateTankVolume(tank, errors, warnings);
}

/**
 * Valide le type de réservoir
 * @param {Object} tank - Réservoir à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
export function validateTankType(tank, errors) {
  const tankType = getNestedValue(tank, 'tankType', null);
  
  if (tankType === null) {
    errors.push(formatError(
      "Réservoir: Champ 'tankType' manquant",
      'tankType',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (typeof tankType !== 'string') {
    errors.push(formatError(
      "Réservoir: Le champ 'tankType' doit être une chaîne de caractères",
      'tankType',
      ERROR_CODES.INVALID_TYPE
    ));
  }
}

/**
 * Valide les ressources du réservoir
 * @param {Object} tank - Réservoir à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validateTankResources(tank, errors, warnings) {
  const resources = getNestedValue(tank, 'resources', null);
  
  if (resources === null) {
    errors.push(formatError(
      "Réservoir: Champ 'resources' manquant",
      'resources',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (!Array.isArray(resources)) {
    errors.push(formatError(
      "Réservoir: Le champ 'resources' doit être un tableau",
      'resources',
      ERROR_CODES.INVALID_TYPE
    ));
  } else if (resources.length === 0) {
    warnings.push(formatError(
      "Réservoir: Le tableau 'resources' est vide",
      'resources',
      ERROR_CODES.UNUSUAL_VALUE,
      ERROR_TYPES.WARNING
    ));
  }
}

/**
 * Valide le volume du réservoir
 * @param {Object} tank - Réservoir à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validateTankVolume(tank, errors, warnings) {
  const volume = getNestedValue(tank, 'volume', null);
  
  if (volume !== null) {
    if (typeof volume !== 'number') {
      errors.push(formatError(
        "Réservoir: Le champ 'volume' doit être un nombre",
        'volume',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (volume <= 0) {
      errors.push(formatError(
        "Réservoir: Le champ 'volume' doit être positif",
        'volume',
        ERROR_CODES.INVALID_VALUE
      ));
    }
    
    // Vérification de l'utilisation du volume
    const resources = getNestedValue(tank, 'resources', []);
    if (Array.isArray(resources) && resources.length > 0) {
      const totalCapacity = resources.reduce((sum, resource) => {
        const maxAmount = getNestedValue(resource, 'maxAmount', 0);
        return sum + (typeof maxAmount === 'number' ? maxAmount : 0);
      }, 0);
      
      // Vérifier si la capacité totale correspond au volume
      if (totalCapacity > 0 && Math.abs(totalCapacity - volume) > 0.001) {
        warnings.push(formatError(
          `Réservoir: La capacité totale des ressources (${totalCapacity.toFixed(3)}) ne correspond pas au volume déclaré (${volume.toFixed(3)})`,
          'volume',
          ERROR_CODES.CONSTRAINT_VIOLATION,
          ERROR_TYPES.WARNING
        ));
      }
    }
  }
}