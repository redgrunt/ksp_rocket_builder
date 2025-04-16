// src/engine/modules/core/RocketConfig.js
/**
 * @module RocketConfig
 * @description Configuration globale pour Rocket.js
 */

/**
 * @class RocketConfig
 * @description Gère la configuration globale du système Rocket.js
 */
class RocketConfig {
  /**
   * @constructor
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    // Constantes globales
    this.KERBIN_GRAVITY = 9.81; // m/s²
    this.KERBIN_ATMOSPHERE_HEIGHT = 70000; // m
    this.KERBIN_RADIUS = 600000; // m
    
    // Version
    this.VERSION = options.version || '0.3.0';
    
    // Configuration de l'environnement
    this.environment = {
      planet: options.planet || 'kerbin',
      atmosphere: options.hasAtmosphere !== undefined ? options.hasAtmosphere : true,
      gravity: options.gravity || this.KERBIN_GRAVITY
    };
    
    // Options de calcul
    this.calculation = {
      includeAtmosphericEffects: options.includeAtmosphericEffects !== undefined 
        ? options.includeAtmosphericEffects 
        : true,
      includeGravityTurn: options.includeGravityTurn !== undefined 
        ? options.includeGravityTurn 
        : true,
      includeGravityLosses: options.includeGravityLosses !== undefined 
        ? options.includeGravityLosses 
        : true,
      accuracyLevel: options.accuracyLevel || 'standard' // 'simple', 'standard', 'detailed'
    };
    
    // Configuration des étages
    this.staging = {
      autoAssignNewParts: options.autoAssignNewParts !== undefined 
        ? options.autoAssignNewParts 
        : true,
      autoNumberStages: options.autoNumberStages !== undefined 
        ? options.autoNumberStages 
        : true,
      defaultStageName: options.defaultStageName || 'Stage'
    };
    
    // Configuration de l'interface
    this.ui = {
      showGridLines: options.showGridLines !== undefined ? options.showGridLines : true,
      autoUpdateStats: options.autoUpdateStats !== undefined ? options.autoUpdateStats : true,
      defaultUnits: options.defaultUnits || 'metric', // 'metric', 'imperial'
      decimalPrecision: options.decimalPrecision || 2
    };
    
    // Fusée initiale (optionnelle)
    this.initialRocket = options.initialRocket || null;
    
    // Charger les options personnalisées
    this._loadCustomOptions(options);
  }
  
  /**
   * Charge les options personnalisées
   * @private
   * @param {Object} options - Options supplémentaires
   */
  _loadCustomOptions(options) {
    // Extension pour les options personnalisées
    if (options.custom) {
      Object.assign(this, options.custom);
    }
  }
  
  /**
   * Met à jour la configuration
   * @param {Object} newOptions - Nouvelles options
   * @returns {Object} Configuration mise à jour
   */
  update(newOptions) {
    // Mettre à jour les options existantes
    if (newOptions.environment) {
      Object.assign(this.environment, newOptions.environment);
    }
    
    if (newOptions.calculation) {
      Object.assign(this.calculation, newOptions.calculation);
    }
    
    if (newOptions.staging) {
      Object.assign(this.staging, newOptions.staging);
    }
    
    if (newOptions.ui) {
      Object.assign(this.ui, newOptions.ui);
    }
    
    // Charger les nouvelles options personnalisées
    this._loadCustomOptions(newOptions);
    
    return this;
  }
  
  /**
   * Obtient la constante de gravité pour le corps céleste actuel
   * @returns {number} Constante de gravité en m/s²
   */
  getGravity() {
    return this.environment.gravity;
  }
  
  /**
   * Définit la précision des calculs
   * @param {string} level - Niveau de précision ('simple', 'standard', 'detailed')
   */
  setAccuracyLevel(level) {
    const validLevels = ['simple', 'standard', 'detailed'];
    if (validLevels.includes(level)) {
      this.calculation.accuracyLevel = level;
    } else {
      console.warn(`Niveau de précision invalide: ${level}. Utilisation de 'standard'.`);
      this.calculation.accuracyLevel = 'standard';
    }
  }
  
  /**
   * Obtient les paramètres spécifiques à un corps céleste
   * @param {string} bodyName - Nom du corps céleste
   * @returns {Object} Paramètres du corps céleste
   */
  getCelestialBodyParams(bodyName = null) {
    const bodyToUse = bodyName || this.environment.planet;
    
    // Table des corps célestes (simplifié)
    const bodies = {
      kerbin: {
        gravity: 9.81,
        atmosphereHeight: 70000,
        radius: 600000,
        hasAtmosphere: true
      },
      mun: {
        gravity: 1.63,
        atmosphereHeight: 0,
        radius: 200000,
        hasAtmosphere: false
      },
      minmus: {
        gravity: 0.491,
        atmosphereHeight: 0,
        radius: 60000,
        hasAtmosphere: false
      },
      // Autres corps célestes...
    };
    
    return bodies[bodyToUse] || bodies.kerbin;
  }
  
  /**
   * Obtient la configuration au format JSON
   * @returns {Object} Configuration complète
   */
  toJSON() {
    return {
      version: this.VERSION,
      environment: { ...this.environment },
      calculation: { ...this.calculation },
      staging: { ...this.staging },
      ui: { ...this.ui }
    };
  }
}

export default RocketConfig;
