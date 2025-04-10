/**
 * @fileoverview Utilitaires de formatage pour la validation des données
 * @module api/utils/datavalidator/formatters
 */

import { ERROR_CODES, ERROR_TYPES } from './constants.js';

/**
 * Formatte une erreur de validation
 * @param {string} message - Message d'erreur
 * @param {string} path - Chemin vers la valeur problématique
 * @param {string} code - Code d'erreur
 * @param {string} type - Type d'erreur (ERROR, WARNING, INFO)
 * @returns {Object} - Erreur formattée
 */
export function formatError(message, path = '', code = ERROR_CODES.INVALID_VALUE, type = ERROR_TYPES.ERROR) {
  return {
    type,
    code,
    path,
    message,
    timestamp: Date.now()
  };
}