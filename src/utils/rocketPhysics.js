// src/utils/rocketPhysics.js
// Utilitaires pour le calcul des performances des fusées

const KERBIN_GRAVITY = 9.81; // m/s²
const KERBIN_ATMOSPHERE_HEIGHT = 70000; // m
const KERBIN_RADIUS = 600000; // m

/**
 * Calcule le Delta-V pour une configuration donnée
 * Utilise l'équation de Tsiolkovsky: ΔV = Isp * g0 * ln(m0 / m1)
 * 
 * @param {Array} parts - Liste des pièces de la fusée
 * @param {Array} engines - Liste des moteurs de l'étage
 * @param {number} totalMassWithPayload - Masse totale incluant la charge utile (kg)
 * @param {number} altitude - Altitude pour le calcul (m)
 * @returns {number} Delta-V en m/s
 */
export const calculateDeltaV = (parts, engines, totalMassWithPayload, altitude = 0) => {
  if (!engines || engines.length === 0) return 0;
  
  // Déterminer le type d'environnement (espace ou atmosphère)
  const isVacuum = altitude >= KERBIN_ATMOSPHERE_HEIGHT;
  
  // Calculer l'ISP effective en fonction de l'altitude
  let totalThrust = 0;
  let weightedIsp = 0;
  
  engines.forEach(engine => {
    // Dans une implémentation réelle, vous récupéreriez ces données
    // depuis la base de données des pièces
    const engineData = _getEngineData(engine.partId);
    
    // ISP en fonction de l'environnement
    const effectiveIsp = isVacuum ? 
      engineData.isp.atmosphereLevel0 : 
      _interpolateIsp(engineData, altitude);
    
    // Poussée en fonction de l'environnement
    const effectiveThrust = isVacuum ?
      engineData.thrust :
      engineData.thrust * (effectiveIsp / engineData.isp.atmosphereLevel0);
    
    totalThrust += effectiveThrust;
    weightedIsp += effectiveThrust * effectiveIsp;
  });
  
  // ISP moyenne pondérée par la poussée
  const averageIsp = totalThrust > 0 ? weightedIsp / totalThrust : 0;
  
  // Calculer la masse sèche (sans carburant)
  const dryMass = _calculateDryMass(parts);
  
  // Calculer la masse de carburant
  const fuelMass = totalMassWithPayload - dryMass;
  
  if (fuelMass <= 0 || dryMass <= 0) return 0;
  
  // Masse initiale et finale
  const initialMass = totalMassWithPayload;
  const finalMass = dryMass;
  
  // Équation de Tsiolkovsky
  return averageIsp * KERBIN_GRAVITY * Math.log(initialMass / finalMass);
};

/**
 * Interpole l'ISP en fonction de l'altitude
 * @private
 * @param {Object} engineData - Données du moteur
 * @param {number} altitude - Altitude en mètres
 * @returns {number} ISP interpolée
 */
const _interpolateIsp = (engineData, altitude) => {
  // Ratio d'atmosphère (0 = vide, 1 = niveau de la mer)
  const atmRatio = Math.max(0, 1 - (altitude / KERBIN_ATMOSPHERE_HEIGHT));
  
  // Interpolation linéaire entre l'ISP du vide et l'ISP atmosphérique
  return engineData.isp.atmosphereLevel0 + 
         (engineData.isp.atmosphereLevel1 - engineData.isp.atmosphereLevel0) * atmRatio;
};

/**
 * Calcule le Thrust-to-Weight Ratio (TWR)
 * 
 * @param {Array} engines - Liste des moteurs
 * @param {number} totalMass - Masse totale en kg
 * @param {number} altitude - Altitude pour le calcul (m)
 * @returns {number} TWR (rapport poussée/poids)
 */
export const calculateTWR = (engines, totalMass, altitude = 0) => {
  if (!engines || engines.length === 0 || totalMass <= 0) return 0;
  
  const isVacuum = altitude >= KERBIN_ATMOSPHERE_HEIGHT;
  let totalThrust = 0;
  
  engines.forEach(engine => {
    const engineData = _getEngineData(engine.partId);
    
    // Poussée effective en fonction de l'environnement
    const effectiveThrust = isVacuum ?
      engineData.thrust :
      engineData.thrust * (engineData.isp.atmosphereLevel1 / engineData.isp.atmosphereLevel0);
    
    totalThrust += effectiveThrust;
  });
  
  // Calcul de la gravité locale
  const localGravity = _calculateLocalGravity(altitude);
  
  // Poids total
  const totalWeight = totalMass * localGravity;
  
  // TWR
  return totalThrust / totalWeight;
};

/**
 * Calcule la gravité locale en fonction de l'altitude
 * @private
 * @param {number} altitude - Altitude en mètres
 * @returns {number} Gravité locale en m/s²
 */
