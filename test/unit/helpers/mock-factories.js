/**
 * Mock factories for n8n-BMAD tests
 * Provides factory functions for creating test data
 */

function createMockAgent(overrides = {}) {
  return {
    agent: {
      id: 'test-agent',
      name: 'Test Agent',
      role: 'Tester',
      version: '1.0.0',
      ...overrides.agent,
    },
    identity: {
      description: 'A test agent for unit testing',
      expertise: ['testing', 'automation'],
      personality: ['methodical', 'thorough'],
      ...overrides.identity,
    },
    responsibilities: {
      testing: { description: 'Run tests' },
      ...overrides.responsibilities,
    },
    menu: overrides.menu || [
      { trigger: 'TS', action: 'test-suite', description: 'Run test suite' },
      { trigger: 'TC', action: 'test-case', description: 'Create test case' },
    ],
    collaborates_with: overrides.collaborates_with || [
      { agent: 'developer', relationship: 'Reviews code' },
    ],
    prompts: {
      welcome: 'Welcome to the test agent.',
      test_suite: 'Run the test suite.',
      ...overrides.prompts,
    },
    templates: overrides.templates || ['test-plan.md'],
    capabilities: overrides.capabilities || ['unit-testing'],
    integrations: overrides.integrations || [],
  };
}

function createMockAgentV2(overrides = {}) {
  return {
    agent: {
      metadata: {
        id: 'test-agent-v2',
        name: 'TestBot',
        title: 'Test Specialist',
        icon: '🧪',
        version: '2.0.0',
        ...overrides.metadata,
      },
      persona: {
        role: 'Test Specialist + Quality Expert',
        identity: 'I am TestBot, a specialized test agent.',
        ...overrides.persona,
      },
      critical_actions: overrides.critical_actions || ['Always validate inputs'],
    },
    menu: overrides.menu || [
      { trigger: 'TS', action: 'test-suite', description: 'Run test suite' },
    ],
    collaborates_with: overrides.collaborates_with || [],
    responsibilities: overrides.responsibilities || {},
    prompts: {
      welcome: 'Hello from TestBot v2.',
      test_suite: 'Execute the full test suite.',
      ...overrides.prompts,
    },
  };
}

function createMockWorkflow(overrides = {}) {
  return {
    id: 'test-workflow',
    trigger: 'TW',
    description: 'Test workflow',
    file: 'test/test-workflow.md',
    primary_agent: 'developer',
    supporting_agents: ['qa'],
    next: ['another-workflow'],
    ...overrides,
  };
}

function createMockManifest(overrides = {}) {
  return {
    workflows: {
      requirements: [
        createMockWorkflow({ id: 'create-prd', trigger: 'PRD', description: 'Create PRD', file: '1-requirements/create-prd.md' }),
      ],
      development: [
        createMockWorkflow({ id: 'dev-story', trigger: 'DS', description: 'Dev Story', file: '3-development/dev-story.md' }),
      ],
      ...overrides.workflows,
    },
    paths: overrides.paths || {
      quick: { name: 'Quick', description: 'Fast', steps: ['PRD', 'DS'], agents: ['pm', 'dev'] },
    },
    routing: overrides.routing || {},
  };
}

function createMockConfig(overrides = {}) {
  return {
    framework: { name: 'n8n-BMAD', version: '1.0.0', description: 'Test config' },
    agents: {
      default_agent: 'n8n-master',
      agent_path: './src/core/agents',
      available_agents: ['n8n-master', 'developer', 'architect'],
      ...overrides.agents,
    },
    templates: {
      path: './templates',
      categories: ['project', 'agile'],
      ...overrides.templates,
    },
    options: {
      n8n_instance_url: { default: 'http://localhost:5678/api/v1' },
      naming_convention: {
        default: { workflow_prefix: 'wf_', credential_prefix: 'cred_', use_snake_case: true },
      },
      ...overrides.options,
    },
    patterns: { path: './patterns', categories: ['error-handling'] },
    output: { docs_path: './docs/generated' },
    defaults: { workflow: { timezone: 'UTC' }, validation: { check_naming: true } },
    ...overrides,
  };
}

function createMockNode(overrides = {}) {
  return {
    type: 'n8n-nodes-base.httpRequest',
    displayName: 'HTTP Request',
    description: 'Makes HTTP requests',
    icon: 'file:httpRequest.svg',
    group: ['transform'],
    version: 1,
    ...overrides,
  };
}

function createMockCachedNodes(overrides = {}) {
  return {
    nodes: {
      core: [
        createMockNode(),
        createMockNode({ type: 'n8n-nodes-base.set', displayName: 'Set', description: 'Sets values' }),
      ],
      community: [
        createMockNode({ type: 'n8n-nodes-coolpackage.myNode', displayName: 'Cool Node', description: 'A cool community node' }),
      ],
      custom: [
        createMockNode({ type: 'custom.myCustomNode', displayName: 'My Custom Node', description: 'Custom node' }),
      ],
      ...overrides.nodes,
    },
    stats: { total: 4, core: 2, community: 1, custom: 1, ...overrides.stats },
    source: overrides.source || 'http://localhost:5678/api/v1',
    fetchedAt: overrides.fetchedAt || '2026-01-01T00:00:00.000Z',
    timestamp: overrides.timestamp || Date.now(),
    version: '1.0.0',
  };
}

function createMockPartyConfig() {
  return {
    parties: {
      'architecture-review': {
        name: 'Architecture Review',
        trigger: 'AR',
        icon: '🏗️',
        description: 'Review architecture decisions',
        output_template: 'architecture-review.md',
        next_workflow: 'create-architecture',
        when_to_use: ['Complex architecture decisions', 'Before major refactors'],
        agents: [
          { name: 'Winston', agent: 'architect', role: 'lead', contributes: ['Design review', 'Pattern assessment'] },
          { name: 'Sierra', agent: 'security', role: 'participant', contributes: ['Security review'] },
          { name: 'Nate', agent: 'developer', role: 'participant', contributes: ['Feasibility check'] },
        ],
      },
      'story-refinement': {
        name: 'Story Refinement',
        trigger: 'SR',
        icon: '📝',
        description: 'Refine stories for sprint',
        output_template: 'refined-stories.md',
        next_workflow: null,
        when_to_use: ['Before sprint planning'],
        agents: [
          { name: 'Victor', agent: 'po', role: 'lead', contributes: ['Story validation'] },
          { name: 'Nate', agent: 'developer', role: 'participant', contributes: ['Estimation'] },
          { name: 'Quinn', agent: 'qa', role: 'participant', contributes: ['Test criteria'] },
        ],
      },
    },
  };
}

module.exports = {
  createMockAgent,
  createMockAgentV2,
  createMockWorkflow,
  createMockManifest,
  createMockConfig,
  createMockNode,
  createMockCachedNodes,
  createMockPartyConfig,
};
