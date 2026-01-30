/**
 * Agent loader for n8n-BMAD CLI
 * Parses and loads agent YAML configuration files
 *
 * @module lib/agent-loader
 * @description Handles loading, parsing, and managing agent personas
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { getProjectRoot, getConfigValue } = require('./config-loader');

/**
 * Agent cache for performance
 * @type {Map<string, Object>}
 */
const agentCache = new Map();

/**
 * Get the agents directory path
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<string>} Agents directory path
 */
async function getAgentsPath(configPath) {
  const agentPath = await getConfigValue('agents.agent_path', './src/core/agents', configPath);
  const projectRoot = await getProjectRoot(configPath);
  return path.resolve(projectRoot, agentPath);
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
 * Load a single agent by ID
 * @async
 * @param {string} agentId - Agent identifier (e.g., 'developer', 'architect')
 * @param {Object} [options] - Load options
 * @param {boolean} [options.useCache=true] - Use cached agent if available
 * @param {string} [options.configPath] - Config file path
 * @returns {Promise<Object>} Parsed agent configuration
 * @throws {Error} If agent file not found or invalid
 */
async function loadAgent(agentId, options = {}) {
  const { useCache = true, configPath } = options;

  // Check cache
  if (useCache && agentCache.has(agentId)) {
    return agentCache.get(agentId);
  }

  const agentsPath = await getAgentsPath(configPath);
  const agentFile = path.join(agentsPath, `${agentId}.agent.yaml`);

  if (!await fileExists(agentFile)) {
    throw new Error(`Agent not found: ${agentId} (expected at ${agentFile})`);
  }

  try {
    const content = await fs.readFile(agentFile, 'utf8');
    const agent = yaml.load(content);

    // Normalize agent structure
    const normalizedAgent = normalizeAgent(agent, agentId);

    // Cache the agent
    agentCache.set(agentId, normalizedAgent);

    return normalizedAgent;
  } catch (error) {
    if (error.name === 'YAMLException') {
      throw new Error(`Invalid YAML in agent file ${agentId}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Normalize agent structure for consistent access
 * @param {Object} agent - Raw agent data
 * @param {string} agentId - Agent identifier
 * @returns {Object} Normalized agent structure
 */
function normalizeAgent(agent, agentId) {
  const normalized = {
    // Basic info
    id: agent.agent?.id || agentId,
    name: agent.agent?.name || agentId,
    role: agent.agent?.role || 'Agent',
    version: agent.agent?.version || '1.0.0',

    // Identity
    description: agent.identity?.description || '',
    expertise: agent.identity?.expertise || [],
    personality: agent.identity?.personality || [],

    // Responsibilities
    responsibilities: agent.responsibilities || {},

    // Menu and commands
    menu: agent.menu || null,

    // Help system
    helpSystem: agent.help_system || null,

    // Routing (for master agent)
    routing: agent.routing || null,

    // Templates
    templates: agent.templates || [],

    // Collaboration
    collaboratesWith: agent.collaborates_with || [],

    // Prompts
    prompts: agent.prompts || {},

    // Capabilities
    capabilities: agent.capabilities || [],

    // Integrations
    integrations: agent.integrations || [],

    // Raw data for full access
    _raw: agent,
  };

  return normalized;
}

/**
 * Load all available agents
 * @async
 * @param {Object} [options] - Load options
 * @param {boolean} [options.useCache=true] - Use cached agents
 * @param {string} [options.configPath] - Config file path
 * @returns {Promise<Array<Object>>} Array of loaded agents
 */
async function loadAllAgents(options = {}) {
  const { configPath } = options;
  const availableAgents = await getConfigValue('agents.available_agents', [], configPath);

  const agents = [];
  for (const agentId of availableAgents) {
    try {
      const agent = await loadAgent(agentId, options);
      agents.push(agent);
    } catch (error) {
      // Skip agents that fail to load, but log in verbose mode
      console.error(`Warning: Could not load agent ${agentId}: ${error.message}`);
    }
  }

  return agents;
}

/**
 * List all available agents with basic info
 * @async
 * @param {Object} [options] - Options
 * @param {string} [options.configPath] - Config file path
 * @returns {Promise<Array<Object>>} Array of agent summaries
 */
async function listAgents(options = {}) {
  const { configPath } = options;
  const availableAgents = await getConfigValue('agents.available_agents', [], configPath);

  const agentList = [];

  for (const agentId of availableAgents) {
    try {
      const agent = await loadAgent(agentId, options);
      agentList.push({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description.split('\n')[0].trim().substring(0, 100),
        expertiseCount: agent.expertise.length,
        hasMenu: !!agent.menu,
      });
    } catch (error) {
      // Include failed agents with error info
      agentList.push({
        id: agentId,
        name: agentId,
        role: 'Unknown',
        description: `Error: ${error.message}`,
        expertiseCount: 0,
        hasMenu: false,
        error: true,
      });
    }
  }

  return agentList;
}

/**
 * Get agent menu commands
 * @async
 * @param {string} agentId - Agent identifier
 * @param {Object} [options] - Options
 * @returns {Promise<Object|null>} Menu configuration or null
 */
async function getAgentMenu(agentId, options = {}) {
  const agent = await loadAgent(agentId, options);
  return agent.menu;
}

/**
 * Get agent expertise areas
 * @async
 * @param {string} agentId - Agent identifier
 * @param {Object} [options] - Options
 * @returns {Promise<Array<string>>} List of expertise areas
 */
async function getAgentExpertise(agentId, options = {}) {
  const agent = await loadAgent(agentId, options);
  return agent.expertise;
}

/**
 * Get agent prompts
 * @async
 * @param {string} agentId - Agent identifier
 * @param {string} [promptKey] - Specific prompt key
 * @param {Object} [options] - Options
 * @returns {Promise<Object|string>} Prompts object or specific prompt
 */
async function getAgentPrompts(agentId, promptKey, options = {}) {
  const agent = await loadAgent(agentId, options);

  if (promptKey) {
    return agent.prompts[promptKey] || null;
  }

  return agent.prompts;
}

/**
 * Find agents by expertise keyword
 * @async
 * @param {string} keyword - Keyword to search for
 * @param {Object} [options] - Options
 * @returns {Promise<Array<Object>>} Matching agents
 */
async function findAgentsByExpertise(keyword, options = {}) {
  const agents = await loadAllAgents(options);
  const lowerKeyword = keyword.toLowerCase();

  return agents.filter(agent => {
    // Search in expertise
    const expertiseMatch = agent.expertise.some(e =>
      e.toLowerCase().includes(lowerKeyword)
    );

    // Search in description
    const descriptionMatch = agent.description.toLowerCase().includes(lowerKeyword);

    // Search in role
    const roleMatch = agent.role.toLowerCase().includes(lowerKeyword);

    return expertiseMatch || descriptionMatch || roleMatch;
  });
}

/**
 * Get routing rules from master agent
 * @async
 * @param {Object} [options] - Options
 * @returns {Promise<Object|null>} Routing configuration
 */
async function getRoutingRules(options = {}) {
  try {
    const masterAgent = await loadAgent('n8n-master', options);
    return masterAgent.routing;
  } catch {
    return null;
  }
}

/**
 * Route a query to the appropriate agent based on keywords
 * @async
 * @param {string} query - User query
 * @param {Object} [options] - Options
 * @returns {Promise<Object|null>} Recommended agent with reason
 */
async function routeToAgent(query, options = {}) {
  const routing = await getRoutingRules(options);

  if (!routing || !routing.rules) {
    return null;
  }

  const lowerQuery = query.toLowerCase();

  for (const rule of routing.rules) {
    // Parse condition (OR-separated keywords)
    const keywords = rule.condition.split(' OR ').map(k => k.trim().toLowerCase());

    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        try {
          const agent = await loadAgent(rule.agent, options);
          return {
            agent,
            reason: rule.reason,
            matchedKeyword: keyword,
          };
        } catch {
          // Agent not found, continue to next rule
          continue;
        }
      }
    }
  }

  return null;
}

/**
 * Get collaborating agents for a given agent
 * @async
 * @param {string} agentId - Agent identifier
 * @param {Object} [options] - Options
 * @returns {Promise<Array<Object>>} List of collaborating agents with relationships
 */
async function getCollaborators(agentId, options = {}) {
  const agent = await loadAgent(agentId, options);

  if (!agent.collaboratesWith || agent.collaboratesWith.length === 0) {
    return [];
  }

  const collaborators = [];
  for (const collab of agent.collaboratesWith) {
    try {
      const collaborator = await loadAgent(collab.agent, options);
      collaborators.push({
        ...collaborator,
        relationship: collab.relationship,
      });
    } catch {
      // Skip unavailable collaborators
    }
  }

  return collaborators;
}

/**
 * Format agent for display
 * @param {Object} agent - Agent object
 * @param {Object} [options] - Format options
 * @param {boolean} [options.detailed=false] - Include detailed info
 * @returns {Object} Formatted agent data for display
 */
function formatAgentForDisplay(agent, options = {}) {
  const { detailed = false } = options;

  const formatted = {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    shortDescription: agent.description.split('\n')[0].trim(),
  };

  if (detailed) {
    formatted.fullDescription = agent.description;
    formatted.expertise = agent.expertise;
    formatted.personality = agent.personality;
    formatted.capabilities = agent.capabilities;
    formatted.templates = agent.templates;
    formatted.hasMenu = !!agent.menu;
    formatted.hasPrompts = Object.keys(agent.prompts).length > 0;
  }

  return formatted;
}

/**
 * Clear the agent cache
 */
function clearCache() {
  agentCache.clear();
}

/**
 * Validate an agent file
 * @async
 * @param {string} agentId - Agent identifier
 * @param {Object} [options] - Options
 * @returns {Promise<Object>} Validation result
 */
async function validateAgent(agentId, options = {}) {
  const errors = [];
  const warnings = [];

  try {
    const agent = await loadAgent(agentId, { ...options, useCache: false });

    // Required fields
    if (!agent.id) errors.push('Missing agent.id');
    if (!agent.name) errors.push('Missing agent.name');
    if (!agent.role) errors.push('Missing agent.role');
    if (!agent.description) warnings.push('Missing identity.description');
    if (!agent.expertise || agent.expertise.length === 0) {
      warnings.push('No expertise defined');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      agent: errors.length === 0 ? agent : null,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error.message],
      warnings: [],
      agent: null,
    };
  }
}

module.exports = {
  loadAgent,
  loadAllAgents,
  listAgents,
  getAgentMenu,
  getAgentExpertise,
  getAgentPrompts,
  findAgentsByExpertise,
  getRoutingRules,
  routeToAgent,
  getCollaborators,
  formatAgentForDisplay,
  clearCache,
  validateAgent,
  normalizeAgent,
  getAgentsPath,
};
