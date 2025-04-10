/**
 * @fileoverview Validateur pour les pièces
 * @module api/utils/datavalidator/validators/part
 */

import { getNestedValue, validateRequiredProps, applyDefaults } from '../../../../utils/SafeAccess.js';
import { ERROR_CODES, ERROR_TYPES } from '../constants.js';
import { formatError } from '../formatters.js';
import { validateEngine } from '../helpers/engineValidator.js';
import { validateFuelTank } from '../helpers/fuelTankValidator.js';
import { validateCommand } from '../helpers/commandValidator.js';

/**
 * Valide une pièce
 * @param {Object} part - Pièce à valider
 * @param {Map} validationCache - Cache de validation
 * @param {Object} defaultOptions - Options par défaut
 * @param {Function} applyCustomRules - Fonction pour appliquer les règles personnalisées
 * @param {Function} validateType - Fonction de validation de type
 * @param {Object} options - Options spécifiques à cette validation
 * @returns {Object} - Résultat de la validation {valid, errors, warnings, infos}
 */
export function validatePart(part, validationCache, defaultOptions, applyCustomRules, validateType, options = {}) {
  // Fusion avec les options par défaut
  const opts = { ...defaultOptions, ...options };
  
  // Vérifier le cache si activé
  const cacheKey = part ? `part_${part.id || 'undefined'}` : 'part_undefined';
  if (opts.enableCache && validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }

  const errors = [];
  const warnings = [];
  const infos = [];
  
  if (!part) {
    errors.push(formatError(
      'Pièce non définie',
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
  let validatedPart = part;
  if (opts.autoFix) {
    validatedPart = applyDefaults(part, {
      name: `Part_${part.id || 'unknown'}`,
      title: part.name || `Pièce ${part.id || 'inconnue'}`,
      category: 'unknown',
      mass: { dry: 0, wet: 0 },
      cost: 0,
      attachNodes: [],
      attachRules: { stack: true, srfAttach: false },
      resources: []
    });
  }
  
  // Validation des champs obligatoires
  const requiredFields = ['id', 'name', 'category', 'mass'];
  const requiredProps = validateRequiredProps(validatedPart, requiredFields);
  
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
  validateType(validatedPart, 'id', 'string', errors);
  validateType(validatedPart, 'name', 'string', errors);
  validateType(validatedPart, 'category', 'string', errors);
  validateType(validatedPart, 'cost', 'number', errors);
  
  // Validation de la masse
  validatePartMass(validatedPart, errors, warnings);
  
  // Validation spécifique selon la catégorie
  const category = getNestedValue(validatedPart, 'category', '');
  
  if (category === 'engines') {
    validateEngine(validatedPart, errors, warnings, infos);
  } else if (category === 'fuel_tanks') {
    validateFuelTank(validatedPart, errors, warnings, infos);
  } else if (category === 'command') {
    validateCommand(validatedPart, errors, warnings, infos);
  }
  
  // Validation des nœuds d'attachement
  validateAttachNodes(validatedPart, errors, warnings);
  
  // Validation des règles d'attachement
  validateAttachRules(validatedPart, errors);
  
  // Validation des ressources
  validateResources(validatedPart, errors, warnings);
  
  // Validation des modules
  validateModules(validatedPart, errors, warnings);
  
  // Validation de la technologie requise
  validateTechRequired(validatedPart, errors);
  
  // Appliquer les règles de validation personnalisées
  applyCustomRules(validatedPart, 'part', errors, warnings, infos);
  
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
  if (opts.enableCache && validatedPart && validatedPart.id) {
    validationCache.set(cacheKey, result);
  }
  
  return result;
}

/**
 * Valide la masse d'une pièce
 * @private
 * @param {Object} part - Pièce à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
function validatePartMass(part, errors, warnings) {
  const mass = getNestedValue(part, 'mass', null);
  
  if (mass === null) {
    errors.push(formatError(
      "Champ 'mass' manquant",
      'mass',
      ERROR_CODES.REQUIRED_FIELD_MISSING
    ));
  } else if (typeof mass !== 'object') {
    errors.push(formatError(
      "Le champ 'mass' doit être un objet",
      'mass',
      ERROR_CODES.INVALID_TYPE
    ));
  } else {
    // Vérification de la masse à sec
    const dry = getNestedValue(mass, 'dry', null);
    
    if (dry === null) {
      errors.push(formatError(
        "Champ 'mass.dry' manquant",
        'mass.dry',
        ERROR_CODES.REQUIRED_FIELD_MISSING
      ));
    } else if (typeof dry !== 'number') {
      errors.push(formatError(
        "Le champ 'mass.dry' doit être un nombre",
        'mass.dry',
        ERROR_CODES.INVALID_TYPE
      ));
    } else if (dry < 0) {
      errors.push(formatError(
        "Le champ 'mass.dry' ne peut pas être négatif",
        'mass.dry',
        ERROR_CODES.INVALID_VALUE
      ));
    }
    
    // Vérification de la masse humide (si présente)
    const wet = getNestedValue(mass, 'wet', null);
    
    if (wet !== null) {
      if (typeof wet !== 'number') {
        errors.push(formatError(
          "Le champ 'mass.wet' doit être un nombre",
          'mass.wet',
          ERROR_CODES.INVALID_TYPE
        ));
      } else if (wet < dry) {
        warnings.push(formatError(
          "Le champ 'mass.wet' est inférieur à 'mass.dry'",
          'mass.wet',
          ERROR_CODES.INVALID_VALUE,
          ERROR_TYPES.WARNING
        ));
      }
    }
  }
}

/**
 * Valide les nœuds d'attachement d'une pièce
 * @private
 * @param {Object} part - Pièce à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
function validateAttachNodes(part, errors, warnings) {
  const attachNodes = getNestedValue(part, 'attachNodes', null);
  
  if (attachNodes !== null) {
    if (!Array.isArray(attachNodes)) {
      errors.push(formatError(
        "Le champ 'attachNodes' doit être un tableau",
        'attachNodes',
        ERROR_CODES.INVALID_TYPE
      ));
    } else {
      attachNodes.forEach((node, index) => {
        if (!node) {
          warnings.push(formatError(
            `Nœud d'attachement à l'index ${index} est null ou undefined`,
            `attachNodes[${index}]`,
            ERROR_CODES.INVALID_VALUE,
            ERROR_TYPES.WARNING
          ));
          return;
        }
        
        const nodeId = getNestedValue(node, 'id', null);
        
        if (nodeId === null) {
          errors.push(formatError(
            `Nœud d'attachement à l'index ${index}: Champ 'id' manquant`,
            `attachNodes[${index}].id`,
            ERROR_CODES.REQUIRED_FIELD_MISSING
          ));
        } else if (typeof nodeId !== 'string') {
          errors.push(formatError(
            `Nœud d'attachement à l'index ${index}: Le champ 'id' doit être une chaîne de caractères`,
            `attachNodes[${index}].id`,
            ERROR_CODES.INVALID_TYPE
          ));
        }
        
        const position = getNestedValue(node, 'position', null);
        
        if (position === null) {
          errors.push(formatError(
            `Nœud d'attachement à l'index ${index}: Champ 'position' manquant`,
            `attachNodes[${index}].position`,
            ERROR_CODES.REQUIRED_FIELD_MISSING
          ));
        } else if (!Array.isArray(position) || position.length !== 3) {
          errors.push(formatError(
            `Nœud d'attachement à l'index ${index}: Le champ 'position' doit être un tableau de 3 nombres`,
            `attachNodes[${index}].position`,
            ERROR_CODES.INVALID_TYPE
          ));
        } else {
          position.forEach((coord, coordIndex) => {
            if (typeof coord !== 'number') {
              errors.push(formatError(
                `Nœud d'attachement à l'index ${index}: La coordonnée ${coordIndex} de 'position' doit être un nombre`,
                `attachNodes[${index}].position[${coordIndex}]`,
                ERROR_CODES.INVALID_TYPE
              ));
            }
          });
        }
        
        const orientation = getNestedValue(node, 'orientation', null);
        
        if (orientation === null) {
          errors.push(formatError(
            `Nœud d'attachement à l'index ${index}: Champ 'orientation' manquant`,
            `attachNodes[${index}].orientation`,
            ERROR_CODES.REQUIRED_FIELD_MISSING
          ));
        } else if (!Array.isArray(orientation) || orientation.length !== 3) {
          errors.push(formatError(
            `Nœud d'attachement à l'index ${index}: Le champ 'orientation' doit être un tableau de 3 nombres`,
            `attachNodes[${index}].orientation`,
            ERROR_CODES.INVALID_TYPE
          ));
        } else {
          orientation.forEach((coord, coordIndex) => {
            if (typeof coord !== 'number') {
              errors.push(formatError(
                `Nœud d'attachement à l'index ${index}: La coordonnée ${coordIndex} de 'orientation' doit être un nombre`,
                `attachNodes[${index}].orientation[${coordIndex}]`,
                ERROR_CODES.INVALID_TYPE
              ));
            }
          });
          
          // Vérifier que le vecteur est normalisé (longueur ~ 1)
          const length = Math.sqrt(
            orientation[0] * orientation[0] + 
            orientation[1] * orientation[1] + 
            orientation[2] * orientation[2]
          );
          
          if (Math.abs(length - 1) > 0.01) {
            warnings.push(formatError(
              `Nœud d'attachement à l'index ${index}: Le vecteur 'orientation' n'est pas normalisé (longueur = ${length.toFixed(3)})`,
              `attachNodes[${index}].orientation`,
              ERROR_CODES.UNUSUAL_VALUE,
              ERROR_TYPES.WARNING
            ));
          }
        }
      });
    }
  }
}

/**
 * Valide les règles d'attachement d'une pièce
 * @private
 * @param {Object} part - Pièce à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
function validateAttachRules(part, errors) {
  const attachRules = getNestedValue(part, 'attachRules', null);
  
  if (attachRules !== null) {
    if (typeof attachRules !== 'object') {
      errors.push(formatError(
        "Le champ 'attachRules' doit être un objet",
        'attachRules',
        ERROR_CODES.INVALID_TYPE
      ));
    } else {
      const booleanProps = ['stack', 'srfAttach', 'allowStack', 'allowSrfAttach', 'allowCollision'];
      
      booleanProps.forEach(prop => {
        const value = getNestedValue(attachRules, prop, null);
        
        if (value !== null && typeof value !== 'boolean') {
          errors.push(formatError(
            `Le champ 'attachRules.${prop}' doit être un booléen`,
            `attachRules.${prop}`,
            ERROR_CODES.INVALID_TYPE
          ));
        }
      });
    }
  }
}

/**
 * Valide les ressources d'une pièce
 * @private
 * @param {Object} part - Pièce à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
function validateResources(part, errors, warnings) {
  const resources = getNestedValue(part, 'resources', null);
  
  if (resources !== null) {
    if (!Array.isArray(resources)) {
      errors.push(formatError(
        "Le champ 'resources' doit être un tableau",
        'resources',
        ERROR_CODES.INVALID_TYPE
      ));
    } else {
      resources.forEach((resource, index) => {
        if (!resource) {
          warnings.push(formatError(
            `Ressource à l'index ${index} est null ou undefined`,
            `resources[${index}]`,
            ERROR_CODES.INVALID_VALUE,
            ERROR_TYPES.WARNING
          ));
          return;
        }
        
        const type = getNestedValue(resource, 'type', null);
        
        if (type === null) {
          errors.push(formatError(
            `Ressource à l'index ${index}: Champ 'type' manquant`,
            `resources[${index}].type`,
            ERROR_CODES.REQUIRED_FIELD_MISSING
          ));
        } else if (typeof type !== 'string') {
          errors.push(formatError(
            `Ressource à l'index ${index}: Le champ 'type' doit être une chaîne de caractères`,
            `resources[${index}].type`,
            ERROR_CODES.INVALID_TYPE
          ));
        }
        
        const amount = getNestedValue(resource, 'amount', null);
        
        if (amount === null) {
          errors.push(formatError(
            `Ressource à l'index ${index}: Champ 'amount' manquant`,
            `resources[${index}].amount`,
            ERROR_CODES.REQUIRED_FIELD_MISSING
          ));
        } else if (typeof amount !== 'number') {
          errors.push(formatError(
            `Ressource à l'index ${index}: Le champ 'amount' doit être un nombre`,
            `resources[${index}].amount`,
            ERROR_CODES.INVALID_TYPE
          ));
        } else if (amount < 0) {
          errors.push(formatError(
            `Ressource à l'index ${index}: Le champ 'amount' ne peut pas être négatif`,
            `resources[${index}].amount`,
            ERROR_CODES.INVALID_VALUE
          ));
        }
        
        const maxAmount = getNestedValue(resource, 'maxAmount', null);
        
        if (maxAmount === null) {
          errors.push(formatError(
            `Ressource à l'index ${index}: Champ 'maxAmount' manquant`,
            `resources[${index}].maxAmount`,
            ERROR_CODES.REQUIRED_FIELD_MISSING
          ));
        } else if (typeof maxAmount !== 'number') {
          errors.push(formatError(
            `Ressource à l'index ${index}: Le champ 'maxAmount' doit être un nombre`,
            `resources[${index}].maxAmount`,
            ERROR_CODES.INVALID_TYPE
          ));
        } else if (maxAmount < 0) {
          errors.push(formatError(
            `Ressource à l'index ${index}: Le champ 'maxAmount' ne peut pas être négatif`,
            `resources[${index}].maxAmount`,
            ERROR_CODES.INVALID_VALUE
          ));
        } else if (amount > maxAmount) {
          errors.push(formatError(
            `Ressource à l'index ${index}: Le champ 'amount' (${amount}) est supérieur à 'maxAmount' (${maxAmount})`,
            `resources[${index}].amount`,
            ERROR_CODES.CONSTRAINT_VIOLATION
          ));
        }
      });
    }
  }
}

/**
 * Valide les modules d'une pièce
 * @private
 * @param {Object} part - Pièce à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
function validateModules(part, errors, warnings) {
  const modules = getNestedValue(part, 'modules', null);
  
  if (modules !== null) {
    if (!Array.isArray(modules)) {
      errors.push(formatError(
        "Le champ 'modules' doit être un tableau",
        'modules',
        ERROR_CODES.INVALID_TYPE
      ));
    } else {
      modules.forEach((module, index) => {
        if (!module) {
          warnings.push(formatError(
            `Module à l'index ${index} est null ou undefined`,
            `modules[${index}]`,
            ERROR_CODES.INVALID_VALUE,
            ERROR_TYPES.WARNING
          ));
          return;
        }
        
        const name = getNestedValue(module, 'name', null);
        
        if (name === null) {
          errors.push(formatError(
            `Module à l'index ${index}: Champ 'name' manquant`,
            `modules[${index}].name`,
            ERROR_CODES.REQUIRED_FIELD_MISSING
          ));
        } else if (typeof name !== 'string') {
          errors.push(formatError(
            `Module à l'index ${index}: Le champ 'name' doit être une chaîne de caractères`,
            `modules[${index}].name`,
            ERROR_CODES.INVALID_TYPE
          ));
        }
        
        // Vérifier les paramètres du module si présents
        const params = getNestedValue(module, 'params', null);
        
        if (params !== null && typeof params !== 'object') {
          errors.push(formatError(
            `Module à l'index ${index}: Le champ 'params' doit être un objet`,
            `modules[${index}].params`,
            ERROR_CODES.INVALID_TYPE
          ));
        }
      });
    }
  }
}

/**
 * Valide la technologie requise pour une pièce
 * @private
 * @param {Object} part - Pièce à valider
 * @param {Array} errors - Tableau des erreurs à remplir
 */
function validateTechRequired(part, errors) {
  const techRequired = getNestedValue(part, 'techRequired', null);
  
  if (techRequired !== null && typeof techRequired !== 'string') {
    errors.push(formatError(
      "Le champ 'techRequired' doit être une chaîne de caractères",
      'techRequired',
      ERROR_CODES.INVALID_TYPE
    ));
  }
}