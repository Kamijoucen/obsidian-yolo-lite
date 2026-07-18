/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
    // path-browserify ships CommonJS; its default import resolves to undefined
    // under ts-jest. Re-export Node's built-in path (identical API) instead.
    '^path-browserify$': '<rootDir>/__mocks__/path-browserify.ts',
  },
}
