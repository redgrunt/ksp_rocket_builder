/**
 * @fileoverview Classe principale pour la validation des données KSP
 * @module api/utils/datavalidator/DataValidator
 */

import { getNestedValue, applyDefaults } from '../../../utils/SafeAccess.js';
import { validatePart } from './validators/part.js';
import { validateCelestialBody } from './validators/celestialBody.js';
import { validateResource } from './validators/resource.js';
import { formatError } from './formatters.js';
import { VALIDATION_TYPES, ERROR_CODES, ERROR_TYPES } from './constants.js';

/**
 * Classe utilitaire pour la validation des données
 * @class
 */
class DataValidator {
  constructor() {
    // Règles de validation personnalisées
    this.customRules = {
      part: {},
      celestial_body: {},
      resource: {},
      tech: {}
    };
    
    // Cache de validation pour optimiser les performances
    this.validationCache = new Map();
    
    // Options par défaut
    this.defaultOptions = {
      enableCache: true,          // Utiliser le cache de validation
      validateReferences: true,   // Vérifier les références entre entités
      strictMode: false,          // Mode strict (toutes les erreurs sont critiques)
      autoFix: false,             // Correction automatique des problèmes simples
      maxErrors: 100,             // Nombre maximum d'erreurs à collecter
      includeWarnings: true,      // Inclure les avertissements
      includeInfo: true           // Inclure les informations
    };
  }
  
  /**
   * Ajoute une règle de validation personnalisée
   * @param {string} entityType - Type d'entité (part, celestial_body, resource, tech)
   * @param {string} ruleName - Nom de la règle
   * @param {Function} validator - Fonction de validation qui prend l'entité et retourne {valid, message, code, type}
   */
  addCustomValidationRule(entityType, ruleName, validator) {
    if (!this.customRules[entityType]) {
      console.warn(`Type d'entité inconnu: ${entityType}. La règle ne sera pas ajoutée.`);
      return;
    }
    
    if (typeof validator !== 'function') {
      console.error('Le validateur doit être une fonction. La règle ne sera pas ajoutée.');
      return;
    }
    
    this.customRules[entityType][ruleName] = validator;
    console.info(`Règle de validation "${ruleName}" ajoutée pour le type ${entityType}`);
    
    // Vider le cache car les règles ont changé
    this.clearCache();
  }
  
  /**
   * Supprime une règle de validation personnalisée
   * @param {string} entityType - Type d'entité
   * @param {string} ruleName - Nom de la règle à supprimer
   */
  removeCustomValidationRule(entityType, ruleName) {
    if (!this.customRules[entityType] || !this.customRules[entityType][ruleName]) {
      console.warn(`Règle "${ruleName}" pour le type ${entityType} non trouvée.`);
      return;
    }
    
    delete this.customRules[entityType][ruleName];
    console.info(`Règle de validation "${ruleName}" supprimée pour le type ${entityType}`);
    
    // Vider le cache car les règles ont changé
    this.clearCache();
  }
  
  /**
   * Vide le cache de validation
   */
  clearCache() {
    this.validationCache.clear();
    console.info('Cache de validation vidé');
  }
  
  /**
   * Applique les règles de validation personnalisées à une entité
   * @private
   * @param {Object} entity - Entité à valider
   * @param {string} entityType - Type d'entité
   * @param {Array} errors - Tableau d'erreurs à remplir
   * @param {Array} warnings - Tableau d'avertissements à remplir
   * @param {Array} infos - Tableau d'informations à remplir
   */
  _applyCustomRules(entity, entityType, errors, warnings, infos) {
    const rules = this.customRules[entityType] || {};
    
    for (const [ruleName, validator] of Object.entries(rules)) {
      try {
        const result = validator(entity);
        
        if (!result || typeof result !== 'object') {
          console.warn(`La règle "${ruleName}" n'a pas retourné un objet de résultat valide.`);
          continue;
        }
        
        if (!result.valid) {
          const error = formatError(
            result.message || `Échec de la règle ${ruleName}`,
            result.path || '',
            result.code || ERROR_CODES.CONSTRAINT_VIOLATION,
            result.type || ERROR_TYPES.ERROR
          );
          
          if (error.type === ERROR_TYPES.ERROR) {
            errors.push(error);
          } else if (error.type === ERROR_TYPES.WARNING) {
            warnings.push(error);
          } else if (error.type === ERROR_TYPES.INFO) {
            infos.push(error);
          }
        }
      } catch (e) {
        console.error(`Erreur lors de l'exécution de la règle "${ruleName}":`, e);
      }
    }
  }
  
  /**
   * Valide le type d'une propriété
   * @private
   * @param {Object} obj - Objet à valider
   * @param {string} prop - Nom de la propriété
   * @param {string} expectedType - Type attendu
   * @param {Array} errors - Tableau d'erreurs à remplir
   */
  _validateType(obj, prop, expectedType, errors) {
    const value = getNestedValue(obj, prop, null);
    
    if (value !== null && typeof value !== expectedType) {
      errors.push(formatError(
        `Le champ '${prop}' doit être un ${expectedType}`,
        prop,
        ERROR_CODES.INVALID_TYPE
      ));
    }
  }
  
  /**
   * Valide une pièce
   * @param {Object} part - Pièce à valider
   * @param {Object} [options] - Options de validation
   * @returns {Object} - Résultat de la validation {valid, errors, warnings, infos}
   */
  validatePart(part, options = {}) {
    return validatePart(
      part, 
      this.validationCache, 
      this.defaultOptions, 
      this._applyCustomRules.bind(this), 
      this._validateType.bind(this), 
      options
    );
  }
  
