/**
 * @fileoverview Moteur de recherche avancé pour les pièces KSP
 * Ce module permet d'effectuer des recherches complexes et des filtrages sur les pièces.
 * @module api/SearchEngine
 */

/**
 * Opérateurs de comparaison pour les filtres numériques
 * @enum {string}
 */
export const NUMERIC_OPERATORS = {
  EQUALS: 'eq',
  NOT_EQUALS: 'ne',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUALS: 'gte',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUALS: 'lte',
  BETWEEN: 'between'
};

/**
 * Opérateurs de texte pour les filtres de chaînes
 * @enum {string}
 */
export const TEXT_OPERATORS = {
  EQUALS: 'eq',
  NOT_EQUALS: 'ne',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith'
};

/**
 * Opérateurs logiques pour les filtres composés
 * @enum {string}
 */
export const LOGICAL_OPERATORS = {
  AND: 'and',
  OR: 'or',
  NOT: 'not'
};

/**
 * Moteur de recherche avancé pour les pièces
 * @class
 */
class SearchEngine {
  /**
   * Crée une instance du moteur de recherche
   * @param {Object} dataAPI - Instance de l'API de données
   * @constructor
   */
  constructor(dataAPI) {
    this.dataAPI = dataAPI;
  }

  /**
   * Effectue une recherche simple par texte
   * @param {string} query - Texte de recherche
   * @param {Array} [scope=null] - Liste des pièces à filtrer (toutes par défaut)
   * @returns {Array} - Pièces correspondant à la recherche
   */
  search(query, scope = null) {
    if (!query || query.trim() === '') {
      return scope || this.dataAPI.parts.getAllParts();
    }

    // Utiliser PartsAPI pour la recherche de base
    const parts = scope || this.dataAPI.parts.getAllParts();
    const searchTerm = query.toLowerCase().trim();
    
    return parts.filter(part => {
      return (
        (part.name && part.name.toLowerCase().includes(searchTerm)) ||
        (part.title && part.title.toLowerCase().includes(searchTerm)) ||
        (part.description && part.description.toLowerCase().includes(searchTerm)) ||
        (part.manufacturer && part.manufacturer.toLowerCase().includes(searchTerm)) ||
        (part.tags && part.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    });
  }

  /**
   * Effectue une recherche avancée avec des filtres complexes
   * @param {Object} filters - Filtres de recherche
   * @param {Array} [scope=null] - Liste des pièces à filtrer (toutes par défaut)
   * @returns {Array} - Pièces correspondant à la recherche
   */
  advancedSearch(filters, scope = null) {
    if (!filters || Object.keys(filters).length === 0) {
      return scope || this.dataAPI.parts.getAllParts();
    }

    const parts = scope || this.dataAPI.parts.getAllParts();
    
    return parts.filter(part => this._applyFilter(part, filters));
  }

  /**
   * Applique un filtre à une pièce
   * @private
   * @param {Object} part - Pièce à filtrer
   * @param {Object} filter - Filtre à appliquer
   * @returns {boolean} - True si la pièce passe le filtre
   */
  _applyFilter(part, filter) {
    // Cas de base: filtre simple sous forme {field, operator, value}
    if (filter.field && filter.operator) {
      return this._applySimpleFilter(part, filter);
    }
    
    // Cas 1: Opérateur AND
    if (filter.and && Array.isArray(filter.and)) {
      return filter.and.every(subFilter => this._applyFilter(part, subFilter));
    }
    
    // Cas 2: Opérateur OR
    if (filter.or && Array.isArray(filter.or)) {
      return filter.or.some(subFilter => this._applyFilter(part, subFilter));
    }
    
    // Cas 3: Opérateur NOT
    if (filter.not) {
      return !this._applyFilter(part, filter.not);
    }
    
    // Par défaut, passer le filtre
    return true;
  }

  /**
   * Applique un filtre simple à une pièce
   * @private
   * @param {Object} part - Pièce à filtrer
   * @param {Object} filter - Filtre simple {field, operator, value}
   * @returns {boolean} - True si la pièce passe le filtre
   */
  _applySimpleFilter(part, filter) {
    const { field, operator, value } = filter;
    
    // Extraire la valeur du champ de la pièce
    const fieldValue = this._getFieldValue(part, field);
    
    // Si le champ n'existe pas et qu'on ne teste pas son existence
    if (fieldValue === undefined && operator !== 'exists' && operator !== 'notExists') {
      return false;
    }
    
    // Appliquer l'opérateur approprié selon le type de valeur
    if (typeof fieldValue === 'number') {
      return this._applyNumericFilter(fieldValue, operator, value);
    } else if (typeof fieldValue === 'string') {
      return this._applyTextFilter(fieldValue, operator, value);
    } else if (typeof fieldValue === 'boolean') {
      return this._applyBooleanFilter(fieldValue, operator, value);
    } else if (Array.isArray(fieldValue)) {
      return this._applyArrayFilter(fieldValue, operator, value);
    } else if (fieldValue === null || fieldValue === undefined) {
      return this._applyExistenceFilter(fieldValue, operator);
    }
    
    return false;
  }

  /**
   * Extrait la valeur d'un champ à partir d'un chemin (ex: "mass.dry")
   * @private
   * @param {Object} part - Pièce à filtrer
   * @param {string} fieldPath - Chemin du champ
   * @returns {*} - Valeur du champ
   */
  _getFieldValue(part, fieldPath) {
    if (!fieldPath) {
      return undefined;
    }
    
    // Support de la notation par points pour les champs imbriqués
    const parts = fieldPath.split('.');
    let value = part;
    
    for (const key of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      
      value = value[key];
    }
    
    return value;
  }

  /**
   * Applique un filtre numérique
   * @private
   * @param {number} fieldValue - Valeur du champ
   * @param {string} operator - Opérateur
   * @param {*} filterValue - Valeur du filtre
   * @returns {boolean} - True si le filtre passe
   */
  _applyNumericFilter(fieldValue, operator, filterValue) {
    switch (operator) {
      case NUMERIC_OPERATORS.EQUALS:
        return fieldValue === Number(filterValue);
        
      case NUMERIC_OPERATORS.NOT_EQUALS:
        return fieldValue !== Number(filterValue);
        
      case NUMERIC_OPERATORS.GREATER_THAN:
        return fieldValue > Number(filterValue);
        
      case NUMERIC_OPERATORS.GREATER_THAN_OR_EQUALS:
        return fieldValue >= Number(filterValue);
        
      case NUMERIC_OPERATORS.LESS_THAN:
        return fieldValue < Number(filterValue);
        
      case NUMERIC_OPERATORS.LESS_THAN_OR_EQUALS:
        return fieldValue <= Number(filterValue);
        
      case NUMERIC_OPERATORS.BETWEEN:
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const [min, max] = filterValue.map(Number);
          return fieldValue >= min && fieldValue <= max;
        }
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Applique un filtre de texte
   * @private
   * @param {string} fieldValue - Valeur du champ
   * @param {string} operator - Opérateur
   * @param {*} filterValue - Valeur du filtre
   * @returns {boolean} - True si le filtre passe
   */
  _applyTextFilter(fieldValue, operator, filterValue) {
    // Convertir les valeurs en chaînes et en minuscules pour une comparaison insensible à la casse
    const fieldStr = String(fieldValue).toLowerCase();
    const filterStr = String(filterValue).toLowerCase();
    
    switch (operator) {
      case TEXT_OPERATORS.EQUALS:
        return fieldStr === filterStr;
        
      case TEXT_OPERATORS.NOT_EQUALS:
        return fieldStr !== filterStr;
        
      case TEXT_OPERATORS.CONTAINS:
        return fieldStr.includes(filterStr);
        
      case TEXT_OPERATORS.NOT_CONTAINS:
        return !fieldStr.includes(filterStr);
        
      case TEXT_OPERATORS.STARTS_WITH:
        return fieldStr.startsWith(filterStr);
        
      case TEXT_OPERATORS.ENDS_WITH:
        return fieldStr.endsWith(filterStr);
        
      default:
        return false;
    }
  }

  /**
   * Applique un filtre booléen
   * @private
   * @param {boolean} fieldValue - Valeur du champ
   * @param {string} operator - Opérateur
   * @param {*} filterValue - Valeur du filtre
   * @returns {boolean} - True si le filtre passe
   */
  _applyBooleanFilter(fieldValue, operator, filterValue) {
    // Convertir la valeur du filtre en booléen
    const boolValue = filterValue === true || filterValue === 'true';
    
    switch (operator) {
      case 'eq':
        return fieldValue === boolValue;
        
      case 'ne':
        return fieldValue !== boolValue;
        
      default:
        return false;
    }
  }

  /**
   * Applique un filtre de tableau
   * @private
   * @param {Array} fieldValue - Valeur du champ
   * @param {string} operator - Opérateur
   * @param {*} filterValue - Valeur du filtre
   * @returns {boolean} - True si le filtre passe
   */
  _applyArrayFilter(fieldValue, operator, filterValue) {
    switch (operator) {
      case 'contains':
        return fieldValue.includes(filterValue);
        
      case 'notContains':
        return !fieldValue.includes(filterValue);
        
      case 'containsAny':
        if (Array.isArray(filterValue)) {
          return filterValue.some(val => fieldValue.includes(val));
        }
        return false;
        
      case 'containsAll':
        if (Array.isArray(filterValue)) {
          return filterValue.every(val => fieldValue.includes(val));
        }
        return false;
        
      case 'lengthEq':
        return fieldValue.length === Number(filterValue);
        
      case 'lengthGt':
        return fieldValue.length > Number(filterValue);
        
      case 'lengthLt':
        return fieldValue.length < Number(filterValue);
        
      default:
        return false;
    }
  }

  /**
   * Applique un filtre d'existence
   * @private
   * @param {*} fieldValue - Valeur du champ
   * @param {string} operator - Opérateur
   * @returns {boolean} - True si le filtre passe
   */
  _applyExistenceFilter(fieldValue, operator) {
    switch (operator) {
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
        
      case 'notExists':
        return fieldValue === undefined || fieldValue === null;
        
      default:
        return false;
    }
  }

  /**
   * Effectue une recherche par similarité
   * @param {Object} reference - Pièce de référence
   * @param {Object} options - Options de recherche
   * @param {Array} [scope=null] - Liste des pièces à filtrer (toutes par défaut)
   * @returns {Array} - Pièces similaires avec leur score
   */
  findSimilar(reference, options = {}, scope = null) {
    if (!reference) {
      return [];
    }

    const parts = scope || this.dataAPI.parts.getAllParts();
    const results = [];
    
    // Options par défaut
    const defaultOptions = {
      categoryWeight: 2.0,   // Poids pour la correspondance de catégorie
      sizeWeight: 1.5,       // Poids pour la correspondance de taille
      massWeight: 1.0,       // Poids pour la similarité de masse
      costWeight: 0.8,       // Poids pour la similarité de coût
      techWeight: 1.2,       // Poids pour la correspondance de technologie
      tagsWeight: 0.5,       // Poids pour les tags communs
      minScore: 0.3          // Score minimal pour inclure dans les résultats
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Pour chaque pièce, calculer un score de similarité
    parts.forEach(part => {
      // Ignorer la pièce de référence elle-même
      if (part.id === reference.id) {
        return;
      }
      
      let score = 0;
      let maxScore = 0;
      
      // 1. Similarité de catégorie
      if (part.category === reference.category) {
        score += config.categoryWeight;
      }
      maxScore += config.categoryWeight;
      
      // 2. Similarité de taille
      if (part.size && reference.size && 
          part.size.radialSize === reference.size.radialSize) {
        score += config.sizeWeight;
      }
      maxScore += config.sizeWeight;
      
      // 3. Similarité de masse
      if (part.mass && reference.mass && part.mass.dry && reference.mass.dry) {
        const massRatio = Math.min(part.mass.dry, reference.mass.dry) / 
                        Math.max(part.mass.dry, reference.mass.dry);
        score += massRatio * config.massWeight;
      }
      maxScore += config.massWeight;
      
      // 4. Similarité de coût
      if (part.cost && reference.cost) {
        const costRatio = Math.min(part.cost, reference.cost) / 
                        Math.max(part.cost, reference.cost);
        score += costRatio * config.costWeight;
      }
      maxScore += config.costWeight;
      
      // 5. Correspondance de technologie
      if (part.techRequired === reference.techRequired) {
        score += config.techWeight;
      }
      maxScore += config.techWeight;
      
      // 6. Tags communs
      if (part.tags && reference.tags) {
        const commonTags = part.tags.filter(tag => reference.tags.includes(tag));
        const tagScore = (commonTags.length / Math.max(part.tags.length, reference.tags.length)) * 
                        config.tagsWeight;
        score += tagScore;
      }
      maxScore += config.tagsWeight;
      
      // Normaliser le score (0-1)
      const normalizedScore = score / maxScore;
      
      // N'inclure que les pièces au-dessus du score minimal
      if (normalizedScore >= config.minScore) {
        results.push({
          part,
          score: normalizedScore
        });
      }
    });
    
    // Trier par score décroissant
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Suggère des pièces pour compléter une fusée
   * @param {Array} currentParts - Pièces actuellement dans la fusée
   * @param {string} attachPoint - Point d'attachement actif
   * @param {Object} options - Options de suggestion
   * @returns {Array} - Pièces suggérées
   */
  suggestParts(currentParts, attachPoint, options = {}) {
    if (!currentParts || currentParts.length === 0) {
      // Pour une fusée vide, suggérer des modules de commande
      return this.dataAPI.parts.getPartsByCategory('command');
    }

    // Trouver la pièce active (celle avec le point d'attachement actif)
    const activePart = currentParts.find(part => 
      part.attachNodes && part.attachNodes.some(node => node.id === attachPoint)
    );
    
    if (!activePart) {
      return [];
    }
    
    // Options par défaut
    const defaultOptions = {
      maxSuggestions: 10,
      prioritizeTech: true,    // Prioriser les pièces déjà débloquées
      respectSize: true,       // Respecter les contraintes de taille
      includeCompatibility: true // Inclure l'information de compatibilité
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Obtenir les pièces compatibles avec le point d'attachement
    let compatibleParts;
    
    if (this.dataAPI.compatibility) {
      compatibleParts = this.dataAPI.compatibility.getAllCompatibleParts(activePart, {
        nodeId: attachPoint
      });
    } else {
      // Fallback si CompatibilityChecker n'est pas disponible
      compatibleParts = this.dataAPI.parts.getAllParts().filter(part => {
        // Exclure la pièce elle-même
        if (part.id === activePart.id) {
          return false;
        }
        
        // Vérifier si la pièce a des nœuds d'attachement compatibles
        return part.attachNodes && part.attachNodes.some(node => {
          // Trouver le nœud actif
          const activeNode = activePart.attachNodes.find(n => n.id === attachPoint);
          if (!activeNode) {
            return false;
          }
          
          // Vérifier la compatibilité de taille
          return config.respectSize ? node.size === activeNode.size : true;
        });
      });
    }
    
    // Trier les pièces selon différents critères
    return this._rankSuggestions(compatibleParts, activePart, currentParts, config);
  }

  /**
   * Classe les suggestions selon différents critères
   * @private
   * @param {Array} compatibleParts - Pièces compatibles
   * @param {Object} activePart - Pièce active
   * @param {Array} currentParts - Pièces actuelles dans la fusée
   * @param {Object} config - Configuration
   * @returns {Array} - Suggestions classées
   */
  _rankSuggestions(compatibleParts, activePart, currentParts, config) {
    // Calculer un score pour chaque pièce compatible
    const scoredParts = compatibleParts.map(part => {
      let score = 0;
      
      // 1. Les pièces de la même catégorie sont préférées pour la cohérence
      if (part.category === activePart.category) {
        score += 2;
      }
      
      // 2. Les pièces du même fabricant sont préférées pour la cohérence
      if (part.manufacturer === activePart.manufacturer) {
        score += 1;
      }
      
      // 3. Les pièces déjà utilisées dans la fusée sont préférées pour la réutilisation
      if (currentParts.some(p => p.id === part.id)) {
        score += 3;
      }
      
      // 4. Les pièces qui complètent une fonction sont préférées
      // Par exemple, si un moteur est présent mais pas de réservoir
      const hasEngines = currentParts.some(p => p.category === 'engines');
      const hasFuelTanks = currentParts.some(p => p.category === 'fuel_tanks');
      
      if (hasEngines && !hasFuelTanks && part.category === 'fuel_tanks') {
        score += 4;
      }
      
      if (!hasEngines && hasFuelTanks && part.category === 'engines') {
        score += 4;
      }
      
      // 5. Si prioritizeTech est activé, les pièces débloquées ont un bonus
      if (config.prioritizeTech && part.techRequired && 
          activePart.techRequired === part.techRequired) {
        score += 2;
      }
      
      return {
        part,
        score
      };
    });
    
    // Trier par score décroissant
    const sortedSuggestions = scoredParts.sort((a, b) => b.score - a.score);
    
    // Limiter le nombre de suggestions
    const limitedSuggestions = sortedSuggestions.slice(0, config.maxSuggestions);
    
    // Si l'option includeCompatibility est activée, ajouter les détails de compatibilité
    if (config.includeCompatibility && this.dataAPI.compatibility) {
      return limitedSuggestions.map(suggestion => {
        const compatibilityDetails = this.dataAPI.compatibility.checkAttachmentCompatibility(
          activePart, 
          suggestion.part
        );
        
        return {
          ...suggestion,
          compatibility: compatibilityDetails
        };
      });
    }
    
    return limitedSuggestions;
  }
}

// Exporter la classe (pas d'instance singleton car elle nécessite DataAPI)
export default SearchEngine;