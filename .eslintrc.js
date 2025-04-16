module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    // Règles générales
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single", { "avoidEscape": true }],
    "semi": ["error", "always"],
    
    // Règles pour les conventions de nommage
    "camelcase": ["error", { 
      "properties": "always",
      "ignoreDestructuring": false,
      "ignoreImports": false,
      "ignoreGlobals": true
    }],
    
    // Règles pour les noms de constantes
    "id-match": ["error", "^(([A-Z][A-Z0-9_]*)|([a-z][a-zA-Z0-9]*)|(_[a-z][a-zA-Z0-9]*))$", {
      "properties": true,
      "onlyDeclarations": false
    }],
    
    // Règle pour les méthodes privées (préfixe _)
    "no-underscore-dangle": ["error", { 
      "allowAfterThis": true,
      "allowAfterSuper": true,
      "enforceInMethodNames": true,
      "allow": ["_id"]
    }],
    
    // Règles pour les noms de classes (PascalCase)
    "new-cap": ["error", { 
      "newIsCap": true,
      "capIsNew": false,
      "properties": true
    }],
    
    // Règles supplémentaires
    "no-unused-vars": ["warn", { 
      "vars": "all", 
      "args": "after-used", 
      "ignoreRestSiblings": false 
    }],
    "no-var": "error",
    "prefer-const": "warn",
    
    // Règle pour les préfixes des booléens
    "naming-convention": ["warn", {
      "selector": "variable",
      "types": ["boolean"],
      "format": ["camelCase"],
      "prefix": ["is", "has", "should", "can", "will", "did"]
    }]
  },
  "overrides": [
    {
      "files": ["*.constant.js", "**/constants/**/*.js"],
      "rules": {
        "camelcase": "off",
        "id-match": ["error", "^[A-Z][A-Z0-9_]*$", {
          "properties": true,
          "onlyDeclarations": false
        }]
      }
    }
  ]
};
