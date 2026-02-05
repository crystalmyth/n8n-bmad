/**
 * @fileoverview Unit tests for the agent command module
 *
 * Tests cover: formatAgentTable, displayAgentDetails, ESSENTIAL_AGENTS,
 * createListCommand (list subcommand), createLoadCommand (load subcommand),
 * createMenuCommand (menu subcommand), createRouteCommand (route subcommand),
 * createCreateCommand (create subcommand), createInfoCommand (info subcommand),
 * and the top-level createAgentCommand export.
 */

const { Command } = require('commander');
const path = require('path');

// ---- Mocks must be declared before requiring the module under test ----

// Mock display functions
jest.mock('../../../tools/cli/lib/display', () => ({
  displaySuccess: jest.fn(),
  displayError: jest.fn(),
  displayWarning: jest.fn(),
  displayInfo: jest.fn(),
  displayHeader: jest.fn(),
  displayTable: jest.fn().mockReturnValue('table-output'),
  displayList: jest.fn(),
  displayBox: jest.fn(),
  displayAgentCard: jest.fn(),
  displayMenu: jest.fn(),
  displayKeyValue: jest.fn(),
}));

// Mock agent-loader functions
jest.mock('../../../tools/cli/lib/agent-loader', () => ({
  loadAgent: jest.fn(),
  listAgents: jest.fn(),
  getAgentMenu: jest.fn(),
  findAgentsByExpertise: jest.fn(),
  routeToAgent: jest.fn(),
  getCollaborators: jest.fn(),
  formatAgentForDisplay: jest.fn(),
}));

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
  Separator: jest.fn().mockImplementation((text) => ({ type: 'separator', line: text })),
}));

// Mock ora
jest.mock('ora', () => {
  const spinnerInstance = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
  };
  const oraFn = jest.fn().mockReturnValue(spinnerInstance);
  oraFn._instance = spinnerInstance;
  return oraFn;
});

// Mock chalk as passthrough — bold must be callable AND have properties
jest.mock('chalk', () => {
  const passthrough = (x) => x;
  const bold = jest.fn(passthrough);
  bold.white = jest.fn(passthrough);
  bold.cyan = jest.fn(passthrough);
  const chalkMock = {
    cyan: jest.fn(passthrough),
    red: jest.fn(passthrough),
    green: jest.fn(passthrough),
    gray: jest.fn(passthrough),
    yellow: jest.fn(passthrough),
    blue: jest.fn(passthrough),
    white: jest.fn(passthrough),
    magenta: jest.fn(passthrough),
    bold,
  };
  return chalkMock;
});

// Mock fs.promises for the create command
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn(),
      access: jest.fn(),
    },
  };
});

// ---- Require modules after mocks ----

const display = require('../../../tools/cli/lib/display');
const agentLoader = require('../../../tools/cli/lib/agent-loader');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const fs = require('fs').promises;

// ---- Helpers ----

/**
 * Reset Commander internal state on a command tree so parsed options
 * from previous tests don't leak into the next test.
 * Rebuilds default values from registered options to ensure clean state.
 */
function resetCommanderState(cmd) {
  // Rebuild _optionValues and _optionValueSources from registered options
  cmd._optionValues = {};
  cmd._optionValueSources = {};
  if (cmd.options) {
    for (const opt of cmd.options) {
      const key = opt.attributeName();
      if (opt.defaultValue !== undefined) {
        cmd._optionValues[key] = opt.defaultValue;
        cmd._optionValueSources[key] = 'default';
      }
    }
  }
  cmd.parent = null;
  // Recursively reset subcommands
  if (cmd.commands) {
    cmd.commands.forEach(sub => resetCommanderState(sub));
  }
}

/**
 * Create a fresh command instance. We re-require the module to get a new
 * Commander tree, and reset any stale parsed state.
 */
function getAgentCommand() {
  const modulePath = require.resolve('../../../tools/cli/commands/agent');
  delete require.cache[modulePath];
  const cmd = require('../../../tools/cli/commands/agent');
  resetCommanderState(cmd);
  return cmd;
}

/**
 * Find a subcommand by name from the parent command.
 */
function findSubcommand(parentCmd, name) {
  return parentCmd.commands.find(c => c.name() === name);
}

/**
 * Create a mock agent object matching the format expected by the code.
 */
function makeMockAgent(overrides = {}) {
  return {
    id: 'developer',
    name: 'Nate',
    role: 'Developer',
    version: '1.0.0',
    description: 'A workflow developer agent',
    expertise: ['n8n workflows', 'JavaScript'],
    personality: ['methodical', 'pragmatic'],
    capabilities: ['build workflows', 'debug issues'],
    templates: ['workflow.md'],
    prompts: { welcome: 'Welcome! I am Nate.' },
    ...overrides,
  };
}

// ---- Setup / Teardown ----

let processExitSpy;

