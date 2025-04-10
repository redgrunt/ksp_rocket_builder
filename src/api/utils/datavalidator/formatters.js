/**
 * @fileoverview Fonctions de formatage pour le système de validation
 * @module api/utils/datavalidator/formatters
 */

import { ERROR_TYPES, ERROR_CODES } from './constants.js';

/**
 * Formate un message d'erreur de validation
 * @param {string} message - Message d'erreur descriptif
 * @param {string} path - Chemin d'accès à la propriété concernée
 * @param {string} code - Code d'erreur (voir ERROR_CODES)
 * @param {string} [type=ERROR_TYPES.ERROR] - Type d'erreur (voir ERROR_TYPES)
 * @param {Object} [details={}] - Détails supplémentaires sur l'erreur
 * @returns {Object} Objet représentant l'erreur
 */
export function formatError(message, path, code, type = ERROR_TYPES.ERROR, details = {}) {
  return {
    message,
    path,
    code: code || ERROR_CODES.CONSTRAINT_VIOLATION,
    type: type || ERROR_TYPES.ERROR,
    timestamp: new Date().toISOString(),
    details
  };
}

/**
 * Formate un résultat de validation complet
 * @param {boolean} valid - Indique si la validation est réussie
 * @param {Array} errors - Tableau des erreurs
 * @param {Array} [warnings=[]] - Tableau des avertissements
 * @param {Array} [infos=[]] - Tableau des informations
 * @param {Object} [metadata={}] - Métadonnées supplémentaires
 * @returns {Object} Résultat de validation formaté
 */
export function formatValidationResult(valid, errors, warnings = [], infos = [], metadata = {}) {
  return {
    valid,
    errors,
    warnings,
    infos,
    timestamp: new Date().toISOString(),
    metadata
  };
}

/**
 * Formate une erreur de référence pour une entité manquante
 * @param {string} entityType - Type d'entité manquante
 * @param {string} entityId - Identifiant de l'entité manquante
 * @param {string} referencingEntityType - Type d'entité qui fait la référence
 * @param {string} referencingEntityId - Identifiant de l'entité qui fait la référence
 * @param {string} referencePath - Chemin d'accès de la référence
 * @returns {Object} Erreur de référence formatée
 */
export function formatReferenceError(entityType, entityId, referencingEntityType, referencingEntityId, referencePath) {
  return formatError(
    `Référence invalide: ${referencingEntityType} '${referencingEntityId}' fait référence à ${entityType} '${entityId}' qui n'existe pas`,
    referencePath,
    ERROR_CODES.REFERENCE_ERROR,
    ERROR_TYPES.ERROR,
    {
      entityType,
      entityId,
      referencingEntityType,
      referencingEntityId
    }
  );
}

/**
 * Formate un message d'avertissement
 * @param {string} message - Message d'avertissement descriptif
 * @param {string} path - Chemin d'accès à la propriété concernée
 * @param {string} code - Code d'avertissement
 * @param {Object} [details={}] - Détails supplémentaires sur l'avertissement
 * @returns {Object} Avertissement formaté
 */
export function formatWarning(message, path, code, details = {}) {
  return formatError(message, path, code, ERROR_TYPES.WARNING, details);
}

/**
 * Formate un message d'information
 * @param {string} message - Message d'information descriptif
 * @param {string} path - Chemin d'accès à la propriété concernée
 * @param {string} code - Code d'information
 * @param {Object} [details={}] - Détails supplémentaires sur l'information
 * @returns {Object} Information formatée
 */
export function formatInfo(message, path, code, details = {}) {
  return formatError(message, path, code, ERROR_TYPES.INFO, details);
}

/**
 * Formate un résumé des erreurs de validation
 * @param {Object} validationResult - Résultat de validation complet
 * @returns {Object} Résumé des erreurs par type et code
 */
export function formatErrorSummary(validationResult) {
  const { errors, warnings, infos } = validationResult;
  
  const summary = {
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    totalInfos: infos.length,
    totalIssues: errors.length + warnings.length + infos.length,
    errorsByCode: {},
    warningsByCode: {},
    infosByCode: {}
  };
  
  // Compter les erreurs par code
  errors.forEach(error => {
    if (!summary.errorsByCode[error.code]) {
      summary.errorsByCode[error.code] = 0;
    }
    summary.errorsByCode[error.code]++;
  });
  
  // Compter les avertissements par code
  warnings.forEach(warning => {
    if (!summary.warningsByCode[warning.code]) {
      summary.warningsByCode[warning.code] = 0;
    }
    summary.warningsByCode[warning.code]++;
  });
  
  // Compter les informations par code
  infos.forEach(info => {
    if (!summary.infosByCode[info.code]) {
      summary.infosByCode[info.code] = 0;
    }
    summary.infosByCode[info.code]++;
  });
  
  return summary;
}

/**
 * Groupe les erreurs par chemin d'accès
 * @param {Array} errors - Tableau d'erreurs
 * @returns {Object} Erreurs groupées par chemin
 */
export function groupErrorsByPath(errors) {
  const grouped = {};
  
  errors.forEach(error => {
    const path = error.path || 'global';
    
    if (!grouped[path]) {
      grouped[path] = [];
    }
    
    grouped[path].push(error);
  });
  
  return grouped;
}

/**
 * Convertit un résultat de validation en chaîne de caractères lisible
 * @param {Object} validationResult - Résultat de validation
 * @returns {string} Représentation textuelle du résultat
 */
export function validationResultToString(validationResult) {
  const { valid, errors, warnings, infos } = validationResult;
  
  let result = `Validation ${valid ? 'réussie' : 'échouée'}\n`;
  result += `- ${errors.length} erreur(s)\n`;
  result += `- ${warnings.length} avertissement(s)\n`;
  result += `- ${infos.length} information(s)\n\n`;
  
  if (errors.length > 0) {
    result += 'Erreurs:\n';
    errors.forEach(error => {
      result += `- [${error.code}] ${error.path ? `${error.path}: ` : ''}${error.message}\n`;
    });
    result += '\n';
  }
  
  if (warnings.length > 0) {
    result += 'Avertissements:\n';
    warnings.forEach(warning => {
      result += `- [${warning.code}] ${warning.path ? `${warning.path}: ` : ''}${warning.message}\n`;
    });
    result += '\n';
  }
  
  if (infos.length > 0) {
    result += 'Informations:\n';
    infos.forEach(info => {
      result += `- [${info.code}] ${info.path ? `${info.path}: ` : ''}${info.message}\n`;
    });
  }
  
  return result;
}
