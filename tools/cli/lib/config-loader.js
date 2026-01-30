/**
 * Configuration loader for n8n-BMAD CLI
 * Loads and parses module.yaml configuration file
 *
 * @module lib/config-loader
 * @description Handles loading and merging of framework configuration
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Default configuration values
 * Used when no config file is found or for missing values
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  framework: {
    name: 'n8n-BMAD',
    version: '1.0.0',
    description: 'AI-powered methodology framework for n8n workflow automation teams',
  },
  options: {
    n8n_instance_url: {
      default: 'http://localhost:5678',
      env_var: 'N8N_INSTANCE_URL',
    },
    naming_convention: {
      default: {
        workflow_prefix: 'wf_',
        credential_prefix: 'cred_',
        environment_separator: '_',
        use_snake_case: true,
      },
    },
  },
  defaults: {
    workflow: {
      timezone: 'UTC',
      save_execution_progress: true,
    },
    validation: {
      check_naming: true,
      check_credentials: true,
      check_expressions: true,
      check_connections: true,
    },
  },
  output: {
    docs_path: './docs/generated',
    exports_path: './exports',
    backups_path: './backups',
    reports_path: './reports',
  },
  agents: {
    default_agent: 'n8n-master',
    agent_path: './src/core/agents',
    available_agents: [
      'n8n-master',
      'po',
      'pm',
      'sm',
      'architect',
      'developer',
      'qa',
      'devops',
      'ba',
      'security',
      'integration',
      'data-analyst',
      'tech-writer',
    ],
  },
  templates: {
    path: './templates',
    categories: [
      'project',
      'agile',
      'architecture',
      'operations',
      'testing',
      'n8n-specific',
      'security',
    ],
  },
  patterns: {
    path: './patterns',
    categories: [
      'error-handling',
      'integration',
      'data-transformation',
      'scheduling',
    ],
  },
  reference: {
    path: './reference',
  },
  mcp: {
    enabled: true,
    config_path: './.mcp.json',
  },
  logging: {
    level: 'info',
    format: 'text',
    output: 'console',
  },
};

/**
 * Configuration cache
 * @type {Object|null}
 */
let configCache = null;

/**
 * Cache timestamp
 * @type {number}
 */
let cacheTimestamp = 0;

/**
 * Cache TTL in milliseconds (5 seconds)
 * @type {number}
 */
const CACHE_TTL = 5000;

/**
 * Resolve config path relative to current working directory
 * @param {string} configPath - Config file path
 * @returns {string} Resolved absolute path
 */
function resolveConfigPath(configPath) {
  if (path.isAbsolute(configPath)) {
    return configPath;
  }
  return path.resolve(process.cwd(), configPath);
}

/**
 * Check if a file exists
 * @async
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (target[key] instanceof Object && !Array.isArray(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = { ...source[key] };
      }
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Load and parse the configuration file
 * @async
 * @param {string} [configPath='./src/core/module.yaml'] - Path to config file
 * @param {Object} [options] - Load options
 * @param {boolean} [options.useCache=true] - Use cached config if available
 * @param {boolean} [options.mergeDefaults=true] - Merge with default config
 * @returns {Promise<Object>} Loaded configuration object
 * @throws {Error} If config file cannot be read or parsed
 */
