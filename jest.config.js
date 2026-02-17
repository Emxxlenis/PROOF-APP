/**
 * Jest Configuration
 * 
 * Para tests unitarios de React components y hooks
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Excluir tests de Playwright (e2e) y otros
  testPathIgnorePatterns: [
    '/node_modules/',
    '/\\.next/',
    '/tests/e2e/',
    '/tests/scripts/',
    '.*\\.spec\\.[jt]sx?$', // Excluir explícitamente archivos .spec.ts/.spec.tsx
  ],
  // Transformar archivos TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = async () => {
  const nextJestConfig = await createJestConfig(customJestConfig)();
  // Sobrescribir explícitamente testMatch/testRegex para excluir .spec.ts
  // Eliminar testRegex si existe para evitar conflictos
  const { testRegex, ...restConfig } = nextJestConfig;
  return {
    ...restConfig,
    testMatch: [
      '**/__tests__/**/*.[jt]s?(x)',
      '**/*.test.[jt]s?(x)', // Solo .test.ts/.test.tsx, NO .spec.ts
    ],
    testPathIgnorePatterns: [
      ...(nextJestConfig.testPathIgnorePatterns || []),
      '/tests/e2e/',
      '/tests/scripts/',
      '.*\\.spec\\.[jt]sx?$', // Excluir explícitamente archivos .spec.ts/.spec.tsx
    ],
  };
}
