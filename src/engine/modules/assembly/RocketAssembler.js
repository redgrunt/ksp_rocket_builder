/**
 * @fileoverview Module d'assemblage des fusées
 * Ce module gère la construction et la structure des fusées en permettant la connexion
 * et la déconnexion des pièces selon les règles d'assemblage.
 * @module engine/modules/assembly/RocketAssembler
 */

/**
 * Gère l'assemblage des fusées et les connexions entre pièces
 * @class
 */
class RocketAssembler {
  /**
   * Crée une instance de l'assembleur de fusées
   * @param {Object} core - Instance du noyau RocketCore
   * @constructor
   */
  constructor(core) {
    this.core = core;
    this.events = core.events;
    
    // Enregistrer les gestionnaires d'événements
    this.events.subscribe('part:added', this._onPartAdded.bind(this));
    this.events.subscribe('part:removed', this._onPartRemoved.bind(this));
  }

  /**
   * Connecte deux pièces ensemble
   * 
   * @param {string} childId - ID de la pièce enfant
   * @param {string} parentId - ID de la pièce parent
   * @param {string} [attachPointChild='bottom'] - Point d'attache sur l'enfant
   * @param {string} [attachPointParent='top'] - Point d'attache sur le parent
   * @returns {boolean} - True si la connexion a réussi
   */
  connectParts(childId, parentId, attachPointChild = 'bottom', attachPointParent = 'top') {
    // Vérifier les IDs des pièces
    const childPart = this._getPartById(childId);
    const parentPart = this._getPartById(parentId);
    
    if (!childPart || !parentPart) {
      console.error('Pièce introuvable pour la connexion');
      return false;
    }
    
    // Vérifier les points d'attache
    if (this._isNodeOccupied(parentId, attachPointParent)) {
      console.error(`Point d'attache ${attachPointParent} du parent déjà occupé`);
      return false;
    }
    
    if (this._isNodeOccupied(childId, attachPointChild)) {
      console.error(`Point d'attache ${attachPointChild} de l'enfant déjà occupé`);
      return false;
    }
    
    // Vérifier si la connexion créerait un cycle
    if (this._isCreatingCycle(childId, parentId)) {
      console.error('La connexion créerait un cycle dans la structure de la fusée');
      return false;
    }
    
    // Créer la connexion
    const connection = {
      parent: {
        id: parentId,
        node: attachPointParent
      },
      child: {
        id: childId,
        node: attachPointChild
      }
    };
    
    // Ajouter la connexion à la structure
    this.core.rocket.connections.push(connection);
    
    // Mettre à jour les statistiques et notifier
    this.core.events.publish('connection:created', { connection });
    this.core.events.publish('rocket:updated', { updateType: 'structure' });
    
    return true;
  }

  /**
   * Déconnecte deux pièces
   * 
   * @param {string} childId - ID de la pièce enfant
   * @param {string} parentId - ID de la pièce parent
   * @returns {boolean} - True si la déconnexion a réussi
   */
  disconnectParts(childId, parentId) {
    // Trouver la connexion
    const connectionIndex = this.core.rocket.connections.findIndex(conn => 
      conn.parent.id === parentId && conn.child.id === childId
    );
    
    if (connectionIndex === -1) {
      console.error('Connexion introuvable pour la déconnexion');
      return false;
    }
    
    // Récupérer la connexion avant suppression
    const connection = this.core.rocket.connections[connectionIndex];
    
    // Supprimer la connexion
    this.core.rocket.connections.splice(connectionIndex, 1);
    
    // Mettre à jour les statistiques et notifier
    this.core.events.publish('connection:removed', { connection });
    this.core.events.publish('rocket:updated', { updateType: 'structure' });
    
    return true;
  }

  /**
   * Déplace une pièce vers une nouvelle position
   * 
   * @param {string} partId - ID de la pièce à déplacer
   * @param {Object} newPosition - Nouvelle position {x, y, z}
   * @returns {boolean} - True si le déplacement a réussi
   */
  movePart(partId, newPosition) {
    const part = this._getPartById(partId);
    
    if (!part) {
      console.error(`Pièce introuvable pour le déplacement: ${partId}`);
      return false;
    }
    
    // Mettre à jour la position
    part.position = { ...part.position, ...newPosition };
    
    // Notifier du changement
    this.core.events.publish('part:moved', { part });
    this.core.events.publish('rocket:updated', { updateType: 'visual' });
    
    return true;
  }

