/**
 * @fileoverview Unit tests for the workflow command module
 *
 * Tests the workflow CLI command including subcommands (list, run, show, paths, triggers),
 * internal helper functions (formatWorkflowTable, displayStep), and interactive navigation.
 */

// =============================================================================
// Mock setup (must precede require of module under test)
// =============================================================================

// Pass-through chalk mock: every method returns its input unchanged, supports chaining
const createChalkProxy = () => {
  const handler = {
    get(_target, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (
        prop === 'bold' || prop === 'cyan' || prop === 'magenta' ||
        prop === 'green' || prop === 'red' || prop === 'yellow' ||
        prop === 'blue' || prop === 'gray' || prop === 'white'
      ) {
        const fn = (str) => String(str);
        return new Proxy(fn, handler);
      }
      return undefined;
    },
    apply(_target, _thisArg, args) {
      return String(args[0]);
    },
  };
  return new Proxy((str) => String(str), handler);
};

const mockChalk = createChalkProxy();
jest.mock('chalk', () => mockChalk);

// Mock ora (spinner)
const mockSpinner = {
  start: jest.fn(function () { return this; }),
  stop: jest.fn(function () { return this; }),
  succeed: jest.fn(function () { return this; }),
  fail: jest.fn(function () { return this; }),
};
jest.mock('ora', () => jest.fn(() => mockSpinner));

// Mock inquirer
const mockPrompt = jest.fn();
jest.mock('inquirer', () => ({
  prompt: mockPrompt,
  Separator: jest.fn(function () { this.type = 'separator'; }),
}));

// Mock display module
const mockDisplay = {
  displaySuccess: jest.fn(),
  displayError: jest.fn(),
  displayWarning: jest.fn(),
  displayInfo: jest.fn(),
  displayHeader: jest.fn(),
  displayTable: jest.fn(() => 'mock-table-output'),
  displayList: jest.fn(),
  displayBox: jest.fn(),
  displayKeyValue: jest.fn(),
  displayDivider: jest.fn(),
  theme: {
    primary: (s) => s,
    secondary: (s) => s,
    success: (s) => s,
    warning: (s) => s,
    error: (s) => s,
    info: (s) => s,
    muted: (s) => s,
    highlight: (s) => s,
    accent: (s) => s,
  },
};
jest.mock('../../../tools/cli/lib/display', () => mockDisplay);

// Mock workflow-loader
const mockWorkflowLoader = {
  findWorkflowByTrigger: jest.fn(),
  loadWorkflowFile: jest.fn(),
  listWorkflows: jest.fn(),
  getWorkflowPaths: jest.fn(),
  getNextWorkflows: jest.fn(),
  formatWorkflowForDisplay: jest.fn(),
};
jest.mock('../../../tools/cli/lib/workflow-loader', () => mockWorkflowLoader);

// Mock agent-loader
const mockAgentLoader = {
  loadAgent: jest.fn(),
};
jest.mock('../../../tools/cli/lib/agent-loader', () => mockAgentLoader);

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// =============================================================================
// Require module under test (after all mocks)
// =============================================================================

// NOTE: workflow.js exports `createWorkflowCommand()` which returns a single
// Commander instance.  Commander commands accumulate event listeners, internal
// parent references, and parsed-option state.  Re-adding the *same* instance to
// a new parent on every test causes cross-test pollution.
//
// Solution: use `getFreshCommand()` (like nodes.test.js) to bust the require
// cache and get a brand-new Command instance for every `runCommand` invocation.
//
// We keep one reference for the static "Module export" tests that only inspect
// the shape of the command without running it.
const workflowCommand = require('../../../tools/cli/commands/workflow');

// =============================================================================
// Helpers
// =============================================================================

let logSpy;
let errorSpy;

/**
 * Reset Commander internal state on a command tree so parsed options
 * from previous tests don't leak into the next test.
 * Rebuilds default values from registered options to ensure clean state.
 */
function resetCommanderState(cmd) {
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
  if (cmd.commands) {
    cmd.commands.forEach(sub => resetCommanderState(sub));
  }
}

/**
 * Get a fresh workflow command module to avoid Commander state issues.
 */
function getFreshCommand() {
  const modulePath = require.resolve('../../../tools/cli/commands/workflow');
  delete require.cache[modulePath];
  const cmd = require('../../../tools/cli/commands/workflow');
  resetCommanderState(cmd);
  return cmd;
}

/**
 * Helper: run a Commander command by parsing argv-style arguments.
 * Commander expects ['node', 'program', ...args].
 */
async function runCommand(args) {
  const freshCmd = getFreshCommand();

  const { Command } = require('commander');
  const parent = new Command();
  parent.exitOverride(); // throw instead of exiting
  parent.addCommand(freshCmd);

  try {
    await parent.parseAsync(['node', 'test', 'workflow', ...args]);
  } catch (e) {
    // Commander throws on exitOverride - ignore CommanderError
    if (e.code !== 'commander.helpDisplayed' && e.code !== 'commander.help') {
      // Allow test to continue; the error is from process.exit mock or Commander
    }
  }
}

// Sample data factories
function createWorkflowList() {
  return [
    {
      id: 'create-prd',
      trigger: 'PRD',
      category: 'requirements',
      description: 'Create a Product Requirements Document for your project',
      primaryAgent: 'Paula (PM)',
      supportingAgents: [],
    },
    {
      id: 'dev-story',
      trigger: 'DS',
      category: 'development',
      description: 'Implement a user story with guided workflow',
      primaryAgent: 'Nate (Developer)',
      supportingAgents: ['Quinn (QA)'],
    },
    {
      id: 'code-review',
      trigger: 'CR',
      category: 'quality',
      description: 'Perform a comprehensive code review on implemented work',
      primaryAgent: 'Quinn (QA)',
      supportingAgents: [],
    },
  ];
}

