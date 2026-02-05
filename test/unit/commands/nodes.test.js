/**
 * @fileoverview Unit tests for nodes command module
 *
 * Tests cover all functions from tools/cli/commands/nodes.js:
 * - formatNodeTable (with/without category, description truncation)
 * - createDiscoverCommand (force, json, warning, error handling)
 * - createListCommand (type filter, limit, json, stale cache, missing cache)
 * - createSearchCommand (query, type filter, json, empty results)
 * - createStatusCommand (all fields, json, stale warning, no cache)
 * - createNodesCommand (default action, subcommand wiring)
 */

const { Command } = require('commander');

// ---------------------------------------------------------------------------
// Mock setup (must precede require of module under test)
// ---------------------------------------------------------------------------

// Pass-through chalk mock that supports chaining
const createChalkProxy = () => {
  const handler = {
    get(_target, prop) {
      if (typeof prop === 'symbol') return undefined;
      const fn = (str) => String(str);
      return new Proxy(fn, handler);
    },
    apply(_target, _thisArg, args) {
      return String(args[0]);
    },
  };
  return new Proxy((str) => String(str), handler);
};

jest.mock('chalk', () => createChalkProxy());

// Mock ora
const mockSpinner = {
  start: jest.fn(function () { return mockSpinner; }),
  succeed: jest.fn(function () { return mockSpinner; }),
  fail: jest.fn(function () { return mockSpinner; }),
  warn: jest.fn(function () { return mockSpinner; }),
  stop: jest.fn(function () { return mockSpinner; }),
};

jest.mock('ora', () => jest.fn(() => mockSpinner));

// Mock display functions
jest.mock('../../../tools/cli/lib/display', () => ({
  displaySuccess: jest.fn(),
  displayError: jest.fn(),
  displayWarning: jest.fn(),
  displayInfo: jest.fn(),
  displayHeader: jest.fn(),
  displayTable: jest.fn(() => 'mock-table-output'),
  displayBox: jest.fn(),
  displayKeyValue: jest.fn(),
}));

