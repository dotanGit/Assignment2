/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFiles: ["./jest.setup.ts"],
    roots: ["<rootDir>/src/tests"],
    collectCoverage: false,
    coverageDirectory: "coverage",
    coverageReporters: ["html", "text", "lcov"],
    collectCoverageFrom: [
      "src/**/*.ts",
      "!src/**/*.test.ts",
      "!src/tests/**",
      "!src/server.ts",
      "!src/swagger.ts",
      "!src/index.ts"
    ],
  };