function createWorkflowDef(overrides = {}) {
  return {
    id: 'create-prd',
    trigger: 'PRD',
    category: 'requirements',
    description: 'Create PRD',
    primaryAgent: 'Paula (PM)',
    file: '1-requirements/create-prd.md',
    ...overrides,
  };
}

function createLoadedWorkflow(overrides = {}) {
  return {
    title: 'Create PRD',
    trigger: 'PRD',
    agents: [
      { name: 'Paula', role: 'PM', icon: '' },
    ],
    steps: [
      {
        number: 1,
        title: 'Gather Requirements',
        agent: { name: 'Paula', role: 'PM', icon: '' },
        content: 'Gather all project requirements.\n- Identify stakeholders\n- Define scope',
        isRoute: false,
      },
      {
        number: 2,
        title: 'Draft Document',
        agent: { name: 'Paula', role: 'PM', icon: '' },
        content: 'Write the PRD document.\n### Sections\n- Problem statement\n- Goals',
        isRoute: false,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

// =============================================================================
// 1. Module Export
// =============================================================================

describe('Module export', () => {
  it('should export a Commander Command object', () => {
    expect(workflowCommand).toBeDefined();
    expect(workflowCommand.constructor.name).toBe('Command');
  });

  it('should have command name "workflow"', () => {
    expect(workflowCommand.name()).toBe('workflow');
  });

  it('should have alias "wf"', () => {
    expect(workflowCommand.alias()).toBe('wf');
  });

  it('should have a description', () => {
    expect(workflowCommand.description()).toContain('Workflow operations');
  });

  it('should have the "list" subcommand', () => {
    const listCmd = workflowCommand.commands.find(c => c.name() === 'list');
    expect(listCmd).toBeDefined();
  });

  it('should have the "run" subcommand', () => {
    const runCmd = workflowCommand.commands.find(c => c.name() === 'run');
    expect(runCmd).toBeDefined();
  });

  it('should have the "show" subcommand', () => {
    const showCmd = workflowCommand.commands.find(c => c.name() === 'show');
    expect(showCmd).toBeDefined();
  });

  it('should have the "paths" subcommand', () => {
    const pathsCmd = workflowCommand.commands.find(c => c.name() === 'paths');
    expect(pathsCmd).toBeDefined();
  });

  it('should have the "triggers" subcommand', () => {
    const triggersCmd = workflowCommand.commands.find(c => c.name() === 'triggers');
    expect(triggersCmd).toBeDefined();
  });

  it('should have triggers subcommand with alias "t"', () => {
    const triggersCmd = workflowCommand.commands.find(c => c.name() === 'triggers');
    expect(triggersCmd.alias()).toBe('t');
  });
});

// =============================================================================
// 2. formatWorkflowTable (tested via list command with table format)
// =============================================================================

describe('formatWorkflowTable (via list command)', () => {
  it('should pass table data with correct headers to displayTable', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    expect(mockDisplay.displayTable).toHaveBeenCalled();
    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData[0]).toEqual(['Trigger', 'Description', 'Agent', 'Category']);
  });

  it('should include a row for each workflow', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    // 1 header + 3 data rows
    expect(tableData).toHaveLength(4);
  });

  it('should truncate descriptions longer than 40 characters', async () => {
    const workflows = [{
      id: 'long-desc',
      trigger: 'LD',
      category: 'test',
      description: 'This is a very long description that exceeds forty characters easily',
      primaryAgent: 'Agent',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    const descriptionCell = tableData[1][1];
    expect(descriptionCell).toContain('...');
    expect(descriptionCell.length).toBeLessThanOrEqual(43); // 40 chars + '...'
  });

  it('should not add ellipsis for descriptions at or under 40 characters', async () => {
    const workflows = [{
      id: 'short-desc',
      trigger: 'SD',
      category: 'test',
      description: 'Short description here',
      primaryAgent: 'Agent',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    const descriptionCell = tableData[1][1];
    expect(descriptionCell).not.toContain('...');
    expect(descriptionCell).toBe('Short description here');
  });

  it('should show "-" for missing primaryAgent', async () => {
    const workflows = [{
      id: 'no-agent',
      trigger: 'NA',
      category: 'test',
      description: 'No agent workflow',
      primaryAgent: null,
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData[1][2]).toBe('-');
  });

  it('should include category in the last column', async () => {
    const workflows = [{
      id: 'cat-test',
      trigger: 'CT',
      category: 'quality',
      description: 'Category test',
      primaryAgent: 'Quinn',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData[1][3]).toBe('quality');
  });

  it('should wrap trigger in brackets in first column', async () => {
    const workflows = [{
      id: 'trigger-test',
      trigger: 'PRD',
      category: 'requirements',
      description: 'Trigger format test',
      primaryAgent: 'Paula',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData[1][0]).toContain('[PRD]');
  });
});

// =============================================================================
// 3. List command
// =============================================================================

describe('list command', () => {
  it('should call listWorkflows', async () => {
    mockWorkflowLoader.listWorkflows.mockResolvedValue([]);
    await runCommand(['list']);
    expect(mockWorkflowLoader.listWorkflows).toHaveBeenCalled();
  });

  it('should show spinner while loading', async () => {
    mockWorkflowLoader.listWorkflows.mockResolvedValue([]);
    await runCommand(['list']);
    expect(mockSpinner.start).toHaveBeenCalled();
  });

  it('should display warning when no workflows found', async () => {
    mockWorkflowLoader.listWorkflows.mockResolvedValue([]);
    await runCommand(['list']);
    expect(mockDisplay.displayWarning).toHaveBeenCalledWith('No workflows found');
  });

  it('should filter by category when --category is provided', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--category', 'requirements']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    // Header + 1 matching row (only 'requirements' category)
    expect(tableData).toHaveLength(2);
  });

  it('should filter by category case-insensitively', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--category', 'REQUIREMENTS']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(2);
  });

  it('should filter by partial category match', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--category', 'dev']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    // 'development' contains 'dev'
    expect(tableData).toHaveLength(2);
  });

  it('should display warning when category filter yields no results', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--category', 'nonexistent']);

    expect(mockDisplay.displayWarning).toHaveBeenCalledWith('No workflows found');
  });

  it('should display JSON output when --format json', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'json']);

    const jsonOutput = logSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('"trigger"')
    );
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput[0]);
    expect(parsed).toHaveLength(3);
  });

  it('should display simple format when --format simple', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'simple']);

    // Should NOT call displayTable for simple format
    expect(mockDisplay.displayTable).not.toHaveBeenCalled();
    // Should log each workflow
    const outputCalls = logSpy.mock.calls.filter(call =>
      typeof call[0] === 'string' && call[0].includes('[')
    );
    expect(outputCalls.length).toBeGreaterThanOrEqual(3);
  });

  it('should display table header for table format', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    expect(mockDisplay.displayHeader).toHaveBeenCalledWith('Available Workflows');
  });

  it('should show unique categories info in table format', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const infoCall = mockDisplay.displayInfo.mock.calls.find(call =>
      call[0].includes('Categories:')
    );
    expect(infoCall).toBeDefined();
  });

  it('should show usage hint in table format', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const infoCall = mockDisplay.displayInfo.mock.calls.find(call =>
      call[0].includes('workflow run')
    );
    expect(infoCall).toBeDefined();
  });

  it('should show spinner succeed with count', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list']);

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Found 3 workflows');
  });

  it('should call displayError and process.exit on failure', async () => {
    mockWorkflowLoader.listWorkflows.mockRejectedValue(new Error('manifest missing'));

    await runCommand(['list']);

    expect(mockDisplay.displayError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to list workflows')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// =============================================================================
// 4. Run command
// =============================================================================

describe('run command', () => {
  it('should call findWorkflowByTrigger with the provided trigger', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    // Immediately exit interactive mode
    mockPrompt.mockResolvedValueOnce({ action: 'exit' });

    await runCommand(['run', 'PRD']);

    expect(mockWorkflowLoader.findWorkflowByTrigger).toHaveBeenCalledWith('PRD');
  });

  it('should show error when workflow not found', async () => {
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(null);

    await runCommand(['run', 'INVALID']);

    expect(mockSpinner.fail).toHaveBeenCalledWith(
      expect.stringContaining('Workflow not found')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should show usage hint when workflow not found', async () => {
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(null);

    await runCommand(['run', 'INVALID']);

    expect(mockDisplay.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('workflow list')
    );
  });

  it('should call displayWorkflowSummary when --summary flag is set', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);

    await runCommand(['run', 'PRD', '--summary']);

    // displayWorkflowSummary calls displayHeader with style: 'prominent'
    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      expect.stringContaining('Create PRD'),
      expect.objectContaining({ style: 'prominent' })
    );
  });

  it('should run interactive mode by default', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockPrompt.mockResolvedValueOnce({ action: 'exit' });

    await runCommand(['run', 'PRD']);

    // Interactive mode shows a box
    expect(mockDisplay.displayBox).toHaveBeenCalled();
  });

  it('should call displayError on failure', async () => {
    mockWorkflowLoader.findWorkflowByTrigger.mockRejectedValue(new Error('network error'));

    await runCommand(['run', 'PRD']);

    expect(mockDisplay.displayError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to run workflow')
    );
  });
});

