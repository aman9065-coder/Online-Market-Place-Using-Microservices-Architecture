/** @type {import('jest').Config} */
const config = {
  // Mocks function clear hota h , mock  func(jest ke help se bnta h ) testing ke liye bnta h 
  clearMocks: true,
  // table of coverage report jisme rhta h kitna konsa api kitna percent chl h 
  collectCoverage: true,
  // coverage folder me jake sara report store hota h
  coverageDirectory: "coverage",
  // coverage generate krne ke liye  v8 chrome engine ke use krte h  
  coverageProvider: "v8",
  // each test file chlane se phl setup.js chlega
  setupFilesAfterEnv: ['./test/setup.js'],
  // node environment me hi test ko run krte h 
  testEnvironment: "node",
  // test.js test file mana jayega 
  testMatch: ['**/**/*.test.js'],
}

module.exports = config;