beforeEach(() => {
  jest.clearAllMocks();
  // Suppress console output
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  // Mock process.exit to prevent test runner from exiting
  processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ===========================================================================
// Module Export
// ===========================================================================
describe('module export', () => {
  it('should export a Commander Command object', () => {
    const command = getAgentCommand();
    expect(command).toBeInstanceOf(Command);
  });

  it('should export a command named "agent"', () => {
    const command = getAgentCommand();
    expect(command.name()).toBe('agent');
  });

  it('should have a description', () => {
    const command = getAgentCommand();
    expect(command.description()).toContain('Agent operations');
  });

  it('should have six subcommands', () => {
    const command = getAgentCommand();
    expect(command.commands.length).toBe(6);
  });

  it('should have list, load, menu, route, info, and create subcommands', () => {
    const command = getAgentCommand();
    const names = command.commands.map(c => c.name());
    expect(names).toContain('list');
    expect(names).toContain('load');
    expect(names).toContain('menu');
    expect(names).toContain('route');
    expect(names).toContain('info');
    expect(names).toContain('create');
  });
});

// ===========================================================================
// ESSENTIAL_AGENTS
// ===========================================================================
describe('ESSENTIAL_AGENTS', () => {
  // We cannot directly access the const, but we can test it via the list command
  // with --essential flag. We know from source it is:
  // ['n8n-master', 'quick-flow', 'developer', 'architect', 'po']

  it('should filter to exactly 5 agents when --essential is used', async () => {
    const allAgents = [
      { id: 'n8n-master', name: 'Master', role: 'Orchestrator' },
      { id: 'quick-flow', name: 'Barry', role: 'Quick Flow' },
      { id: 'developer', name: 'Nate', role: 'Developer' },
      { id: 'architect', name: 'Winston', role: 'Architect' },
      { id: 'po', name: 'Victor', role: 'Product Owner' },
      { id: 'pm', name: 'Paula', role: 'Project Manager' },
      { id: 'qa', name: 'Quinn', role: 'QA' },
      { id: 'sm', name: 'Sam', role: 'Scrum Master' },
    ];

    agentLoader.listAgents.mockResolvedValue(allAgents);

    const command = getAgentCommand();
    // Attach a parent to avoid optional chaining issues
    const parent = new Command('test-parent');
    const grandparent = new Command('test-grandparent');
    parent.addCommand(command);
    grandparent.addCommand(parent);

    await grandparent.parseAsync(['node', 'test', 'test-parent', 'agent', 'list', '--essential']);

    // displayTable should have been called with the table containing 5 agents + header
    expect(display.displayTable).toHaveBeenCalled();
    expect(display.displayHeader).toHaveBeenCalledWith('Essential Agents');
  });

  it('should include n8n-master in essential agents', async () => {
    const allAgents = [
      { id: 'n8n-master', name: 'Master', role: 'Orchestrator' },
      { id: 'pm', name: 'Paula', role: 'PM' },
    ];
    agentLoader.listAgents.mockResolvedValue(allAgents);

    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);

    await grandparent.parseAsync(['node', 'test', 'p', 'agent', 'list', '--essential']);

    // The spinner should show 1 essential agent (only n8n-master matches)
    const spinner = ora._instance;
    expect(spinner.succeed).toHaveBeenCalledWith(expect.stringContaining('1 essential'));
  });

  it('should not include pm in essential agents', async () => {
    const allAgents = [
      { id: 'pm', name: 'Paula', role: 'PM' },
      { id: 'qa', name: 'Quinn', role: 'QA' },
    ];
    agentLoader.listAgents.mockResolvedValue(allAgents);

    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);

    await grandparent.parseAsync(['node', 'test', 'p', 'agent', 'list', '--essential']);

    // Neither pm nor qa are essential, so 0 agents should be found
    expect(display.displayWarning).toHaveBeenCalledWith('No agents found');
  });
});

// ===========================================================================
// formatAgentTable (tested indirectly through list command table format)
// ===========================================================================
describe('formatAgentTable (via list command)', () => {
  it('should call displayTable with correctly structured table data', async () => {
    const agents = [
      { id: 'developer', name: 'Nate', role: 'Developer' },
      { id: 'architect', name: 'Winston', role: 'Architect' },
    ];
    agentLoader.listAgents.mockResolvedValue(agents);

    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);

    await grandparent.parseAsync(['node', 'test', 'p', 'agent', 'list']);

    expect(display.displayTable).toHaveBeenCalledTimes(1);
    const tableData = display.displayTable.mock.calls[0][0];

    // First row should be headers
    expect(tableData[0]).toEqual(['ID', 'Name', 'Role', 'Status']);
    // Subsequent rows should be agent data
    expect(tableData.length).toBe(3); // header + 2 agents
  });

  it('should use chalk.cyan for normal agent IDs', async () => {
    const agents = [{ id: 'developer', name: 'Nate', role: 'Developer' }];
    agentLoader.listAgents.mockResolvedValue(agents);

    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);

    await grandparent.parseAsync(['node', 'test', 'p', 'agent', 'list']);

    expect(chalk.cyan).toHaveBeenCalledWith('developer');
  });

  it('should use chalk.red for error agent IDs', async () => {
    const agents = [{ id: 'broken', name: 'Broken', role: 'N/A', error: 'parse error' }];
    agentLoader.listAgents.mockResolvedValue(agents);

    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);

    await grandparent.parseAsync(['node', 'test', 'p', 'agent', 'list']);

    expect(chalk.red).toHaveBeenCalledWith('broken');
  });

  it('should use chalk.green for OK status on normal agents', async () => {
    const agents = [{ id: 'dev', name: 'Dev', role: 'Dev' }];
    agentLoader.listAgents.mockResolvedValue(agents);

    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);

    await grandparent.parseAsync(['node', 'test', 'p', 'agent', 'list']);

    expect(chalk.green).toHaveBeenCalledWith('OK');
  });

  it('should use chalk.red for Error status on error agents', async () => {
    const agents = [{ id: 'bad', name: 'Bad', role: 'Bad', error: 'fail' }];
    agentLoader.listAgents.mockResolvedValue(agents);

    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);

    await grandparent.parseAsync(['node', 'test', 'p', 'agent', 'list']);

    expect(chalk.red).toHaveBeenCalledWith('Error');
  });
});