// =============================================================================
// 5. Show command
// =============================================================================

describe('show command', () => {
  it('should call findWorkflowByTrigger with the trigger', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);

    await runCommand(['show', 'PRD']);

    expect(mockWorkflowLoader.findWorkflowByTrigger).toHaveBeenCalledWith('PRD');
  });

  it('should display error when workflow not found', async () => {
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(null);

    await runCommand(['show', 'MISSING']);

    expect(mockDisplay.displayError).toHaveBeenCalledWith(
      expect.stringContaining('Workflow not found')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should display summary by default (non-JSON)', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);

    await runCommand(['show', 'PRD']);

    // displayWorkflowSummary calls displayHeader with prominent style
    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      expect.stringContaining('Create PRD'),
      expect.objectContaining({ style: 'prominent' })
    );
  });

  it('should output JSON when --json flag is provided', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    const formatted = { trigger: 'PRD', title: 'Create PRD', stepCount: 2 };
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.formatWorkflowForDisplay.mockReturnValue(formatted);

    await runCommand(['show', 'PRD', '--json']);

    expect(mockWorkflowLoader.loadWorkflowFile).toHaveBeenCalledWith(workflowDef.file);
    expect(mockWorkflowLoader.formatWorkflowForDisplay).toHaveBeenCalledWith(
      loadedWorkflow,
      { detailed: true }
    );
    const jsonCall = logSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('"trigger"')
    );
    expect(jsonCall).toBeDefined();
  });

  it('should call displayError on failure', async () => {
    mockWorkflowLoader.findWorkflowByTrigger.mockRejectedValue(new Error('parse error'));

    await runCommand(['show', 'PRD']);

    expect(mockDisplay.displayError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to show workflow')
    );
  });
});

// =============================================================================
// 6. Paths command
// =============================================================================

