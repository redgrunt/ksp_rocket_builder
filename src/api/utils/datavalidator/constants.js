/**
 * @fileoverview Constantes pour le système de validation des données
 * @module api/utils/datavalidator/constants
 */

/**
 * Types d'entités pour la validation
 * @enum {string}
 */
export const VALIDATION_TYPES = {
  PART: 'part',
  CELESTIAL_BODY: 'celestial_body',
  RESOURCE: 'resource',
  TECH: 'tech'
};

/**
 * Types d'erreurs pour la validation
 * @enum {string}
 */
export const ERROR_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Codes d'erreur pour la validation
 * @enum {string}
 */
export const ERROR_CODES = {
  // Erreurs générales
  REQUIRED_FIELD_MISSING: 'required_field_missing',
  INVALID_TYPE: 'invalid_type',
  INVALID_VALUE: 'invalid_value',
  CONSTRAINT_VIOLATION: 'constraint_violation',
  REFERENCE_ERROR: 'reference_error',
  
  // Avertissements
  UNUSUAL_VALUE: 'unusual_value',
  RECOMMENDED_FIELD_MISSING: 'recommended_field_missing',
  PERFORMANCE_ISSUE: 'performance_issue',
  DEPRECATED_FEATURE: 'deprecated_feature',
  
  // Informations
  SUGGESTION: 'suggestion',
  OPTIMIZATION: 'optimization'
};

/**
 * Limites et contraintes pour la validation
 * @enum {number}
 */
export const VALIDATION_LIMITS = {
  MAX_ISP: 5000,           // ISP maximum réaliste (secondes)
  MAX_THRUST: 10000,       // Poussée maximum réaliste (kN)
  MAX_MASS: 1000,          // Masse maximum pour une pièce simple (tonnes)
  MAX_COST: 100000,        // Coût maximum pour une pièce simple
  MAX_ATTACH_NODES: 20,    // Nombre maximum de noeuds d'attachement
  MAX_PART_MODULES: 50,    // Nombre maximum de modules pour une pièce
  MAX_RESOURCES: 10,       // Nombre maximum de ressources dans une pièce
};

/**
 * Catégories de pièces valides
 * @enum {string}
 */
export const PART_CATEGORIES = {
  COMMAND: 'command',
  STRUCTURAL: 'structural',
  FUEL_TANKS: 'fuel_tanks',
  ENGINES: 'engines',
  CONTROL: 'control',
  COUPLING: 'coupling',
  PAYLOAD: 'payload',
  AERODYNAMIC: 'aerodynamic',
  UTILITY: 'utility',
  SCIENCE: 'science',
  ELECTRICAL: 'electrical',
  GROUND: 'ground',
  THERMAL: 'thermal'
};

/**
 * Types de corps célestes valides
 * @enum {string}
 */
export const CELESTIAL_BODY_TYPES = {
  STAR: 'star',
  PLANET: 'planet',
  MOON: 'moon',
  DWARF_PLANET: 'dwarf_planet',
  ASTEROID: 'asteroid',
  COMET: 'comet'
};

/**
 * Modes de flux de ressources valides
 * @enum {string}
 */
export const RESOURCE_FLOW_MODES = {
  NO_FLOW: 'NO_FLOW',
  ALL_VESSEL: 'ALL_VESSEL',
  STAGE_PRIORITY_FLOW: 'STAGE_PRIORITY_FLOW',
  STAGE_STACK_FLOW: 'STAGE_STACK_FLOW',
  STAGE_LOCKED: 'STAGE_LOCKED'
};

/**
 * Types de propergols valides
 * @enum {string}
 */
export const PROPELLANT_TYPES = {
  LIQUID_FUEL: 'LiquidFuel',
  OXIDIZER: 'Oxidizer',
  MONOPROPELLANT: 'MonoPropellant',
  SOLID_FUEL: 'SolidFuel',
  XENON_GAS: 'XenonGas',
  ELECTRIC_CHARGE: 'ElectricCharge'
};