  /**
   * Valide un corps céleste
   * @param {Object} body - Corps céleste à valider
   * @param {Object} [options] - Options de validation
   * @returns {Object} - Résultat de la validation {valid, errors, warnings, infos}
   */
  validateCelestialBody(body, options = {}) {
    return validateCelestialBody(
      body, 
      this.validationCache, 
      this.defaultOptions, 
      this._applyCustomRules.bind(this), 
      this._validateType.bind(this), 
      options
    );
  }
  
  /**
   * Valide une ressource
   * @param {Object} resource - Ressource à valider
   * @param {Object} [options] - Options de validation
   * @returns {Object} - Résultat de la validation {valid, errors, warnings, infos}
   */
  validateResource(resource, options = {}) {
    return validateResource(
      resource, 
      this.validationCache, 
      this.defaultOptions, 
      this._applyCustomRules.bind(this), 
      this._validateType.bind(this), 
      options
    );
  }
  
  /**
   * Valide un nœud technologique
   * @param {Object} tech - Nœud technologique à valider
   * @param {Object} [options] - Options de validation
   * @returns {Object} - Résultat de la validation {valid, errors, warnings, infos}
   */
  validateTech(tech, options = {}) {
    // À implémenter: import et appel de validateTech
    console.warn("Méthode validateTech pas encore implémentée");
    return { valid: false, errors: [], warnings: [], infos: [] };
  }
  
  /**
   * Essaie de corriger automatiquement les problèmes simples dans une entité
   * @param {Object} entity - Entité à corriger
   * @param {string} type - Type d'entité (voir VALIDATION_TYPES)
   * @param {Object} [options] - Options de correction
   * @returns {Object} - Résultat de la correction {entity, fixed, changes}
   */
  autoFix(entity, type, options = {}) {
    if (!entity) return { entity: null, fixed: false, changes: [] };
    
    const changes = [];
    let fixedEntity = { ...entity };
    
    switch (type) {
      case VALIDATION_TYPES.PART:
        // Appliquer les valeurs par défaut pour les champs manquants
        fixedEntity = applyDefaults(fixedEntity, {
          name: `Part_${entity.id || 'unknown'}`,
          title: entity.name || `Pièce ${entity.id || 'inconnue'}`,
          category: 'unknown',
          mass: { dry: 0, wet: 0 },
          cost: 0,
          attachNodes: [],
          attachRules: { stack: true, srfAttach: false },
          resources: []
        });
        
        // Corriger les tableaux vides au lieu de null
        if (fixedEntity.attachNodes === null) {
          fixedEntity.attachNodes = [];
          changes.push({ path: 'attachNodes', oldValue: null, newValue: [] });
        }
        
        if (fixedEntity.resources === null) {
          fixedEntity.resources = [];
          changes.push({ path: 'resources', oldValue: null, newValue: [] });
        }
        
        // Vérifier et normaliser les nœuds d'attachement
        if (Array.isArray(fixedEntity.attachNodes)) {
          fixedEntity.attachNodes = fixedEntity.attachNodes.map((node, index) => {
            if (!node) return null;
            
            const fixedNode = { ...node };
            
            // Corriger la position si elle est invalide
            if (!Array.isArray(fixedNode.position) || fixedNode.position.length !== 3) {
              const oldValue = fixedNode.position;
              fixedNode.position = [0, 0, 0];
              changes.push({ path: `attachNodes[${index}].position`, oldValue, newValue: fixedNode.position });
            }
            
            // Corriger l'orientation si elle est invalide
            if (!Array.isArray(fixedNode.orientation) || fixedNode.orientation.length !== 3) {
              const oldValue = fixedNode.orientation;
              fixedNode.orientation = [0, 1, 0]; // Orientation vers le haut par défaut
              changes.push({ path: `attachNodes[${index}].orientation`, oldValue, newValue: fixedNode.orientation });
            }
            
            return fixedNode;
          }).filter(node => node !== null);
        }
        break;
        
      case VALIDATION_TYPES.CELESTIAL_BODY:
        // Appliquer les valeurs par défaut pour les champs manquants
        fixedEntity = applyDefaults(fixedEntity, {
          name: `Body_${entity.id || 'unknown'}`,
          type: 'planet',
          physical: { radius: 0, mass: 0, gravity: 0 }
        });
        break;
        
      case VALIDATION_TYPES.RESOURCE:
        // Appliquer les valeurs par défaut pour les champs manquants
        fixedEntity = applyDefaults(fixedEntity, {
          name: `Resource_${entity.id || 'unknown'}`,
          density: 1,
          unitCost: 0,
          transferable: true
        });
        break;
        
      case VALIDATION_TYPES.TECH:
        // Appliquer les valeurs par défaut pour les champs manquants
        fixedEntity = applyDefaults(fixedEntity, {
          title: `Tech_${entity.id || 'unknown'}`,
          cost: 0,
          parents: [],
          partUnlocks: []
        });
        
        // Corriger les tableaux vides au lieu de null
        if (fixedEntity.parents === null) {
          fixedEntity.parents = [];
          changes.push({ path: 'parents', oldValue: null, newValue: [] });
        }
        
        if (fixedEntity.partUnlocks === null) {
          fixedEntity.partUnlocks = [];
          changes.push({ path: 'partUnlocks', oldValue: null, newValue: [] });
        }
        break;
        
      default:
        return { entity, fixed: false, changes: [] };
    }
    
    // Vérifier si des corrections ont été appliquées
    const fixed = changes.length > 0;
    
    return { entity: fixedEntity, fixed, changes };
  }
}

export default DataValidator;