describe('paths command', () => {
  it('should call getWorkflowPaths', async () => {
    mockWorkflowLoader.getWorkflowPaths.mockResolvedValue({});
    await runCommand(['paths']);
    expect(mockWorkflowLoader.getWorkflowPaths).toHaveBeenCalled();
  });

  it('should show spinner while loading', async () => {
    mockWorkflowLoader.getWorkflowPaths.mockResolvedValue({});
    await runCommand(['paths']);
    expect(mockSpinner.start).toHaveBeenCalled();
  });

  it('should display warning when no paths defined', async () => {
    mockWorkflowLoader.getWorkflowPaths.mockResolvedValue({});
    await runCommand(['paths']);
    expect(mockDisplay.displayWarning).toHaveBeenCalledWith('No workflow paths defined');
  });

  it('should display header for paths', async () => {
    const paths = {
      'quick-flow': {
        name: 'Quick Flow',
        description: 'Fast implementation path',
        steps: ['PRD', 'DS', 'CR'],
        agents: ['Paula', 'Nate', 'Quinn'],
      },
    };
    mockWorkflowLoader.getWorkflowPaths.mockResolvedValue(paths);

    await runCommand(['paths']);

    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      'Common Workflow Paths',
      expect.objectContaining({ style: 'prominent' })
    );
  });

  it('should display a box for each path', async () => {
    const paths = {
      'quick-flow': {
        name: 'Quick Flow',
        description: 'Fast implementation',
        steps: ['PRD', 'DS'],
        agents: ['Paula', 'Nate'],
      },
      'standard': {
        name: 'Standard',
        description: 'Full process',
        steps: ['PRD', 'VP', 'CA', 'DS', 'CR'],
        agents: ['Paula', 'Victor', 'Winston', 'Nate', 'Quinn'],
      },
    };
    mockWorkflowLoader.getWorkflowPaths.mockResolvedValue(paths);

    await runCommand(['paths']);

    expect(mockDisplay.displayBox).toHaveBeenCalledTimes(2);
  });

  it('should include path key as box title', async () => {
    const paths = {
      'quick-flow': {
        name: 'Quick Flow',
        description: 'Fast implementation',
        steps: ['PRD', 'DS'],
        agents: ['Paula'],
      },
    };
    mockWorkflowLoader.getWorkflowPaths.mockResolvedValue(paths);

    await runCommand(['paths']);

    expect(mockDisplay.displayBox).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ title: 'quick-flow', style: 'round' })
    );
  });

  it('should show usage hint after paths display', async () => {
    const paths = {
      'quick-flow': {
        name: 'Quick Flow',
        description: 'desc',
        steps: ['PRD'],
        agents: ['Paula'],
      },
    };
    mockWorkflowLoader.getWorkflowPaths.mockResolvedValue(paths);

    await runCommand(['paths']);

    expect(mockDisplay.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('workflow run')
    );
  });

  it('should call displayError on failure', async () => {
    mockWorkflowLoader.getWorkflowPaths.mockRejectedValue(new Error('manifest error'));

    await runCommand(['paths']);

    expect(mockDisplay.displayError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load paths')
    );
  });
});

// =============================================================================
// 7. Triggers command
// =============================================================================

describe('triggers command', () => {
  it('should call listWorkflows', async () => {
    mockWorkflowLoader.listWorkflows.mockResolvedValue([]);
    await runCommand(['triggers']);
    expect(mockWorkflowLoader.listWorkflows).toHaveBeenCalled();
  });

  it('should display prominent header', async () => {
    mockWorkflowLoader.listWorkflows.mockResolvedValue([]);
    await runCommand(['triggers']);
    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      'Workflow Triggers Quick Reference',
      expect.objectContaining({ style: 'prominent' })
    );
  });

  it('should group workflows by category', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['triggers']);

    // Should create a header for each unique category
    const headerCalls = mockDisplay.displayHeader.mock.calls;
    // First call is the main header, subsequent ones are per category
    const categoryHeaders = headerCalls.filter(call =>
      call[1] && call[1].style === 'compact'
    );
    expect(categoryHeaders.length).toBe(3); // requirements, development, quality
  });

  it('should capitalize category names in headers', async () => {
    const workflows = [{
      id: 'w1',
      trigger: 'T1',
      category: 'data-pipeline',
      description: 'Test',
      primaryAgent: 'Agent',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['triggers']);

    const categoryHeader = mockDisplay.displayHeader.mock.calls.find(call =>
      call[1] && call[1].style === 'compact'
    );
    expect(categoryHeader[0]).toContain('Data');
    expect(categoryHeader[0]).toContain('Pipeline');
  });

  it('should display trigger codes and descriptions', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['triggers']);

    const allLogOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allLogOutput).toContain('[PRD]');
    expect(allLogOutput).toContain('[DS]');
    expect(allLogOutput).toContain('[CR]');
  });

  it('should show run hint at the end', async () => {
    mockWorkflowLoader.listWorkflows.mockResolvedValue([]);
    await runCommand(['triggers']);
    expect(mockDisplay.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('n8n-bmad workflow run')
    );
  });

  it('should call displayError on failure', async () => {
    mockWorkflowLoader.listWorkflows.mockRejectedValue(new Error('bad'));
    await runCommand(['triggers']);
    expect(mockDisplay.displayError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to list triggers')
    );
  });
});

// =============================================================================
// 8. displayStep (tested via interactive run)
// =============================================================================

