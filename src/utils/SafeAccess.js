/**
 * @fileoverview Utilitaires pour l'accès sécurisé aux propriétés et la validation
 * @module utils/SafeAccess
 */

/**
 * Récupère une valeur dans un objet potentiellement imbriqué avec accès sécurisé
 * @param {Object} obj - Objet source
 * @param {string} path - Chemin d'accès à la propriété (peut utiliser la notation à points, ex: 'prop1.prop2')
 * @param {*} defaultVal - Valeur par défaut à retourner si la propriété n'existe pas
 * @returns {*} La valeur trouvée ou la valeur par défaut
 */
export function getNestedValue(obj, path, defaultVal = undefined) {
  if (!obj || typeof obj !== 'object' || !path) {
    return defaultVal;
  }
  
  // Gérer le cas d'une propriété simple
  if (!path.includes('.')) {
    return obj[path] !== undefined ? obj[path] : defaultVal;
  }
  
  // Gérer le cas d'un chemin imbriqué
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (current[part] === undefined) {
      return defaultVal;
    }
    
    current = current[part];
  }
  
  return current;
}

/**
 * Vérifie la présence des propriétés requises dans un objet
 * @param {Object} obj - Objet à vérifier
 * @param {Array<string>} requiredProps - Liste des propriétés requises
 * @returns {Object} Résultat de la validation {valid, missing}
 */
export function validateRequiredProps(obj, requiredProps) {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, missing: requiredProps };
  }
  
  const missing = [];
  
  for (const prop of requiredProps) {
    if (getNestedValue(obj, prop, undefined) === undefined) {
      missing.push(prop);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Applique des valeurs par défaut aux propriétés manquantes d'un objet
 * @param {Object} obj - Objet source
 * @param {Object} defaults - Objet contenant les valeurs par défaut
 * @returns {Object} Nouvel objet avec les valeurs par défaut appliquées
 */
export function applyDefaults(obj, defaults) {
  if (!obj) {
    return { ...defaults };
  }
  
  if (!defaults || typeof defaults !== 'object') {
    return { ...obj };
  }
  
  const result = { ...obj };
  
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (result[key] === undefined) {
      result[key] = defaultValue;
    } else if (
      typeof defaultValue === 'object' && 
      defaultValue !== null && 
      !Array.isArray(defaultValue) && 
      typeof result[key] === 'object' && 
      result[key] !== null && 
      !Array.isArray(result[key])
    ) {
      // Récursion pour les objets imbriqués
      result[key] = applyDefaults(result[key], defaultValue);
    }
  }
  
  return result;
}

/**
 * Met à jour une valeur dans un objet potentiellement imbriqué
 * @param {Object} obj - Objet source
 * @param {string} path - Chemin d'accès à la propriété (peut utiliser la notation à points)
 * @param {*} value - Nouvelle valeur à assigner
 * @returns {Object} Nouvel objet avec la valeur mise à jour
 */
export function setNestedValue(obj, path, value) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = { ...obj };
  
  // Gérer le cas d'une propriété simple
  if (!path.includes('.')) {
    result[path] = value;
    return result;
  }
  
  // Gérer le cas d'un chemin imbriqué
  const parts = path.split('.');
  let current = result;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    if (current[part] === undefined || typeof current[part] !== 'object') {
      current[part] = {};
    }
    
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  
  return result;
}

/**
 * Clone profondément un objet pour éviter les références partagées
 * @param {*} source - Valeur à cloner
 * @returns {*} Clone profond de la valeur
 */
export function deepClone(source) {
  if (source === null || source === undefined) {
    return source;
  }
  
  if (Array.isArray(source)) {
    return source.map(item => deepClone(item));
  }
  
  if (typeof source === 'object') {
    const result = {};
    
    for (const [key, value] of Object.entries(source)) {
      result[key] = deepClone(value);
    }
    
    return result;
  }
  
  // Pour les types primitifs
  return source;
}

/**
 * Compare deux valeurs en profondeur pour déterminer si elles sont équivalentes
 * @param {*} value1 - Première valeur
 * @param {*} value2 - Deuxième valeur
 * @returns {boolean} Vrai si les valeurs sont équivalentes
 */
export function deepEquals(value1, value2) {
  // Vérification des types primitifs et des références identiques
  if (value1 === value2) {
    return true;
  }
  
  // Vérification si l'un des deux est null/undefined
  if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
    return false;
  }
  
  // Vérification des types
  if (typeof value1 !== typeof value2) {
    return false;
  }
  
  // Vérification des tableaux
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false;
    }
    
    for (let i = 0; i < value1.length; i++) {
      if (!deepEquals(value1[i], value2[i])) {
        return false;
      }
    }
    
    return true;
  }
  
  // Vérification des objets
  if (typeof value1 === 'object' && !Array.isArray(value1)) {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (!keys2.includes(key) || !deepEquals(value1[key], value2[key])) {
        return false;
      }
    }
    
    return true;
  }
  
  // Cas par défaut
  return false;
}