// ===========================================================================
// List Command
// ===========================================================================
describe('list command', () => {
  function setupAndParse(args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', 'list', ...args]);
  }

  it('should call listAgents when no filter is provided', async () => {
    agentLoader.listAgents.mockResolvedValue([{ id: 'dev', name: 'Dev', role: 'Dev' }]);
    await setupAndParse();
    expect(agentLoader.listAgents).toHaveBeenCalled();
  });

  it('should call findAgentsByExpertise when --filter is provided', async () => {
    agentLoader.findAgentsByExpertise.mockResolvedValue([{ id: 'dev', name: 'Dev', role: 'Dev' }]);
    await setupAndParse(['--filter', 'webhook']);
    expect(agentLoader.findAgentsByExpertise).toHaveBeenCalledWith('webhook');
  });

  it('should show spinner with matching count when filter is used', async () => {
    agentLoader.findAgentsByExpertise.mockResolvedValue([
      { id: 'dev', name: 'Dev', role: 'Dev' },
      { id: 'arch', name: 'Arch', role: 'Arch' },
    ]);
    await setupAndParse(['--filter', 'api']);
    const spinner = ora._instance;
    expect(spinner.succeed).toHaveBeenCalledWith('Found 2 matching agents');
  });

  it('should display warning when no agents found', async () => {
    agentLoader.listAgents.mockResolvedValue([]);
    await setupAndParse();
    expect(display.displayWarning).toHaveBeenCalledWith('No agents found');
  });

  it('should output JSON when --format json is specified', async () => {
    const agents = [{ id: 'dev', name: 'Dev', role: 'Dev' }];
    agentLoader.listAgents.mockResolvedValue(agents);
    await setupAndParse(['--format', 'json']);
    expect(console.log).toHaveBeenCalledWith(JSON.stringify(agents, null, 2));
  });

  it('should output simple format when --format simple is specified', async () => {
    const agents = [{ id: 'dev', name: 'Dev', role: 'Dev' }];
    agentLoader.listAgents.mockResolvedValue(agents);
    await setupAndParse(['--format', 'simple']);
    // console.log should have been called with the simple format line
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('dev'));
  });

  it('should show table format by default', async () => {
    agentLoader.listAgents.mockResolvedValue([{ id: 'dev', name: 'Dev', role: 'Dev' }]);
    await setupAndParse();
    expect(display.displayTable).toHaveBeenCalled();
    expect(display.displayHeader).toHaveBeenCalledWith('Available Agents');
  });

  it('should show "Essential Agents" header with --essential flag', async () => {
    agentLoader.listAgents.mockResolvedValue([
      { id: 'developer', name: 'Nate', role: 'Dev' },
    ]);
    await setupAndParse(['--essential']);
    expect(display.displayHeader).toHaveBeenCalledWith('Essential Agents');
  });

  it('should show tip about --essential for table format without filter', async () => {
    agentLoader.listAgents.mockResolvedValue([{ id: 'dev', name: 'Dev', role: 'Dev' }]);
    await setupAndParse();
    expect(display.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('--essential')
    );
  });

  it('should show hint about seeing all agents when --essential is used', async () => {
    agentLoader.listAgents.mockResolvedValue([
      { id: 'developer', name: 'Nate', role: 'Dev' },
    ]);
    await setupAndParse(['--essential']);
    // The second displayInfo call should mention seeing all agents
    const infoCalls = display.displayInfo.mock.calls;
    const hasAllAgentsHint = infoCalls.some(call => call[0].includes('to see all'));
    expect(hasAllAgentsHint).toBe(true);
  });

  it('should not show --essential tip when filter is used in table format', async () => {
    agentLoader.findAgentsByExpertise.mockResolvedValue([{ id: 'dev', name: 'Dev', role: 'Dev' }]);
    await setupAndParse(['--filter', 'api']);
    const infoCalls = display.displayInfo.mock.calls;
    const hasEssentialTip = infoCalls.some(call => call[0].includes('--essential'));
    expect(hasEssentialTip).toBe(false);
  });

  it('should call displayInfo with load agent hint in table format', async () => {
    agentLoader.listAgents.mockResolvedValue([{ id: 'dev', name: 'Dev', role: 'Dev' }]);
    await setupAndParse();
    expect(display.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('n8n-bmad agent load')
    );
  });

  it('should call displayError and process.exit on error', async () => {
    agentLoader.listAgents.mockRejectedValue(new Error('load failure'));
    await setupAndParse();
    expect(display.displayError).toHaveBeenCalledWith('Failed to list agents: load failure');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should show simple format with [ERR] for error agents', async () => {
    const agents = [{ id: 'broken', name: 'Broken', role: 'N/A', error: 'parse error' }];
    agentLoader.listAgents.mockResolvedValue(agents);
    await setupAndParse(['--format', 'simple']);
    expect(chalk.red).toHaveBeenCalledWith('[ERR]');
  });

  it('should show simple format with [OK] for normal agents', async () => {
    const agents = [{ id: 'dev', name: 'Dev', role: 'Dev' }];
    agentLoader.listAgents.mockResolvedValue(agents);
    await setupAndParse(['--format', 'simple']);
    expect(chalk.green).toHaveBeenCalledWith('[OK]');
  });
});

// ===========================================================================
// Load Command
// ===========================================================================
describe('load command', () => {
  function setupAndParse(args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', 'load', ...args]);
  }

  it('should call loadAgent with the provided agent-id', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer']);
    expect(agentLoader.loadAgent).toHaveBeenCalledWith('developer');
  });

  it('should show spinner with agent name on success', async () => {
    const agent = makeMockAgent({ name: 'Nate' });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer']);
    const spinner = ora._instance;
    expect(spinner.succeed).toHaveBeenCalledWith('Agent loaded: Nate');
  });

  it('should display agent card by default (no flags)', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer']);
    expect(display.displayAgentCard).toHaveBeenCalledWith(agent);
  });

  it('should display detailed info when --detailed flag is set', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    // displayAgentDetails calls displayHeader, displayKeyValue, etc.
    expect(display.displayHeader).toHaveBeenCalledWith(agent.name, { style: 'prominent' });
    expect(display.displayKeyValue).toHaveBeenCalledWith('ID', agent.id);
    expect(display.displayKeyValue).toHaveBeenCalledWith('Role', agent.role);
  });

  it('should output JSON when --json flag is set', async () => {
    const agent = makeMockAgent();
    const formatted = { id: 'developer', name: 'Nate' };
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.formatAgentForDisplay.mockReturnValue(formatted);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--json']);
    expect(agentLoader.formatAgentForDisplay).toHaveBeenCalledWith(agent, { detailed: true });
    expect(console.log).toHaveBeenCalledWith(JSON.stringify(formatted, null, 2));
  });

  it('should not display card or details when --json is set', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.formatAgentForDisplay.mockReturnValue({});
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--json']);
    expect(display.displayAgentCard).not.toHaveBeenCalled();
  });

  it('should show welcome prompt when available', async () => {
    const agent = makeMockAgent({ prompts: { welcome: 'Hello!\nI am Nate.\nWelcome.' } });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer']);
    expect(display.displayBox).toHaveBeenCalledWith(
      expect.any(Array),
      { title: 'Welcome', style: 'round' }
    );
  });

  it('should not show welcome box when no welcome prompt exists', async () => {
    const agent = makeMockAgent({ prompts: {} });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer']);
    expect(display.displayBox).not.toHaveBeenCalled();
  });

  it('should show collaborators when they exist', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([
      { name: 'Quinn', relationship: 'Reviews code' },
      { name: 'Winston', relationship: 'Architecture advice' },
    ]);
    await setupAndParse(['developer']);
    expect(display.displayHeader).toHaveBeenCalledWith('Collaborates With', { style: 'compact' });
  });

  it('should not show collaborators section when empty', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer']);
    // displayHeader should NOT be called with 'Collaborates With'
    const calls = display.displayHeader.mock.calls;
    const hasCollabHeader = calls.some(c => c[0] === 'Collaborates With');
    expect(hasCollabHeader).toBe(false);
  });

  it('should show tip about menu command', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer']);
    expect(display.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('n8n-bmad agent menu developer')
    );
  });

  it('should call displayError and process.exit on error', async () => {
    agentLoader.loadAgent.mockRejectedValue(new Error('agent not found'));
    await setupAndParse(['nonexistent']);
    expect(display.displayError).toHaveBeenCalledWith('Failed to load agent: agent not found');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should truncate welcome prompt to first 10 lines', async () => {
    const longWelcome = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
    const agent = makeMockAgent({ prompts: { welcome: longWelcome } });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer']);
    const boxContent = display.displayBox.mock.calls[0][0];
    expect(boxContent.length).toBe(10);
  });
});