  /**
   * Fait pivoter une pièce
   * 
   * @param {string} partId - ID de la pièce à pivoter
   * @param {Object} newRotation - Nouvelle rotation {x, y, z} en degrés
   * @returns {boolean} - True si la rotation a réussi
   */
  rotatePart(partId, newRotation) {
    const part = this._getPartById(partId);
    
    if (!part) {
      console.error(`Pièce introuvable pour la rotation: ${partId}`);
      return false;
    }
    
    // Mettre à jour la rotation
    part.rotation = { ...part.rotation, ...newRotation };
    
    // Notifier du changement
    this.core.events.publish('part:rotated', { part });
    this.core.events.publish('rocket:updated', { updateType: 'visual' });
    
    return true;
  }

  /**
   * Génère une structure hiérarchique de la fusée
   * 
   * @returns {Object} - Structure hiérarchique de la fusée
   */
  generateStructureTree() {
    // Trouver la pièce racine (généralement un module de commande)
    const rootPart = this._findRootPart();
    
    if (!rootPart) {
      return null;
    }
    
    // Construire l'arbre de manière récursive
    return this._buildStructureTree(rootPart.id);
  }

  /**
   * Vérifie si la fusée est structurellement valide
   * 
   * @returns {Object} - Résultat de la validation {valid, issues}
   */
  validateStructure() {
    const issues = [];
    
    // 1. Vérifier s'il y a au moins une pièce
    if (this.core.rocket.parts.length === 0) {
      issues.push({
        type: 'error',
        message: 'La fusée ne contient aucune pièce'
      });
      return { valid: false, issues };
    }
    
    // 2. Vérifier s'il y a une pièce racine (module de commande)
    const rootPart = this._findRootPart();
    if (!rootPart) {
      issues.push({
        type: 'error',
        message: 'La fusée nécessite un module de commande'
      });
    }
    
    // 3. Vérifier si toutes les pièces sont connectées
    const connectedPartIds = this._getAllConnectedParts(rootPart ? rootPart.id : null);
    const disconnectedParts = this.core.rocket.parts.filter(part => 
      !connectedPartIds.includes(part.id)
    );
    
    if (disconnectedParts.length > 0) {
      issues.push({
        type: 'warning',
        message: `${disconnectedParts.length} pièce(s) non connectée(s) à la structure principale`,
        parts: disconnectedParts.map(part => part.id)
      });
    }
    
    // 4. Vérifier les problèmes de stabilité
    const stabilityIssues = this._checkStabilityIssues();
    issues.push(...stabilityIssues);
    
    // Déterminer si la structure est valide (aucune erreur critique)
    const hasCriticalIssues = issues.some(issue => issue.type === 'error');
    
    return {
      valid: !hasCriticalIssues,
      issues
    };
  }

  /**
   * Gestionnaire d'événement pour l'ajout d'une pièce
   * @private
   * @param {Object} eventData - Données de l'événement
   */
  _onPartAdded(eventData) {
    const { part } = eventData;
    
    if (!part) return;
    
    // Logique supplémentaire après l'ajout d'une pièce
    // (par exemple, connexions automatiques si nécessaire)
  }

  /**
   * Gestionnaire d'événement pour la suppression d'une pièce
   * @private
   * @param {Object} eventData - Données de l'événement
   */
  _onPartRemoved(eventData) {
    const { partId } = eventData;
    
    if (!partId) return;
    
    // Supprimer toutes les connexions associées à cette pièce
    const connectionsToRemove = this.core.rocket.connections.filter(conn => 
      conn.parent.id === partId || conn.child.id === partId
    );
    
    connectionsToRemove.forEach(conn => {
      const index = this.core.rocket.connections.indexOf(conn);
      if (index !== -1) {
        this.core.rocket.connections.splice(index, 1);
        this.core.events.publish('connection:removed', { connection: conn });
      }
    });
    
    if (connectionsToRemove.length > 0) {
      this.core.events.publish('rocket:updated', { updateType: 'structure' });
    }
  }

  /**
   * Récupère une pièce par son ID
   * @private
   * @param {string} partId - ID de la pièce
   * @returns {Object|null} - Pièce trouvée ou null
   */
  _getPartById(partId) {
    return this.core.rocket.parts.find(part => part.id === partId) || null;
  }

  /**
   * Vérifie si un nœud d'attachement est occupé
   * @private
   * @param {string} partId - ID de la pièce
   * @param {string} nodeName - Nom du nœud d'attachement
   * @returns {boolean} - True si le nœud est occupé
   */
  _isNodeOccupied(partId, nodeName) {
    return this.core.rocket.connections.some(conn => 
      (conn.parent.id === partId && conn.parent.node === nodeName) ||
      (conn.child.id === partId && conn.child.node === nodeName)
    );
  }

