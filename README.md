
# KSP Rocket Builder

Un outil web complexe avec une interface 3D WebGL pour la construction, personnalisation et analyse de fusées pour Kerbal Space Program.

## Version actuelle

**v0.2.1** - Modularisation du DataValidator (voir [Historique des versions](docs/VERSION_HISTORY.md) pour plus de détails)

## Prochaine version

**v0.3.0** - Correction des bugs et admin (prévue pour le 15/04/2025)  
Objectifs principaux :
- Correction des bugs logiques et fonctionnels critiques
- Mise en place d'une interface d'administration
- Amélioration de la validation et intégrité des données
- Robustesse et gestion d'erreurs

## Fonctionnalités

- **Interface 3D WebGL Avancée** : Visualisez vos fusées en temps réel avec des modèles 3D détaillés
- **Concepteur de fusées par glisser-déposer** : Créez facilement des designs complexes
- **Gestion d'étages** : Organisez vos fusées en étages logiques
- **Calculs de Delta-V précis** : Calculez les performances de vos fusées pour différentes missions
- **Analyses physiques détaillées** : Masse, centre de gravité, TWR, ISP, etc.
- **Interface utilisateur moderne** : Design intuitif et adaptatif
- **Base de données complète** : Toutes les pièces de KSP avec leurs caractéristiques

## Structure du projet

```
ksp-rocket-builder/
├── assets/
│   ├── models/      # Modèles 3D des pièces de fusée
│   ├── textures/    # Textures pour les modèles
│   └── images/      # Images pour l'interface
├── data/
│   ├── parts/       # Données JSON des pièces par catégorie
│   ├── celestial_bodies.json
│   ├── resources.json
│   └── tech_tree.json
├── src/
│   ├── components/  # Composants React (dans une implémentation complète)
│   ├── engine/      # Moteur 3D WebGL (RocketEngine.js)
│   ├── api/         # API de données et gestion des pièces
│   │   ├── DataAPI.js
│   │   ├── PartsAPI.js
│   │   ├── CelestialBodiesAPI.js
│   │   ├── ResourcesAPI.js
│   │   ├── TechTreeAPI.js
│   │   ├── CompatibilityChecker.js
│   │   ├── AssetsLoader.js
│   │   ├── SearchEngine.js
│   │   └── utils/
│   │       └── datavalidator/    # Système modulaire de validation des données
│   │           ├── index.js
│   │           ├── constants.js
│   │           ├── formatters.js
│   │           ├── DataValidator.js
│   │           ├── validators/
│   │           └── helpers/
│   └── utils/       # Fonctions utilitaires et calculs physiques
├── docs/            # Documentation complète du projet
├── index.html       # Page d'accueil
├── app.html         # Application principale
└── README.md
```

## Composants Principaux

### 1. API de Données (src/api)

Système modulaire pour l'accès aux données du jeu:
- **DataAPI.js** : Point d'entrée principal de l'API
- **PartsAPI.js** : Gestion des pièces de fusée
- **CelestialBodiesAPI.js** : Gestion des corps célestes
- **ResourcesAPI.js** : Gestion des ressources
- **TechTreeAPI.js** : Gestion de l'arbre technologique
- **CompatibilityChecker.js** : Vérification de compatibilité entre pièces
- **SearchEngine.js** : Recherche avancée de pièces
- **AssetsLoader.js** : Chargement des modèles 3D et textures
- **datavalidator/** : Système modulaire de validation des données

### 2. Moteur de Visualisation 3D (RocketEngine.js)

Construit sur Three.js, ce moteur gère le rendu WebGL des fusées en 3D et permet:
- Chargement des modèles 3D de pièces
- Manipulation des pièces dans l'espace 3D
- Attachement et détachement de pièces
- Gestion des symétries (x2, x3, x4, etc.)
- Simulation des séparations d'étages
- Effets visuels et ombrages

### 3. Calculateur de Physique (rocketPhysics.js)

Module d'analyse physique qui calcule:
- Delta-V par étage et total
- Rapport poussée/poids dans différentes conditions
- Temps de combustion
- Capacités de mission (orbite, transferts interplanétaires, etc.)

### 4. Interface Utilisateur

L'interface utilisateur est divisée en trois zones principales :
- **Panneau gauche** : Catalogue des pièces disponibles, filtrable par catégorie
- **Zone centrale** : Visualisation 3D de la fusée en construction
- **Panneau droit** : Informations détaillées, gestionnaire d'étages et statistiques

## Guide d'utilisation

1. **Ajouter des pièces** : Faites glisser les pièces du catalogue vers la zone de construction
2. **Organiser les pièces** : Utilisez les contrôles de symétrie pour ajouter plusieurs pièces à la fois
3. **Gérer les étages** : Organisez votre fusée en étages pour une séparation optimale
4. **Analyser les performances** : Consultez le Delta-V, TWR et capacités de mission de votre fusée
5. **Tester les séparations** : Simulez le largage d'étages pour vérifier le comportement de votre fusée

## Documentation

Une documentation complète est disponible dans le dossier `docs/` :
- [Architecture du projet](docs/ARCHITECTURE.md)
- [Structure de la base de données](docs/DB_STRUCTURE.md)
- [Spécifications du module de validation](docs/DATA_VALIDATOR.md)
- [Plan d'intégration des données](docs/DATA_INTEGRATION_PLAN.md)
- [Guide de démarrage rapide](docs/QUICKSTART.md)
- [Historique des versions](docs/VERSION_HISTORY.md)

## Calculs physiques

KSP Rocket Builder utilise des formules physiques réalistes pour simuler les performances des fusées :

- **Équation de Tsiolkovsky** : ΔV = Isp * g₀ * ln(m₀/m₁)
- **Rapport poussée/poids** : TWR = T / (m * g)
- **Temps de combustion** : t = m_fuel / (T / (Isp * g₀))

Ces calculs tiennent compte des variations d'ISP avec l'altitude, des effets atmosphériques et des caractéristiques spécifiques de chaque corps céleste de KSP.

## Licence

Ce projet est distribué sous licence MIT.

## Remerciements

- Squad pour la création de Kerbal Space Program
- La communauté KSP pour ses ressources et son soutien
- Three.js pour la bibliothèque de rendu WebGL

---

*Note: KSP Rocket Builder est un projet fan et n'est pas affilié officiellement à Squad ou Private Division, les créateurs de Kerbal Space Program.*
