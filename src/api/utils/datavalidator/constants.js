/**
 * @fileoverview Constantes pour la validation des données KSP
 * @module api/utils/datavalidator/constants
 */

/**
 * Types de validations supportées
 * @enum {string}
 */
export const VALIDATION_TYPES = {
  PART: 'part',
  CELESTIAL_BODY: 'celestial_body',
  RESOURCE: 'resource',
  TECH: 'tech'
};

/**
 * Niveaux de gravité des erreurs
 * @enum {string}
 */
export const ERROR_TYPES = {
  ERROR: 'ERROR',      // Erreur critique qui empêche le bon fonctionnement
  WARNING: 'WARNING',  // Problème potentiel qui n'empêche pas le fonctionnement
  INFO: 'INFO'         // Information non critique
};

/**
 * Codes d'erreur standard
 * @enum {string}
 */
export const ERROR_CODES = {
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_VALUE: 'INVALID_VALUE',
  REFERENCE_ERROR: 'REFERENCE_ERROR',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  UNUSUAL_VALUE: 'UNUSUAL_VALUE',
  OPTIMIZATION_SUGGESTION: 'OPTIMIZATION_SUGGESTION'
};