  /**
   * Vérifie si la connexion créerait un cycle dans la structure
   * @private
   * @param {string} childId - ID de la pièce enfant
   * @param {string} parentId - ID de la pièce parent
   * @returns {boolean} - True si un cycle serait créé
   */
  _isCreatingCycle(childId, parentId) {
    // Si les deux pièces sont identiques, c'est un cycle
    if (childId === parentId) {
      return true;
    }
    
    // Obtenir toutes les pièces enfants du candidat enfant
    const allChildren = this._getAllChildParts(childId);
    
    // Si le parent potentiel est déjà un enfant, c'est un cycle
    return allChildren.includes(parentId);
  }

  /**
   * Obtient toutes les pièces enfants d'une pièce donnée
   * @private
   * @param {string} partId - ID de la pièce parent
   * @returns {Array} - Liste des IDs des pièces enfants
   */
  _getAllChildParts(partId) {
    const children = [];
    const toProcess = [partId];
    
    while (toProcess.length > 0) {
      const currentId = toProcess.shift();
      
      // Trouver toutes les connexions où cette pièce est le parent
      const directChildren = this.core.rocket.connections
        .filter(conn => conn.parent.id === currentId)
        .map(conn => conn.child.id);
      
      // Ajouter ces enfants à notre liste et à la file de traitement
      directChildren.forEach(childId => {
        if (!children.includes(childId)) {
          children.push(childId);
          toProcess.push(childId);
        }
      });
    }
    
    return children;
  }

  /**
   * Obtient toutes les pièces connectées à une pièce racine
   * @private
   * @param {string} rootId - ID de la pièce racine
   * @returns {Array} - Liste des IDs de toutes les pièces connectées
   */
  _getAllConnectedParts(rootId) {
    if (!rootId) return [];
    
    const connected = [rootId];
    const toProcess = [rootId];
    
    while (toProcess.length > 0) {
      const currentId = toProcess.shift();
      
      // Trouver toutes les connexions impliquant cette pièce
      const relatedConnections = this.core.rocket.connections.filter(conn => 
        conn.parent.id === currentId || conn.child.id === currentId
      );
      
      relatedConnections.forEach(conn => {
        // Déterminer l'autre pièce dans la connexion
        const otherId = conn.parent.id === currentId ? conn.child.id : conn.parent.id;
        
        if (!connected.includes(otherId)) {
          connected.push(otherId);
          toProcess.push(otherId);
        }
      });
    }
    
    return connected;
  }

  /**
   * Trouve la pièce racine (généralement un module de commande)
   * @private
   * @returns {Object|null} - Pièce racine ou null
   */
  _findRootPart() {
    // Stratégie 1: Chercher un module de commande
    const commandModule = this.core.rocket.parts.find(part => 
      part.partType === 'commandModule' || part.category === 'command'
    );
    
    if (commandModule) {
      return commandModule;
    }
    
    // Stratégie 2: Chercher une pièce qui est parent mais pas enfant
    const parentOnlyIds = this.core.rocket.connections
      .map(conn => conn.parent.id)
      .filter(parentId => 
        !this.core.rocket.connections.some(conn => conn.child.id === parentId)
      );
    
    if (parentOnlyIds.length > 0) {
      return this._getPartById(parentOnlyIds[0]);
    }
    
    // Stratégie 3: Prendre simplement la première pièce
    return this.core.rocket.parts.length > 0 ? this.core.rocket.parts[0] : null;
  }

  /**
   * Construit récursivement l'arbre de structure
   * @private
   * @param {string} partId - ID de la pièce racine de l'arbre
   * @returns {Object} - Nœud d'arbre avec enfants
   */
  _buildStructureTree(partId) {
    const part = this._getPartById(partId);
    
    if (!part) {
      return null;
    }
    
    // Créer le nœud pour cette pièce
    const node = {
      id: part.id,
      partId: part.partId,
      name: part.name || part.partId,
      type: part.partType,
      children: []
    };
    
    // Trouver toutes les pièces enfants directes
    const childConnections = this.core.rocket.connections
      .filter(conn => conn.parent.id === partId);
    
    // Ajouter récursivement les enfants
    childConnections.forEach(conn => {
      const childTree = this._buildStructureTree(conn.child.id);
      if (childTree) {
        node.children.push(childTree);
      }
    });
    
    return node;
  }

