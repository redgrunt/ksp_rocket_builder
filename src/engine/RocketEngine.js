// src/engine/RocketEngine.js
// Moteur de visualisation 3D pour KSP Rocket Builder

/**
 * @class RocketEngine
 * @description Moteur de visualisation 3D pour KSP Rocket Builder
 * Gère le rendu, l'assemblage et l'interaction avec les modèles 3D des pièces
 */
class RocketEngine {
  /**
   * Crée une instance du moteur de visualisation
   * @param {HTMLElement} containerElement - Élément HTML conteneur pour le rendu
   */
  constructor(containerElement) {
    // Éléments de base Three.js
    this.container = containerElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance' // Optimisation pour les performances
    });
    
    // Configuration du renderer
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limite pour de meilleures performances
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Lumières
    this.setupLights();
    
    // Contrôles
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Position initiale de la caméra
    this.camera.position.set(0, 5, 10);
    this.controls.update();
    
    // Loaders pour les modèles 3D
    this.setupLoaders();
    
    // Gestion des pièces
    this.parts = new Map(); // stockage des modèles par ID
    this.partInstances = new Map(); // instances de pièces placées dans la scène
    this.instancedMeshes = new Map(); // stockage pour l'instancing des mêmes modèles
    
    // Stats de performance (optionnel)
    this.showPerformanceStats = false;
    this.performanceStats = null;
    
    // Gestion des niveaux de détail (LOD)
    this.isLODEnabled = true;
    this.distanceLODThresholds = [10, 25, 50]; // distances pour les niveaux de détail
    
    // Grille de base pour visualiser le sol
    this.addGrid();
    
    // Gestion du redimensionnement
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Animation loop
    this.animate();
    
    // Configuration pour le frustum culling
    this.frustumCulling = true;
    this.frustum = new THREE.Frustum();
  }
  
  /**
   * Met en place les lumières de la scène
   */
  setupLights() {
    // Lumière ambiante - légère pour de meilleures performances
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambientLight);
    
    // Lumière directionnelle principale (comme le soleil)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    
    // Configuration des ombres - optimisées pour les performances
    mainLight.shadow.mapSize.width = 1024; // Réduit pour de meilleures performances
    mainLight.shadow.mapSize.height = 1024; // Réduit pour de meilleures performances
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -15;
    mainLight.shadow.camera.right = 15;
    mainLight.shadow.camera.top = 15;
    mainLight.shadow.camera.bottom = -15;
    mainLight.shadow.bias = -0.001; // Réduit les artefacts d'ombre
    
    this.scene.add(mainLight);
    
    // Lumière d'appoint arrière - sans ombres pour les performances
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(-10, 5, -10);
    backLight.castShadow = false; // Pas d'ombres pour cette lumière
    this.scene.add(backLight);
  }
  
  /**
   * Initialise les loaders pour les modèles 3D et textures
   */
  setupLoaders() {
    // Loader GLTF avec support Draco pour la compression
    this.gltfLoader = new THREE.GLTFLoader();
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader.setDRACOLoader(dracoLoader);
    
    // Texture loader
    this.textureLoader = new THREE.TextureLoader();
  }
  
  /**
   * Ajoute une grille de référence à la scène
   */
  addGrid() {
    const grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    this.scene.add(grid);
  }
  
  /**
   * Gère le redimensionnement de la fenêtre
   */
  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  /**
   * Boucle d'animation principale
   */
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Mise à jour des contrôles
    this.controls.update();
    
    // Mettre à jour le frustum pour le culling
    if (this.frustumCulling) {
      this.updateFrustumCulling();
    }
    
    // Mettre à jour les niveaux de détail
    if (this.isLODEnabled) {
      this.updateLOD();
    }
    
    // Mettre à jour les statistiques de performance
    if (this.showPerformanceStats && this.performanceStats) {
      this.performanceStats.begin();
    }
    
    // Rendu de la scène
    this.renderer.render(this.scene, this.camera);
    
    // Terminer la mesure des performances
    if (this.showPerformanceStats && this.performanceStats) {
      this.performanceStats.end();
    }
  }
  
  /**
   * Charge un modèle de pièce et prépare l'optimisation
   * @param {string} partId - Identifiant de la pièce
   * @param {string} modelPath - Chemin vers le fichier de modèle
   * @param {string} texturePath - Chemin vers la texture (optionnel)
   * @returns {Promise<Object>} - Modèle chargé
   */
  async loadPartModel(partId, modelPath, texturePath = null) {
    try {
      return new Promise((resolve, reject) => {
        this.gltfLoader.load(
          modelPath,
          (gltf) => {
            const model = gltf.scene;
            
            // Appliquer des textures si fournies
            if (texturePath) {
              this.textureLoader.load(
                texturePath,
                (texture) => {
                  model.traverse((child) => {
                    if (child.isMesh) {
                      child.material.map = texture;
                      child.material.needsUpdate = true;
                    }
                  });
                },
                undefined,
                (error) => {
                  console.warn(`Erreur de chargement de la texture pour ${partId}:`, error);
                  // Continuer sans texture plutôt que d'échouer
                }
              );
            }
            
            // Préparer le modèle pour l'optimisation
            this.optimizeModel(model, partId);
            
            // Stocker le modèle pour une utilisation ultérieure
            this.parts.set(partId, model.clone());
            resolve(model);
          },
          (xhr) => {
            // Progression du chargement
            console.log(`${partId} ${(xhr.loaded / xhr.total) * 100}% loaded`);
          },
          (error) => {
            console.error(`Error loading model ${partId}:`, error);
            // Créer un modèle de secours au lieu d'échouer
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            const fallbackModel = new THREE.Mesh(geometry, material);
            const modelGroup = new THREE.Group();
            modelGroup.add(fallbackModel);
            
            // Marquer comme modèle de secours
            modelGroup.userData.isFallback = true;
            
            // Stocker et résoudre avec le modèle de secours
            this.parts.set(partId, modelGroup.clone());
            resolve(modelGroup);
          }
        );
      });
    } catch (error) {
      console.error(`Failed to load part ${partId}:`, error);
      // Créer un modèle de secours
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const fallbackModel = new THREE.Mesh(geometry, material);
      const modelGroup = new THREE.Group();
      modelGroup.add(fallbackModel);
      modelGroup.userData.isFallback = true;
      return modelGroup;
    }
  }
  
  /**
   * Optimise un modèle 3D pour améliorer les performances
   * @param {Object} model - Modèle Three.js à optimiser
   * @param {string} partId - Identifiant de la pièce
   */
  optimizeModel(model, partId) {
    // Configurer les ombres et autres optimisations
    model.traverse((child) => {
      if (child.isMesh) {
        // Configurer les ombres
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Optimiser la géométrie
        if (child.geometry) {
          // Fusionner les vertices proches pour réduire les draw calls
          if (child.geometry.attributes && child.geometry.attributes.position) {
            if (typeof child.geometry.mergeVertices === 'function') {
              child.geometry.mergeVertices();
            }
          }
          
          // Ajouter des niveaux de détail si la géométrie est complexe
          const vertexCount = child.geometry.attributes.position.count;
          if (vertexCount > 1000) {
            // Stocker la géométrie originale pour les LOD
            child.userData.originalGeometry = child.geometry.clone();
            
            // Préparation pour les niveaux de détail
            if (this.isLODEnabled) {
              this.prepareLODGeometries(child);
            }
          }
        }
        
        // Optimiser les matériaux
        if (child.material) {
          // Désactiver la transparence si non nécessaire
          if (child.material.opacity === 1.0) {
            child.material.transparent = false;
          }
          
          // Réduire la précision des textures pour les objets distants
          if (child.material.map) {
            child.material.map.anisotropy = 4; // Valeur modérée
          }
        }
      }
    });
  }
  
  /**
   * Prépare les géométries de différents niveaux de détail pour un mesh
   * @param {Object} mesh - Mesh Three.js à préparer
   */
  prepareLODGeometries(mesh) {
    if (!mesh.geometry || !mesh.userData.originalGeometry) return;
    
    // Créer des géométries simplifiées pour différents niveaux de détail
    const originalVertexCount = mesh.userData.originalGeometry.attributes.position.count;
    
    // LOD moyen (50% des vertices)
    const lodMediumGeometry = this.simplifyGeometry(mesh.userData.originalGeometry, 0.5);
    
    // LOD faible (25% des vertices)
    const lodLowGeometry = this.simplifyGeometry(mesh.userData.originalGeometry, 0.25);
    
    // LOD très faible (10% des vertices)
    const lodVeryLowGeometry = this.simplifyGeometry(mesh.userData.originalGeometry, 0.1);
    
    // Stocker les géométries LOD
    mesh.userData.lodGeometries = {
      high: mesh.userData.originalGeometry,
      medium: lodMediumGeometry || mesh.userData.originalGeometry,
      low: lodLowGeometry || lodMediumGeometry || mesh.userData.originalGeometry,
      veryLow: lodVeryLowGeometry || lodLowGeometry || mesh.userData.originalGeometry
    };
  }
  
  /**
   * Simplifie une géométrie en réduisant le nombre de vertices
   * @param {THREE.BufferGeometry} geometry - Géométrie originale
   * @param {number} factor - Facteur de simplification (0-1)
   * @returns {THREE.BufferGeometry} - Géométrie simplifiée
   */
  simplifyGeometry(geometry, factor) {
    // Implémentation de base pour l'exemple
    try {
      // Clone la géométrie
      const simplified = geometry.clone();
      
      // Note: Ceci est une simplification naïve 
      if (simplified.attributes.position && simplified.index) {
        // Réduire le nombre d'indices en fonction du facteur
        const newIndexCount = Math.max(6, Math.floor(simplified.index.count * factor));
        // Assurer que c'est un multiple de 3 pour les triangles
        const adjustedCount = Math.floor(newIndexCount / 3) * 3;
        
        // Créer un nouveau tableau d'indices
        const newIndices = new simplified.index.array.constructor(adjustedCount);
        for (let i = 0; i < adjustedCount; i++) {
          newIndices[i] = simplified.index.array[i];
        }
        
        // Mettre à jour l'attribut index
        simplified.index.array = newIndices;
        simplified.index.count = adjustedCount;
        simplified.index.needsUpdate = true;
      }
      
      return simplified;
    } catch (error) {
      console.warn("Erreur lors de la simplification de la géométrie:", error);
      return geometry; // Retourner la géométrie originale en cas d'erreur
    }
  }
  
  /**
   * Met à jour les niveaux de détail des modèles en fonction de la distance à la caméra
   */
  updateLOD() {
    if (!this.isLODEnabled) return;
    
    // Position de la caméra
    const cameraPosition = this.camera.position.clone();
    
    // Parcourir toutes les instances de pièces
    this.partInstances.forEach(instance => {
      if (!instance.model) return;
      
      // Calculer la distance à la caméra
      const instancePosition = new THREE.Vector3();
      instance.model.getWorldPosition(instancePosition);
      const distance = cameraPosition.distanceTo(instancePosition);
      
      // Appliquer le niveau de détail approprié
      instance.model.traverse(child => {
        if (child.isMesh && child.userData.lodGeometries) {
          let newGeometry;
          
          // Sélectionner la géométrie en fonction de la distance
          if (distance < this.distanceLODThresholds[0]) {
            newGeometry = child.userData.lodGeometries.high;
          } else if (distance < this.distanceLODThresholds[1]) {
            newGeometry = child.userData.lodGeometries.medium;
          } else if (distance < this.distanceLODThresholds[2]) {
            newGeometry = child.userData.lodGeometries.low;
          } else {
            newGeometry = child.userData.lodGeometries.veryLow;
          }
          
          // Appliquer la nouvelle géométrie si elle est différente de l'actuelle
          if (newGeometry && child.geometry !== newGeometry) {
            child.geometry = newGeometry;
          }
        }
      });
    });
  }
  
  /**
   * Met à jour le frustum culling pour masquer les objets hors champ
   */
  updateFrustumCulling() {
    // Mettre à jour la matrice de projection de la caméra
    this.camera.updateMatrixWorld();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(projScreenMatrix);
    
    // Parcourir toutes les instances de pièces
    this.partInstances.forEach(instance => {
      if (!instance.model) return;
      
      // Vérifier si la pièce est dans le frustum
      const bbox = new THREE.Box3().setFromObject(instance.model);
      const isVisible = this.frustum.intersectsBox(bbox);
      
      // Activer/désactiver le rendu de la pièce
      if (instance.model.visible !== isVisible) {
        instance.model.visible = isVisible;
      }
    });
  }
  
  // Méthodes pour création et gestion des pièces dans la scène
  // ...autres méthodes...
}

// Exporter la classe
export default RocketEngine;