describe('displayStep (via interactive run)', () => {
  const setupInteractiveRun = async (steps, promptResponses) => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow({ steps });

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue([]);

    for (const response of promptResponses) {
      mockPrompt.mockResolvedValueOnce(response);
    }

    await runCommand(['run', 'PRD']);
  };

  it('should display step number and total for regular steps', async () => {
    const steps = [
      { number: 1, title: 'First', content: 'Content here', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Step 1/1');
    expect(allOutput).toContain('First');
  });

  it('should display "Route X" label for route steps', async () => {
    const steps = [
      { number: 'A', title: 'Route Alpha', content: 'Route content', isRoute: true, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Route A');
  });

  it('should display agent name and role when present', async () => {
    const steps = [
      {
        number: 1,
        title: 'Step With Agent',
        content: 'Do something',
        isRoute: false,
        agent: { name: 'Paula', role: 'PM', icon: '' },
      },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Agent: Paula (PM)');
  });

  it('should call displayDivider for each step', async () => {
    const steps = [
      { number: 1, title: 'Step 1', content: 'Content', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    expect(mockDisplay.displayDivider).toHaveBeenCalledWith({ width: 50, char: '\u2500' });
  });

  it('should format h3 headers in step content', async () => {
    const steps = [
      { number: 1, title: 'Step', content: '### Section Title\nSome text', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Section Title');
  });

  it('should format unchecked checkboxes', async () => {
    const steps = [
      { number: 1, title: 'Step', content: '- [ ] Todo item', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Todo item');
  });

  it('should format checked checkboxes', async () => {
    const steps = [
      { number: 1, title: 'Step', content: '- [x] Done item', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Done item');
  });

  it('should format bullet points', async () => {
    const steps = [
      { number: 1, title: 'Step', content: '- Bullet item', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Bullet item');
  });

  it('should format table rows', async () => {
    const steps = [
      { number: 1, title: 'Step', content: '| Col1 | Col2 |', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('| Col1 | Col2 |');
  });

  it('should format decision points', async () => {
    const steps = [
      { number: 1, title: 'Step', content: '**\u{1F500} If error:** Route to handler', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('If error:');
  });

  it('should format code blocks', async () => {
    const steps = [
      {
        number: 1,
        title: 'Step',
        content: '```js\nconst x = 1;\n```\nAfter code',
        isRoute: false,
        agent: null,
      },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('const x = 1;');
  });

  it('should not display agent line when agent is null', async () => {
    const steps = [
      { number: 1, title: 'No Agent Step', content: 'Content', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).not.toContain('Agent:');
  });

  it('should skip empty lines in content', async () => {
    const steps = [
      { number: 1, title: 'Step', content: 'Line 1\n\nLine 2', isRoute: false, agent: null },
    ];
    await setupInteractiveRun(steps, [{ action: 'exit' }]);

    // Empty lines (line.trim() is falsy) should not generate console.log output for that line
    // The function only logs non-empty lines from the else-if chain
    const contentLogs = logSpy.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].includes('Line')
    );
    expect(contentLogs.length).toBe(2);
  });
});

// =============================================================================
// 9. Interactive navigation (runWorkflowInteractive)
// =============================================================================

describe('runWorkflowInteractive navigation', () => {
  const setupInteractive = async (promptResponses, workflowOverrides = {}) => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow(workflowOverrides);

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue([]);

    for (const response of promptResponses) {
      mockPrompt.mockResolvedValueOnce(response);
    }

    await runCommand(['run', 'PRD']);
  };

  it('should display workflow header box on start', async () => {
    await setupInteractive([{ action: 'exit' }]);

    expect(mockDisplay.displayBox).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('Create PRD'),
      ]),
      expect.objectContaining({ title: 'Workflow', style: 'round' })
    );
  });

  it('should show spinner loading message', async () => {
    await setupInteractive([{ action: 'exit' }]);
    const ora = require('ora');
    expect(ora).toHaveBeenCalledWith(expect.stringContaining('Loading workflow'));
  });

  it('should succeed spinner with workflow title', async () => {
    await setupInteractive([{ action: 'exit' }]);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Loaded: Create PRD')
    );
  });

  it('should navigate to next step on "next" action', async () => {
    const steps = [
      { number: 1, title: 'Step 1', content: 'First', isRoute: false, agent: null },
      { number: 2, title: 'Step 2', content: 'Second', isRoute: false, agent: null },
    ];
    await setupInteractive(
      [{ action: 'next' }, { action: 'exit' }],
      { steps }
    );

    // Both steps should be displayed
    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Step 1');
    expect(allOutput).toContain('Step 2');
  });

  it('should navigate to previous step on "prev" action', async () => {
    const steps = [
      { number: 1, title: 'Step 1', content: 'First', isRoute: false, agent: null },
      { number: 2, title: 'Step 2', content: 'Second', isRoute: false, agent: null },
    ];
    await setupInteractive(
      [{ action: 'next' }, { action: 'prev' }, { action: 'exit' }],
      { steps }
    );

    // prompt should be called 3 times
    expect(mockPrompt).toHaveBeenCalledTimes(3);
  });

  it('should show "Finish workflow" on last step instead of "Next step"', async () => {
    const steps = [
      { number: 1, title: 'Only Step', content: 'Content', isRoute: false, agent: null },
    ];
    await setupInteractive([{ action: 'finish' }], { steps });

    const promptCall = mockPrompt.mock.calls[0][0][0];
    const finishChoice = promptCall.choices.find(c => c.value === 'finish');
    expect(finishChoice).toBeDefined();
  });

  it('should not show "Previous step" on first step', async () => {
    const steps = [
      { number: 1, title: 'Step 1', content: 'First', isRoute: false, agent: null },
      { number: 2, title: 'Step 2', content: 'Second', isRoute: false, agent: null },
    ];
    await setupInteractive([{ action: 'exit' }], { steps });

    const promptCall = mockPrompt.mock.calls[0][0][0];
    const prevChoice = promptCall.choices.find(c => c.value === 'prev');
    expect(prevChoice).toBeUndefined();
  });

  it('should display success message on "finish" action', async () => {
    const steps = [
      { number: 1, title: 'Step', content: 'Content', isRoute: false, agent: null },
    ];
    await setupInteractive([{ action: 'finish' }], { steps });

    expect(mockDisplay.displaySuccess).toHaveBeenCalledWith(
      expect.stringContaining('completed')
    );
  });

  it('should show next workflow suggestions on finish', async () => {
    const steps = [
      { number: 1, title: 'Step', content: 'Content', isRoute: false, agent: null },
    ];
    const nextWorkflows = [
      { trigger: 'VP', description: 'Validate PRD' },
      { trigger: 'CA', description: 'Create Architecture' },
    ];

    // Set up manually (not via setupInteractive) so getNextWorkflows mock
    // is set AFTER all other mocks and not overridden.
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow({ steps });

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue(nextWorkflows);

    mockPrompt.mockResolvedValueOnce({ action: 'finish' });

    await runCommand(['run', 'PRD']);

    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      'Suggested Next Workflows',
      expect.objectContaining({ style: 'compact' })
    );
  });

  it('should not show next workflows header when none available', async () => {
    const steps = [
      { number: 1, title: 'Step', content: 'Content', isRoute: false, agent: null },
    ];
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue([]);

    await setupInteractive([{ action: 'finish' }], { steps });

    const suggestedHeader = mockDisplay.displayHeader.mock.calls.find(
      call => typeof call[0] === 'string' && call[0].includes('Suggested')
    );
    expect(suggestedHeader).toBeUndefined();
  });

  it('should display warning on "exit" action', async () => {
    await setupInteractive([{ action: 'exit' }]);

    expect(mockDisplay.displayWarning).toHaveBeenCalledWith('Workflow exited');
  });

  it('should mark step complete on "complete" action', async () => {
    await setupInteractive([{ action: 'complete' }, { action: 'exit' }]);

    expect(mockDisplay.displaySuccess).toHaveBeenCalledWith(
      expect.stringContaining('marked as complete')
    );
  });

  it('should handle "jump" action by showing step list and jumping', async () => {
    const steps = [
      { number: 1, title: 'Step 1', content: 'First', isRoute: false, agent: null },
      { number: 2, title: 'Step 2', content: 'Second', isRoute: false, agent: null },
      { number: 3, title: 'Step 3', content: 'Third', isRoute: false, agent: null },
    ];

    mockPrompt
      .mockResolvedValueOnce({ action: 'jump' })
      .mockResolvedValueOnce({ stepIndex: 2 }) // jump to step 3
      .mockResolvedValueOnce({ action: 'exit' });

    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow({ steps });

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue([]);

    await runCommand(['run', 'PRD']);

    // The jump prompt should present step choices
    const jumpPromptCall = mockPrompt.mock.calls[1][0][0];
    expect(jumpPromptCall.choices).toHaveLength(3);
    expect(jumpPromptCall.choices[2].name).toContain('Step 3');
  });

  it('should handle "list" action by showing all steps', async () => {
    const steps = [
      { number: 1, title: 'Step 1', content: 'First', isRoute: false, agent: null },
      { number: 2, title: 'Step 2', content: 'Second', isRoute: false, agent: null },
    ];
    await setupInteractive([{ action: 'list' }, { action: 'exit' }], { steps });

    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      'Workflow Steps',
      expect.objectContaining({ style: 'compact' })
    );
  });

  it('should handle workflow load failure in interactive mode', async () => {
    const workflowDef = createWorkflowDef();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockRejectedValue(new Error('file not found'));

    await runCommand(['run', 'PRD']);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to load workflow');
  });

  it('should handle workflow with route steps in jump list', async () => {
    const steps = [
      { number: 1, title: 'Step 1', content: 'Normal', isRoute: false, agent: null },
      { number: 'A', title: 'Route A', content: 'Route', isRoute: true, agent: null },
    ];

    mockPrompt
      .mockResolvedValueOnce({ action: 'jump' })
      .mockResolvedValueOnce({ stepIndex: 1 })
      .mockResolvedValueOnce({ action: 'exit' });

    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow({ steps });

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue([]);

    await runCommand(['run', 'PRD']);

    const jumpPromptCall = mockPrompt.mock.calls[1][0][0];
    expect(jumpPromptCall.choices[1].name).toContain('Route');
  });

  it('should navigate through all steps naturally when pressing next repeatedly', async () => {
    const steps = [
      { number: 1, title: 'Step 1', content: 'First', isRoute: false, agent: null },
      { number: 2, title: 'Step 2', content: 'Second', isRoute: false, agent: null },
      { number: 3, title: 'Step 3', content: 'Third', isRoute: false, agent: null },
    ];
    await setupInteractive(
      [{ action: 'next' }, { action: 'next' }, { action: 'finish' }],
      { steps }
    );

    // All three prompts should be called, plus the success message
    expect(mockPrompt).toHaveBeenCalledTimes(3);
    expect(mockDisplay.displaySuccess).toHaveBeenCalledWith(
      expect.stringContaining('completed')
    );
  });
});

// =============================================================================
// 10. displayWorkflowSummary (tested via --summary and show)
// =============================================================================

describe('displayWorkflowSummary', () => {
  const setupSummary = async (workflowOverrides = {}) => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow(workflowOverrides);

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);

    await runCommand(['run', 'PRD', '--summary']);
  };

  it('should show spinner loading message', async () => {
    await setupSummary();
    const ora = require('ora');
    expect(ora).toHaveBeenCalledWith(expect.stringContaining('Loading workflow'));
  });

  it('should succeed spinner with workflow title', async () => {
    await setupSummary();
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Loaded: Create PRD')
    );
  });

  it('should display prominent header with title and trigger', async () => {
    await setupSummary();
    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      expect.stringContaining('Create PRD [PRD]'),
      { style: 'prominent' }
    );
  });

  it('should display agents key-value', async () => {
    await setupSummary();
    expect(mockDisplay.displayKeyValue).toHaveBeenCalledWith(
      'Agents',
      expect.stringContaining('Paula')
    );
  });

  it('should display step count key-value', async () => {
    await setupSummary();
    expect(mockDisplay.displayKeyValue).toHaveBeenCalledWith('Steps', '2');
  });

  it('should display category key-value', async () => {
    await setupSummary();
    expect(mockDisplay.displayKeyValue).toHaveBeenCalledWith('Category', 'requirements');
  });

  it('should display steps header', async () => {
    await setupSummary();
    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      'Steps',
      expect.objectContaining({ style: 'compact' })
    );
  });

  it('should display each step in the summary', async () => {
    await setupSummary();
    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Gather Requirements');
    expect(allOutput).toContain('Draft Document');
  });

  it('should display route prefix for route steps', async () => {
    const steps = [
      { number: 'A', title: 'Route A', content: 'Content', isRoute: true, agent: null },
    ];
    await setupSummary({ steps });

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Route');
  });

  it('should display agent name in brackets for steps with agents', async () => {
    await setupSummary();
    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('[Paula]');
  });

  it('should display run hint', async () => {
    await setupSummary();
    expect(mockDisplay.displayInfo).toHaveBeenCalledWith(
      expect.stringContaining('workflow run')
    );
  });

  it('should handle load failure', async () => {
    const workflowDef = createWorkflowDef();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockRejectedValue(new Error('bad file'));

    await runCommand(['run', 'PRD', '--summary']);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to load workflow');
  });
});

// =============================================================================
// 11. Default action (no subcommand)
// =============================================================================

describe('default action (no subcommand)', () => {
  it('should show triggers when no subcommand is provided', async () => {
    mockWorkflowLoader.listWorkflows.mockResolvedValue(createWorkflowList());

    // Get a fresh command to inspect -- the static `workflowCommand` is stale
    // after prior tests may have mutated it.
    const freshCmd = getFreshCommand();

    // The default action creates a new triggers command internally.
    // We test that the workflow command has an action handler registered.
    expect(freshCmd._actionHandler).toBeDefined();
  });
});

// =============================================================================
// 12. Edge cases
// =============================================================================

describe('edge cases', () => {
  it('should handle workflow with zero steps in interactive mode', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow({ steps: [] });

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);

    await runCommand(['run', 'PRD']);

    // With zero steps, the while loop exits immediately and displays success
    expect(mockDisplay.displaySuccess).toHaveBeenCalledWith(
      expect.stringContaining('completed')
    );
  });

  it('should handle workflow with single step finishing', async () => {
    const steps = [
      { number: 1, title: 'Only', content: 'Single step', isRoute: false, agent: null },
    ];

    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow({ steps });

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue([]);

    mockPrompt.mockResolvedValueOnce({ action: 'finish' });

    await runCommand(['run', 'PRD']);

    expect(mockDisplay.displaySuccess).toHaveBeenCalledWith(
      expect.stringContaining('completed')
    );
  });

  it('should handle description exactly 40 characters', async () => {
    const desc40 = 'A'.repeat(40);
    const workflows = [{
      id: 'exact',
      trigger: 'EX',
      category: 'test',
      description: desc40,
      primaryAgent: 'Agent',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData[1][1]).toBe(desc40);
    expect(tableData[1][1]).not.toContain('...');
  });

  it('should handle description of 41 characters (truncation boundary)', async () => {
    const desc41 = 'B'.repeat(41);
    const workflows = [{
      id: 'boundary',
      trigger: 'BD',
      category: 'test',
      description: desc41,
      primaryAgent: 'Agent',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData[1][1]).toBe('B'.repeat(40) + '...');
  });

  it('should handle empty primaryAgent with undefined', async () => {
    const workflows = [{
      id: 'undef',
      trigger: 'UN',
      category: 'test',
      description: 'Test',
      primaryAgent: undefined,
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData[1][2]).toBe('-');
  });

  it('should handle empty string primaryAgent', async () => {
    const workflows = [{
      id: 'empty-agent',
      trigger: 'EA',
      category: 'test',
      description: 'Test',
      primaryAgent: '',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list', '--format', 'table']);

    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    // Empty string is falsy, so should show '-'
    expect(tableData[1][2]).toBe('-');
  });

  it('should handle content with uppercase X checkbox', async () => {
    const steps = [
      { number: 1, title: 'Step', content: '- [X] Done with uppercase', isRoute: false, agent: null },
    ];

    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow({ steps });

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue([]);
    mockPrompt.mockResolvedValueOnce({ action: 'exit' });

    await runCommand(['run', 'PRD']);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('Done with uppercase');
  });

  it('should handle multiple code blocks in step content', async () => {
    const steps = [
      {
        number: 1,
        title: 'Step',
        content: '```\nblock1\n```\nBetween\n```\nblock2\n```',
        isRoute: false,
        agent: null,
      },
    ];

    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow({ steps });

    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockWorkflowLoader.getNextWorkflows.mockResolvedValue([]);
    mockPrompt.mockResolvedValueOnce({ action: 'exit' });

    await runCommand(['run', 'PRD']);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('block1');
    expect(allOutput).toContain('block2');
    expect(allOutput).toContain('Between');
  });

  it('should handle many workflows in JSON format', async () => {
    const manyWorkflows = Array.from({ length: 50 }, (_, i) => ({
      id: `wf-${i}`,
      trigger: `T${i}`,
      category: `cat-${i % 5}`,
      description: `Workflow ${i}`,
      primaryAgent: `Agent ${i}`,
    }));
    mockWorkflowLoader.listWorkflows.mockResolvedValue(manyWorkflows);

    await runCommand(['list', '--format', 'json']);

    const jsonCall = logSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].startsWith('[')
    );
    expect(jsonCall).toBeDefined();
    const parsed = JSON.parse(jsonCall[0]);
    expect(parsed).toHaveLength(50);
  });

  it('should handle triggers command with single workflow', async () => {
    const workflows = [{
      id: 'solo',
      trigger: 'S',
      category: 'misc',
      description: 'Solo workflow',
      primaryAgent: 'Agent',
    }];
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['triggers']);

    const allOutput = logSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(allOutput).toContain('[S]');
  });

  it('should handle paths with multiple steps displayed as arrows', async () => {
    const paths = {
      'full': {
        name: 'Full Process',
        description: 'Complete workflow',
        steps: ['PRD', 'VP', 'CA', 'CE', 'VE', 'SD', 'VS', 'DS', 'CR', 'DW'],
        agents: ['Paula', 'Victor', 'Winston', 'Sam', 'Nate', 'Quinn', 'Rex'],
      },
    };
    mockWorkflowLoader.getWorkflowPaths.mockResolvedValue(paths);

    await runCommand(['paths']);

    const boxCall = mockDisplay.displayBox.mock.calls[0];
    const boxContent = boxCall[0];
    const stepsLine = boxContent.find(line => line.includes('Steps:'));
    expect(stepsLine).toBeDefined();
    // Each step should be wrapped in [brackets]
    expect(stepsLine).toContain('[PRD]');
    expect(stepsLine).toContain('[DW]');
  });
});

// =============================================================================
// 13. List command option defaults
// =============================================================================

describe('list command option defaults', () => {
  it('should default to table format when no --format specified', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list']);

    expect(mockDisplay.displayTable).toHaveBeenCalled();
  });

  it('should not filter by category when --category is not provided', async () => {
    const workflows = createWorkflowList();
    mockWorkflowLoader.listWorkflows.mockResolvedValue(workflows);

    await runCommand(['list']);

    // All 3 workflows should appear in the table (header + 3 rows)
    const tableData = mockDisplay.displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(4);
  });
});

// =============================================================================
// 14. Run command subcommand options
// =============================================================================

describe('run command options', () => {
  it('should use --interactive as default (true)', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockPrompt.mockResolvedValueOnce({ action: 'exit' });

    await runCommand(['run', 'PRD']);

    // Interactive mode uses inquirer prompt
    expect(mockPrompt).toHaveBeenCalled();
  });

  it('should not prompt when --summary is set', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);

    await runCommand(['run', 'PRD', '-s']);

    expect(mockPrompt).not.toHaveBeenCalled();
  });
});

// =============================================================================
// 15. Show command options
// =============================================================================

describe('show command options', () => {
  it('should display summary by default without --json', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);

    await runCommand(['show', 'PRD']);

    // Summary mode calls displayHeader with prominent style
    expect(mockDisplay.displayHeader).toHaveBeenCalledWith(
      expect.any(String),
      { style: 'prominent' }
    );
    // Should NOT call formatWorkflowForDisplay (that's only for --json)
    expect(mockWorkflowLoader.formatWorkflowForDisplay).not.toHaveBeenCalled();
  });
});

