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
    
    // Consommation de carburant = poussée / (Isp * g0)
    const fuelConsumption = engineData.thrust / (engineData.isp.atmosphereLevel1 * KERBIN_GRAVITY);
    totalFuelConsumption += fuelConsumption;
  });
  
  if (totalFuelConsumption <= 0) return 0;
  
  // Temps = masse de carburant / consommation
  return fuelMass / totalFuelConsumption;
};

/**
 * Récupère les données d'un moteur par son ID
 * @private
 * @param {string} engineId - ID du moteur
 * @returns {Object} Données du moteur
 */
const _getEngineData = (engineId) => {
  // Dans une implémentation réelle, ces données viendraient d'une API ou d'une base de données
  // Ceci est juste un exemple
  const engineData = {
    // ID du moteur
    id: engineId,
    
    // Poussée en Newtons
    thrust: 100000,
    
    // ISP à différents niveaux d'atmosphère
    isp: {
      // ISP dans le vide
      atmosphereLevel0: 350,
      
      // ISP au niveau de la mer
      atmosphereLevel1: 300
    },
    
    // Consommation de carburant en kg/s
    fuelConsumption: 10
  };
  
  return engineData;
};

/**
 * Récupère les données d'une pièce par son ID
 * @private
 * @param {string} partId - ID de la pièce
 * @returns {Object} Données de la pièce
 */
const _getPartData = (partId) => {
  // Dans une implémentation réelle, ces données viendraient d'une API ou d'une base de données
  // Ceci est juste un exemple
  const partData = {
    // ID de la pièce
    id: partId,
    
    // Catégorie de la pièce
    category: 'fuel_tank',
    
    // Masse totale en kg
    mass: 1000,
    
    // Masse à vide pour les réservoirs
    dryMass: 100
  };
  
  return partData;
};

/**
 * Calcule l'efficacité de la fusée (ratio DeltaV / masse)
 * 
 * @param {number} deltaV - Delta-V de la fusée
 * @param {number} totalMass - Masse totale
 * @returns {number} Efficacité en m/s par kg
 */
export const calculateEfficiency = (deltaV, totalMass) => {
  if (totalMass <= 0) return 0;
  return deltaV / totalMass;
};

/**
 * Estime la hauteur maximale atteignable
 * 
 * @param {number} deltaV - Delta-V disponible
 * @param {number} initialTWR - TWR initial
 * @returns {number} Hauteur estimée en mètres
 */
export const estimateMaxHeight = (deltaV, initialTWR) => {
  if (deltaV <= 0 || initialTWR <= 0) return 0;
  
  // Calcul simplifié basé sur une approximation
  // Dans un cas réel, il faudrait une simulation complète
  
  // Si TWR < 1, la fusée ne peut pas décoller
  if (initialTWR < 1) return 0;
  
  // Vitesse nécessaire pour l'orbite basse de Kerbin
  const orbitalVelocity = 2200; // m/s
  
  // Pertes dues à la traînée et à la gravité (estimation)
  const gravityDragLoss = 1500; // m/s
  
  // Delta-V requis pour l'orbite
  const requiredDeltaV = orbitalVelocity + gravityDragLoss;
  
  if (deltaV < requiredDeltaV) {
    // Estimation approximative pour les vols suborbitaux
    return (deltaV / requiredDeltaV) * KERBIN_ATMOSPHERE_HEIGHT;
  } else {
    // Pour les vols orbitaux, calculer l'altitude maximale
    const excessDeltaV = deltaV - requiredDeltaV;
    const baseOrbit = 80000; // m, orbite basse de Kerbin
    
    // Estimation de l'altitude supplémentaire en fonction du Delta-V excédentaire
    return baseOrbit + (excessDeltaV * 100);
  }
};
