/**
 * @fileoverview Unit tests for party command module
 *
 * Tests cover the party command (tools/cli/commands/party.js) which provides
 * multi-agent collaboration session management. Since internal functions
 * (loadPartyConfig, listParties, describeParty, startParty) are not exported,
 * all tests exercise them indirectly through the Commander subcommands:
 *   - party list       (also the default action)
 *   - party describe <name>
 *   - party start <name>
 *
 * Dependencies mocked:
 *   - fs.promises.readFile  (party-mode.yaml loading)
 *   - js-yaml.load          (YAML parsing)
 *   - ../lib/display         (all display helpers)
 *   - process.exit / process.cwd / console.log
 */

const path = require('path');

// ---------------------------------------------------------------------------
// Mock fs.promises before requiring the module under test
// ---------------------------------------------------------------------------
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      readFile: jest.fn(),
    },
  };
});

jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

jest.mock('../../../tools/cli/lib/display', () => ({
  displayError: jest.fn(),
  displayInfo: jest.fn(),
  displayHeader: jest.fn(),
  displayList: jest.fn(),
  displayBox: jest.fn(),
  displayTable: jest.fn(() => 'mocked-table-output'),
}));

const fs = require('fs').promises;
const yaml = require('js-yaml');
const {
  displayError,
  displayInfo,
  displayHeader,
  displayBox,
  displayTable,
} = require('../../../tools/cli/lib/display');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_CWD = '/mock/project';

/**
 * Build a party config fixture with two parties: architecture-review and story-refinement
 */
function buildPartyConfig(overrides = {}) {
  return {
    parties: {
      'architecture-review': {
        name: 'Architecture Review',
        trigger: 'AR',
        icon: '\u{1F3D7}',
        description: 'Review architecture decisions with cross-functional input',
        output_template: 'architecture-review.md',
        next_workflow: 'create-architecture',
        when_to_use: [
          'Complex architecture decisions',
          'Before major refactors',
        ],
        agents: [
          {
            name: 'Winston',
            agent: 'architect',
            role: 'lead',
            contributes: ['Design review', 'Pattern assessment'],
          },
          {
            name: 'Sierra',
            agent: 'security',
            role: 'participant',
            contributes: ['Security review'],
          },
          {
            name: 'Nate',
            agent: 'developer',
            role: 'participant',
            contributes: ['Feasibility check'],
          },
        ],
        ...(overrides['architecture-review'] || {}),
      },
      'story-refinement': {
        name: 'Story Refinement',
        trigger: 'SR',
        icon: '\u{1F4DD}',
        description: 'Refine stories for sprint planning',
        output_template: 'refined-stories.md',
        next_workflow: null,
        when_to_use: ['Before sprint planning'],
        agents: [
          {
            name: 'Victor',
            agent: 'po',
            role: 'lead',
            contributes: ['Story validation'],
          },
          {
            name: 'Nate',
            agent: 'developer',
            role: 'participant',
            contributes: ['Estimation'],
          },
          {
            name: 'Quinn',
            agent: 'qa',
            role: 'participant',
            contributes: ['Test criteria'],
          },
        ],
        ...(overrides['story-refinement'] || {}),
      },
      ...(overrides.extra || {}),
    },
  };
}

/**
 * Expected config file paths that loadPartyConfig tries in order
 */
function getExpectedPaths(cwd = MOCK_CWD) {
  return [
    path.join(cwd, '.n8n-bmad', 'src', 'core', 'teams', 'party-mode.yaml'),
    path.join(cwd, 'src', 'core', 'teams', 'party-mode.yaml'),
    // The third path is relative to __dirname of party.js
  ];
}

/**
 * Configure fs.readFile mock so that the second config path succeeds
 * and yaml.load returns the provided config.
 */
function setupConfigLoad(config = buildPartyConfig()) {
  const paths = getExpectedPaths();

  fs.readFile.mockImplementation(async (filePath) => {
    // First path: fail with ENOENT
    if (filePath === paths[0]) {
      const err = new Error('ENOENT');
      err.code = 'ENOENT';
      throw err;
    }
    // Second path: succeed
    if (filePath === paths[1]) {
      return 'yaml-content';
    }
    // Any path containing party-mode.yaml: succeed (for the package fallback)
    if (filePath.includes('party-mode.yaml')) {
      return 'yaml-content';
    }
    const err = new Error('ENOENT');
    err.code = 'ENOENT';
    throw err;
  });

  yaml.load.mockReturnValue(config);
}