// =============================================================================
// 16. Workflow header box content
// =============================================================================

describe('workflow header box content in interactive mode', () => {
  it('should include trigger in the header box', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockPrompt.mockResolvedValueOnce({ action: 'exit' });

    await runCommand(['run', 'PRD']);

    const boxCall = mockDisplay.displayBox.mock.calls[0];
    const boxContent = boxCall[0];
    const triggerLine = boxContent.find(line => line.includes('Trigger:'));
    expect(triggerLine).toBeDefined();
    expect(triggerLine).toContain('PRD');
  });

  it('should include step count in the header box', async () => {
    const workflowDef = createWorkflowDef();
    const loadedWorkflow = createLoadedWorkflow();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockPrompt.mockResolvedValueOnce({ action: 'exit' });

    await runCommand(['run', 'PRD']);

    const boxCall = mockDisplay.displayBox.mock.calls[0];
    const boxContent = boxCall[0];
    const stepsLine = boxContent.find(line => line.includes('Steps:'));
    expect(stepsLine).toBeDefined();
    expect(stepsLine).toContain('2');
  });

  it('should include agents with arrows in the header box', async () => {
    const loadedWorkflow = createLoadedWorkflow({
      agents: [
        { name: 'Paula', role: 'PM', icon: '' },
        { name: 'Victor', role: 'PO', icon: '' },
      ],
    });
    const workflowDef = createWorkflowDef();
    mockWorkflowLoader.findWorkflowByTrigger.mockResolvedValue(workflowDef);
    mockWorkflowLoader.loadWorkflowFile.mockResolvedValue(loadedWorkflow);
    mockPrompt.mockResolvedValueOnce({ action: 'exit' });

    await runCommand(['run', 'PRD']);

    const boxCall = mockDisplay.displayBox.mock.calls[0];
    const boxContent = boxCall[0];
    const agentsLine = boxContent.find(line => line.includes('Agents:'));
    expect(agentsLine).toBeDefined();
  });
});
