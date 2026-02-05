/**
 * @fileoverview Unit tests for agent-loader module
 */

const path = require('path');

// Mock fs.promises before requiring the module under test
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      readFile: jest.fn(),
      access: jest.fn(),
    },
  };
});

jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

jest.mock('../../tools/cli/lib/config-loader', () => ({
  getProjectRoot: jest.fn(),
  getConfigValue: jest.fn(),
}));

const fs = require('fs').promises;
const yaml = require('js-yaml');
const { getProjectRoot, getConfigValue } = require('../../tools/cli/lib/config-loader');

const {
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
} = require('../../tools/cli/lib/agent-loader');

// ---------------------------------------------------------------------------
// Helpers & Fixtures
// ---------------------------------------------------------------------------

const MOCK_PROJECT_ROOT = '/mock/project';
const MOCK_AGENTS_DIR = '/mock/project/src/core/agents';

/**
 * Build a raw YAML agent structure that mirrors what yaml.load() would return
 */
function buildRawAgent(overrides = {}) {
  return {
    agent: {
      id: 'developer',
      name: 'Nate',
      role: 'Developer',
      version: '2.0.0',
      ...(overrides.agent || {}),
    },
    identity: {
      description: 'Expert n8n workflow developer.\nSecond line of description.',
      expertise: ['n8n workflows', 'JavaScript', 'REST APIs'],
      personality: ['methodical', 'detail-oriented'],
      ...(overrides.identity || {}),
    },
    responsibilities: overrides.responsibilities || { core: ['build workflows'] },
    menu: overrides.menu !== undefined ? overrides.menu : [
      { trigger: 'dev-story', action: 'dev-story', description: 'Implement a story' },
    ],
    help_system: overrides.help_system || { commands: ['/help'] },
    routing: overrides.routing || null,
    templates: overrides.templates || ['story.md'],
    collaborates_with: overrides.collaborates_with || [
      { agent: 'qa', relationship: 'Review partner' },
    ],
    prompts: overrides.prompts || {
      create: 'Create prompt text',
      review: 'Review prompt text',
    },
    capabilities: overrides.capabilities || ['workflow-building'],
    integrations: overrides.integrations || ['n8n-api'],
  };
}

/**
 * Configure mocks so loadAgent(agentId) can succeed for a given agent
 */
function setupAgentLoad(agentId, rawAgent) {
  const agentFile = path.join(MOCK_AGENTS_DIR, `${agentId}.agent.yaml`);

  fs.access.mockImplementation(async (filePath) => {
    if (filePath === agentFile) return undefined;
    throw new Error('ENOENT');
  });

  fs.readFile.mockImplementation(async (filePath) => {
    if (filePath === agentFile) return 'yaml-content';
    throw new Error('ENOENT');
  });

  yaml.load.mockReturnValue(rawAgent);
}

/**
 * Configure mocks so loadAgent(agentId) succeeds for multiple agents
 */
