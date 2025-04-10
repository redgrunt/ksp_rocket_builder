/**
 * @fileoverview Validateur spécifique pour les modules de commande
 * @module api/utils/datavalidator/helpers/commandValidator
 */

import { getNestedValue } from '../../../../utils/SafeAccess.js';
import { ERROR_CODES, ERROR_TYPES } from '../constants.js';
import { formatError } from '../formatters.js';

/**
 * Valide un module de commande
 * @param {Object} command - Module de commande à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 * @param {Array} infos - Tableau des informations à remplir
 */
export function validateCommand(command, errors, warnings, infos) {
  validateCrewCapacity(command, errors);
  validateCommandModules(command, errors, warnings);
  validateElectricalResources(command, warnings);
}

/**
 * Valide la capacité d'équipage
 * @param {Object} command - Module de commande à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
export function validateCrewCapacity(command, errors) {
  const crewCapacity = getNestedValue(command, 'crewCapacity', null);
  
  if (crewCapacity === null) {
    errors.push(formatError(
      "Module de commande: Champ 'crewCapacity' manquant",
      'crewCapacity',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (typeof crewCapacity !== 'number' || !Number.isInteger(crewCapacity)) {
    errors.push(formatError(
      "Module de commande: Le champ 'crewCapacity' doit être un entier",
      'crewCapacity',
      ERROR_CODES.INVALID_TYPE
    ));
  } else if (crewCapacity < 0) {
    errors.push(formatError(
      "Module de commande: Le champ 'crewCapacity' ne peut pas être négatif",
      'crewCapacity',
      ERROR_CODES.INVALID_VALUE
    ));
  }
}

/**
 * Valide les modules du module de commande
 * @param {Object} command - Module de commande à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validateCommandModules(command, errors, warnings) {
  const modules = getNestedValue(command, 'modules', null);
  
  if (modules === null) {
    errors.push(formatError(
      "Module de commande: Champ 'modules' manquant",
      'modules',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (!Array.isArray(modules)) {
    errors.push(formatError(
      "Module de commande: Le champ 'modules' doit être un tableau",
      'modules',
      ERROR_CODES.INVALID_TYPE
    ));
  } else {
    // Vérifier la présence de modules requis
    const moduleNames = modules.map(module => getNestedValue(module, 'name', '')).filter(name => name);
    
    if (!moduleNames.includes('ModuleSAS')) {
      warnings.push(formatError(
        "Module de commande: Le module 'ModuleSAS' est généralement requis",
        'modules',
        ERROR_CODES.UNUSUAL_VALUE,
        ERROR_TYPES.WARNING
      ));
    }
    
    if (!moduleNames.includes('ModuleReactionWheel')) {
      warnings.push(formatError(
        "Module de commande: Le module 'ModuleReactionWheel' est généralement requis",
        'modules',
        ERROR_CODES.UNUSUAL_VALUE,
        ERROR_TYPES.WARNING
      ));
    }
    
    const crewCapacity = getNestedValue(command, 'crewCapacity', 0);
    if (crewCapacity > 0 && !moduleNames.includes('ModuleCommand')) {
      errors.push(formatError(
        "Module de commande avec équipage: Le module 'ModuleCommand' est requis",
        'modules',
        ERROR_CODES.REQUIRED_FIELD_MISSING
      ));
    }
  }
}

/**
 * Valide la présence de ressources électriques
 * @param {Object} command - Module de commande à valider
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validateElectricalResources(command, warnings) {
  const resources = getNestedValue(command, 'resources', []);
  const hasElectricalResource = Array.isArray(resources) && 
    resources.some(resource => {
      const resourceType = getNestedValue(resource, 'type', '');
      return resourceType === 'ElectricCharge' || resourceType === 'Electricity';
    });
  
  if (!hasElectricalResource) {
    warnings.push(formatError(
      "Module de commande: Aucune ressource électrique trouvée",
      'resources',
      ERROR_CODES.UNUSUAL_VALUE,
      ERROR_TYPES.WARNING
    ));
  }
}