// Mock node-discovery
jest.mock('../../../tools/cli/lib/node-discovery', () => ({
  discoverInstalledNodes: jest.fn(),
  getCachedNodes: jest.fn(),
  searchInstalledNodes: jest.fn(),
  getCustomNodes: jest.fn(),
  getCacheStatus: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Require modules after mocks are configured
// ---------------------------------------------------------------------------

const {
  displaySuccess,
  displayError,
  displayWarning,
  displayInfo,
  displayHeader,
  displayTable,
  displayBox,
  displayKeyValue,
} = require('../../../tools/cli/lib/display');

const {
  discoverInstalledNodes,
  getCachedNodes,
  searchInstalledNodes,
  getCustomNodes,
  getCacheStatus,
} = require('../../../tools/cli/lib/node-discovery');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let logSpy;
let errorSpy;
let exitSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  exitSpy.mockRestore();
});

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
 * Get a fresh nodes command module to avoid Commander state issues.
 */
function getFreshCommand() {
  const modulePath = require.resolve('../../../tools/cli/commands/nodes');
  delete require.cache[modulePath];
  const cmd = require('../../../tools/cli/commands/nodes');
  resetCommanderState(cmd);
  return cmd;
}

/**
 * Create a program wrapper and parse arguments through the nodes command.
 * This is the reliable way to test Commander actions.
 */
async function parseNodes(args) {
  const cmd = getFreshCommand();
  const program = new Command();
  program.exitOverride(); // Prevent process.exit on commander errors
  program.addCommand(cmd);
  try {
    await program.parseAsync(['node', 'test', 'nodes', ...args]);
  } catch (e) {
    // Commander may throw on exitOverride; we handle this for --help etc.
    if (e.code !== 'commander.helpDisplayed') {
      throw e;
    }
  }
  return cmd;
}

// ---------------------------------------------------------------------------
// 1. formatNodeTable (tested indirectly through commands that call it)
// ---------------------------------------------------------------------------
describe('formatNodeTable', () => {
  describe('without category column', () => {
    it('should format nodes into a table with 3-column headers', async () => {
      const mockResult = {
        stats: { total: 2, core: 1, community: 0, custom: 1 },
        nodes: {
          custom: [
            { type: 'custom.myNode', displayName: 'My Node', description: 'A custom node', category: 'custom' },
          ],
        },
        source: 'http://localhost:5678/api/v1',
        fetchedAt: '2026-01-01T00:00:00.000Z',
      };
      discoverInstalledNodes.mockResolvedValue(mockResult);

      await parseNodes(['discover']);

      // displayTable is called with the formatted node table for custom nodes
      expect(displayTable).toHaveBeenCalled();
      const tableData = displayTable.mock.calls[0][0];

      // First row should be headers (3 columns, no category)
      expect(tableData[0]).toHaveLength(3);
      expect(tableData[0]).toEqual(['Type', 'Display Name', 'Description']);
    });

    it('should include node data rows after header', async () => {
      const mockResult = {
        stats: { total: 1, core: 0, community: 0, custom: 1 },
        nodes: {
          custom: [
            { type: 'custom.test', displayName: 'Test Node', description: 'Test desc', category: 'custom' },
          ],
        },
        source: 'http://localhost:5678/api/v1',
        fetchedAt: '2026-01-01T00:00:00.000Z',
      };
      discoverInstalledNodes.mockResolvedValue(mockResult);

      await parseNodes(['discover']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData).toHaveLength(2); // header + 1 data row
      expect(tableData[1][0]).toContain('custom.test');
      expect(tableData[1][1]).toBe('Test Node');
    });

    it('should truncate descriptions longer than 50 characters', async () => {
      const longDesc = 'A'.repeat(60);
      const mockResult = {
        stats: { total: 1, core: 0, community: 0, custom: 1 },
        nodes: {
          custom: [
            { type: 'custom.long', displayName: 'Long Desc', description: longDesc, category: 'custom' },
          ],
        },
        source: 'http://localhost:5678/api/v1',
        fetchedAt: '2026-01-01T00:00:00.000Z',
      };
      discoverInstalledNodes.mockResolvedValue(mockResult);

      await parseNodes(['discover']);

      const tableData = displayTable.mock.calls[0][0];
      const descCell = tableData[1][2];
      expect(descCell).toContain('...');
    });

    it('should not add ellipsis for descriptions at or under 50 characters', async () => {
      const shortDesc = 'A'.repeat(49);
      const mockResult = {
        stats: { total: 1, core: 0, community: 0, custom: 1 },
        nodes: {
          custom: [
            { type: 'custom.short', displayName: 'Short', description: shortDesc, category: 'custom' },
          ],
        },
        source: 'http://localhost:5678/api/v1',
        fetchedAt: '2026-01-01T00:00:00.000Z',
      };
      discoverInstalledNodes.mockResolvedValue(mockResult);

      await parseNodes(['discover']);

      const tableData = displayTable.mock.calls[0][0];
      const descCell = tableData[1][2];
      expect(descCell).not.toContain('...');
    });

    it('should handle empty description with dash fallback', async () => {
      const mockResult = {
        stats: { total: 1, core: 0, community: 0, custom: 1 },
        nodes: {
          custom: [
            { type: 'custom.empty', displayName: 'Empty', description: '', category: 'custom' },
          ],
        },
        source: 'http://localhost:5678/api/v1',
        fetchedAt: '2026-01-01T00:00:00.000Z',
      };
      discoverInstalledNodes.mockResolvedValue(mockResult);

      await parseNodes(['discover']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData[1][2]).toContain('-');
    });

    it('should handle missing node properties with dashes', async () => {
      const mockResult = {
        stats: { total: 1, core: 0, community: 0, custom: 1 },
        nodes: {
          custom: [
            { category: 'custom' },
          ],
        },
        source: 'http://localhost:5678/api/v1',
        fetchedAt: '2026-01-01T00:00:00.000Z',
      };
      discoverInstalledNodes.mockResolvedValue(mockResult);

      await parseNodes(['discover']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData[1][0]).toContain('-');
      expect(tableData[1][1]).toBe('-');
    });
  });

  describe('with category column', () => {
    it('should format nodes with 4-column headers when showCategory is true', async () => {
      const mockResults = [
        { type: 'n8n-nodes-base.http', displayName: 'HTTP', description: 'HTTP requests', category: 'core' },
      ];
      searchInstalledNodes.mockResolvedValue(mockResults);

      await parseNodes(['search', 'http']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData[0]).toHaveLength(4);
      expect(tableData[0]).toEqual(['Type', 'Display Name', 'Category', 'Description']);
    });

    it('should include category in data rows', async () => {
      const mockResults = [
        { type: 'community.slack', displayName: 'Slack', description: 'Slack integration', category: 'community' },
      ];
      searchInstalledNodes.mockResolvedValue(mockResults);

      await parseNodes(['search', 'slack']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData[1]).toHaveLength(4);
      expect(tableData[1][2]).toContain('community');
    });

    it('should include category text for all category types', async () => {
      const mockResults = [
        { type: 'core.http', displayName: 'HTTP', description: 'HTTP', category: 'core' },
        { type: 'comm.slack', displayName: 'Slack', description: 'Slack', category: 'community' },
        { type: 'custom.my', displayName: 'My', description: 'Mine', category: 'custom' },
      ];
      searchInstalledNodes.mockResolvedValue(mockResults);

      await parseNodes(['search', 'test']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData[1][2]).toContain('core');
      expect(tableData[2][2]).toContain('community');
      expect(tableData[3][2]).toContain('custom');
    });

    it('should handle unknown category gracefully', async () => {
      const mockResults = [
        { type: 'unknown.node', displayName: 'Unknown', description: 'test', category: 'unknown' },
      ];
      searchInstalledNodes.mockResolvedValue(mockResults);

      await parseNodes(['search', 'test']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData[1][2]).toContain('unknown');
    });
  });

  describe('list command with type=all uses showCategory=true', () => {
    it('should show category column when listing all types', async () => {
      const mockCache = {
        nodes: {
          custom: [{ type: 'custom.a', displayName: 'A', description: 'a', category: 'custom' }],
          community: [],
          core: [],
        },
        stats: { core: 0, community: 0, custom: 1 },
      };
      getCachedNodes.mockResolvedValue(mockCache);

      await parseNodes(['list']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData[0]).toHaveLength(4);
    });

    it('should not show category column when listing specific type', async () => {
      const mockCache = {
        nodes: {
          custom: [{ type: 'custom.a', displayName: 'A', description: 'a', category: 'custom' }],
          community: [],
          core: [],
        },
        stats: { core: 0, community: 0, custom: 1 },
      };
      getCachedNodes.mockResolvedValue(mockCache);

      await parseNodes(['list', '--type', 'custom']);

      const tableData = displayTable.mock.calls[0][0];
      expect(tableData[0]).toHaveLength(3);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Discover subcommand
// ---------------------------------------------------------------------------
describe('createDiscoverCommand', () => {
  it('should call discoverInstalledNodes', async () => {
    const mockResult = {
      stats: { total: 10, core: 8, community: 1, custom: 1 },
      nodes: { custom: [], community: [], core: [] },
      source: 'http://localhost:5678/api/v1',
      fetchedAt: '2026-01-01T00:00:00.000Z',
    };
    discoverInstalledNodes.mockResolvedValue(mockResult);

    await parseNodes(['discover']);

    expect(discoverInstalledNodes).toHaveBeenCalledWith({ force: undefined });
  });

  it('should pass force option to discoverInstalledNodes', async () => {
    const mockResult = {
      stats: { total: 5, core: 3, community: 1, custom: 1 },
      nodes: { custom: [], community: [], core: [] },
      source: 'http://localhost:5678/api/v1',
      fetchedAt: '2026-01-01T00:00:00.000Z',
    };
    discoverInstalledNodes.mockResolvedValue(mockResult);

    await parseNodes(['discover', '--force']);

    expect(discoverInstalledNodes).toHaveBeenCalledWith({ force: true });
  });

  it('should show spinner with succeed on success', async () => {
    const mockResult = {
      stats: { total: 5, core: 3, community: 1, custom: 1 },
      nodes: { custom: [], community: [], core: [] },
      source: 'http://localhost:5678/api/v1',
      fetchedAt: '2026-01-01T00:00:00.000Z',
    };
    discoverInstalledNodes.mockResolvedValue(mockResult);

    await parseNodes(['discover']);

    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('5'));
  });

  it('should display warning when result has _warning', async () => {
    const mockResult = {
      stats: { total: 5, core: 3, community: 1, custom: 1 },
      nodes: { custom: [], community: [], core: [] },
      source: 'http://localhost:5678/api/v1',
      fetchedAt: '2026-01-01T00:00:00.000Z',
      _warning: 'Using cached data (fetch failed)',
    };
    discoverInstalledNodes.mockResolvedValue(mockResult);

    await parseNodes(['discover']);

    expect(displayWarning).toHaveBeenCalledWith('Using cached data (fetch failed)');
  });

  it('should display summary box with stats on normal output', async () => {
    const mockResult = {
      stats: { total: 15, core: 10, community: 3, custom: 2 },
      nodes: { custom: [], community: [], core: [] },
      source: 'http://localhost:5678/api/v1',
      fetchedAt: '2026-02-06T10:00:00.000Z',
    };
    discoverInstalledNodes.mockResolvedValue(mockResult);

    await parseNodes(['discover']);

    expect(displayBox).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('15')]),
      expect.objectContaining({ title: 'Node Discovery Complete' })
    );
  });

  it('should show custom nodes table when custom nodes are found', async () => {
    const mockResult = {
      stats: { total: 3, core: 1, community: 0, custom: 2 },
      nodes: {
        custom: [
          { type: 'custom.a', displayName: 'Node A', description: 'Desc A', category: 'custom' },
          { type: 'custom.b', displayName: 'Node B', description: 'Desc B', category: 'custom' },
        ],
        community: [],
        core: [],
      },
      source: 'http://localhost:5678/api/v1',
      fetchedAt: '2026-01-01T00:00:00.000Z',
    };
    discoverInstalledNodes.mockResolvedValue(mockResult);

    await parseNodes(['discover']);

    expect(displayHeader).toHaveBeenCalledWith('Custom Nodes Found', expect.any(Object));
    expect(displayTable).toHaveBeenCalled();
  });

  it('should not show custom nodes table when no custom nodes exist', async () => {
    const mockResult = {
      stats: { total: 5, core: 5, community: 0, custom: 0 },
      nodes: { custom: [], community: [], core: [] },
      source: 'http://localhost:5678/api/v1',
      fetchedAt: '2026-01-01T00:00:00.000Z',
    };
    discoverInstalledNodes.mockResolvedValue(mockResult);

    await parseNodes(['discover']);

    expect(displayHeader).not.toHaveBeenCalledWith('Custom Nodes Found', expect.any(Object));
  });

  it('should show usage hints after discover', async () => {
    const mockResult = {
      stats: { total: 5, core: 5, community: 0, custom: 0 },
      nodes: { custom: [], community: [], core: [] },
      source: 'http://localhost:5678/api/v1',
      fetchedAt: '2026-01-01T00:00:00.000Z',
    };
    discoverInstalledNodes.mockResolvedValue(mockResult);

    await parseNodes(['discover']);

    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('nodes list'));
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('nodes search'));
  });

  it('should handle API URL not configured error', async () => {
    discoverInstalledNodes.mockRejectedValue(new Error('API URL not configured'));

    await parseNodes(['discover']);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to discover nodes');
    expect(displayError).toHaveBeenCalledWith('API URL not configured');
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('n8n-bmad init'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle generic error without showing init hint', async () => {
    discoverInstalledNodes.mockRejectedValue(new Error('Network timeout'));

    await parseNodes(['discover']);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to discover nodes');
    expect(displayError).toHaveBeenCalledWith('Network timeout');
    const initCalls = displayInfo.mock.calls.filter(call =>
      typeof call[0] === 'string' && call[0].includes('n8n-bmad init')
    );
    expect(initCalls).toHaveLength(0);
  });

  it('should call process.exit(1) on error', async () => {
    discoverInstalledNodes.mockRejectedValue(new Error('some error'));

    await parseNodes(['discover']);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

// ---------------------------------------------------------------------------
// 3. List subcommand
// ---------------------------------------------------------------------------
describe('createListCommand', () => {
  const mockCache = {
    nodes: {
      custom: [
        { type: 'custom.a', displayName: 'A', description: 'Node A', category: 'custom' },
        { type: 'custom.b', displayName: 'B', description: 'Node B', category: 'custom' },
      ],
      community: [
        { type: 'comm.c', displayName: 'C', description: 'Node C', category: 'community' },
      ],
      core: [
        { type: 'n8n-nodes-base.http', displayName: 'HTTP', description: 'HTTP Request', category: 'core' },
      ],
    },
    stats: { core: 1, community: 1, custom: 2 },
  };

  it('should call getCachedNodes with correct options', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list']);

    expect(getCachedNodes).toHaveBeenCalledWith({ silent: false, allowStale: true });
  });

  it('should list all nodes when type is all (default)', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list']);

    expect(displayTable).toHaveBeenCalled();
    const tableData = displayTable.mock.calls[0][0];
    // Header + 4 data rows (2 custom + 1 community + 1 core)
    expect(tableData).toHaveLength(5);
  });

  it('should filter by custom type', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list', '--type', 'custom']);

    const tableData = displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(3); // Header + 2 custom nodes
  });

  it('should filter by community type', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list', '--type', 'community']);

    const tableData = displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(2); // header + 1
  });

  it('should filter by core type', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list', '--type', 'core']);

    const tableData = displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(2); // header + 1
  });

  it('should handle invalid type filter', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list', '--type', 'invalid']);

    expect(displayError).toHaveBeenCalledWith(expect.stringContaining('Invalid type'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should respect the limit option', async () => {
    const bigCache = {
      nodes: {
        custom: Array.from({ length: 100 }, (_, i) => ({
          type: `custom.node${i}`, displayName: `Node ${i}`, description: `Desc ${i}`, category: 'custom',
        })),
        community: [],
        core: [],
      },
      stats: { core: 0, community: 0, custom: 100 },
    };
    getCachedNodes.mockResolvedValue(bigCache);

    await parseNodes(['list', '--type', 'custom', '--limit', '10']);

    const tableData = displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(11); // header + 10 rows
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('10 of 100'));
  });

  it('should default limit to 50', async () => {
    const bigCache = {
      nodes: {
        custom: Array.from({ length: 60 }, (_, i) => ({
          type: `custom.node${i}`, displayName: `Node ${i}`, description: `Desc ${i}`, category: 'custom',
        })),
        community: [],
        core: [],
      },
      stats: { core: 0, community: 0, custom: 60 },
    };
    getCachedNodes.mockResolvedValue(bigCache);

    await parseNodes(['list', '--type', 'custom']);

    const tableData = displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(51); // header + 50
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('50 of 60'));
  });

  it('should not show limit message when all nodes fit', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list']);

    const limitCalls = displayInfo.mock.calls.filter(call =>
      typeof call[0] === 'string' && call[0].includes('Showing')
    );
    expect(limitCalls).toHaveLength(0);
  });

  it('should output JSON when --json is set', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list', '--json']);

    const jsonOutput = logSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('[')
    );
    expect(jsonOutput).toBeTruthy();
    const parsed = JSON.parse(jsonOutput[0]);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(4);
  });

  it('should show stale cache warning', async () => {
    const staleCache = { ...mockCache, _stale: true };
    getCachedNodes.mockResolvedValue(staleCache);

    await parseNodes(['list']);

    expect(mockSpinner.warn).toHaveBeenCalledWith('Using stale cache data');
    expect(displayWarning).toHaveBeenCalledWith(expect.stringContaining('stale'));
  });

  it('should show fresh cache message when not stale', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list']);

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Loaded cached nodes');
  });

  it('should handle missing nodes in cache', async () => {
    getCachedNodes.mockResolvedValue({ stats: { core: 0, community: 0, custom: 0 } });

    await parseNodes(['list']);

    expect(displayWarning).toHaveBeenCalledWith('No node data in cache');
  });

  it('should show stats after listing', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list']);

    expect(displayKeyValue).toHaveBeenCalledWith('Core', 1);
    expect(displayKeyValue).toHaveBeenCalledWith('Community', 1);
    expect(displayKeyValue).toHaveBeenCalledWith('Custom', 2);
  });

  it('should display proper title for type=all', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list']);

    expect(displayHeader).toHaveBeenCalledWith(expect.stringContaining('All Installed Nodes'));
  });

  it('should display proper title for specific type', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list', '--type', 'custom']);

    expect(displayHeader).toHaveBeenCalledWith(expect.stringContaining('Custom Nodes'));
  });

  it('should handle error when no cached data exists', async () => {
    getCachedNodes.mockRejectedValue(new Error('No cached node data available'));

    await parseNodes(['list']);

    expect(displayError).toHaveBeenCalledWith('No cached node data available');
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('nodes discover'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should call process.exit(1) on generic error', async () => {
    getCachedNodes.mockRejectedValue(new Error('File system error'));

    await parseNodes(['list']);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should capitalize type name in title', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list', '--type', 'community']);

    expect(displayHeader).toHaveBeenCalledWith(expect.stringContaining('Community'));
  });

  it('should handle stats with zero values', async () => {
    const emptyStats = {
      nodes: { custom: [], community: [], core: [] },
      stats: { core: 0, community: 0, custom: 0 },
    };
    getCachedNodes.mockResolvedValue(emptyStats);

    await parseNodes(['list']);

    expect(displayKeyValue).toHaveBeenCalledWith('Core', 0);
    expect(displayKeyValue).toHaveBeenCalledWith('Community', 0);
    expect(displayKeyValue).toHaveBeenCalledWith('Custom', 0);
  });

  it('should handle missing stats gracefully', async () => {
    const noStatsCache = {
      nodes: { custom: [], community: [], core: [] },
    };
    getCachedNodes.mockResolvedValue(noStatsCache);

    await parseNodes(['list']);

    expect(displayKeyValue).toHaveBeenCalledWith('Core', 0);
  });

  it('should combine nodes in custom, community, core order for type=all', async () => {
    getCachedNodes.mockResolvedValue(mockCache);

    await parseNodes(['list']);

    const tableData = displayTable.mock.calls[0][0];
    // First data row should be from custom (custom comes first in all mode)
    expect(tableData[1][0]).toContain('custom.a');
    expect(tableData[2][0]).toContain('custom.b');
    expect(tableData[3][0]).toContain('comm.c');
    expect(tableData[4][0]).toContain('n8n-nodes-base.http');
  });
});