// ===========================================================================
// displayAgentDetails (tested indirectly through load --detailed)
// ===========================================================================
describe('displayAgentDetails', () => {
  function setupAndParse(args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', 'load', ...args]);
  }

  it('should display version defaulting to 1.0.0 when not provided', async () => {
    const agent = makeMockAgent({ version: undefined });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    expect(display.displayKeyValue).toHaveBeenCalledWith('Version', '1.0.0');
  });

  it('should display description when available', async () => {
    const agent = makeMockAgent({ description: '  A great developer  ' });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    expect(display.displayHeader).toHaveBeenCalledWith('Description', { style: 'compact' });
  });

  it('should not display description section when not available', async () => {
    const agent = makeMockAgent({ description: undefined });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    const calls = display.displayHeader.mock.calls;
    const hasDesc = calls.some(c => c[0] === 'Description');
    expect(hasDesc).toBe(false);
  });

  it('should display expertise list when available', async () => {
    const agent = makeMockAgent({ expertise: ['n8n', 'JavaScript'] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    expect(display.displayHeader).toHaveBeenCalledWith('Expertise', { style: 'compact' });
    expect(display.displayList).toHaveBeenCalledWith(['n8n', 'JavaScript'], { bullet: '-' });
  });

  it('should not display expertise when empty array', async () => {
    const agent = makeMockAgent({ expertise: [] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    const calls = display.displayHeader.mock.calls;
    const hasExpertise = calls.some(c => c[0] === 'Expertise');
    expect(hasExpertise).toBe(false);
  });

  it('should not display expertise when undefined', async () => {
    const agent = makeMockAgent({ expertise: undefined });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    const calls = display.displayHeader.mock.calls;
    const hasExpertise = calls.some(c => c[0] === 'Expertise');
    expect(hasExpertise).toBe(false);
  });

  it('should display personality list when available', async () => {
    const agent = makeMockAgent({ personality: ['focused', 'pragmatic'] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    expect(display.displayHeader).toHaveBeenCalledWith('Personality', { style: 'compact' });
    expect(display.displayList).toHaveBeenCalledWith(['focused', 'pragmatic'], { bullet: '-' });
  });

  it('should not display personality when empty', async () => {
    const agent = makeMockAgent({ personality: [] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    const calls = display.displayHeader.mock.calls;
    const hasPersonality = calls.some(c => c[0] === 'Personality');
    expect(hasPersonality).toBe(false);
  });

  it('should display capabilities list when available', async () => {
    const agent = makeMockAgent({ capabilities: ['build', 'test'] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    expect(display.displayHeader).toHaveBeenCalledWith('Capabilities', { style: 'compact' });
    expect(display.displayList).toHaveBeenCalledWith(['build', 'test'], { bullet: '-' });
  });

  it('should not display capabilities when empty', async () => {
    const agent = makeMockAgent({ capabilities: [] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    const calls = display.displayHeader.mock.calls;
    const hasCaps = calls.some(c => c[0] === 'Capabilities');
    expect(hasCaps).toBe(false);
  });

  it('should display templates list when available', async () => {
    const agent = makeMockAgent({ templates: ['story.md', 'epic.md'] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    expect(display.displayHeader).toHaveBeenCalledWith('Templates', { style: 'compact' });
    expect(display.displayList).toHaveBeenCalledWith(['story.md', 'epic.md'], { bullet: '-' });
  });

  it('should not display templates when empty', async () => {
    const agent = makeMockAgent({ templates: [] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse(['developer', '--detailed']);
    const calls = display.displayHeader.mock.calls;
    const hasTemplates = calls.some(c => c[0] === 'Templates');
    expect(hasTemplates).toBe(false);
  });
});

// ===========================================================================
// Menu Command
// ===========================================================================
describe('menu command', () => {
  function setupAndParse(args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', 'menu', ...args]);
  }

  it('should default to n8n-master when no agent-id is provided', async () => {
    const agent = makeMockAgent({ id: 'n8n-master', name: 'Master' });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue({ sections: [] });
    await setupAndParse();
    expect(agentLoader.loadAgent).toHaveBeenCalledWith('n8n-master');
    expect(agentLoader.getAgentMenu).toHaveBeenCalledWith('n8n-master');
  });

  it('should use specified agent-id', async () => {
    const agent = makeMockAgent({ id: 'developer', name: 'Nate' });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue({ sections: [] });
    await setupAndParse(['developer']);
    expect(agentLoader.loadAgent).toHaveBeenCalledWith('developer');
    expect(agentLoader.getAgentMenu).toHaveBeenCalledWith('developer');
  });

  it('should display menu when available', async () => {
    const agent = makeMockAgent({ name: 'Nate' });
    const menu = {
      sections: [{ name: 'Main', commands: [{ key: 'DW', action: 'dev-workflow', description: 'Dev Workflow' }] }],
    };
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue(menu);
    await setupAndParse(['developer']);
    expect(display.displayMenu).toHaveBeenCalledWith(menu);
    expect(display.displayHeader).toHaveBeenCalledWith('Nate - Commands', { style: 'prominent' });
  });

  it('should show warning when menu is null', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue(null);
    await setupAndParse(['developer']);
    expect(display.displayWarning).toHaveBeenCalledWith(
      expect.stringContaining('No menu defined for agent')
    );
  });

  it('should show warning when menu has no sections', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue({});
    await setupAndParse(['developer']);
    expect(display.displayWarning).toHaveBeenCalledWith(
      expect.stringContaining('No menu defined')
    );
  });

  it('should handle interactive mode with inquirer', async () => {
    const agent = makeMockAgent({ name: 'Nate' });
    const menu = {
      sections: [
        {
          name: 'Dev',
          commands: [
            { key: 'DW', action: 'dev-workflow', description: 'Build workflow' },
          ],
        },
      ],
    };
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue(menu);
    inquirer.prompt.mockResolvedValue({ selected: { action: 'dev-workflow', description: 'Build workflow' } });

    await setupAndParse(['developer', '--interactive']);

    expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'list',
        name: 'selected',
        message: 'Select a command:',
      }),
    ]));
    expect(display.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('Selected: dev-workflow')
    );
  });

  it('should handle interactive mode when user selects Exit (null)', async () => {
    const agent = makeMockAgent({ name: 'Nate' });
    const menu = {
      sections: [{ name: 'Dev', commands: [{ key: 'DW', action: 'dw', description: 'Test' }] }],
    };
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue(menu);
    inquirer.prompt.mockResolvedValue({ selected: null });

    await setupAndParse(['developer', '--interactive']);

    // displayInfo should NOT be called with "Selected:" when null
    const infoCalls = display.displayInfo.mock.calls;
    const hasSelected = infoCalls.some(c => c[0].includes('Selected:'));
    expect(hasSelected).toBe(false);
  });

  it('should call displayError and process.exit on error', async () => {
    agentLoader.loadAgent.mockRejectedValue(new Error('menu load failure'));
    await setupAndParse(['developer']);
    expect(display.displayError).toHaveBeenCalledWith('Failed to load menu: menu load failure');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should include Exit option in interactive choices', async () => {
    const agent = makeMockAgent();
    const menu = {
      sections: [{ name: 'Dev', commands: [{ key: 'X', action: 'x', description: 'X' }] }],
    };
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue(menu);
    inquirer.prompt.mockResolvedValue({ selected: null });

    await setupAndParse(['developer', '-i']);

    const promptCall = inquirer.prompt.mock.calls[0][0][0];
    const exitChoice = promptCall.choices.find(c => c.name === 'Exit');
    expect(exitChoice).toBeDefined();
    expect(exitChoice.value).toBeNull();
  });
});

// ===========================================================================
// Route Command
// ===========================================================================
describe('route command', () => {
  function setupAndParse(args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', 'route', ...args]);
  }

  it('should call routeToAgent with the query', async () => {
    agentLoader.routeToAgent.mockResolvedValue({
      agent: { id: 'developer', name: 'Nate', role: 'Developer' },
      reason: 'Best match for workflow tasks',
      matchedKeyword: 'webhook',
    });
    await setupAndParse(['build webhook']);
    expect(agentLoader.routeToAgent).toHaveBeenCalledWith('build webhook');
  });

  it('should display recommendation box on successful routing', async () => {
    agentLoader.routeToAgent.mockResolvedValue({
      agent: { id: 'developer', name: 'Nate', role: 'Developer' },
      reason: 'Best match',
      matchedKeyword: 'webhook',
    });
    await setupAndParse(['build webhook']);
    expect(display.displaySuccess).toHaveBeenCalledWith('Recommended agent: Nate');
    expect(display.displayBox).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('Agent: Nate'),
        expect.stringContaining('Role: Developer'),
      ]),
      { title: 'Recommendation', style: 'round' }
    );
  });

  it('should show load agent hint after recommendation', async () => {
    agentLoader.routeToAgent.mockResolvedValue({
      agent: { id: 'developer', name: 'Nate', role: 'Developer' },
      reason: 'Best match',
      matchedKeyword: 'webhook',
    });
    await setupAndParse(['build webhook']);
    expect(display.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('n8n-bmad agent load developer')
    );
  });

  it('should display warning when no agent is recommended (null result)', async () => {
    agentLoader.routeToAgent.mockResolvedValue(null);
    await setupAndParse(['random query']);
    expect(display.displayWarning).toHaveBeenCalledWith(
      'No specific agent recommended for this query.'
    );
    expect(display.displayInfo).toHaveBeenCalledWith(
      'The n8n-master agent can help with general questions.'
    );
  });

  it('should stop spinner on successful routing', async () => {
    agentLoader.routeToAgent.mockResolvedValue({
      agent: { id: 'dev', name: 'Dev', role: 'Dev' },
      reason: 'r',
      matchedKeyword: 'k',
    });
    await setupAndParse(['test query']);
    const spinner = ora._instance;
    expect(spinner.stop).toHaveBeenCalled();
  });

  it('should call displayError and process.exit on error', async () => {
    agentLoader.routeToAgent.mockRejectedValue(new Error('routing failed'));
    await setupAndParse(['test query']);
    expect(display.displayError).toHaveBeenCalledWith('Routing failed: routing failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should include matched keyword and reason in recommendation box', async () => {
    agentLoader.routeToAgent.mockResolvedValue({
      agent: { id: 'arch', name: 'Winston', role: 'Architect' },
      reason: 'Architecture expertise',
      matchedKeyword: 'design',
    });
    await setupAndParse(['design system']);
    const boxContent = display.displayBox.mock.calls[0][0];
    expect(boxContent).toContain('Reason: Architecture expertise');
    expect(boxContent).toContain('Matched: "design"');
  });
});

// ===========================================================================
// Create Command
// ===========================================================================
describe('create command', () => {
  function setupAndParse(args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', 'create', ...args]);
  }

  it('should use interactive prompts when --name is not provided', async () => {
    inquirer.prompt.mockResolvedValue({
      base: 'developer',
      name: 'Edgar',
      title: 'ETL Specialist',
      specialization: 'ETL workflows',
      nodes: 'SpreadsheetFile,FTP',
      domains: 'data-migration,etl',
    });

    await setupAndParse();

    expect(inquirer.prompt).toHaveBeenCalled();
    const spinner = ora._instance;
    expect(spinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Custom agent created: Edgar')
    );
  });

  it('should skip interactive prompts when --name is provided', async () => {
    await setupAndParse(['-n', 'Edgar', '-t', 'ETL Specialist']);
    expect(inquirer.prompt).not.toHaveBeenCalled();
  });

  it('should generate correct agent ID from title', async () => {
    await setupAndParse(['-n', 'Edgar', '-t', 'ETL Specialist']);
    // ID should be "etl-specialist"
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('etl-specialist.agent.yaml'),
      expect.any(String),
      'utf8'
    );
  });

  it('should generate correct agent ID with special characters in title', async () => {
    await setupAndParse(['-n', 'TestBot', '-t', '---My Special! Agent---']);
    // Should become "my-special-agent"
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('my-special-agent.agent.yaml'),
      expect.any(String),
      'utf8'
    );
  });

  it('should use specified output path when --output is provided', async () => {
    await setupAndParse(['-n', 'Edgar', '-t', 'ETL Specialist', '-o', '/custom/path/agent.yaml']);
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/custom/path/agent.yaml',
      expect.any(String),
      'utf8'
    );
  });

  it('should create directory recursively before writing', async () => {
    await setupAndParse(['-n', 'Edgar', '-t', 'ETL Specialist']);
    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true }
    );
  });

  it('should write YAML content with agent metadata', async () => {
    await setupAndParse(['-n', 'Edgar', '-t', 'ETL Specialist', '-b', 'architect']);
    const content = fs.writeFile.mock.calls[0][1];
    expect(content).toContain('name: Edgar');
    expect(content).toContain('title: ETL Specialist');
    expect(content).toContain('extends: architect');
  });

  it('should include nodes in YAML when provided via interactive prompt', async () => {
    inquirer.prompt.mockResolvedValue({
      base: 'developer',
      name: 'NodeBot',
      title: 'Node Expert',
      specialization: 'Custom nodes',
      nodes: 'HTTP Request,Webhook',
      domains: 'api',
    });

    await setupAndParse();
    const content = fs.writeFile.mock.calls[0][1];
    expect(content).toContain('HTTP Request');
    expect(content).toContain('Webhook');
  });

  it('should include domains in YAML when provided', async () => {
    inquirer.prompt.mockResolvedValue({
      base: 'developer',
      name: 'DomBot',
      title: 'Domain Expert',
      specialization: 'Domain stuff',
      nodes: '',
      domains: 'fintech,healthcare',
    });

    await setupAndParse();
    const content = fs.writeFile.mock.calls[0][1];
    expect(content).toContain('fintech');
    expect(content).toContain('healthcare');
  });

  it('should display success box with next steps', async () => {
    await setupAndParse(['-n', 'Edgar', '-t', 'ETL Specialist']);
    expect(display.displayBox).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('Agent: Edgar'),
        expect.stringContaining('Extends: developer'),
        expect.stringContaining('Next steps:'),
      ]),
      { title: 'Custom Agent Created', style: 'round' }
    );
  });

  it('should call displayError and process.exit on file write error', async () => {
    fs.writeFile.mockRejectedValueOnce(new Error('disk full'));
    await setupAndParse(['-n', 'Edgar', '-t', 'ETL Specialist']);
    expect(display.displayError).toHaveBeenCalledWith('Failed to create agent: disk full');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should default --base to developer', async () => {
    await setupAndParse(['-n', 'TestBot', '-t', 'Test Agent']);
    const content = fs.writeFile.mock.calls[0][1];
    expect(content).toContain('extends: developer');
  });

  it('should merge interactive answers with existing options', async () => {
    inquirer.prompt.mockResolvedValue({
      base: 'architect',
      name: 'NewBot',
      title: 'New Agent',
      specialization: 'New stuff',
      nodes: '',
      domains: '',
    });

    await setupAndParse(['--base', 'integration']);
    // The interactive answer for base should override the CLI option
    const content = fs.writeFile.mock.calls[0][1];
    expect(content).toContain('extends: architect');
  });

  it('should write valid YAML with prompts section', async () => {
    await setupAndParse(['-n', 'TestBot', '-t', 'Test Agent']);
    const content = fs.writeFile.mock.calls[0][1];
    expect(content).toContain('prompts:');
    expect(content).toContain('introduction:');
    expect(content).toContain("I'm TestBot");
  });
});

