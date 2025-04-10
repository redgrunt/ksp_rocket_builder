/**
 * @fileoverview Fonctions utilitaires pour l'accès sécurisé aux données
 * Permet d'éviter les erreurs liées aux données manquantes ou nulles.
 * @module utils/SafeAccess
 */

/**
 * Obtient une valeur imbriquée dans un objet de façon sécurisée
 * Évite les erreurs si un chemin intermédiaire est null ou undefined
 * 
 * @param {Object} obj - L'objet à explorer
 * @param {string|Array} path - Chemin d'accès (ex: "user.address.city" ou ["user", "address", "city"])
 * @param {*} defaultValue - Valeur par défaut si le chemin n'existe pas
 * @returns {*} - La valeur trouvée ou la valeur par défaut
 * 
 * @example
 * // Retourne "Paris" si l'objet complet existe, sinon "Unknown"
 * const city = getNestedValue(user, "address.city", "Unknown");
 */
export function getNestedValue(obj, path, defaultValue = null) {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  // Convertir le chemin en tableau s'il est sous forme de chaîne
  const keys = Array.isArray(path) ? path : path.split('.');
  
  // Cas spécial pour un chemin vide
  if (keys.length === 0) {
    return obj;
  }
  
  // Parcourir l'objet en suivant le chemin
  let result = obj;
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    
    // Si à un moment donné la valeur est null ou undefined, retourner la valeur par défaut
    if (result === null || result === undefined || result[key] === undefined) {
      return defaultValue;
    }
    
    result = result[key];
  }
  
  return result;
}

/**
 * Définit une valeur imbriquée dans un objet de façon sécurisée
 * Crée les objets intermédiaires si nécessaire
 * 
 * @param {Object} obj - L'objet à modifier
 * @param {string|Array} path - Chemin d'accès
 * @param {*} value - Valeur à définir
 * @returns {Object} - L'objet modifié
 * 
 * @example
 * // Crée automatiquement les objets address et contact si nécessaire
 * setNestedValue(user, "address.contact.email", "user@example.com");
 */
export function setNestedValue(obj, path, value) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Convertir le chemin en tableau s'il est sous forme de chaîne
  const keys = Array.isArray(path) ? path : path.split('.');
  
  // Cas spécial pour un chemin vide
  if (keys.length === 0) {
    return obj;
  }
  
  // Parcourir et créer la structure si nécessaire
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    // Créer l'objet intermédiaire s'il n'existe pas
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    
    current = current[key];
  }
  
  // Définir la valeur finale
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
  
  return obj;
}

/**
 * Sécurise l'accès à un objet pour éviter les erreurs sur propriétés nulles
 * 
 * @param {Object} obj - L'objet à sécuriser
 * @param {Object} defaultValues - Valeurs par défaut pour les propriétés
 * @returns {Object} - Un proxy sécurisé
 * 
 * @example
 * const safeUser = safeObject(user, { name: "Guest", email: "unknown" });
 * // Ne causera pas d'erreur même si user est null
 * console.log(safeUser.name);
 */
export function safeObject(obj, defaultValues = {}) {
  // Si l'objet est null ou undefined, utiliser un objet vide
  const targetObj = obj || {};
  
  return new Proxy(targetObj, {
    get(target, prop) {
      // Utiliser la valeur si elle existe, sinon la valeur par défaut
      if (prop in target) {
        return target[prop];
      }
      
      // Retourner la valeur par défaut si spécifiée
      if (prop in defaultValues) {
        return defaultValues[prop];
      }
      
      // Sinon retourner null pour éviter les erreurs
      return null;
    }
  });
}

/**
 * Valide qu'un objet contient toutes les propriétés requises
 * Utile pour vérifier que les données chargées sont complètes
 * 
 * @param {Object} obj - L'objet à valider
 * @param {Array<string>} requiredProps - Liste des propriétés requises
 * @returns {Object} - Résultat de la validation { valid: boolean, missing: Array }
 * 
 * @example
 * const validation = validateRequiredProps(part, ["id", "name", "mass"]);
 * if (!validation.valid) {
 *   console.error("Propriétés manquantes:", validation.missing);
 * }
 */
export function validateRequiredProps(obj, requiredProps) {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, missing: requiredProps };
  }

  const missing = requiredProps.filter(prop => {
    const value = getNestedValue(obj, prop);
    return value === null || value === undefined;
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Applique des valeurs par défaut à un objet de façon non destructive
 * Ne modifie que les propriétés manquantes ou nulles
 * 
 * @param {Object} obj - L'objet à compléter
 * @param {Object} defaults - Valeurs par défaut à appliquer
 * @returns {Object} - L'objet complété
 * 
 * @example
 * const completePart = applyDefaults(part, {
 *   mass: { dry: 0, wet: 0 },
 *   cost: 0,
 *   resources: []
 * });
 */
export function applyDefaults(obj, defaults) {
  if (!obj || typeof obj !== 'object') {
    return { ...defaults };
  }

  const result = { ...obj };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    // Si la propriété n'existe pas ou est null/undefined
    if (result[key] === undefined || result[key] === null) {
      result[key] = defaultValue;
    } 
    // Si la propriété et la valeur par défaut sont des objets, appliquer récursivement
    else if (typeof result[key] === 'object' && !Array.isArray(result[key]) && 
             typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
      result[key] = applyDefaults(result[key], defaultValue);
    }
    // Cas spécial pour les tableaux vides
    else if (Array.isArray(result[key]) && result[key].length === 0 && Array.isArray(defaultValue) && defaultValue.length > 0) {
      result[key] = [...defaultValue];
    }
  }

  return result;
}

/**
 * Génère une version sécurisée d'une fonction en gérant les erreurs
 * Utile pour les méthodes d'API qui ne doivent pas planter
 * 
 * @param {Function} fn - Fonction à sécuriser
 * @param {*} defaultReturn - Valeur à retourner en cas d'erreur
 * @returns {Function} - Version sécurisée de la fonction
 * 
 * @example
 * const safeParsePart = safeFn(parsePart, { id: "unknown", mass: 0 });
 * // Ne plantera jamais, retournera au pire la valeur par défaut
 * const part = safeParsePart(rawData);
 */
export function safeFn(fn, defaultReturn = null) {
  return function(...args) {
    try {
      return fn(...args);
    } catch (error) {
      console.warn(`Error in function ${fn.name || 'anonymous'}:`, error);
      return defaultReturn;
    }
  };
}