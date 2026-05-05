module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)s?$": "ts-jest",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  moduleNameMapper: {
    // The SDK source uses ESM-style .js extensions in imports
    // (e.g. "./pool.js", "./utils/fetchFormTemplate.js").
    // ts-jest resolves .ts files, so we strip the .js suffix here.
    "^(\\.\\.?/.*)\\.js$": "$1",
  },
};
