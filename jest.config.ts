import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          noImplicitAny: false,
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020', 'DOM'],
          esModuleInterop: true,
          moduleResolution: 'node',
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/OpCodes.ts',
  ],
  coverageDirectory: 'build/coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'json-summary'],
};

export default config;
