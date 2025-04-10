/**
 * @fileoverview Fonctions d'aide pour la validation des relations entre entités
 * @module api/utils/datavalidator/helpers/relationValidators
 */

import { getNestedValue } from '../../../../utils/SafeAccess.js';
import { ERROR_CODES, ERROR_TYPES } from '../constants.js';
import { formatError } from '../formatters.js';

/**
 * Valide les références entre pièces et ressources
 * @param {Array} parts - Collection de pièces
 * @param {Array} resources - Collection de ressources
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validatePartResourceReferences(parts, resources, errors, warnings) {
  // Créer un index des ressources par ID pour une recherche efficace
  const resourcesIndex = {};
  resources.forEach(resource => {
    if (resource && resource.id) {
      resourcesIndex[resource.id] = resource;
    }
  });
  
  // Vérifier chaque pièce
  parts.forEach(part => {
    if (!part) return;
    
    // Vérifier les ressources dans les pièces
    const partResources = getNestedValue(part, 'resources', []);
    
    if (Array.isArray(partResources)) {
      partResources.forEach((resource, index) => {
        if (!resource) return;
        
        const resourceType = getNestedValue(resource, 'type', null);
        
        if (resourceType && !resourcesIndex[resourceType]) {
          errors.push(formatError(
            `La pièce "${part.id}" référence une ressource inexistante: "${resourceType}"`,
            `parts[${part.id}].resources[${index}].type`,
            ERROR_CODES.REFERENCE_ERROR
          ));
        }
      });
    }
    
    // Vérifier les propergols dans les moteurs
    if (getNestedValue(part, 'category', '') === 'engines') {
      const propellants = getNestedValue(part, 'propellants', []);
      
      if (Array.isArray(propellants)) {
        propellants.forEach((propellant, index) => {
          if (!propellant) return;
          
          const propType = getNestedValue(propellant, 'type', null);
          
          if (propType && !resourcesIndex[propType]) {
            errors.push(formatError(
              `Le moteur "${part.id}" référence un propergol inexistant: "${propType}"`,
              `parts[${part.id}].propellants[${index}].type`,
              ERROR_CODES.REFERENCE_ERROR
            ));
          }
        });
      }
    }
  });
}

/**
 * Valide les références entre pièces et technologies
 * @param {Array} parts - Collection de pièces
 * @param {Array} techs - Collection de technologies
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validatePartTechReferences(parts, techs, errors, warnings) {
  // Créer un index des technologies par ID pour une recherche efficace
  const techsIndex = {};
  techs.forEach(tech => {
    if (tech && tech.id) {
      techsIndex[tech.id] = tech;
    }
  });
  
  // Vérifier chaque pièce
  parts.forEach(part => {
    if (!part) return;
    
    const techRequired = getNestedValue(part, 'techRequired', null);
    
    if (techRequired && !techsIndex[techRequired]) {
      errors.push(formatError(
        `La pièce "${part.id}" référence une technologie inexistante: "${techRequired}"`,
        `parts[${part.id}].techRequired`,
        ERROR_CODES.REFERENCE_ERROR
      ));
    }
  });
  
  // Vérifier chaque technologie
  techs.forEach(tech => {
    if (!tech) return;
    
    const partUnlocks = getNestedValue(tech, 'partUnlocks', []);
    
    if (Array.isArray(partUnlocks)) {
      partUnlocks.forEach((partId, index) => {
        if (!partId) return;
        
        // Chercher la pièce correspondante
        const partExists = parts.some(part => part && part.id === partId);
        
        if (!partExists) {
          warnings.push(formatError(
            `La technologie "${tech.id}" fait référence à une pièce inexistante: "${partId}"`,
            `techs[${tech.id}].partUnlocks[${index}]`,
            ERROR_CODES.REFERENCE_ERROR,
            ERROR_TYPES.WARNING
          ));
        }
      });
    }
  });
}

/**
 * Valide la hiérarchie des corps célestes
 * @param {Array} bodies - Collection de corps célestes
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validateCelestialBodyHierarchy(bodies, errors, warnings) {
  // Créer un index des corps par ID pour une recherche efficace
  const bodiesIndex = {};
  bodies.forEach(body => {
    if (body && body.id) {
      bodiesIndex[body.id] = body;
    }
  });
  
  // Vérifier chaque corps
  bodies.forEach(body => {
    if (!body) return;
    
    const parent = getNestedValue(body, 'parent', null);
    
    // Vérifier que le parent existe (sauf pour l'étoile centrale)
    if (parent && getNestedValue(body, 'type', '') !== 'star') {
      if (!bodiesIndex[parent]) {
        errors.push(formatError(
          `Le corps céleste "${body.id}" référence un parent inexistant: "${parent}"`,
          `celestialBodies[${body.id}].parent`,
          ERROR_CODES.REFERENCE_ERROR
        ));
      } else {
        // Vérifier qu'il n'y a pas de référence circulaire
        let current = body;
        const visited = new Set();
        
        while (current && current.parent && !visited.has(current.id)) {
          visited.add(current.id);
          current = bodiesIndex[current.parent];
          
          // Si on arrive à une référence circulaire
          if (current && current.id === body.id) {
            errors.push(formatError(
              `Référence circulaire détectée pour le corps céleste "${body.id}"`,
              `celestialBodies[${body.id}].parent`,
              ERROR_CODES.CIRCULAR_REFERENCE
            ));
            break;
          }
        }
      }
    }
  });
}

/**
 * Valide l'absence de cycles dans l'arbre technologique
 * @param {Array} techs - Collection de technologies
 * @param {Array} errors - Tableau des erreurs à remplir
 * @param {Array} warnings - Tableau des avertissements à remplir
 */
export function validateTechTreeCycles(techs, errors, warnings) {
  // Créer un index des technologies par ID
  const techsIndex = {};
  techs.forEach(tech => {
    if (tech && tech.id) {
      techsIndex[tech.id] = tech;
    }
  });
  
  // Fonction pour détecter les cycles avec un algorithme de détection de cycle dirigé
  function detectCycle(techId, visited, stack) {
    // Marquer comme visité
    visited[techId] = true;
    stack[techId] = true;
    
    const tech = techsIndex[techId];
    if (!tech) return false;
    
    const parents = getNestedValue(tech, 'parents', []);
    
    if (Array.isArray(parents)) {
      for (const parentId of parents) {
        // Vérifier que le parent existe
        if (!techsIndex[parentId]) {
          warnings.push(formatError(
            `La technologie "${techId}" référence un parent inexistant: "${parentId}"`,
            `techs[${techId}].parents`,
            ERROR_CODES.REFERENCE_ERROR,
            ERROR_TYPES.WARNING
          ));
          continue;
        }
        
        // Si le parent n'est pas visité, vérifier récursivement
        if (!visited[parentId]) {
          if (detectCycle(parentId, visited, stack)) {
            return true;
          }
        } else if (stack[parentId]) {
          // Si le parent est dans la pile, un cycle est détecté
          return true;
        }
      }
    }
    
    // Retirer de la pile
    stack[techId] = false;
    return false;
  }
  
  // Vérifier chaque technologie
  const visited = {};
  const stack = {};
  
  for (const tech of techs) {
    if (!tech || !tech.id) continue;
    
    if (!visited[tech.id]) {
      if (detectCycle(tech.id, visited, stack)) {
        errors.push(formatError(
          `Cycle détecté dans l'arbre technologique impliquant "${tech.id}"`,
          `techs[${tech.id}]`,
          ERROR_CODES.CIRCULAR_REFERENCE
        ));
      }
    }
  }
}