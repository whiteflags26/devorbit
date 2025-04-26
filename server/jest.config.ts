import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/config/",
    "/dst/",
    "/node_modules/",
    "/routes",
    "/shared/",
    "/tests/",
    "/types/",
    "/utils/",
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  verbose: true,
  setupFilesAfterEnv: ["./jest.setup.ts"],
};

export default config;