function setupMultipleAgents(agentMap) {
  const files = {};
  for (const [id, raw] of Object.entries(agentMap)) {
    files[path.join(MOCK_AGENTS_DIR, `${id}.agent.yaml`)] = raw;
  }

  fs.access.mockImplementation(async (filePath) => {
    if (files[filePath] !== undefined) return undefined;
    throw new Error('ENOENT');
  });

  fs.readFile.mockImplementation(async (filePath) => {
    if (files[filePath] !== undefined) return 'yaml-content';
    throw new Error('ENOENT');
  });

  yaml.load.mockImplementation(() => {
    return files[fs.readFile.mock.calls[fs.readFile.mock.calls.length - 1][0]];
  });
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('agent-loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCache();

    // Default config-loader behaviour
    getProjectRoot.mockResolvedValue(MOCK_PROJECT_ROOT);
    getConfigValue.mockImplementation(async (key, defaultVal) => {
      if (key === 'agents.agent_path') return './src/core/agents';
      if (key === 'agents.available_agents') return ['developer', 'architect', 'qa'];
      return defaultVal;
    });
  });

  // =========================================================================
  // getAgentsPath
  // =========================================================================
  describe('getAgentsPath', () => {
    it('should resolve agents directory from config', async () => {
      const result = await getAgentsPath();
      expect(result).toBe(path.resolve(MOCK_PROJECT_ROOT, './src/core/agents'));
    });

    it('should pass configPath to getConfigValue and getProjectRoot', async () => {
      await getAgentsPath('/custom/config.yaml');
      expect(getConfigValue).toHaveBeenCalledWith(
        'agents.agent_path',
        './src/core/agents',
        '/custom/config.yaml'
      );
      expect(getProjectRoot).toHaveBeenCalledWith('/custom/config.yaml');
    });

    it('should handle custom agent_path from config', async () => {
      getConfigValue.mockImplementation(async (key, defaultVal) => {
        if (key === 'agents.agent_path') return './custom/agents';
        return defaultVal;
      });
      const result = await getAgentsPath();
      expect(result).toBe(path.resolve(MOCK_PROJECT_ROOT, './custom/agents'));
    });
  });

  // =========================================================================
  // normalizeAgent
  // =========================================================================
  describe('normalizeAgent', () => {
    it('should extract id, name, role, version from agent.agent', () => {
      const raw = buildRawAgent();
      const result = normalizeAgent(raw, 'developer');
      expect(result.id).toBe('developer');
      expect(result.name).toBe('Nate');
      expect(result.role).toBe('Developer');
      expect(result.version).toBe('2.0.0');
    });

    it('should fall back to agentId when agent.agent.id is missing', () => {
      const raw = buildRawAgent({ agent: { name: 'NoId', role: 'Test', version: '1.0.0' } });
      delete raw.agent.id;
      const result = normalizeAgent(raw, 'fallback-id');
      expect(result.id).toBe('fallback-id');
    });

    it('should fall back to agentId for missing name', () => {
      const raw = buildRawAgent();
      delete raw.agent.name;
      const result = normalizeAgent(raw, 'some-agent');
      expect(result.name).toBe('some-agent');
    });

    it('should default role to "Agent" when missing', () => {
      const raw = buildRawAgent();
      delete raw.agent.role;
      const result = normalizeAgent(raw, 'test');
      expect(result.role).toBe('Agent');
    });

    it('should default version to "1.0.0" when missing', () => {
      const raw = buildRawAgent();
      delete raw.agent.version;
      const result = normalizeAgent(raw, 'test');
      expect(result.version).toBe('1.0.0');
    });

    it('should extract identity fields (description, expertise, personality)', () => {
      const raw = buildRawAgent();
      const result = normalizeAgent(raw, 'developer');
      expect(result.description).toContain('Expert n8n');
      expect(result.expertise).toEqual(['n8n workflows', 'JavaScript', 'REST APIs']);
      expect(result.personality).toEqual(['methodical', 'detail-oriented']);
    });

    it('should default identity fields when identity is missing', () => {
      const raw = buildRawAgent();
      delete raw.identity;
      const result = normalizeAgent(raw, 'test');
      expect(result.description).toBe('');
      expect(result.expertise).toEqual([]);
      expect(result.personality).toEqual([]);
    });

    it('should map menu and set null when absent', () => {
      const raw = buildRawAgent();
      expect(normalizeAgent(raw, 'dev').menu).toHaveLength(1);

      const rawNoMenu = buildRawAgent({ menu: undefined });
      delete rawNoMenu.menu;
      expect(normalizeAgent(rawNoMenu, 'test').menu).toBeNull();
    });

    it('should map helpSystem from help_system', () => {
      const raw = buildRawAgent();
      const result = normalizeAgent(raw, 'developer');
      expect(result.helpSystem).toEqual({ commands: ['/help'] });
    });

    it('should map collaboratesWith from collaborates_with', () => {
      const raw = buildRawAgent();
      const result = normalizeAgent(raw, 'developer');
      expect(result.collaboratesWith).toEqual([
        { agent: 'qa', relationship: 'Review partner' },
      ]);
    });

    it('should default collaboratesWith to empty array when missing', () => {
      const raw = buildRawAgent({ collaborates_with: undefined });
      delete raw.collaborates_with;
      const result = normalizeAgent(raw, 'test');
      expect(result.collaboratesWith).toEqual([]);
    });

    it('should preserve raw data in _raw', () => {
      const raw = buildRawAgent();
      const result = normalizeAgent(raw, 'developer');
      expect(result._raw).toBe(raw);
    });

    it('should map responsibilities, templates, prompts, capabilities, integrations', () => {
      const raw = buildRawAgent();
      const result = normalizeAgent(raw, 'developer');
      expect(result.responsibilities).toEqual({ core: ['build workflows'] });
      expect(result.templates).toEqual(['story.md']);
      expect(result.prompts).toEqual({ create: 'Create prompt text', review: 'Review prompt text' });
      expect(result.capabilities).toEqual(['workflow-building']);
      expect(result.integrations).toEqual(['n8n-api']);
    });

    it('should default prompts to empty object when missing', () => {
      const raw = buildRawAgent({ prompts: undefined });
      delete raw.prompts;
      expect(normalizeAgent(raw, 'test').prompts).toEqual({});
    });

    it('should map routing from raw', () => {
      const routingData = { rules: [{ condition: 'test', agent: 'dev' }] };
      const raw = buildRawAgent({ routing: routingData });
      expect(normalizeAgent(raw, 'test').routing).toBe(routingData);
    });

    it('should handle completely empty raw object with all defaults', () => {
      const result = normalizeAgent({}, 'empty-agent');
      expect(result.id).toBe('empty-agent');
      expect(result.name).toBe('empty-agent');
      expect(result.role).toBe('Agent');
      expect(result.version).toBe('1.0.0');
      expect(result.description).toBe('');
      expect(result.expertise).toEqual([]);
      expect(result.menu).toBeNull();
      expect(result.responsibilities).toEqual({});
      expect(result.templates).toEqual([]);
      expect(result.capabilities).toEqual([]);
      expect(result.integrations).toEqual([]);
    });

    it('should handle null identity and null agent fields', () => {
      const raw = { agent: null, identity: null };
      const result = normalizeAgent(raw, 'fallback');
      expect(result.id).toBe('fallback');
      expect(result.name).toBe('fallback');
      expect(result.role).toBe('Agent');
      expect(result.description).toBe('');
      expect(result.expertise).toEqual([]);
    });
  });

  // =========================================================================
  // loadAgent
  // =========================================================================
  describe('loadAgent', () => {
    it('should load and normalize an agent by ID', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const agent = await loadAgent('developer');
      expect(agent.id).toBe('developer');
      expect(agent.name).toBe('Nate');
      expect(agent.role).toBe('Developer');
    });

    it('should throw "Agent not found" when file does not exist', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      await expect(loadAgent('nonexistent')).rejects.toThrow('Agent not found: nonexistent');
    });

    it('should include expected file path in "Agent not found" error', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      const expectedPath = path.join(MOCK_AGENTS_DIR, 'ghost.agent.yaml');
      await expect(loadAgent('ghost')).rejects.toThrow(expectedPath);
    });

    it('should throw descriptive error on YAMLException', async () => {
      fs.access.mockResolvedValue(undefined);
      fs.readFile.mockResolvedValue('bad content');
      const yamlError = new Error('bad indentation');
      yamlError.name = 'YAMLException';
      yaml.load.mockImplementation(() => { throw yamlError; });

      await expect(loadAgent('bad')).rejects.toThrow('Invalid YAML in agent file bad');
    });

    it('should re-throw non-YAML errors', async () => {
      fs.access.mockResolvedValue(undefined);
      fs.readFile.mockRejectedValue(new Error('Permission denied'));
      await expect(loadAgent('perm')).rejects.toThrow('Permission denied');
    });

    it('should cache agent on successful load and return same reference', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const first = await loadAgent('developer');
      const second = await loadAgent('developer');
      expect(first).toBe(second);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when useCache is false', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      await loadAgent('developer');
      await loadAgent('developer', { useCache: false });
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should pass configPath through to getAgentsPath', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      await loadAgent('developer', { configPath: '/my/config.yaml' });
      expect(getConfigValue).toHaveBeenCalledWith(
        'agents.agent_path',
        './src/core/agents',
        '/my/config.yaml'
      );
    });

    it('should read file with utf8 encoding', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      await loadAgent('developer');
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('developer.agent.yaml'),
        'utf8'
      );
    });

    it('should construct correct agent file path from ID', async () => {
      const raw = buildRawAgent();
      const archFile = path.join(MOCK_AGENTS_DIR, 'architect.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === archFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === archFile) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      await loadAgent('architect');
      expect(fs.readFile).toHaveBeenCalledWith(archFile, 'utf8');
    });
  });

  // =========================================================================
  // clearCache
  // =========================================================================
  describe('clearCache', () => {
    it('should force reload after clearing', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      await loadAgent('developer');
      clearCache();
      await loadAgent('developer');
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should not throw when cache is already empty', () => {
      expect(() => clearCache()).not.toThrow();
    });
  });

  // =========================================================================
  // loadAllAgents
  // =========================================================================
  describe('loadAllAgents', () => {
    it('should load all agents from available_agents config', async () => {
      const devRaw = buildRawAgent();
      const archRaw = buildRawAgent({ agent: { id: 'architect', name: 'Winston', role: 'Architect', version: '2.0.0' } });
      const qaRaw = buildRawAgent({ agent: { id: 'qa', name: 'Quinn', role: 'QA', version: '2.0.0' } });

      setupMultipleAgents({ developer: devRaw, architect: archRaw, qa: qaRaw });

      const agents = await loadAllAgents();
      expect(agents).toHaveLength(3);
    });

    it('should skip failing agents and log console.error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      getConfigValue.mockImplementation(async (key, defaultVal) => {
        if (key === 'agents.available_agents') return ['developer', 'missing-agent'];
        if (key === 'agents.agent_path') return './src/core/agents';
        return defaultVal;
      });

      const devRaw = buildRawAgent();
      const devFile = path.join(MOCK_AGENTS_DIR, 'developer.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === devFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === devFile) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(devRaw);

      const agents = await loadAllAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('developer');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('missing-agent'));
      consoleSpy.mockRestore();
    });

    it('should return empty array when no agents configured', async () => {
      getConfigValue.mockImplementation(async (key, defaultVal) => {
        if (key === 'agents.available_agents') return [];
        if (key === 'agents.agent_path') return './src/core/agents';
        return defaultVal;
      });

      const agents = await loadAllAgents();
      expect(agents).toEqual([]);
    });

    it('should pass options through to getConfigValue', async () => {
      const devRaw = buildRawAgent();
      setupMultipleAgents({ developer: devRaw });
      getConfigValue.mockImplementation(async (key, defaultVal) => {
        if (key === 'agents.available_agents') return ['developer'];
        if (key === 'agents.agent_path') return './src/core/agents';
        return defaultVal;
      });

      await loadAllAgents({ configPath: '/custom/path.yaml' });
      expect(getConfigValue).toHaveBeenCalledWith(
        'agents.available_agents',
        [],
        '/custom/path.yaml'
      );
    });
  });

  // =========================================================================
  // listAgents
  // =========================================================================
  describe('listAgents', () => {
    beforeEach(() => {
      getConfigValue.mockImplementation(async (key, defaultVal) => {
        if (key === 'agents.available_agents') return ['developer'];
        if (key === 'agents.agent_path') return './src/core/agents';
        return defaultVal;
      });
    });

    it('should return agent summaries with id, name, role, description, expertiseCount, hasMenu', async () => {
      const devRaw = buildRawAgent();
      setupMultipleAgents({ developer: devRaw });

      const list = await listAgents();
      expect(list).toHaveLength(1);
      expect(list[0]).toEqual(expect.objectContaining({
        id: 'developer',
        name: 'Nate',
        role: 'Developer',
        expertiseCount: 3,
        hasMenu: true,
      }));
    });

    it('should truncate description to 100 chars and use only first line', async () => {
      const longDesc = 'A'.repeat(200) + '\nSecond line';
      const raw = buildRawAgent({ identity: { description: longDesc, expertise: [], personality: [] } });
      setupMultipleAgents({ developer: raw });

      const list = await listAgents();
      expect(list[0].description.length).toBeLessThanOrEqual(100);
      expect(list[0].description).not.toContain('\n');
    });

    it('should use only the first line of description for short descriptions', async () => {
      const raw = buildRawAgent({
        identity: { description: 'First line\nSecond line\nThird line', expertise: [], personality: [] },
      });
      setupMultipleAgents({ developer: raw });

      const list = await listAgents();
      expect(list[0].description).toBe('First line');
    });

    it('should include error entry for agents that fail to load', async () => {
      getConfigValue.mockImplementation(async (key, defaultVal) => {
        if (key === 'agents.available_agents') return ['broken'];
        if (key === 'agents.agent_path') return './src/core/agents';
        return defaultVal;
      });
      fs.access.mockRejectedValue(new Error('ENOENT'));

      const list = await listAgents();
      expect(list).toHaveLength(1);
      expect(list[0].error).toBe(true);
      expect(list[0].id).toBe('broken');
      expect(list[0].role).toBe('Unknown');
      expect(list[0].description).toContain('Error');
      expect(list[0].hasMenu).toBe(false);
      expect(list[0].expertiseCount).toBe(0);
    });
  });

  // =========================================================================
  // getAgentMenu
  // =========================================================================
  describe('getAgentMenu', () => {
    it('should return the menu of a loaded agent', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const menu = await getAgentMenu('developer');
      expect(menu).toEqual([
        { trigger: 'dev-story', action: 'dev-story', description: 'Implement a story' },
      ]);
    });

    it('should return null when agent has no menu', async () => {
      const raw = buildRawAgent({ menu: undefined });
      delete raw.menu;
      const file = path.join(MOCK_AGENTS_DIR, 'noMenu.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === file) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      const menu = await getAgentMenu('noMenu');
      expect(menu).toBeNull();
    });

    it('should propagate loadAgent errors', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      await expect(getAgentMenu('missing')).rejects.toThrow('Agent not found');
    });
  });

  // =========================================================================
  // getAgentExpertise
  // =========================================================================
  describe('getAgentExpertise', () => {
    it('should return expertise array', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const expertise = await getAgentExpertise('developer');
      expect(expertise).toEqual(['n8n workflows', 'JavaScript', 'REST APIs']);
    });

    it('should return empty array when agent has no expertise', async () => {
      const raw = buildRawAgent({ identity: { description: 'test', expertise: undefined, personality: [] } });
      delete raw.identity.expertise;
      const file = path.join(MOCK_AGENTS_DIR, 'noexp.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === file) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      const expertise = await getAgentExpertise('noexp');
      expect(expertise).toEqual([]);
    });
  });

  // =========================================================================
  // getAgentPrompts
  // =========================================================================
  describe('getAgentPrompts', () => {
    it('should return all prompts when no promptKey given', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const prompts = await getAgentPrompts('developer');
      expect(prompts).toEqual({ create: 'Create prompt text', review: 'Review prompt text' });
    });

    it('should return specific prompt by key', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const prompt = await getAgentPrompts('developer', 'create');
      expect(prompt).toBe('Create prompt text');
    });

    it('should return null for non-existent prompt key', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const prompt = await getAgentPrompts('developer', 'nonexistent');
      expect(prompt).toBeNull();
    });

    it('should return empty object when agent has no prompts', async () => {
      const raw = buildRawAgent({ prompts: undefined });
      delete raw.prompts;
      const file = path.join(MOCK_AGENTS_DIR, 'noprompt.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === file) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      const prompts = await getAgentPrompts('noprompt');
      expect(prompts).toEqual({});
    });
  });

  // =========================================================================
  // findAgentsByExpertise
  // =========================================================================
  describe('findAgentsByExpertise', () => {
    beforeEach(() => {
      const devRaw = buildRawAgent();
      const archRaw = buildRawAgent({
        agent: { id: 'architect', name: 'Winston', role: 'Architect', version: '2.0.0' },
        identity: {
          description: 'System architecture expert',
          expertise: ['architecture', 'system design', 'patterns'],
          personality: ['analytical'],
        },
      });
      const qaRaw = buildRawAgent({
        agent: { id: 'qa', name: 'Quinn', role: 'QA Engineer', version: '2.0.0' },
        identity: {
          description: 'Quality assurance specialist',
          expertise: ['testing', 'code review', 'quality'],
          personality: ['thorough'],
        },
      });

      setupMultipleAgents({ developer: devRaw, architect: archRaw, qa: qaRaw });
    });

    it('should find agents by expertise keyword', async () => {
      const results = await findAgentsByExpertise('JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('developer');
    });

    it('should be case-insensitive', async () => {
      const results = await findAgentsByExpertise('javascript');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('developer');
    });

    it('should search in description', async () => {
      const results = await findAgentsByExpertise('quality assurance');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('qa');
    });

    it('should search in role', async () => {
      const results = await findAgentsByExpertise('architect');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('architect');
    });

    it('should return empty array when no match', async () => {
      const results = await findAgentsByExpertise('blockchain');
      expect(results).toEqual([]);
    });

    it('should match partial keywords in expertise', async () => {
      const results = await findAgentsByExpertise('test');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('qa');
    });
  });

  // =========================================================================
  // getRoutingRules
  // =========================================================================
  describe('getRoutingRules', () => {
    it('should load routing from n8n-master agent', async () => {
      const masterRaw = buildRawAgent({
        agent: { id: 'n8n-master', name: 'Master', role: 'Master', version: '2.0.0' },
        routing: {
          rules: [
            { condition: 'build OR develop', agent: 'developer', reason: 'Development task' },
          ],
        },
      });
      const masterFile = path.join(MOCK_AGENTS_DIR, 'n8n-master.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === masterFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === masterFile) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(masterRaw);

      const routing = await getRoutingRules();
      expect(routing).toEqual({
        rules: [
          { condition: 'build OR develop', agent: 'developer', reason: 'Development task' },
        ],
      });
    });

    it('should return null when n8n-master cannot be loaded', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      const routing = await getRoutingRules();
      expect(routing).toBeNull();
    });

    it('should return null when master agent has no routing', async () => {
      const masterRaw = buildRawAgent({
        agent: { id: 'n8n-master', name: 'Master', role: 'Master', version: '2.0.0' },
        routing: null,
      });
      const masterFile = path.join(MOCK_AGENTS_DIR, 'n8n-master.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === masterFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockResolvedValue('yaml');
      yaml.load.mockReturnValue(masterRaw);

      const routing = await getRoutingRules();
      expect(routing).toBeNull();
    });
  });

  // =========================================================================
  // routeToAgent
  // =========================================================================
  describe('routeToAgent', () => {
    function setupRoutingWithDev() {
      const masterRaw = buildRawAgent({
        agent: { id: 'n8n-master', name: 'Master', role: 'Master', version: '2.0.0' },
        routing: {
          rules: [
            { condition: 'build OR develop OR code', agent: 'developer', reason: 'Development task' },
            { condition: 'test OR quality', agent: 'qa', reason: 'Quality task' },
            { condition: 'architect OR design', agent: 'architect', reason: 'Architecture task' },
          ],
        },
      });
      const devRaw = buildRawAgent();
      const qaRaw = buildRawAgent({
        agent: { id: 'qa', name: 'Quinn', role: 'QA', version: '2.0.0' },
      });
      const archRaw = buildRawAgent({
        agent: { id: 'architect', name: 'Winston', role: 'Architect', version: '2.0.0' },
      });

      const files = {
        [path.join(MOCK_AGENTS_DIR, 'n8n-master.agent.yaml')]: masterRaw,
        [path.join(MOCK_AGENTS_DIR, 'developer.agent.yaml')]: devRaw,
        [path.join(MOCK_AGENTS_DIR, 'qa.agent.yaml')]: qaRaw,
        [path.join(MOCK_AGENTS_DIR, 'architect.agent.yaml')]: archRaw,
      };

      fs.access.mockImplementation(async (p) => {
        if (files[p]) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (files[p]) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockImplementation(() => {
        const lastCall = fs.readFile.mock.calls[fs.readFile.mock.calls.length - 1][0];
        return files[lastCall];
      });
    }

    it('should route query to matching agent with reason', async () => {
      setupRoutingWithDev();
      const result = await routeToAgent('I want to build a workflow');
      expect(result).not.toBeNull();
      expect(result.agent.id).toBe('developer');
      expect(result.reason).toBe('Development task');
      expect(result.matchedKeyword).toBe('build');
    });

    it('should be case-insensitive on query', async () => {
      setupRoutingWithDev();
      const result = await routeToAgent('DEVELOP something');
      expect(result.agent.id).toBe('developer');
    });

    it('should match any OR-separated keyword', async () => {
      setupRoutingWithDev();
      const result = await routeToAgent('need to code a feature');
      expect(result.agent.id).toBe('developer');
      expect(result.matchedKeyword).toBe('code');
    });

    it('should match second rule when first does not match', async () => {
      setupRoutingWithDev();
      const result = await routeToAgent('run quality checks');
      expect(result.agent.id).toBe('qa');
      expect(result.reason).toBe('Quality task');
    });

    it('should return null when no rule matches', async () => {
      setupRoutingWithDev();
      const result = await routeToAgent('deploy to production');
      expect(result).toBeNull();
    });

    it('should return null when routing rules are not available', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      const result = await routeToAgent('build something');
      expect(result).toBeNull();
    });

    it('should return null when routing has no rules property', async () => {
      const masterRaw = buildRawAgent({
        agent: { id: 'n8n-master', name: 'Master', role: 'Master', version: '2.0.0' },
        routing: { description: 'No rules here' },
      });
      const masterFile = path.join(MOCK_AGENTS_DIR, 'n8n-master.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === masterFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockResolvedValue('yaml');
      yaml.load.mockReturnValue(masterRaw);

      const result = await routeToAgent('build something');
      expect(result).toBeNull();
    });

    it('should skip rule when routed agent cannot be loaded and try next', async () => {
      const masterRaw = buildRawAgent({
        agent: { id: 'n8n-master', name: 'Master', role: 'Master', version: '2.0.0' },
        routing: {
          rules: [
            { condition: 'build', agent: 'ghost-agent', reason: 'Ghost' },
            { condition: 'build', agent: 'developer', reason: 'Dev task' },
          ],
        },
      });
      const devRaw = buildRawAgent();
      const masterFile = path.join(MOCK_AGENTS_DIR, 'n8n-master.agent.yaml');
      const devFile = path.join(MOCK_AGENTS_DIR, 'developer.agent.yaml');

      fs.access.mockImplementation(async (p) => {
        if (p === masterFile || p === devFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === masterFile || p === devFile) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockImplementation(() => {
        const lastCall = fs.readFile.mock.calls[fs.readFile.mock.calls.length - 1][0];
        if (lastCall === masterFile) return masterRaw;
        if (lastCall === devFile) return devRaw;
        throw new Error('Not found');
      });

      const result = await routeToAgent('build something');
      expect(result.agent.id).toBe('developer');
    });
  });

  // =========================================================================
  // getCollaborators
  // =========================================================================
  describe('getCollaborators', () => {
    it('should return collaborating agents with relationship info', async () => {
      const devRaw = buildRawAgent({
        collaborates_with: [
          { agent: 'qa', relationship: 'Review partner' },
        ],
      });
      const qaRaw = buildRawAgent({
        agent: { id: 'qa', name: 'Quinn', role: 'QA', version: '2.0.0' },
      });

      const devFile = path.join(MOCK_AGENTS_DIR, 'developer.agent.yaml');
      const qaFile = path.join(MOCK_AGENTS_DIR, 'qa.agent.yaml');

      fs.access.mockImplementation(async (p) => {
        if (p === devFile || p === qaFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === devFile || p === qaFile) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockImplementation(() => {
        const lastCall = fs.readFile.mock.calls[fs.readFile.mock.calls.length - 1][0];
        if (lastCall === devFile) return devRaw;
        if (lastCall === qaFile) return qaRaw;
        throw new Error('Not found');
      });

      const collabs = await getCollaborators('developer');
      expect(collabs).toHaveLength(1);
      expect(collabs[0].id).toBe('qa');
      expect(collabs[0].relationship).toBe('Review partner');
    });

    it('should return empty array when agent has no collaborators', async () => {
      const raw = buildRawAgent({ collaborates_with: [] });
      const file = path.join(MOCK_AGENTS_DIR, 'loner.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === file) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      const collabs = await getCollaborators('loner');
      expect(collabs).toEqual([]);
    });

    it('should skip unavailable collaborators silently', async () => {
      const devRaw = buildRawAgent({
        collaborates_with: [
          { agent: 'missing-agent', relationship: 'Should skip' },
        ],
      });
      const devFile = path.join(MOCK_AGENTS_DIR, 'developer.agent.yaml');

      fs.access.mockImplementation(async (p) => {
        if (p === devFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === devFile) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(devRaw);

      const collabs = await getCollaborators('developer');
      expect(collabs).toEqual([]);
    });

    it('should load multiple collaborators preserving order', async () => {
      const devRaw = buildRawAgent({
        collaborates_with: [
          { agent: 'qa', relationship: 'Reviewer' },
          { agent: 'architect', relationship: 'Design partner' },
        ],
      });
      const qaRaw = buildRawAgent({
        agent: { id: 'qa', name: 'Quinn', role: 'QA', version: '2.0.0' },
      });
      const archRaw = buildRawAgent({
        agent: { id: 'architect', name: 'Winston', role: 'Architect', version: '2.0.0' },
      });

      const fileMap = {
        [path.join(MOCK_AGENTS_DIR, 'developer.agent.yaml')]: devRaw,
        [path.join(MOCK_AGENTS_DIR, 'qa.agent.yaml')]: qaRaw,
        [path.join(MOCK_AGENTS_DIR, 'architect.agent.yaml')]: archRaw,
      };

      fs.access.mockImplementation(async (p) => {
        if (fileMap[p]) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (fileMap[p]) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockImplementation(() => {
        const lastCall = fs.readFile.mock.calls[fs.readFile.mock.calls.length - 1][0];
        return fileMap[lastCall];
      });

      const collabs = await getCollaborators('developer');
      expect(collabs).toHaveLength(2);
      expect(collabs[0].relationship).toBe('Reviewer');
      expect(collabs[1].relationship).toBe('Design partner');
    });

    it('should throw when primary agent does not exist', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      await expect(getCollaborators('missing')).rejects.toThrow('Agent not found');
    });
  });

  // =========================================================================
  // formatAgentForDisplay
  // =========================================================================
  describe('formatAgentForDisplay', () => {
    const agent = {
      id: 'developer',
      name: 'Nate',
      role: 'Developer',
      description: 'Expert n8n workflow developer.\nSecond line.',
      expertise: ['n8n workflows', 'JavaScript'],
      personality: ['methodical'],
      capabilities: ['workflow-building'],
      templates: ['story.md'],
      menu: [{ trigger: 'dev-story' }],
      prompts: { create: 'Create prompt' },
    };

    it('should return basic fields by default', () => {
      const result = formatAgentForDisplay(agent);
      expect(result.id).toBe('developer');
      expect(result.name).toBe('Nate');
      expect(result.role).toBe('Developer');
      expect(result.shortDescription).toBe('Expert n8n workflow developer.');
    });

    it('should use first line only and trim whitespace for shortDescription', () => {
      const spaceyAgent = { ...agent, description: '  Leading spaces  \nSecond line' };
      const result = formatAgentForDisplay(spaceyAgent);
      expect(result.shortDescription).toBe('Leading spaces');
      expect(result.shortDescription).not.toContain('\n');
    });

    it('should not include detailed fields by default', () => {
      const result = formatAgentForDisplay(agent);
      expect(result.fullDescription).toBeUndefined();
      expect(result.expertise).toBeUndefined();
      expect(result.personality).toBeUndefined();
      expect(result.capabilities).toBeUndefined();
      expect(result.templates).toBeUndefined();
      expect(result.hasMenu).toBeUndefined();
      expect(result.hasPrompts).toBeUndefined();
    });

    it('should include all detailed fields when detailed=true', () => {
      const result = formatAgentForDisplay(agent, { detailed: true });
      expect(result.fullDescription).toBe(agent.description);
      expect(result.expertise).toEqual(agent.expertise);
      expect(result.personality).toEqual(agent.personality);
      expect(result.capabilities).toEqual(agent.capabilities);
      expect(result.templates).toEqual(agent.templates);
      expect(result.hasMenu).toBe(true);
      expect(result.hasPrompts).toBe(true);
    });

    it('should set hasMenu false when menu is null in detailed mode', () => {
      const noMenuAgent = { ...agent, menu: null };
      const result = formatAgentForDisplay(noMenuAgent, { detailed: true });
      expect(result.hasMenu).toBe(false);
    });

    it('should set hasPrompts false when prompts is empty in detailed mode', () => {
      const noPromptsAgent = { ...agent, prompts: {} };
      const result = formatAgentForDisplay(noPromptsAgent, { detailed: true });
      expect(result.hasPrompts).toBe(false);
    });

    it('should handle empty description', () => {
      const emptyDescAgent = { ...agent, description: '' };
      const result = formatAgentForDisplay(emptyDescAgent);
      expect(result.shortDescription).toBe('');
    });
  });

  // =========================================================================
  // validateAgent
  // =========================================================================
  describe('validateAgent', () => {
    it('should return valid=true for a well-formed agent', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const result = await validateAgent('developer');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.agent).not.toBeNull();
    });

    it('should always bypass cache (useCache=false)', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      await loadAgent('developer');
      await validateAgent('developer');
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should return warning when description is missing', async () => {
      const raw = buildRawAgent({
        identity: { description: '', expertise: ['test'], personality: [] },
      });
      const file = path.join(MOCK_AGENTS_DIR, 'nodesc.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === file) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      const result = await validateAgent('nodesc');
      expect(result.warnings).toContain('Missing identity.description');
      expect(result.valid).toBe(true);
    });

    it('should return warning when expertise is empty or undefined', async () => {
      const raw = buildRawAgent({
        identity: { description: 'Has description', expertise: [], personality: [] },
      });
      const file = path.join(MOCK_AGENTS_DIR, 'noexp.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === file) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      const result = await validateAgent('noexp');
      expect(result.warnings).toContain('No expertise defined');
    });

    it('should accumulate multiple warnings', async () => {
      const raw = buildRawAgent({
        identity: { description: '', expertise: [], personality: [] },
      });
      const file = path.join(MOCK_AGENTS_DIR, 'bare.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === file) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      const result = await validateAgent('bare');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings).toContain('Missing identity.description');
      expect(result.warnings).toContain('No expertise defined');
    });

    it('should return valid=false when agent file is missing', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await validateAgent('ghost');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Agent not found');
      expect(result.agent).toBeNull();
    });

    it('should return valid=false when YAML is invalid', async () => {
      const file = path.join(MOCK_AGENTS_DIR, 'badyaml.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockResolvedValue('bad content');
      const yamlError = new Error('bad indent');
      yamlError.name = 'YAMLException';
      yaml.load.mockImplementation(() => { throw yamlError; });

      const result = await validateAgent('badyaml');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid YAML');
      expect(result.agent).toBeNull();
    });

    it('should include agent in result when valid', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const result = await validateAgent('developer');
      expect(result.agent).not.toBeNull();
      expect(result.agent.id).toBe('developer');
    });
  });

  // =========================================================================
  // Cache interactions (cross-function)
  // =========================================================================
  describe('cache interactions', () => {
    it('should share cache between loadAgent and accessor functions', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      await loadAgent('developer');
      await getAgentMenu('developer');
      await getAgentExpertise('developer');
      await getAgentPrompts('developer');
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should invalidate all entries on clearCache', async () => {
      const devRaw = buildRawAgent();
      const qaRaw = buildRawAgent({
        agent: { id: 'qa', name: 'Quinn', role: 'QA', version: '2.0.0' },
      });
      const devFile = path.join(MOCK_AGENTS_DIR, 'developer.agent.yaml');
      const qaFile = path.join(MOCK_AGENTS_DIR, 'qa.agent.yaml');

      const fileMap = { [devFile]: devRaw, [qaFile]: qaRaw };
      fs.access.mockImplementation(async (p) => {
        if (fileMap[p]) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (fileMap[p]) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockImplementation(() => {
        const lastCall = fs.readFile.mock.calls[fs.readFile.mock.calls.length - 1][0];
        return fileMap[lastCall];
      });

      await loadAgent('developer');
      await loadAgent('qa');
      expect(fs.readFile).toHaveBeenCalledTimes(2);

      clearCache();

      await loadAgent('developer');
      await loadAgent('qa');
      expect(fs.readFile).toHaveBeenCalledTimes(4);
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================
  describe('edge cases', () => {
    it('should handle loadAgent with empty options object', async () => {
      const raw = buildRawAgent();
      setupAgentLoad('developer', raw);

      const agent = await loadAgent('developer', {});
      expect(agent.id).toBe('developer');
    });

    it('should handle loadAllAgents when all agents fail to load', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      fs.access.mockRejectedValue(new Error('ENOENT'));

      const agents = await loadAllAgents();
      expect(agents).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });

    it('should handle findAgentsByExpertise with empty keyword (matches all)', async () => {
      const raw = buildRawAgent();
      setupMultipleAgents({ developer: raw });
      getConfigValue.mockImplementation(async (key, defaultVal) => {
        if (key === 'agents.available_agents') return ['developer'];
        if (key === 'agents.agent_path') return './src/core/agents';
        return defaultVal;
      });

      const results = await findAgentsByExpertise('');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle routeToAgent with empty query', async () => {
      const masterRaw = buildRawAgent({
        agent: { id: 'n8n-master', name: 'Master', role: 'Master', version: '2.0.0' },
        routing: {
          rules: [
            { condition: 'build', agent: 'developer', reason: 'Dev' },
          ],
        },
      });
      const masterFile = path.join(MOCK_AGENTS_DIR, 'n8n-master.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === masterFile) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockResolvedValue('yaml');
      yaml.load.mockReturnValue(masterRaw);

      const result = await routeToAgent('');
      expect(result).toBeNull();
    });

    it('should handle getCollaborators with undefined collaboratesWith', async () => {
      const raw = buildRawAgent({ collaborates_with: undefined });
      delete raw.collaborates_with;
      const file = path.join(MOCK_AGENTS_DIR, 'solo.agent.yaml');
      fs.access.mockImplementation(async (p) => {
        if (p === file) return undefined;
        throw new Error('ENOENT');
      });
      fs.readFile.mockImplementation(async (p) => {
        if (p === file) return 'yaml';
        throw new Error('ENOENT');
      });
      yaml.load.mockReturnValue(raw);

      const collabs = await getCollaborators('solo');
      expect(collabs).toEqual([]);
    });
  });

  // =========================================================================
  // Module exports
  // =========================================================================
  describe('module exports', () => {
    it('should export all expected functions', () => {
      expect(typeof loadAgent).toBe('function');
      expect(typeof loadAllAgents).toBe('function');
      expect(typeof listAgents).toBe('function');
      expect(typeof getAgentMenu).toBe('function');
      expect(typeof getAgentExpertise).toBe('function');
      expect(typeof getAgentPrompts).toBe('function');
      expect(typeof findAgentsByExpertise).toBe('function');
      expect(typeof getRoutingRules).toBe('function');
      expect(typeof routeToAgent).toBe('function');
      expect(typeof getCollaborators).toBe('function');
      expect(typeof formatAgentForDisplay).toBe('function');
      expect(typeof clearCache).toBe('function');
      expect(typeof validateAgent).toBe('function');
      expect(typeof normalizeAgent).toBe('function');
      expect(typeof getAgentsPath).toBe('function');
    });
  });
});