const _calculateLocalGravity = (altitude) => {
  // Loi de l'inverse du carré de la distance
  const distance = KERBIN_RADIUS + altitude;
  return KERBIN_GRAVITY * (KERBIN_RADIUS * KERBIN_RADIUS) / (distance * distance);
};

/**
 * Calcule la masse sèche de la fusée (sans carburant)
 * @private
 * @param {Array} parts - Liste des pièces
 * @returns {number} Masse sèche en kg
 */
const _calculateDryMass = (parts) => {
  let dryMass = 0;
  
  parts.forEach(part => {
    // Dans une implémentation réelle, vous récupéreriez ces données
    // depuis la base de données des pièces
    const partData = _getPartData(part.partId);
    
    if (partData.category === 'fuel_tank') {
      // Pour les réservoirs, on utilise la masse à vide
      dryMass += partData.dryMass;
    } else {
      // Pour les autres pièces, on utilise la masse totale
      dryMass += partData.mass;
    }
  });
  
  return dryMass;
};

/**
 * Calcule le temps de combustion
 * 
 * @param {Array} engines - Liste des moteurs
 * @param {number} fuelMass - Masse de carburant en kg
 * @returns {number} Temps de combustion en secondes
 */
export const calculateBurnTime = (engines, fuelMass) => {
  if (!engines || engines.length === 0 || fuelMass <= 0) return 0;
  
  let totalFuelConsumption = 0; // kg/s
  
  engines.forEach(engine => {
    const engineData = _getEngineData(engine.partId);
    // Le débit massique est calculé comme: Poussée / (Isp * g0)
    const massFlow = engineData.thrust / (engineData.isp.atmosphereLevel1 * KERBIN_GRAVITY);
    totalFuelConsumption += massFlow;
  });
  
  // Temps de combustion = masse de carburant / débit massique total
  return totalFuelConsumption > 0 ? fuelMass / totalFuelConsumption : 0;
};

/**
 * Récupère les données d'un moteur (simulation)
 * @private
 * @param {string} engineId - Identifiant du moteur
 * @returns {Object} Données du moteur
 */
const _getEngineData = (engineId) => {
  // Ceci est une simulation pour l'exemple
  // Dans une implémentation réelle, ces données viendraient d'une API
  const engineDatabase = {
    'lv-t30': {
      name: 'LV-T30 Liquid Fuel Engine',
      thrust: 215.0, // kN
      isp: {
        atmosphereLevel0: 320, // sec (vide)
        atmosphereLevel1: 290  // sec (niveau de la mer)
      }
    },
    'lv-t45': {
      name: 'LV-T45 Liquid Fuel Engine',
      thrust: 200.0, // kN
      isp: {
        atmosphereLevel0: 320, // sec (vide)
        atmosphereLevel1: 290  // sec (niveau de la mer)
      }
    },
    'reliant': {
      name: 'RE-L10 "Reliant" Liquid Fuel Engine',
      thrust: 240.0, // kN
      isp: {
        atmosphereLevel0: 310, // sec (vide)
        atmosphereLevel1: 265  // sec (niveau de la mer)
      }
    }
  };
  
  return engineDatabase[engineId] || {
    thrust: 0,
    isp: { atmosphereLevel0: 0, atmosphereLevel1: 0 }
  };
};

/**
 * Récupère les données d'une pièce (simulation)
 * @private
 * @param {string} partId - Identifiant de la pièce
 * @returns {Object} Données de la pièce
 */
const _getPartData = (partId) => {
  // Ceci est une simulation pour l'exemple
  // Dans une implémentation réelle, ces données viendraient d'une API
  const partDatabase = {
    'mk1-command-pod': {
      name: 'Mk1 Command Pod',
      category: 'command',
      mass: 0.84 // tonnes
    },
    'fl-t400': {
      name: 'FL-T400 Fuel Tank',
      category: 'fuel_tank',
      mass: 2.25, // tonnes (plein)
      dryMass: 0.25 // tonnes (vide)
    },
    'fl-t800': {
      name: 'FL-T800 Fuel Tank',
      category: 'fuel_tank',
      mass: 4.5, // tonnes (plein)
      dryMass: 0.5 // tonnes (vide)
    }
  };
  
  return partDatabase[partId] || { mass: 0, category: 'unknown' };
};

/**
 * Calcule l'efficacité d'une fusée
 * Ratio Delta-V / masse totale
 * 
 * @param {number} deltaV - Delta-V en m/s
 * @param {number} totalMass - Masse totale en kg
 * @returns {number} Efficacité (Delta-V / masse)
 */
export const calculateEfficiency = (deltaV, totalMass) => {
  if (totalMass <= 0) return 0;
  return deltaV / totalMass;
};
