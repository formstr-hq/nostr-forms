module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)s?$": "ts-jest",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  // Sources use ESM-style "./x.js" imports of .ts files; resolve them to the .ts.
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