async function loadConfig(configPath = './src/core/module.yaml', options = {}) {
  const { useCache = true, mergeDefaults = true } = options;

  // Check cache
  if (useCache && configCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return configCache;
  }

  const resolvedPath = resolveConfigPath(configPath);

  // Check if file exists
  if (!await fileExists(resolvedPath)) {
    if (mergeDefaults) {
      return DEFAULT_CONFIG;
    }
    throw new Error(`Configuration file not found: ${resolvedPath}`);
  }

  try {
    const content = await fs.readFile(resolvedPath, 'utf8');
    const config = yaml.load(content);

    // Merge with defaults if requested
    const finalConfig = mergeDefaults
      ? deepMerge(DEFAULT_CONFIG, config)
      : config;

    // Store the config path for reference
    finalConfig._configPath = resolvedPath;
    finalConfig._projectRoot = path.dirname(path.dirname(path.dirname(resolvedPath)));

    // Update cache
    configCache = finalConfig;
    cacheTimestamp = Date.now();

    return finalConfig;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Configuration file not found: ${resolvedPath}`);
    }
    if (error.name === 'YAMLException') {
      throw new Error(`Invalid YAML in configuration file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get a specific configuration value by path
 * @async
 * @param {string} keyPath - Dot-notation path to config value (e.g., 'agents.default_agent')
 * @param {*} [defaultValue] - Default value if not found
 * @param {string} [configPath] - Config file path
 * @returns {Promise<*>} Configuration value
 */
async function getConfigValue(keyPath, defaultValue = undefined, configPath) {
  const config = await loadConfig(configPath);

  const keys = keyPath.split('.');
  let value = config;

  for (const key of keys) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    value = value[key];
  }

  return value !== undefined ? value : defaultValue;
}

/**
 * Resolve environment variables in configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Configuration with resolved env vars
 */
function resolveEnvVars(config) {
  const resolved = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      // Replace ${VAR_NAME} patterns with environment variables
      resolved[key] = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        return process.env[varName] || match;
      });
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveEnvVars(value);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Get the n8n instance URL from configuration
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<string>} n8n instance URL
 */
async function getN8nUrl(configPath) {
  // First check environment variable
  if (process.env.N8N_INSTANCE_URL) {
    return process.env.N8N_INSTANCE_URL;
  }

  // Then check config
  const urlConfig = await getConfigValue('options.n8n_instance_url', {}, configPath);
  return urlConfig.default || 'http://localhost:5678';
}

/**
 * Get the naming convention configuration
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<Object>} Naming convention settings
 */
async function getNamingConvention(configPath) {
  const convention = await getConfigValue('options.naming_convention', {}, configPath);
  return convention.default || {
    workflow_prefix: 'wf_',
    credential_prefix: 'cred_',
    environment_separator: '_',
    use_snake_case: true,
  };
}

/**
 * Get all template categories from configuration
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<Array<string>>} List of template categories
 */
async function getTemplateCategories(configPath) {
  return await getConfigValue('templates.categories', [], configPath);
}

/**
 * Get all pattern categories from configuration
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<Array<string>>} List of pattern categories
 */
async function getPatternCategories(configPath) {
  return await getConfigValue('patterns.categories', [], configPath);
}

/**
 * Get the list of available agents
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<Array<string>>} List of agent IDs
 */
async function getAvailableAgents(configPath) {
  return await getConfigValue('agents.available_agents', [], configPath);
}

/**
 * Get the project root directory
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<string>} Project root path
 */
async function getProjectRoot(configPath) {
  const config = await loadConfig(configPath);
  return config._projectRoot || process.cwd();
}

/**
 * Validate that required configuration is present
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<Object>} Validation result with 'valid' boolean and 'errors' array
 */
async function validateConfig(configPath) {
  const errors = [];

  try {
    const config = await loadConfig(configPath);

    // Check required sections
    const requiredSections = ['framework', 'agents', 'templates'];
    for (const section of requiredSections) {
      if (!config[section]) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // Check agents configuration
    if (config.agents) {
      if (!config.agents.available_agents || config.agents.available_agents.length === 0) {
        errors.push('No agents defined in configuration');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      config: errors.length === 0 ? config : null,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error.message],
      config: null,
    };
  }
}

/**
 * Clear the configuration cache
 */
function clearCache() {
  configCache = null;
  cacheTimestamp = 0;
}

module.exports = {
  DEFAULT_CONFIG,
  loadConfig,
  getConfigValue,
  resolveEnvVars,
  getN8nUrl,
  getNamingConvention,
  getTemplateCategories,
  getPatternCategories,
  getAvailableAgents,
  getProjectRoot,
  validateConfig,
  clearCache,
  resolveConfigPath,
  fileExists,
  deepMerge,
};
