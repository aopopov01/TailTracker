/**
 * TailTracker Import Organization Standards
 *
 * Utilities and guidelines for maintaining consistent import statements
 * across the entire TailTracker mobile application codebase.
 */

// ===================================
// IMPORT ORGANIZATION RULES
// ===================================

/**
 * Standard import order categories with examples
 */
export const IMPORT_ORDER = {
  // 1. React and React Native (always first)
  REACT_CORE: {
    examples: [
      "import React, { useState, useEffect, useCallback } from 'react';",
      "import { Component, PureComponent } from 'react';",
      "import { View, Text, StyleSheet, ScrollView } from 'react-native';",
    ],
    pattern: /^react(-native)?$/,
  },

  // 2. Third-party libraries (alphabetical by package name)
  THIRD_PARTY: {
    examples: [
      "import AsyncStorage from '@react-native-async-storage/async-storage';",
      "import { NavigationProp } from '@react-navigation/native';",
      "import * as ImagePicker from 'expo-image-picker';",
      "import { Formik, FormikProps } from 'formik';",
      "import * as yup from 'yup';",
    ],
    pattern: /^(@[a-z]|[a-z])/,
  },

  // 3. Internal type-only imports
  TYPE_IMPORTS: {
    examples: [
      "import type { Pet, User, ApiResponse } from '../types';",
      "import type { NavigationScreenProp } from 'react-navigation';",
    ],
    pattern: /^import\s+type/,
  },

  // 4. Internal constants
  CONSTANTS: {
    examples: [
      "import { VALIDATION_MESSAGES, PET_SPECIES_OPTIONS } from '../constants';",
      "import { API_ENDPOINTS } from '../config';",
    ],
    pattern: /constants|config/,
  },

  // 5. Internal utilities
  UTILS: {
    examples: [
      "import { formatDate, validateEmail } from '../utils/helpers';",
      "import { executeServiceOperation } from '../utils/serviceHelpers';",
    ],
    pattern: /utils/,
  },

  // 6. Internal services
  SERVICES: {
    examples: [
      "import { PetService } from '../services/PetService';",
      "import { AuthService } from '../services/AuthService';",
    ],
    pattern: /services/,
  },

  // 7. Internal components
  COMPONENTS: {
    examples: [
      "import { LoadingSpinner, ErrorDisplay } from '../components/UI';",
      "import { PetCard } from '../components/Pet';",
    ],
    pattern: /components/,
  },

  // 8. Internal hooks
  HOOKS: {
    examples: [
      "import { useAuth } from '../hooks/useAuth';",
      "import { usePetForm } from '../hooks/usePetForm';",
    ],
    pattern: /hooks/,
  },

  // 9. Relative imports (same directory)
  RELATIVE: {
    examples: [
      "import { PetFormValidation } from './PetFormValidation';",
      "import './PetScreen.styles.css';",
    ],
    pattern: /^\.\/[^/]/,
  },
} as const;

// ===================================
// IMPORT GROUPING UTILITIES
// ===================================

/**
 * Categorizes an import statement into the appropriate group
 */
