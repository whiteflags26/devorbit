module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
    },
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    collectCoverageFrom: [
      '**/*.{ts,tsx}',
      '!**/node_modules/**',
      '!**/.next/**',
      '!**/test/**',
    ],
  };