/**
 * Configure all paths to fail with ENOENT
 */
function setupConfigNotFound() {
  fs.readFile.mockImplementation(async () => {
    const err = new Error('ENOENT');
    err.code = 'ENOENT';
    throw err;
  });
}

// ---------------------------------------------------------------------------
// Import the command (must come after mocks are set up)
// ---------------------------------------------------------------------------
let partyCommand;

// We need to require inside beforeAll so mocks are in place,
// but jest.mock calls are hoisted, so direct require works.
// However, since the module calls createPartyCommand() at module scope,
// the command is created once on require.
beforeAll(() => {
  partyCommand = require('../../../tools/cli/commands/party');
});

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('party command', () => {
  let consoleSpy;
  let processExitSpy;
  let processCwdSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    processCwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(MOCK_CWD);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
    processCwdSpy.mockRestore();
  });

  // =========================================================================
  // Command Structure
  // =========================================================================
  describe('command structure', () => {
    it('should be a Commander Command instance', () => {
      expect(partyCommand).toBeDefined();
      expect(partyCommand.name()).toBe('party');
    });

    it('should have a description', () => {
      expect(partyCommand.description()).toBe('Multi-agent collaboration sessions');
    });

    it('should have a "list" subcommand', () => {
      const listCmd = partyCommand.commands.find(c => c.name() === 'list');
      expect(listCmd).toBeDefined();
      expect(listCmd.description()).toBe('List all available party modes');
    });

    it('should have a "describe" subcommand', () => {
      const describeCmd = partyCommand.commands.find(c => c.name() === 'describe');
      expect(describeCmd).toBeDefined();
      expect(describeCmd.description()).toBe('Describe a specific party mode');
    });

    it('should have a "start" subcommand', () => {
      const startCmd = partyCommand.commands.find(c => c.name() === 'start');
      expect(startCmd).toBeDefined();
      expect(startCmd.description()).toBe('Start a party session');
    });

    it('should have exactly three subcommands', () => {
      expect(partyCommand.commands).toHaveLength(3);
    });

    it('should have "describe" subcommand requiring a <name> argument', () => {
      const describeCmd = partyCommand.commands.find(c => c.name() === 'describe');
      const args = describeCmd.registeredArguments || describeCmd._args;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
    });

    it('should have "start" subcommand requiring a <name> argument', () => {
      const startCmd = partyCommand.commands.find(c => c.name() === 'start');
      const args = startCmd.registeredArguments || startCmd._args;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
    });
  });

  // =========================================================================
  // loadPartyConfig (tested indirectly)
  // =========================================================================
  describe('loadPartyConfig (via list subcommand)', () => {
    it('should try the .n8n-bmad path first', async () => {
      // Make the first path succeed
      fs.readFile.mockImplementation(async (filePath) => {
        if (filePath.includes('.n8n-bmad')) {
          return 'yaml-content';
        }
        const err = new Error('ENOENT');
        err.code = 'ENOENT';
        throw err;
      });
      yaml.load.mockReturnValue(buildPartyConfig());

      await partyCommand.parseAsync(['node', 'test', 'list']);

      // Should have called readFile with .n8n-bmad path first
      expect(fs.readFile.mock.calls[0][0]).toContain('.n8n-bmad');
    });

    it('should fall back to src/core/teams path when first path fails', async () => {
      setupConfigLoad();

      await partyCommand.parseAsync(['node', 'test', 'list']);

      // The first call fails, second succeeds
      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(fs.readFile.mock.calls[1][0]).toContain(
        path.join('src', 'core', 'teams', 'party-mode.yaml')
      );
    });

    it('should fall back to package path when first two paths fail', async () => {
      const firstTwoPaths = getExpectedPaths();

      fs.readFile.mockImplementation(async (filePath) => {
        if (filePath === firstTwoPaths[0] || filePath === firstTwoPaths[1]) {
          const err = new Error('ENOENT');
          err.code = 'ENOENT';
          throw err;
        }
        // Third path (package-relative) succeeds
        return 'yaml-content';
      });
      yaml.load.mockReturnValue(buildPartyConfig());

      await partyCommand.parseAsync(['node', 'test', 'list']);

      // Should have tried 3 paths
      expect(fs.readFile).toHaveBeenCalledTimes(3);
    });

    it('should throw when all config paths fail', async () => {
      setupConfigNotFound();

      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Party mode configuration not found')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should re-throw non-ENOENT errors immediately', async () => {
      fs.readFile.mockImplementation(async () => {
        const err = new Error('Permission denied');
        err.code = 'EACCES';
        throw err;
      });

      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should read files with utf8 encoding', async () => {
      setupConfigLoad();

      await partyCommand.parseAsync(['node', 'test', 'list']);

      for (const call of fs.readFile.mock.calls) {
        expect(call[1]).toBe('utf8');
      }
    });

    it('should parse YAML content with js-yaml', async () => {
      setupConfigLoad();

      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(yaml.load).toHaveBeenCalledWith('yaml-content');
    });

    it('should use process.cwd() for resolving config paths', async () => {
      processCwdSpy.mockReturnValue('/custom/project');
      setupConfigLoad();

      // Override to match new cwd
      fs.readFile.mockImplementation(async (filePath) => {
        if (filePath.includes('/custom/project')) {
          return 'yaml-content';
        }
        if (filePath.includes('party-mode.yaml')) {
          return 'yaml-content';
        }
        const err = new Error('ENOENT');
        err.code = 'ENOENT';
        throw err;
      });
      yaml.load.mockReturnValue(buildPartyConfig());

      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(fs.readFile.mock.calls[0][0]).toContain('/custom/project');
    });
  });

  // =========================================================================
  // listParties (via "party list" and default action)
  // =========================================================================
  describe('listParties', () => {
    beforeEach(() => {
      setupConfigLoad();
    });

    it('should display a prominent header', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(displayHeader).toHaveBeenCalledWith(
        'Available Party Modes',
        { style: 'prominent' }
      );
    });

    it('should call displayTable with correct header row', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      expect(tableArg[0]).toEqual(['Trigger', 'Name', 'Agents', 'Description']);
    });

    it('should include all parties in the table data', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      // Header + 2 party rows
      expect(tableArg).toHaveLength(3);
    });

    it('should show party trigger in first column', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      const triggers = tableArg.slice(1).map(row => row[0]);
      expect(triggers).toContain('AR');
      expect(triggers).toContain('SR');
    });

    it('should show party name with icon in second column', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      const names = tableArg.slice(1).map(row => row[1]);
      expect(names).toContain('\u{1F3D7} Architecture Review');
      expect(names).toContain('\u{1F4DD} Story Refinement');
    });

    it('should show agent names joined by comma in third column', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      const archRow = tableArg.find(row => row[0] === 'AR');
      expect(archRow[2]).toBe('Winston, Sierra, Nate');
    });

    it('should truncate description to 50 characters plus ellipsis', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      const archRow = tableArg.find(row => row[0] === 'AR');
      expect(archRow[3]).toBe(
        'Review architecture decisions with cross-functiona...'
      );
    });

    it('should truncate short descriptions and append ellipsis', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      const storyRow = tableArg.find(row => row[0] === 'SR');
      // "Refine stories for sprint planning" is 36 chars, substring(0,50) returns the whole thing + '...'
      expect(storyRow[3]).toBe('Refine stories for sprint planning...');
    });

    it('should log the displayTable result', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(consoleSpy).toHaveBeenCalledWith('mocked-table-output');
    });

    it('should display usage info after the table', async () => {
      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(displayInfo).toHaveBeenCalledWith(
        'Use "n8n-bmad party describe <name>" for details'
      );
      expect(displayInfo).toHaveBeenCalledWith(
        'Use "n8n-bmad party start <name>" to begin a party session'
      );
    });

    it('should be the default action when no subcommand is specified', async () => {
      await partyCommand.parseAsync(['node', 'test']);

      expect(displayHeader).toHaveBeenCalledWith(
        'Available Party Modes',
        { style: 'prominent' }
      );
    });

    it('should handle a config with a single party', async () => {
      const singleConfig = {
        parties: {
          'solo-party': {
            name: 'Solo Party',
            trigger: 'SP',
            icon: '\u{1F389}',
            description: 'A solo party',
            agents: [
              { name: 'Alice', agent: 'dev', role: 'lead', contributes: ['Code'] },
            ],
          },
        },
      };
      yaml.load.mockReturnValue(singleConfig);

      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      expect(tableArg).toHaveLength(2); // header + 1 row
    });

    it('should handle config with empty parties object', async () => {
      yaml.load.mockReturnValue({ parties: {} });

      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      expect(tableArg).toHaveLength(1); // header only
    });
  });

  // =========================================================================
  // describeParty (via "party describe <name>")
  // =========================================================================
  describe('describeParty', () => {
    beforeEach(() => {
      setupConfigLoad();
    });

    it('should display party name with icon as header', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(displayHeader).toHaveBeenCalledWith(
        '\u{1F3D7} Architecture Review',
        { style: 'prominent' }
      );
    });

    it('should log the party description', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Review architecture decisions with cross-functional input'
      );
    });

    it('should display the trigger', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith('Trigger:', 'AR');
    });

    it('should display the next_workflow when present', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith('Next Workflow:', 'create-architecture');
    });

    it('should display "None" for next_workflow when null', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'story-refinement']);

      expect(consoleSpy).toHaveBeenCalledWith('Next Workflow:', 'None');
    });

    it('should display "When to Use:" section', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith('When to Use:');
    });

    it('should list all when_to_use items', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith('  - Complex architecture decisions');
      expect(consoleSpy).toHaveBeenCalledWith('  - Before major refactors');
    });

    it('should display "Participants:" section', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith('Participants:');
    });

    it('should show lead agent with crown icon', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith(
        '  \u{1F451} Winston (architect) - lead'
      );
    });

    it('should show participant agents with person icon', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith(
        '  \u{1F464} Sierra (security) - participant'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  \u{1F464} Nate (developer) - participant'
      );
    });

    it('should display "Contributes:" header for each agent', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      const contributesCalls = consoleSpy.mock.calls.filter(
        call => call[0] === '     Contributes:'
      );
      expect(contributesCalls).toHaveLength(3); // 3 agents
    });

    it('should display contribution items for lead agent', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Design review'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Pattern assessment'));
    });

    it('should display contribution items for participant agents', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Security review'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Feasibility check'));
    });

    it('should use bullet character for contribution items', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      const bulletCalls = consoleSpy.mock.calls.filter(
        call => typeof call[0] === 'string' && call[0].includes('\u{2022}')
      );
      // Winston has 2, Sierra has 1, Nate has 1 = 4 total
      expect(bulletCalls).toHaveLength(4);
    });

    it('should handle party not found error', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'nonexistent']);

      expect(displayError).toHaveBeenCalledWith('Party "nonexistent" not found');
    });

    it('should show available parties when party not found', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'nonexistent']);

      expect(displayInfo).toHaveBeenCalledWith(
        expect.stringContaining('architecture-review')
      );
      expect(displayInfo).toHaveBeenCalledWith(
        expect.stringContaining('story-refinement')
      );
    });

    it('should not call process.exit when party not found (graceful return)', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'nonexistent']);

      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should describe the story-refinement party correctly', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'story-refinement']);

      expect(displayHeader).toHaveBeenCalledWith(
        '\u{1F4DD} Story Refinement',
        { style: 'prominent' }
      );
      expect(consoleSpy).toHaveBeenCalledWith('Refine stories for sprint planning');
      expect(consoleSpy).toHaveBeenCalledWith('Trigger:', 'SR');
    });

    it('should show lead agent for story-refinement', async () => {
      await partyCommand.parseAsync(['node', 'test', 'describe', 'story-refinement']);

      expect(consoleSpy).toHaveBeenCalledWith(
        '  \u{1F451} Victor (po) - lead'
      );
    });
  });

  // =========================================================================
  // startParty (via "party start <name>")
  // =========================================================================
  describe('startParty', () => {
    beforeEach(() => {
      setupConfigLoad();
    });

    it('should display a box with party name and lead info', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      expect(displayBox).toHaveBeenCalledTimes(1);
      const boxContent = displayBox.mock.calls[0][0];
      expect(boxContent).toEqual(expect.arrayContaining([
        expect.stringContaining('Architecture Review'),
        expect.stringContaining('Lead: Winston'),
      ]));
    });

    it('should pass box options with title and round style', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const boxOptions = displayBox.mock.calls[0][1];
      expect(boxOptions).toEqual({ title: 'Party Mode', style: 'round' });
    });

    it('should include participant names in the box', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const boxContent = displayBox.mock.calls[0][0];
      const participantLine = boxContent.find(line =>
        typeof line === 'string' && line.startsWith('Participants:')
      );
      expect(participantLine).toContain('Sierra');
      expect(participantLine).toContain('Nate');
    });

    it('should include copy instruction in box', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const boxContent = displayBox.mock.calls[0][0];
      expect(boxContent).toEqual(expect.arrayContaining([
        'Copy the prompt below to your AI assistant:',
      ]));
    });

    it('should output COPY FROM HERE delimiter', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith('------- COPY FROM HERE -------');
    });

    it('should output COPY TO HERE delimiter', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      expect(consoleSpy).toHaveBeenCalledWith('------- COPY TO HERE -------');
    });

    it('should generate prompt with party name in header', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('# Party Mode:')
      );
      expect(promptCall).toBeDefined();
      expect(promptCall[0]).toContain('Architecture Review');
    });

    it('should include party icon in generated prompt header', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('# Party Mode:')
      );
      expect(promptCall[0]).toContain('\u{1F3D7}');
    });

    it('should include Session Purpose section in prompt', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('## Session Purpose')
      );
      expect(promptCall).toBeDefined();
      expect(promptCall[0]).toContain('Review architecture decisions');
    });

    it('should include lead agent in Participants section', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('### Lead:')
      );
      expect(promptCall).toBeDefined();
      expect(promptCall[0]).toContain('Winston (architect)');
    });

    it('should include lead agent contributions in prompt', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('### Lead:')
      );
      expect(promptCall[0]).toContain('- Design review');
      expect(promptCall[0]).toContain('- Pattern assessment');
    });

    it('should include Participants subsection in prompt', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('### Participants')
      );
      expect(promptCall).toBeDefined();
    });

    it('should include all participant agents in prompt', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('### Participants')
      );
      expect(promptCall[0]).toContain('Sierra (security)');
      expect(promptCall[0]).toContain('Nate (developer)');
    });

    it('should include participant contributions in prompt', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('### Participants')
      );
      expect(promptCall[0]).toContain('- Security review');
      expect(promptCall[0]).toContain('- Feasibility check');
    });

    it('should include Protocol section with lead agent name in steps', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('## Protocol')
      );
      expect(promptCall).toBeDefined();
      expect(promptCall[0]).toContain('**Winston**');
    });

    it('should include five protocol steps', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('## Protocol')
      );
      expect(promptCall[0]).toContain('1.');
      expect(promptCall[0]).toContain('2.');
      expect(promptCall[0]).toContain('3.');
      expect(promptCall[0]).toContain('4.');
      expect(promptCall[0]).toContain('5.');
    });

    it('should include Output section with output_template', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('## Output')
      );
      expect(promptCall).toBeDefined();
      expect(promptCall[0]).toContain('architecture-review.md');
    });

    it('should include next_workflow in Output section when present', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('## Output')
      );
      expect(promptCall[0]).toContain('Next workflow: create-architecture');
    });

    it('should include closing line with lead agent name', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('Ready to begin')
      );
      expect(promptCall).toBeDefined();
      expect(promptCall[0]).toContain('Winston');
      expect(promptCall[0]).toContain('Architecture Review');
    });

    it('should display trigger info after the prompt', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      expect(displayInfo).toHaveBeenCalledWith('Trigger: AR');
    });

    it('should display after-party workflow info when next_workflow exists', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      expect(displayInfo).toHaveBeenCalledWith(
        'After party, run: create-architecture'
      );
    });

    it('should not display after-party workflow info when next_workflow is null', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'story-refinement']);

      const afterPartyCall = displayInfo.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('After party, run:')
      );
      expect(afterPartyCall).toBeUndefined();
    });

    it('should handle party not found error', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'nonexistent']);

      expect(displayError).toHaveBeenCalledWith('Party "nonexistent" not found');
    });

    it('should show available parties when party not found', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'nonexistent']);

      expect(displayInfo).toHaveBeenCalledWith(
        expect.stringContaining('architecture-review')
      );
    });

    it('should not call process.exit when party not found (graceful return)', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'nonexistent']);

      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should start story-refinement party with Victor as lead', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'story-refinement']);

      const boxContent = displayBox.mock.calls[0][0];
      expect(boxContent).toEqual(expect.arrayContaining([
        expect.stringContaining('Lead: Victor'),
      ]));
    });

    it('should show "Session summary" as output when no output_template', async () => {
      const config = buildPartyConfig();
      config.parties['architecture-review'].output_template = undefined;
      yaml.load.mockReturnValue(config);

      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('## Output')
      );
      expect(promptCall[0]).toContain('Session summary');
    });

    it('should not include "Next workflow" line when next_workflow is null', async () => {
      await partyCommand.parseAsync(['node', 'test', 'start', 'story-refinement']);

      const promptCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('## Output')
      );
      expect(promptCall[0]).not.toContain('Next workflow:');
    });
  });

  // =========================================================================
  // Error handling and process.exit
  // =========================================================================
  describe('error handling', () => {
    it('should call displayError and process.exit(1) when list fails with config error', async () => {
      setupConfigNotFound();

      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to list parties')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should call displayError and process.exit(1) when describe fails with config error', async () => {
      setupConfigNotFound();

      await partyCommand.parseAsync(['node', 'test', 'describe', 'architecture-review']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to describe party')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should call displayError and process.exit(1) when start fails with config error', async () => {
      setupConfigNotFound();

      await partyCommand.parseAsync(['node', 'test', 'start', 'architecture-review']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to start party')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should call displayError and process.exit(1) when default action fails', async () => {
      setupConfigNotFound();

      await partyCommand.parseAsync(['node', 'test']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load party config')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should include the original error message in list failure', async () => {
      fs.readFile.mockImplementation(async () => {
        throw new Error('Disk read error');
      });

      await partyCommand.parseAsync(['node', 'test', 'list']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Disk read error')
      );
    });

    it('should include the original error message in describe failure', async () => {
      fs.readFile.mockImplementation(async () => {
        throw new Error('Network failure');
      });

      await partyCommand.parseAsync(['node', 'test', 'describe', 'test-party']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Network failure')
      );
    });

    it('should include the original error message in start failure', async () => {
      fs.readFile.mockImplementation(async () => {
        throw new Error('Corrupt file');
      });

      await partyCommand.parseAsync(['node', 'test', 'start', 'test-party']);

      expect(displayError).toHaveBeenCalledWith(
        expect.stringContaining('Corrupt file')
      );
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================
  describe('edge cases', () => {
    it('should handle party with a single agent who is the lead', async () => {
      const config = {
        parties: {
          'solo': {
            name: 'Solo Session',
            trigger: 'SO',
            icon: '\u{1F9D1}',
            description: 'Solo session',
            output_template: 'solo.md',
            next_workflow: null,
            when_to_use: ['When alone'],
            agents: [
              {
                name: 'Winston',
                agent: 'architect',
                role: 'lead',
                contributes: ['Everything'],
              },
            ],
          },
        },
      };
      setupConfigLoad(config);

      await partyCommand.parseAsync(['node', 'test', 'start', 'solo']);

      // Should work without errors - no participants listed
      const boxContent = displayBox.mock.calls[0][0];
      expect(boxContent).toEqual(expect.arrayContaining([
        expect.stringContaining('Lead: Winston'),
      ]));
      // Participants line should be empty
      const participantLine = boxContent.find(line =>
        typeof line === 'string' && line.startsWith('Participants:')
      );
      expect(participantLine).toBe('Participants: ');
    });

    it('should handle party with many agents', async () => {
      const agents = [];
      for (let i = 0; i < 10; i++) {
        agents.push({
          name: `Agent${i}`,
          agent: `agent-${i}`,
          role: i === 0 ? 'lead' : 'participant',
          contributes: [`Task ${i}`],
        });
      }
      const config = {
        parties: {
          'big-party': {
            name: 'Big Party',
            trigger: 'BP',
            icon: '\u{1F389}',
            description: 'Large collaboration session',
            agents,
            when_to_use: ['Large decisions'],
          },
        },
      };
      setupConfigLoad(config);

      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      const bigPartyRow = tableArg.find(row => row[0] === 'BP');
      expect(bigPartyRow[2]).toContain('Agent0');
      expect(bigPartyRow[2]).toContain('Agent9');
    });

    it('should handle description that is exactly 50 characters', async () => {
      const config = {
        parties: {
          'exact': {
            name: 'Exact',
            trigger: 'EX',
            icon: '\u{1F4CF}',
            description: '12345678901234567890123456789012345678901234567890', // exactly 50
            agents: [{ name: 'A', agent: 'a', role: 'lead', contributes: ['X'] }],
            when_to_use: ['Testing'],
          },
        },
      };
      setupConfigLoad(config);

      await partyCommand.parseAsync(['node', 'test', 'list']);

      const tableArg = displayTable.mock.calls[0][0];
      const row = tableArg.find(r => r[0] === 'EX');
      // substring(0, 50) of 50-char string returns all 50 chars + '...'
      expect(row[3]).toBe('12345678901234567890123456789012345678901234567890...');
    });

    it('should handle empty when_to_use array in describe', async () => {
      const config = {
        parties: {
          'empty-use': {
            name: 'Empty Use',
            trigger: 'EU',
            icon: '\u{2753}',
            description: 'No use cases',
            agents: [{ name: 'A', agent: 'a', role: 'lead', contributes: ['X'] }],
            when_to_use: [],
          },
        },
      };
      setupConfigLoad(config);

      await partyCommand.parseAsync(['node', 'test', 'describe', 'empty-use']);

      expect(consoleSpy).toHaveBeenCalledWith('When to Use:');
      // No when_to_use items logged
      const whenCalls = consoleSpy.mock.calls.filter(
        call => typeof call[0] === 'string' && call[0].startsWith('  - ')
      );
      // Only contribution items from agents, not when_to_use items
      expect(whenCalls.every(call => !call[0].includes('No use cases'))).toBe(true);
    });

    it('should handle party name with special characters in describe', async () => {
      setupConfigLoad();

      await partyCommand.parseAsync(['node', 'test', 'describe', 'non-existent-party!']);

      expect(displayError).toHaveBeenCalledWith('Party "non-existent-party!" not found');
    });

    it('should handle party with empty contributes array', async () => {
      const config = {
        parties: {
          'no-contrib': {
            name: 'No Contributions',
            trigger: 'NC',
            icon: '\u{1F6AB}',
            description: 'No contributions listed',
            agents: [
              { name: 'A', agent: 'a', role: 'lead', contributes: [] },
            ],
            when_to_use: ['Testing'],
          },
        },
      };
      setupConfigLoad(config);

      await partyCommand.parseAsync(['node', 'test', 'describe', 'no-contrib']);

      // Should still show the agent line
      expect(consoleSpy).toHaveBeenCalledWith(
        '  \u{1F451} A (a) - lead'
      );
    });

    it('should generate prompt correctly when no participants (all leads)', async () => {
      const config = {
        parties: {
          'all-leads': {
            name: 'All Leads',
            trigger: 'AL',
            icon: '\u{1F451}',
            description: 'All leads party',
            agents: [
              { name: 'Boss', agent: 'boss', role: 'lead', contributes: ['Everything'] },
            ],
            when_to_use: ['Edge cases'],
          },
        },
      };
      setupConfigLoad(config);

      await partyCommand.parseAsync(['node', 'test', 'start', 'all-leads']);

      // No participants means the Participants section should be nearly empty
      expect(displayBox).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Module exports
  // =========================================================================
  describe('module exports', () => {
    it('should export a Command object', () => {
      expect(partyCommand.constructor.name).toBe('Command');
    });

    it('should export the result of createPartyCommand()', () => {
      expect(partyCommand.name()).toBe('party');
    });
  });
});
