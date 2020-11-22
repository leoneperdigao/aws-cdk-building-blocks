module.exports = {
  preset: 'ts-jest',
  clearMocks: true,
  collectCoverage: true,
  verbose: true,
  rootDir: '.',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/index.ts',
    '!<rootDir>/src/**/*.types.ts',
  ],
  coverageReporters: ['json-summary', 'text', 'lcov'],
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  coverageDirectory: './coverage',
  moduleFileExtensions: ['ts', 'js'],
  testEnvironment: 'node',
  transform: {
    '\\.ts$': 'ts-jest',
  },
};
