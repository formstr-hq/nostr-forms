module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)s?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@formstr/core/relay$":
      "<rootDir>/../../node_modules/@formstr/core/dist/relay/module-defaults.js",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
};