  /**
   * Vérifie les problèmes de stabilité structurelle
   * @private
   * @returns {Array} - Liste des problèmes de stabilité détectés
   */
  _checkStabilityIssues() {
    const issues = [];
    
    // 1. Vérifier les pièces sans support adéquat
    this.core.rocket.parts.forEach(part => {
      if (this._isRequiringRadialSupport(part.id) && !this._hasAdequateSupport(part.id)) {
        issues.push({
          type: 'warning',
          message: `La pièce ${part.name || part.id} n'a pas un support structurel adéquat`,
          part: part.id
        });
      }
    });
    
    // 2. Vérifier l'équilibre des poussées
    if (this._isThrustvectoringImbalanced()) {
      issues.push({
        type: 'warning',
        message: 'La poussée des moteurs est déséquilibrée, ce qui peut causer des problèmes de stabilité en vol'
      });
    }
    
    // 3. Vérifier les ratios de masse excessifs
    const excessiveMassRatio = this._checkExcessiveMassRatios();
    if (excessiveMassRatio > 10) {  // Seuil arbitraire
      issues.push({
        type: 'warning',
        message: `Rapport masse/structure élevé (${excessiveMassRatio.toFixed(1)}), ce qui peut causer des ruptures`
      });
    }
    
    return issues;
  }

  /**
   * Vérifie si une pièce nécessite un support radial
   * @private
   * @param {string} partId - ID de la pièce
   * @returns {boolean} - True si la pièce nécessite un support
   */
  _isRequiringRadialSupport(partId) {
    const part = this._getPartById(partId);
    
    if (!part) return false;
    
    // Certaines pièces nécessitent un support radial
    return part.category === 'engines' && part.size === 'large';
  }

  /**
   * Vérifie si une pièce a un support structurel adéquat
   * @private
   * @param {string} partId - ID de la pièce
   * @returns {boolean} - True si la pièce a un support adéquat
   */
  _hasAdequateSupport(partId) {
    // Compter le nombre de connexions
    const connections = this.core.rocket.connections.filter(conn => 
      conn.parent.id === partId || conn.child.id === partId
    );
    
    // Pour certaines pièces, un seul point de connexion n'est pas suffisant
    return connections.length >= 2;
  }

  /**
   * Vérifie si la vectorisation de poussée est déséquilibrée
   * @private
   * @returns {boolean} - True si la poussée est déséquilibrée
   */
  _isThrustvectoringImbalanced() {
    // Calculer le centre de poussée
    // C'est une simplification - dans la réalité, cela nécessiterait des calculs plus complexes
    
    // Pour simplifier, nous supposerons que le déséquilibre est détecté
    // si les moteurs ne sont pas symétriquement placés
    
    // Trouver tous les moteurs
    const engines = this.core.rocket.parts.filter(part => part.category === 'engines');
    
    if (engines.length <= 1) {
      return false; // Un seul moteur est considéré comme équilibré par défaut
    }
    
    // Calculer le centre moyen des moteurs
    let sumX = 0, sumY = 0, sumZ = 0;
    
    engines.forEach(engine => {
      sumX += engine.position.x || 0;
      sumY += engine.position.y || 0;
      sumZ += engine.position.z || 0;
    });
    
    const centerX = sumX / engines.length;
    const centerY = sumY / engines.length;
    const centerZ = sumZ / engines.length;
    
    // Calculer les écarts types pour détecter l'asymétrie
    let varianceX = 0, varianceY = 0, varianceZ = 0;
    
    engines.forEach(engine => {
      varianceX += Math.pow((engine.position.x || 0) - centerX, 2);
      varianceY += Math.pow((engine.position.y || 0) - centerY, 2);
      varianceZ += Math.pow((engine.position.z || 0) - centerZ, 2);
    });
    
    const stdDevX = Math.sqrt(varianceX / engines.length);
    const stdDevY = Math.sqrt(varianceY / engines.length);
    const stdDevZ = Math.sqrt(varianceZ / engines.length);
    
    // Si l'écart-type est trop important, la poussée est déséquilibrée
    // C'est une heuristique simple
    const threshold = 0.5; // Seuil arbitraire
    
    return stdDevX > threshold || stdDevY > threshold || stdDevZ > threshold;
  }

  /**
   * Vérifie les ratios de masse excessifs
   * @private
   * @returns {number} - Ratio de masse maximal détecté
   */
  _checkExcessiveMassRatios() {
    // Trouver le ratio de masse le plus élevé entre deux pièces connectées
    let maxRatio = 0;
    
    this.core.rocket.connections.forEach(conn => {
      const parentPart = this._getPartById(conn.parent.id);
      const childPart = this._getPartById(conn.child.id);
      
      if (!parentPart || !childPart) return;
      
      // Masse des pièces
      const parentMass = parentPart.mass || 1;
      const childMass = childPart.mass || 1;
      
      // Calculer le ratio
      const ratio = Math.max(parentMass / childMass, childMass / parentMass);
      
      if (ratio > maxRatio) {
        maxRatio = ratio;
      }
    });
    
    return maxRatio;
  }
}

// Exporter la classe
export default RocketAssembler;
