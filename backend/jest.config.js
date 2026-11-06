/**
 * Configuração do Jest para o backend AquaWash.
 *
 * Usa ts-jest com isolatedModules (transpilação rápida por arquivo,
 * sem type-check completo — os tipos são validados pelo tsc em CI).
 *
 * Os arquivos de teste ficam em src/__tests__/** e são excluídos do
 * tsconfig.json (para não irem no build nem no `tsc --noEmit`).
 */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/middlewares/**/*.ts',
    'src/utils/cache.ts',
    'src/utils/validators.ts',
    'src/utils/pagination.ts',
    'src/lib/pubsub.ts',
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
  verbose: true,
};