// ---------------------------------------------------------------------------
// 4. Search subcommand
// ---------------------------------------------------------------------------
describe('createSearchCommand', () => {
  it('should call searchInstalledNodes with the query', async () => {
    searchInstalledNodes.mockResolvedValue([]);

    await parseNodes(['search', 'webhook']);

    expect(searchInstalledNodes).toHaveBeenCalledWith('webhook', { type: undefined });
  });

  it('should pass type option to searchInstalledNodes', async () => {
    searchInstalledNodes.mockResolvedValue([]);

    await parseNodes(['search', 'slack', '--type', 'community']);

    expect(searchInstalledNodes).toHaveBeenCalledWith('slack', { type: 'community' });
  });

  it('should show spinner with result count', async () => {
    const results = [
      { type: 'n8n-nodes-base.http', displayName: 'HTTP', description: 'HTTP Request', category: 'core' },
      { type: 'n8n-nodes-base.httpRequest', displayName: 'HTTP Request', description: 'Make HTTP calls', category: 'core' },
    ];
    searchInstalledNodes.mockResolvedValue(results);

    await parseNodes(['search', 'http']);

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Found 2 matching nodes');
  });

  it('should display results table with category', async () => {
    const results = [
      { type: 'n8n-nodes-base.http', displayName: 'HTTP', description: 'HTTP Request', category: 'core' },
    ];
    searchInstalledNodes.mockResolvedValue(results);

    await parseNodes(['search', 'http']);

    expect(displayHeader).toHaveBeenCalledWith(expect.stringContaining('http'));
    expect(displayTable).toHaveBeenCalled();
    const tableData = displayTable.mock.calls[0][0];
    expect(tableData[0]).toHaveLength(4);
  });

  it('should handle empty results', async () => {
    searchInstalledNodes.mockResolvedValue([]);

    await parseNodes(['search', 'nonexistent']);

    expect(displayWarning).toHaveBeenCalledWith(expect.stringContaining('No nodes found'));
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('different search term'));
  });

  it('should not display table when results are empty', async () => {
    searchInstalledNodes.mockResolvedValue([]);

    await parseNodes(['search', 'nonexistent']);

    expect(displayTable).not.toHaveBeenCalled();
  });

  it('should output JSON when --json is set', async () => {
    const results = [
      { type: 'custom.test', displayName: 'Test', description: 'A test', category: 'custom' },
    ];
    searchInstalledNodes.mockResolvedValue(results);

    await parseNodes(['search', 'test', '--json']);

    const jsonOutput = logSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('"type"')
    );
    expect(jsonOutput).toBeTruthy();
    const parsed = JSON.parse(jsonOutput[0]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].type).toBe('custom.test');
  });

  it('should respect the limit option', async () => {
    const results = Array.from({ length: 30 }, (_, i) => ({
      type: `node.${i}`, displayName: `Node ${i}`, description: `Desc ${i}`, category: 'core',
    }));
    searchInstalledNodes.mockResolvedValue(results);

    await parseNodes(['search', 'node', '--limit', '5']);

    const tableData = displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(6); // header + 5
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('5 of 30'));
  });

  it('should default limit to 20', async () => {
    const results = Array.from({ length: 25 }, (_, i) => ({
      type: `node.${i}`, displayName: `Node ${i}`, description: `Desc ${i}`, category: 'core',
    }));
    searchInstalledNodes.mockResolvedValue(results);

    await parseNodes(['search', 'node']);

    const tableData = displayTable.mock.calls[0][0];
    expect(tableData).toHaveLength(21); // header + 20
  });

  it('should handle search error for missing cache', async () => {
    searchInstalledNodes.mockRejectedValue(new Error('No cached node data available'));

    await parseNodes(['search', 'test']);

    expect(displayError).toHaveBeenCalledWith('No cached node data available');
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('nodes discover'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should call process.exit(1) on error', async () => {
    searchInstalledNodes.mockRejectedValue(new Error('unexpected error'));

    await parseNodes(['search', 'test']);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should not show limit info when results fit within limit', async () => {
    const results = [
      { type: 'test.a', displayName: 'A', description: 'A', category: 'core' },
    ];
    searchInstalledNodes.mockResolvedValue(results);

    await parseNodes(['search', 'test']);

    const limitCalls = displayInfo.mock.calls.filter(call =>
      typeof call[0] === 'string' && call[0].includes('Showing')
    );
    expect(limitCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Status subcommand
// ---------------------------------------------------------------------------
describe('createStatusCommand', () => {
  it('should call getCacheStatus', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      ageHours: 5,
      lastFetched: '2026-02-06T10:00:00.000Z',
      source: 'http://localhost:5678/api/v1',
      stats: { total: 10, core: 8, community: 1, custom: 1 },
    });

    await parseNodes(['status']);

    expect(getCacheStatus).toHaveBeenCalled();
  });

  it('should display all status fields', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      ageHours: 5.2,
      lastFetched: '2026-02-06T10:00:00.000Z',
      source: 'http://localhost:5678/api/v1',
      stats: { total: 10, core: 8, community: 1, custom: 1 },
    });

    await parseNodes(['status']);

    expect(displayKeyValue).toHaveBeenCalledWith('Status', expect.stringContaining('FRESH'));
    expect(displayKeyValue).toHaveBeenCalledWith('Cache Path', '/path/to/cache.json');
    expect(displayKeyValue).toHaveBeenCalledWith('TTL', '24 hours');
    expect(displayKeyValue).toHaveBeenCalledWith('Age', '5.2 hours');
    expect(displayKeyValue).toHaveBeenCalledWith('Last Fetched', '2026-02-06T10:00:00.000Z');
    expect(displayKeyValue).toHaveBeenCalledWith('Source', 'http://localhost:5678/api/v1');
  });

  it('should display node statistics', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      stats: { total: 10, core: 8, community: 1, custom: 1 },
    });

    await parseNodes(['status']);

    expect(displayKeyValue).toHaveBeenCalledWith('Total', 10);
    expect(displayKeyValue).toHaveBeenCalledWith('Core', 8);
    expect(displayKeyValue).toHaveBeenCalledWith('Community', 1);
    expect(displayKeyValue).toHaveBeenCalledWith('Custom', 1);
  });

  it('should show STALE status when cache is stale', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: true,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      ageHours: 30,
      stats: { total: 5, core: 5, community: 0, custom: 0 },
    });

    await parseNodes(['status']);

    expect(displayKeyValue).toHaveBeenCalledWith('Status', expect.stringContaining('STALE'));
    expect(displayWarning).toHaveBeenCalledWith(expect.stringContaining('stale'));
  });

  it('should show FRESH status when cache is not stale', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
    });

    await parseNodes(['status']);

    expect(displayKeyValue).toHaveBeenCalledWith('Status', expect.stringContaining('FRESH'));
  });

  it('should handle no cache file found', async () => {
    getCacheStatus.mockResolvedValue({
      exists: false,
      stale: true,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      stats: null,
      lastFetched: null,
      source: null,
    });

    await parseNodes(['status']);

    expect(displayWarning).toHaveBeenCalledWith('No cache file found');
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('nodes discover'));
  });

  it('should not show age when ageHours is undefined', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      stats: null,
    });

    await parseNodes(['status']);

    const ageCalls = displayKeyValue.mock.calls.filter(call => call[0] === 'Age');
    expect(ageCalls).toHaveLength(0);
  });

  it('should not show lastFetched when null', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      lastFetched: null,
    });

    await parseNodes(['status']);

    const fetchedCalls = displayKeyValue.mock.calls.filter(call => call[0] === 'Last Fetched');
    expect(fetchedCalls).toHaveLength(0);
  });

  it('should not show source when null', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      source: null,
    });

    await parseNodes(['status']);

    const sourceCalls = displayKeyValue.mock.calls.filter(call => call[0] === 'Source');
    expect(sourceCalls).toHaveLength(0);
  });

  it('should not show statistics when stats is null', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      stats: null,
    });

    await parseNodes(['status']);

    const totalCalls = displayKeyValue.mock.calls.filter(call => call[0] === 'Total');
    expect(totalCalls).toHaveLength(0);
  });

  it('should output JSON when --json is set', async () => {
    const statusData = {
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      ageHours: 5,
      stats: { total: 10, core: 8, community: 1, custom: 1 },
    };
    getCacheStatus.mockResolvedValue(statusData);

    await parseNodes(['status', '--json']);

    const jsonOutput = logSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('"exists"')
    );
    expect(jsonOutput).toBeTruthy();
    const parsed = JSON.parse(jsonOutput[0]);
    expect(parsed.exists).toBe(true);
    expect(parsed.ttlHours).toBe(24);
  });

  it('should not display formatted output when --json is set', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
    });

    await parseNodes(['status', '--json']);

    expect(displayHeader).not.toHaveBeenCalled();
    expect(displayKeyValue).not.toHaveBeenCalled();
  });

  it('should handle getCacheStatus error', async () => {
    getCacheStatus.mockRejectedValue(new Error('filesystem error'));

    await parseNodes(['status']);

    expect(displayError).toHaveBeenCalledWith('filesystem error');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should display header for status output', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
    });

    await parseNodes(['status']);

    expect(displayHeader).toHaveBeenCalledWith('Node Cache Status');
  });

  it('should display compact header for node statistics section', async () => {
    getCacheStatus.mockResolvedValue({
      exists: true,
      stale: false,
      cachePath: '/path/to/cache.json',
      ttlHours: 24,
      stats: { total: 10, core: 8, community: 1, custom: 1 },
    });

    await parseNodes(['status']);

    expect(displayHeader).toHaveBeenCalledWith('Node Statistics', { style: 'compact' });
  });
});