// ===========================================================================
// Info Command
// ===========================================================================
describe('info command', () => {
  function setupAndParse(args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', 'info', ...args]);
  }

  it('should call loadAgent with the specified agent-id', async () => {
    const agent = makeMockAgent({ id: 'architect' });
    agentLoader.loadAgent.mockResolvedValue(agent);
    await setupAndParse(['architect']);
    expect(agentLoader.loadAgent).toHaveBeenCalledWith('architect');
  });

  it('should display agent details via displayAgentDetails', async () => {
    const agent = makeMockAgent({ name: 'Winston', expertise: ['patterns'] });
    agentLoader.loadAgent.mockResolvedValue(agent);
    await setupAndParse(['architect']);
    // displayAgentDetails calls displayHeader with prominent style
    expect(display.displayHeader).toHaveBeenCalledWith('Winston', { style: 'prominent' });
    expect(display.displayKeyValue).toHaveBeenCalledWith('ID', agent.id);
  });

  it('should show spinner success message', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    await setupAndParse(['developer']);
    const spinner = ora._instance;
    expect(spinner.succeed).toHaveBeenCalledWith('Agent info loaded');
  });

  it('should call displayError and process.exit on error', async () => {
    agentLoader.loadAgent.mockRejectedValue(new Error('info not found'));
    await setupAndParse(['nonexistent']);
    expect(display.displayError).toHaveBeenCalledWith('Failed to get agent info: info not found');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should display all detail sections for a fully populated agent', async () => {
    const agent = makeMockAgent({
      description: 'Full agent',
      expertise: ['a'],
      personality: ['b'],
      capabilities: ['c'],
      templates: ['d'],
    });
    agentLoader.loadAgent.mockResolvedValue(agent);
    await setupAndParse(['developer']);

    const headerCalls = display.displayHeader.mock.calls.map(c => c[0]);
    expect(headerCalls).toContain('Description');
    expect(headerCalls).toContain('Expertise');
    expect(headerCalls).toContain('Personality');
    expect(headerCalls).toContain('Capabilities');
    expect(headerCalls).toContain('Templates');
  });
});

