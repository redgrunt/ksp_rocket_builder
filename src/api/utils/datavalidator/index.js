/**
 * @fileoverview Point d'entrée pour le module DataValidator
 * @module api/utils/datavalidator
 */

import DataValidator from './DataValidator.js';
import { VALIDATION_TYPES, ERROR_TYPES, ERROR_CODES } from './constants.js';

// Créer et exporter l'instance singleton
const validator = new DataValidator();

// Exporter les constantes pour faciliter l'accès
export { VALIDATION_TYPES, ERROR_TYPES, ERROR_CODES };

// Exporter l'instance singleton par défaut
export default validator;