// ---------------------------------------------------------------------------
// 6. Main nodes command (default action and structure)
// ---------------------------------------------------------------------------
describe('createNodesCommand', () => {
  it('should have description set', () => {
    const cmd = getFreshCommand();
    expect(cmd.description()).toContain('Discover and manage');
  });

  it('should have four subcommands', () => {
    const cmd = getFreshCommand();
    const subNames = cmd.commands.map(c => c.name());
    expect(subNames).toContain('discover');
    expect(subNames).toContain('list');
    expect(subNames).toContain('search');
    expect(subNames).toContain('status');
    expect(subNames).toHaveLength(4);
  });

  it('should display help info when invoked without subcommand', async () => {
    const cmd = getFreshCommand();
    // Invoke the main action handler directly
    if (cmd._actionHandler) {
      await cmd._actionHandler([]);
    }

    expect(displayHeader).toHaveBeenCalledWith('Node Discovery Commands');
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('discover'));
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('list'));
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('search'));
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('status'));
  });

  it('should export a Command instance named nodes', () => {
    const cmd = getFreshCommand();
    expect(cmd).toBeDefined();
    expect(cmd.name()).toBe('nodes');
  });

  it('discover subcommand should have force and json options', () => {
    const cmd = getFreshCommand();
    const discoverCmd = cmd.commands.find(c => c.name() === 'discover');
    const optionNames = discoverCmd.options.map(o => o.long);
    expect(optionNames).toContain('--force');
    expect(optionNames).toContain('--json');
  });

  it('list subcommand should have type, json, and limit options', () => {
    const cmd = getFreshCommand();
    const listCmd = cmd.commands.find(c => c.name() === 'list');
    const optionNames = listCmd.options.map(o => o.long);
    expect(optionNames).toContain('--type');
    expect(optionNames).toContain('--json');
    expect(optionNames).toContain('--limit');
  });

  it('search subcommand should have type, json, and limit options', () => {
    const cmd = getFreshCommand();
    const searchCmd = cmd.commands.find(c => c.name() === 'search');
    const optionNames = searchCmd.options.map(o => o.long);
    expect(optionNames).toContain('--type');
    expect(optionNames).toContain('--json');
    expect(optionNames).toContain('--limit');
  });

  it('status subcommand should have json option', () => {
    const cmd = getFreshCommand();
    const statusCmd = cmd.commands.find(c => c.name() === 'status');
    const optionNames = statusCmd.options.map(o => o.long);
    expect(optionNames).toContain('--json');
  });

  it('search subcommand should require a query argument', () => {
    const cmd = getFreshCommand();
    const searchCmd = cmd.commands.find(c => c.name() === 'search');
    const args = searchCmd.registeredArguments;
    expect(args).toHaveLength(1);
    expect(args[0].name()).toBe('query');
    expect(args[0].required).toBe(true);
  });

  it('list subcommand should default type to all', () => {
    const cmd = getFreshCommand();
    const listCmd = cmd.commands.find(c => c.name() === 'list');
    const typeOption = listCmd.options.find(o => o.long === '--type');
    expect(typeOption.defaultValue).toBe('all');
  });

  it('list subcommand should default limit to 50', () => {
    const cmd = getFreshCommand();
    const listCmd = cmd.commands.find(c => c.name() === 'list');
    const limitOption = listCmd.options.find(o => o.long === '--limit');
    expect(limitOption.defaultValue).toBe('50');
  });

  it('search subcommand should default limit to 20', () => {
    const cmd = getFreshCommand();
    const searchCmd = cmd.commands.find(c => c.name() === 'search');
    const limitOption = searchCmd.options.find(o => o.long === '--limit');
    expect(limitOption.defaultValue).toBe('20');
  });
});