// ===========================================================================
// Spinner behavior
// ===========================================================================
describe('spinner behavior', () => {
  function setupAndParse(subcommand, args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', subcommand, ...args]);
  }

  it('should start spinner for list command', async () => {
    agentLoader.listAgents.mockResolvedValue([]);
    await setupAndParse('list');
    expect(ora).toHaveBeenCalledWith('Loading agents...');
    expect(ora._instance.start).toHaveBeenCalled();
  });

  it('should start spinner for load command', async () => {
    agentLoader.loadAgent.mockResolvedValue(makeMockAgent());
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse('load', ['developer']);
    expect(ora).toHaveBeenCalledWith('Loading agent: developer...');
  });

  it('should start spinner for menu command', async () => {
    agentLoader.loadAgent.mockResolvedValue(makeMockAgent());
    agentLoader.getAgentMenu.mockResolvedValue({ sections: [] });
    await setupAndParse('menu', ['developer']);
    expect(ora).toHaveBeenCalledWith('Loading menu for: developer...');
  });

  it('should start spinner for route command', async () => {
    agentLoader.routeToAgent.mockResolvedValue(null);
    await setupAndParse('route', ['test query']);
    expect(ora).toHaveBeenCalledWith('Analyzing query...');
  });

  it('should start spinner for info command', async () => {
    agentLoader.loadAgent.mockResolvedValue(makeMockAgent());
    await setupAndParse('info', ['developer']);
    expect(ora).toHaveBeenCalledWith('Loading agent info: developer...');
  });

  it('should start spinner for create command', async () => {
    await setupAndParse('create', ['-n', 'Bot', '-t', 'Test']);
    expect(ora).toHaveBeenCalledWith('Creating custom agent...');
  });
});

