/**
 * Fixture loader for n8n-BMAD tests
 */

const path = require('path');
const fs = require('fs');

const FIXTURES_PATH = path.join(__dirname, '..', '..', 'fixtures');

function loadFixture(category, name) {
  const filePath = path.join(FIXTURES_PATH, category, name);
  return fs.readFileSync(filePath, 'utf8');
}

function loadYamlFixture(category, name) {
  const yaml = require('js-yaml');
  const content = loadFixture(category, name);
  return yaml.load(content);
}

function loadJsonFixture(category, name) {
  const content = loadFixture(category, name);
  return JSON.parse(content);
}

function fixturePath(category, name) {
  return path.join(FIXTURES_PATH, category, name);
}

module.exports = {
  FIXTURES_PATH,
  loadFixture,
  loadYamlFixture,
  loadJsonFixture,
  fixturePath,
};