export function categorizeImport(
  importStatement: string
): keyof typeof IMPORT_ORDER | 'UNKNOWN' {
  const trimmed = importStatement.trim();

  // React core
  if (/^import\s+.*\s+from\s+['"]react(-native)?['"]/.test(trimmed)) {
    return 'REACT_CORE';
  }

  // Type imports
  if (IMPORT_ORDER.TYPE_IMPORTS.pattern.test(trimmed)) {
    return 'TYPE_IMPORTS';
  }

  // Relative imports
  if (IMPORT_ORDER.RELATIVE.pattern.test(trimmed)) {
    return 'RELATIVE';
  }

  // Check for internal paths
  const pathMatch = trimmed.match(/from\s+['"](.*)['"]/);
  if (pathMatch) {
    const importPath = pathMatch[1];

    if (importPath.includes('constants') || importPath.includes('config')) {
      return 'CONSTANTS';
    }
    if (importPath.includes('utils')) {
      return 'UTILS';
    }
    if (importPath.includes('services')) {
      return 'SERVICES';
    }
    if (importPath.includes('components')) {
      return 'COMPONENTS';
    }
    if (importPath.includes('hooks')) {
      return 'HOOKS';
    }

    // Third-party if starts with @ or lowercase letter
    if (IMPORT_ORDER.THIRD_PARTY.pattern.test(importPath)) {
      return 'THIRD_PARTY';
    }
  }

  return 'UNKNOWN';
}

/**
 * Sorts imports within a category
 */
export function sortImportsInCategory(
  imports: string[],
  category: keyof typeof IMPORT_ORDER
): string[] {
  return imports.sort((a, b) => {
    // For third-party, sort alphabetically by package name
    if (category === 'THIRD_PARTY') {
      const getPackageName = (imp: string) => {
        const match = imp.match(/from\s+['"]([@a-z][^'"]*)['"]/);
        return match ? match[1] : '';
      };
      return getPackageName(a).localeCompare(getPackageName(b));
    }

    // For others, sort alphabetically by the full import
    return a.localeCompare(b);
  });
}

/**
 * Organizes and formats import statements according to standards
 */
export function organizeImports(importStatements: string[]): string {
  const categorized: Record<string, string[]> = {};

  // Initialize categories
  Object.keys(IMPORT_ORDER).forEach(category => {
    categorized[category] = [];
  });
  categorized.UNKNOWN = [];

  // Categorize imports
  importStatements.forEach(importStatement => {
    const category = categorizeImport(importStatement);
    categorized[category].push(importStatement);
  });

  // Sort imports within each category
  Object.keys(categorized).forEach(category => {
    if (categorized[category].length > 0) {
      categorized[category] = sortImportsInCategory(
        categorized[category],
        category as keyof typeof IMPORT_ORDER
      );
    }
  });

  // Build organized import string
  const orderedCategories = [
    'REACT_CORE',
    'THIRD_PARTY',
    'TYPE_IMPORTS',
    'CONSTANTS',
    'UTILS',
    'SERVICES',
    'COMPONENTS',
    'HOOKS',
    'RELATIVE',
    'UNKNOWN',
  ];

  const organizedGroups: string[] = [];

  orderedCategories.forEach(category => {
    if (categorized[category].length > 0) {
      organizedGroups.push(categorized[category].join('\n'));
    }
  });

  return organizedGroups.join('\n\n');
}

// ===================================
// EXAMPLE ORGANIZED IMPORTS
// ===================================

/**
 * Example of perfectly organized imports following our standards
 */
export const EXAMPLE_ORGANIZED_IMPORTS = `// React and React Native core
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';

// Third-party libraries (alphabetical)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Formik, FormikProps } from 'formik';
import * as yup from 'yup';

// Type imports
import type { Pet, User, ApiResponse, FormValidation } from '../types';
import type { NavigationScreenProp } from 'react-navigation';

// Constants and configuration
import { 
  VALIDATION_MESSAGES, 
  PET_SPECIES_OPTIONS, 
  SUCCESS_MESSAGES 
} from '../constants';
import { API_ENDPOINTS } from '../config';

// Utilities
import { formatDate, validateEmail, sanitizeInput } from '../utils/helpers';
import { executeServiceOperation, createAppError } from '../utils/serviceHelpers';

// Services
import { AuthService } from '../services/AuthService';
import { PetService } from '../services/PetService';

// Components
import { LoadingSpinner, ErrorDisplay, SuccessMessage } from '../components/UI';
import { PetCard, PetForm } from '../components/Pet';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { usePetForm } from '../hooks/usePetForm';

// Relative imports
import { PetFormValidation } from './PetFormValidation';
import './PetScreen.styles.css';`;

// ===================================
// VALIDATION UTILITIES
// ===================================

/**
 * Validates import organization and provides suggestions
 */
export function validateImportOrganization(fileContent: string): {
  isValid: boolean;
  issues: {
    line: number;
    issue: string;
    suggestion: string;
    severity: 'error' | 'warning' | 'info';
  }[];
  organizedImports?: string;
} {
  const lines = fileContent.split('\n');
  const importLines: { line: number; content: string }[] = [];
  const issues: {
    line: number;
    issue: string;
    suggestion: string;
    severity: 'error' | 'warning' | 'info';
  }[] = [];

  // Find all import statements
  lines.forEach((line, index) => {
    if (line.trim().startsWith('import ')) {
      importLines.push({ line: index + 1, content: line });
    }
  });

  if (importLines.length === 0) {
    return { isValid: true, issues: [] };
  }

  // Check import organization
  let lastCategory = '';

  importLines.forEach((importLine, _index) => {
    const category = categorizeImport(importLine.content);
    const categoryIndex = Object.keys(IMPORT_ORDER).indexOf(category);
    const lastCategoryIndex = Object.keys(IMPORT_ORDER).indexOf(lastCategory);

    // Check if imports are in correct order
    if (lastCategory && categoryIndex < lastCategoryIndex) {
      issues.push({
        line: importLine.line,
        issue: `Import from '${category}' category should come before '${lastCategory}'`,
        suggestion: `Move this import to the ${category} section`,
        severity: 'warning',
      });
    }

    // Check for unknown imports
    if (category === 'UNKNOWN') {
      issues.push({
        line: importLine.line,
        issue: 'Import could not be categorized',
        suggestion: 'Check if this import follows the expected patterns',
        severity: 'info',
      });
    }

    lastCategory = category;
  });

  // Generate organized imports
  const importStatements = importLines.map(line => line.content);
  const organizedImports = organizeImports(importStatements);

  return {
    isValid: issues.filter(issue => issue.severity === 'error').length === 0,
    issues,
    organizedImports,
  };
}

// ===================================
// BEST PRACTICES CHECKLIST
// ===================================

/**
 * Comprehensive checklist for import organization best practices
 */
export const IMPORT_BEST_PRACTICES = {
  ORDER: [
    '✅ React and React Native imports come first',
    '✅ Third-party libraries are sorted alphabetically',
    '✅ Type-only imports are grouped together',
    '✅ Internal imports follow logical hierarchy',
    '✅ Relative imports come last',
  ],

  FORMATTING: [
    '✅ Use consistent quote style (prefer single quotes)',
    '✅ Group related imports on same line where appropriate',
    '✅ Use named imports instead of default when possible',
    '✅ Avoid mixing named and default imports on same line',
  ],

  GROUPING: [
    '✅ Separate import groups with blank lines',
    '✅ Add comments for import group sections',
    '✅ Keep type imports separate from value imports',
    '✅ Group imports from same module together',
  ],

  MAINTENANCE: [
    '✅ Remove unused imports regularly',
    '✅ Update import paths when files move',
    '✅ Use absolute paths for commonly used modules',
    '✅ Keep import statements concise and readable',
  ],
} as const;