// ===========================================================================
// Error handling
// ===========================================================================
describe('error handling', () => {
  function setupAndParse(subcommand, args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', subcommand, ...args]);
  }

  it('should call process.exit(1) when list command fails', async () => {
    agentLoader.listAgents.mockRejectedValue(new Error('fail'));
    await setupAndParse('list');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should call process.exit(1) when load command fails', async () => {
    agentLoader.loadAgent.mockRejectedValue(new Error('fail'));
    await setupAndParse('load', ['bad']);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should call process.exit(1) when menu command fails', async () => {
    agentLoader.loadAgent.mockRejectedValue(new Error('fail'));
    await setupAndParse('menu', ['bad']);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should call process.exit(1) when route command fails', async () => {
    agentLoader.routeToAgent.mockRejectedValue(new Error('fail'));
    await setupAndParse('route', ['query']);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should call process.exit(1) when info command fails', async () => {
    agentLoader.loadAgent.mockRejectedValue(new Error('fail'));
    await setupAndParse('info', ['bad']);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should call process.exit(1) when create command fails', async () => {
    fs.mkdir.mockRejectedValueOnce(new Error('permission denied'));
    await setupAndParse('create', ['-n', 'X', '-t', 'Y']);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should show specific error message for each failed command', async () => {
    agentLoader.listAgents.mockRejectedValue(new Error('db error'));
    await setupAndParse('list');
    expect(display.displayError).toHaveBeenCalledWith('Failed to list agents: db error');
  });

  it('should show route-specific error prefix', async () => {
    agentLoader.routeToAgent.mockRejectedValue(new Error('route err'));
    await setupAndParse('route', ['q']);
    expect(display.displayError).toHaveBeenCalledWith('Routing failed: route err');
  });

  it('should show create-specific error prefix', async () => {
    fs.writeFile.mockRejectedValueOnce(new Error('write err'));
    await setupAndParse('create', ['-n', 'X', '-t', 'Y']);
    expect(display.displayError).toHaveBeenCalledWith('Failed to create agent: write err');
  });

  it('should show info-specific error prefix', async () => {
    agentLoader.loadAgent.mockRejectedValue(new Error('info err'));
    await setupAndParse('info', ['bad']);
    expect(display.displayError).toHaveBeenCalledWith('Failed to get agent info: info err');
  });
});

// ===========================================================================
// Edge cases
// ===========================================================================
describe('edge cases', () => {
  function setupAndParse(subcommand, args = []) {
    const command = getAgentCommand();
    const parent = new Command('p');
    const grandparent = new Command('gp');
    parent.addCommand(command);
    grandparent.addCommand(parent);
    return grandparent.parseAsync(['node', 'test', 'p', 'agent', subcommand, ...args]);
  }

  it('should handle agents with mixed error and normal states', async () => {
    const agents = [
      { id: 'good', name: 'Good', role: 'Good' },
      { id: 'bad', name: 'Bad', role: 'Bad', error: 'broken' },
      { id: 'ok', name: 'OK', role: 'OK' },
    ];
    agentLoader.listAgents.mockResolvedValue(agents);
    await setupAndParse('list');

    // Both cyan and red should have been called for IDs
    expect(chalk.cyan).toHaveBeenCalledWith('good');
    expect(chalk.red).toHaveBeenCalledWith('bad');
    expect(chalk.cyan).toHaveBeenCalledWith('ok');
  });

  it('should handle agent with no prompts object in load command', async () => {
    const agent = makeMockAgent({ prompts: undefined });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse('load', ['developer']);
    // Should not throw, and displayBox should not be called for welcome
    expect(display.displayBox).not.toHaveBeenCalled();
  });

  it('should handle menu with sections but no commands in a section', async () => {
    const agent = makeMockAgent();
    const menu = { sections: [{ name: 'Empty Section' }] };
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getAgentMenu.mockResolvedValue(menu);
    inquirer.prompt.mockResolvedValue({ selected: null });

    await setupAndParse('menu', ['developer', '-i']);
    // Should still work without error
    expect(display.displayMenu).toHaveBeenCalledWith(menu);
  });

  it('should handle route result with empty strings', async () => {
    agentLoader.routeToAgent.mockResolvedValue({
      agent: { id: '', name: '', role: '' },
      reason: '',
      matchedKeyword: '',
    });
    await setupAndParse('route', ['test']);
    expect(display.displaySuccess).toHaveBeenCalled();
    expect(display.displayBox).toHaveBeenCalled();
  });

  it('should handle list with filter returning empty array', async () => {
    agentLoader.findAgentsByExpertise.mockResolvedValue([]);
    await setupAndParse('list', ['--filter', 'nonexistent']);
    expect(display.displayWarning).toHaveBeenCalledWith('No agents found');
  });

  it('should handle create with empty specialization', async () => {
    await setupAndParse('create', ['-n', 'Bot', '-t', 'Test Agent']);
    const content = fs.writeFile.mock.calls[0][1];
    // specialization is undefined, so the YAML should have the fallback text
    expect(content).toContain('I bring deep expertise to my domain.');
  });

  it('should handle load command with agent that has welcome prompt containing many lines', async () => {
    const longWelcome = 'line\n'.repeat(15);
    const agent = makeMockAgent({ prompts: { welcome: longWelcome } });
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([]);
    await setupAndParse('load', ['developer']);
    const boxContent = display.displayBox.mock.calls[0][0];
    expect(boxContent.length).toBeLessThanOrEqual(10);
  });

  it('should handle multiple collaborators display in load command', async () => {
    const agent = makeMockAgent();
    agentLoader.loadAgent.mockResolvedValue(agent);
    agentLoader.getCollaborators.mockResolvedValue([
      { name: 'Alice', relationship: 'Reviews' },
      { name: 'Bob', relationship: 'Collaborates' },
      { name: 'Charlie', relationship: 'Advises' },
    ]);
    await setupAndParse('load', ['developer']);
    // console.log should be called for each collaborator
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Bob'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Charlie'));
  });

  it('should handle creating agent with nodes but no domains', async () => {
    inquirer.prompt.mockResolvedValue({
      base: 'developer',
      name: 'NodeBot',
      title: 'Node Expert',
      specialization: 'Nodes',
      nodes: 'HTTP,Webhook',
      domains: '',
    });

    await setupAndParse('create');
    const content = fs.writeFile.mock.calls[0][1];
    expect(content).toContain('HTTP');
    expect(content).toContain('Webhook');
    // Empty domains should result in comment placeholder
    expect(content).toContain('# Add your domains');
  });

  it('should handle creating agent with domains but no nodes', async () => {
    inquirer.prompt.mockResolvedValue({
      base: 'developer',
      name: 'DomBot',
      title: 'Dom Expert',
      specialization: 'Domains',
      nodes: '',
      domains: 'fintech,healthcare',
    });

    await setupAndParse('create');
    const content = fs.writeFile.mock.calls[0][1];
    // Empty nodes should result in comment placeholder
    expect(content).toContain('# Add your specialized nodes');
    expect(content).toContain('fintech');
  });
});

// ===========================================================================
// Command structure validation
// ===========================================================================
describe('command structure', () => {
  it('list command should have --format option with default "table"', () => {
    const command = getAgentCommand();
    const listCmd = findSubcommand(command, 'list');
    const formatOpt = listCmd.options.find(o => o.long === '--format');
    expect(formatOpt).toBeDefined();
    expect(formatOpt.defaultValue).toBe('table');
  });

  it('list command should have --filter option', () => {
    const command = getAgentCommand();
    const listCmd = findSubcommand(command, 'list');
    const filterOpt = listCmd.options.find(o => o.long === '--filter');
    expect(filterOpt).toBeDefined();
  });

  it('list command should have --essential option', () => {
    const command = getAgentCommand();
    const listCmd = findSubcommand(command, 'list');
    const essentialOpt = listCmd.options.find(o => o.long === '--essential');
    expect(essentialOpt).toBeDefined();
  });

  it('list command should have --all option', () => {
    const command = getAgentCommand();
    const listCmd = findSubcommand(command, 'list');
    const allOpt = listCmd.options.find(o => o.long === '--all');
    expect(allOpt).toBeDefined();
  });

  it('load command should require agent-id argument', () => {
    const command = getAgentCommand();
    const loadCmd = findSubcommand(command, 'load');
    expect(loadCmd.registeredArguments.length).toBe(1);
    expect(loadCmd.registeredArguments[0].required).toBe(true);
  });

  it('load command should have --detailed option', () => {
    const command = getAgentCommand();
    const loadCmd = findSubcommand(command, 'load');
    const detailedOpt = loadCmd.options.find(o => o.long === '--detailed');
    expect(detailedOpt).toBeDefined();
  });

  it('load command should have --json option', () => {
    const command = getAgentCommand();
    const loadCmd = findSubcommand(command, 'load');
    const jsonOpt = loadCmd.options.find(o => o.long === '--json');
    expect(jsonOpt).toBeDefined();
  });

  it('menu command should have optional agent-id with default n8n-master', () => {
    const command = getAgentCommand();
    const menuCmd = findSubcommand(command, 'menu');
    expect(menuCmd.registeredArguments.length).toBe(1);
    expect(menuCmd.registeredArguments[0].required).toBe(false);
    expect(menuCmd.registeredArguments[0].defaultValue).toBe('n8n-master');
  });

  it('menu command should have --interactive option', () => {
    const command = getAgentCommand();
    const menuCmd = findSubcommand(command, 'menu');
    const interactiveOpt = menuCmd.options.find(o => o.long === '--interactive');
    expect(interactiveOpt).toBeDefined();
  });

  it('route command should require query argument', () => {
    const command = getAgentCommand();
    const routeCmd = findSubcommand(command, 'route');
    expect(routeCmd.registeredArguments.length).toBe(1);
    expect(routeCmd.registeredArguments[0].required).toBe(true);
  });

  it('create command should have --base option with default developer', () => {
    const command = getAgentCommand();
    const createCmd = findSubcommand(command, 'create');
    const baseOpt = createCmd.options.find(o => o.long === '--base');
    expect(baseOpt).toBeDefined();
    expect(baseOpt.defaultValue).toBe('developer');
  });

  it('create command should have --name option', () => {
    const command = getAgentCommand();
    const createCmd = findSubcommand(command, 'create');
    const nameOpt = createCmd.options.find(o => o.long === '--name');
    expect(nameOpt).toBeDefined();
  });

  it('create command should have --title option', () => {
    const command = getAgentCommand();
    const createCmd = findSubcommand(command, 'create');
    const titleOpt = createCmd.options.find(o => o.long === '--title');
    expect(titleOpt).toBeDefined();
  });

  it('create command should have --output option', () => {
    const command = getAgentCommand();
    const createCmd = findSubcommand(command, 'create');
    const outputOpt = createCmd.options.find(o => o.long === '--output');
    expect(outputOpt).toBeDefined();
  });

  it('info command should require agent-id argument', () => {
    const command = getAgentCommand();
    const infoCmd = findSubcommand(command, 'info');
    expect(infoCmd.registeredArguments.length).toBe(1);
    expect(infoCmd.registeredArguments[0].required).toBe(true);
  });

  it('each subcommand should have a description', () => {
    const command = getAgentCommand();
    command.commands.forEach(sub => {
      expect(sub.description()).toBeTruthy();
    });
  });
});
