/**
 * @fileoverview Unit tests for node-discovery module
 *
 * Tests the node discovery system that queries n8n instances for installed nodes,
 * categorizes them, and manages a local cache.
 */

const path = require('path');

// ---------------------------------------------------------------------------
// Mock setup (must precede require of the module under test)
// ---------------------------------------------------------------------------

// Mock fs.promises
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();

jest.mock('fs', () => ({
  promises: {
    readFile: (...args) => mockReadFile(...args),
    writeFile: (...args) => mockWriteFile(...args),
    mkdir: (...args) => mockMkdir(...args),
  },
}));

// Mock config-loader
const mockGetN8nUrl = jest.fn();
const mockGetConfigValue = jest.fn();
const mockFindConfigPath = jest.fn();

jest.mock('../../tools/cli/lib/config-loader', () => ({
  getN8nUrl: (...args) => mockGetN8nUrl(...args),
  getConfigValue: (...args) => mockGetConfigValue(...args),
  findConfigPath: (...args) => mockFindConfigPath(...args),
}));

// ---------------------------------------------------------------------------
// Require the module under test
// ---------------------------------------------------------------------------

const {
  CORE_NODE_PREFIXES,
  COMMUNITY_NODE_PREFIXES,
  getCachePath,
  getCacheTTL,
  isCacheStale,
  loadCache,
  saveCache,
  getApiConfig,
  categorizeNode,
  categorizeNodes,
  getCachedNodes,
  searchInstalledNodes,
  getCustomNodes,
  getCacheStatus,
} = require('../../tools/cli/lib/node-discovery');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_CWD = '/fake/project';
const DEFAULT_CACHE_PATH = path.resolve(FAKE_CWD, '.n8n-bmad', 'cache', 'installed-nodes.json');

/** Build a minimal node object */
function makeNode(type, displayName, description) {
  return {
    type,
    displayName: displayName || type,
    description: description || '',
  };
}

/** Build a valid cache object */
function makeCache(overrides = {}) {
  return {
    timestamp: Date.now(),
    version: '1.0.0',
    nodes: {
      core: [makeNode('n8n-nodes-base.httpRequest', 'HTTP Request', 'Make HTTP calls')],
      community: [makeNode('n8n-nodes-coolpackage.myNode', 'Cool Node', 'A community node')],
      custom: [makeNode('custom.myNode', 'My Custom Node', 'A custom node')],
    },
    stats: { total: 3, core: 1, community: 1, custom: 1 },
    source: 'http://localhost:5678/api/v1',
    fetchedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let originalCwd;
let originalEnv;

beforeEach(() => {
  jest.clearAllMocks();

  // Save and override process.cwd
  originalCwd = process.cwd;
  process.cwd = jest.fn(() => FAKE_CWD);

  // Save and clear env vars
  originalEnv = { ...process.env };
  delete process.env.N8N_API_URL;
  delete process.env.N8N_INSTANCE_URL;
  delete process.env.N8N_API_KEY;

  // Default mock behaviors
  mockGetConfigValue.mockResolvedValue(undefined);
  mockGetN8nUrl.mockResolvedValue('http://localhost:5678/api/v1');
  mockReadFile.mockRejectedValue(new Error('ENOENT'));
  mockWriteFile.mockResolvedValue(undefined);
  mockMkdir.mockResolvedValue(undefined);
});

afterEach(() => {
  process.cwd = originalCwd;
  process.env = originalEnv;
});

// =============================================================================
// 1. Exported constants
// =============================================================================

describe('Exported constants', () => {
  it('CORE_NODE_PREFIXES should contain all expected prefixes', () => {
    expect(Array.isArray(CORE_NODE_PREFIXES)).toBe(true);
    expect(CORE_NODE_PREFIXES).toContain('n8n-nodes-base.');
    expect(CORE_NODE_PREFIXES).toContain('@n8n/n8n-nodes-');
    expect(CORE_NODE_PREFIXES).toContain('n8n-nodes-langchain.');
  });

  it('COMMUNITY_NODE_PREFIXES should contain all expected prefixes', () => {
    expect(Array.isArray(COMMUNITY_NODE_PREFIXES)).toBe(true);
    expect(COMMUNITY_NODE_PREFIXES).toContain('n8n-nodes-');
    expect(COMMUNITY_NODE_PREFIXES).toContain('@community/');
  });
});

// =============================================================================
// 2. getCachePath
// =============================================================================

describe('getCachePath', () => {
  it('should return the default cache path when no config value exists', async () => {
    const result = await getCachePath();
    expect(result).toBe(DEFAULT_CACHE_PATH);
  });

  it('should return the default cache path when getConfigValue throws', async () => {
    mockGetConfigValue.mockRejectedValue(new Error('config error'));
    const result = await getCachePath();
    expect(result).toBe(DEFAULT_CACHE_PATH);
  });

  it('should return a resolved path when config provides a custom cache path', async () => {
    mockGetConfigValue.mockResolvedValue('my-cache/nodes.json');
    const result = await getCachePath();
    expect(result).toBe(path.resolve(FAKE_CWD, 'my-cache/nodes.json'));
  });

  it('should call getConfigValue with node_discovery.cache_path', async () => {
    await getCachePath();
    expect(mockGetConfigValue).toHaveBeenCalledWith('node_discovery.cache_path');
  });

  it('should return the default when config returns falsy values', async () => {
    for (const val of [null, '', 0, false]) {
      mockGetConfigValue.mockResolvedValue(val);
      const result = await getCachePath();
      expect(result).toBe(DEFAULT_CACHE_PATH);
    }
  });
});

// =============================================================================
// 3. getCacheTTL
// =============================================================================

describe('getCacheTTL', () => {
  const DEFAULT_TTL = 24 * 60 * 60 * 1000;

  it('should return default 24-hour TTL when no config value', async () => {
    const result = await getCacheTTL();
    expect(result).toBe(DEFAULT_TTL);
  });

  it('should return default TTL when getConfigValue throws', async () => {
    mockGetConfigValue.mockRejectedValue(new Error('fail'));
    const result = await getCacheTTL();
    expect(result).toBe(DEFAULT_TTL);
  });

  it('should convert configured hours to milliseconds', async () => {
    mockGetConfigValue.mockResolvedValue(12);
    const result = await getCacheTTL();
    expect(result).toBe(12 * 60 * 60 * 1000);
  });

  it('should return default TTL when config returns a non-number', async () => {
    mockGetConfigValue.mockResolvedValue('twelve');
    const result = await getCacheTTL();
    expect(result).toBe(DEFAULT_TTL);
  });

  it('should call getConfigValue with node_discovery.cache_ttl_hours', async () => {
    await getCacheTTL();
    expect(mockGetConfigValue).toHaveBeenCalledWith('node_discovery.cache_ttl_hours');
  });

  it('should handle fractional hours', async () => {
    mockGetConfigValue.mockResolvedValue(0.5);
    const result = await getCacheTTL();
    expect(result).toBe(0.5 * 60 * 60 * 1000);
  });

  it('should return default TTL when config returns zero (falsy)', async () => {
    mockGetConfigValue.mockResolvedValue(0);
    const result = await getCacheTTL();
    expect(result).toBe(DEFAULT_TTL);
  });
});

// =============================================================================
// 4. isCacheStale
// =============================================================================

describe('isCacheStale', () => {
  const ONE_HOUR = 60 * 60 * 1000;

  it('should return true when cache is null', () => {
    expect(isCacheStale(null, ONE_HOUR)).toBe(true);
  });

  it('should return true when cache is undefined', () => {
    expect(isCacheStale(undefined, ONE_HOUR)).toBe(true);
  });

  it('should return true when cache has no timestamp', () => {
    expect(isCacheStale({}, ONE_HOUR)).toBe(true);
  });

  it('should return true when cache timestamp is zero (falsy)', () => {
    expect(isCacheStale({ timestamp: 0 }, ONE_HOUR)).toBe(true);
  });

  it('should return false when cache is fresh (age < TTL)', () => {
    const freshCache = { timestamp: Date.now() - 1000 };
    expect(isCacheStale(freshCache, ONE_HOUR)).toBe(false);
  });

  it('should return true when cache is expired (age > TTL)', () => {
    const expiredCache = { timestamp: Date.now() - (2 * ONE_HOUR) };
    expect(isCacheStale(expiredCache, ONE_HOUR)).toBe(true);
  });

  it('should return false when cache age equals TTL exactly', () => {
    const now = Date.now();
    const cache = { timestamp: now - ONE_HOUR };
    const originalNow = Date.now;
    Date.now = jest.fn(() => now);
    expect(isCacheStale(cache, ONE_HOUR)).toBe(false);
    Date.now = originalNow;
  });

  it('should return true when cache age exceeds TTL by 1ms', () => {
    const now = Date.now();
    const cache = { timestamp: now - ONE_HOUR - 1 };
    const originalNow = Date.now;
    Date.now = jest.fn(() => now);
    expect(isCacheStale(cache, ONE_HOUR)).toBe(true);
    Date.now = originalNow;
  });

  it('should return true with zero TTL if timestamp is in the past', () => {
    const cache = { timestamp: Date.now() - 1 };
    expect(isCacheStale(cache, 0)).toBe(true);
  });
});

// =============================================================================
// 5. categorizeNode
// =============================================================================

describe('categorizeNode', () => {
  describe('core nodes', () => {
    it('should categorize n8n-nodes-base.httpRequest as core', () => {
      expect(categorizeNode({ type: 'n8n-nodes-base.httpRequest' })).toBe('core');
    });

    it('should categorize @n8n/n8n-nodes-langchain.agent as core', () => {
      expect(categorizeNode({ type: '@n8n/n8n-nodes-langchain.agent' })).toBe('core');
    });

    it('should categorize n8n-nodes-langchain.openAi as core', () => {
      expect(categorizeNode({ type: 'n8n-nodes-langchain.openAi' })).toBe('core');
    });

    it('should categorize n8n-nodes-base.webhook as core', () => {
      expect(categorizeNode({ type: 'n8n-nodes-base.webhook' })).toBe('core');
    });

    it('should categorize @n8n/n8n-nodes-something.node as core', () => {
      expect(categorizeNode({ type: '@n8n/n8n-nodes-something.node' })).toBe('core');
    });
  });

  describe('community nodes', () => {
    it('should categorize n8n-nodes-coolpackage.myNode as community', () => {
      expect(categorizeNode({ type: 'n8n-nodes-coolpackage.myNode' })).toBe('community');
    });

    it('should categorize @community/foo as community', () => {
      expect(categorizeNode({ type: '@community/foo' })).toBe('community');
    });

    it('should categorize n8n-nodes-telegram.sendMessage as community (not core)', () => {
      expect(categorizeNode({ type: 'n8n-nodes-telegram.sendMessage' })).toBe('community');
    });
  });

  describe('custom nodes', () => {
    it('should categorize custom.myNode as custom', () => {
      expect(categorizeNode({ type: 'custom.myNode' })).toBe('custom');
    });

    it('should categorize empty string as custom', () => {
      expect(categorizeNode({ type: '' })).toBe('custom');
    });

    it('should categorize unknown prefix as custom', () => {
      expect(categorizeNode({ type: 'some-random-prefix.node' })).toBe('custom');
    });

    it('should categorize node with no type or name as custom', () => {
      expect(categorizeNode({})).toBe('custom');
    });
  });

  describe('name fallback', () => {
    it('should use name field when type is missing', () => {
      expect(categorizeNode({ name: 'n8n-nodes-base.ifNode' })).toBe('core');
    });

    it('should use name field for community detection', () => {
      expect(categorizeNode({ name: 'n8n-nodes-mypackage.thing' })).toBe('community');
    });

    it('should prefer type over name when both exist', () => {
      expect(categorizeNode({ type: 'n8n-nodes-base.set', name: 'custom.thing' })).toBe('core');
    });
  });

  describe('includes matching for core prefixes', () => {
    it('should match core prefix anywhere in the type string via includes()', () => {
      expect(categorizeNode({ type: 'something.n8n-nodes-base.extra' })).toBe('core');
    });
  });
});

// =============================================================================
// 6. categorizeNodes
// =============================================================================

describe('categorizeNodes', () => {
  it('should return an object with core, community, and custom arrays', () => {
    const result = categorizeNodes([]);
    expect(result).toHaveProperty('core');
    expect(result).toHaveProperty('community');
    expect(result).toHaveProperty('custom');
    expect(Array.isArray(result.core)).toBe(true);
    expect(Array.isArray(result.community)).toBe(true);
    expect(Array.isArray(result.custom)).toBe(true);
  });

  it('should return empty arrays for empty input', () => {
    const result = categorizeNodes([]);
    expect(result.core).toHaveLength(0);
    expect(result.community).toHaveLength(0);
    expect(result.custom).toHaveLength(0);
  });

  it('should categorize a mix of nodes into correct groups', () => {
    const nodes = [
      makeNode('n8n-nodes-base.httpRequest', 'HTTP Request'),
      makeNode('n8n-nodes-coolpackage.widget', 'Cool Widget'),
      makeNode('custom.myNode', 'My Custom Node'),
      makeNode('n8n-nodes-langchain.openAi', 'OpenAI'),
    ];
    const result = categorizeNodes(nodes);
    expect(result.core).toHaveLength(2);
    expect(result.community).toHaveLength(1);
    expect(result.custom).toHaveLength(1);
  });

  it('should sort each category by displayName', () => {
    const nodes = [
      makeNode('n8n-nodes-base.webhook', 'Webhook'),
      makeNode('n8n-nodes-base.httpRequest', 'HTTP Request'),
      makeNode('n8n-nodes-base.code', 'Code'),
      makeNode('n8n-nodes-pkg2.z', 'Zeta'),
      makeNode('n8n-nodes-pkg1.a', 'Alpha'),
      makeNode('custom.b', 'Bravo'),
      makeNode('custom.a', 'Aardvark'),
    ];
    const result = categorizeNodes(nodes);
    expect(result.core.map((n) => n.displayName)).toEqual(['Code', 'HTTP Request', 'Webhook']);
    expect(result.community.map((n) => n.displayName)).toEqual(['Alpha', 'Zeta']);
    expect(result.custom.map((n) => n.displayName)).toEqual(['Aardvark', 'Bravo']);
  });

  it('should populate all fields on categorized nodes', () => {
    const nodes = [{
      type: 'n8n-nodes-base.httpRequest',
      displayName: 'HTTP Request',
      description: 'Make HTTP calls',
      icon: 'file:httpRequest.svg',
      group: ['transform'],
      version: '4',
    }];
    const result = categorizeNodes(nodes);
    const node = result.core[0];
    expect(node.type).toBe('n8n-nodes-base.httpRequest');
    expect(node.displayName).toBe('HTTP Request');
    expect(node.description).toBe('Make HTTP calls');
    expect(node.icon).toBe('file:httpRequest.svg');
    expect(node.group).toEqual(['transform']);
    expect(node.version).toBe('4');
    expect(node.category).toBe('core');
  });

  it('should use type as displayName fallback', () => {
    const nodes = [{ type: 'n8n-nodes-base.set' }];
    const result = categorizeNodes(nodes);
    expect(result.core[0].displayName).toBe('n8n-nodes-base.set');
  });

  it('should apply sensible defaults for missing optional fields', () => {
    const nodes = [{ type: 'custom.thing' }];
    const result = categorizeNodes(nodes);
    const node = result.custom[0];
    expect(node.description).toBe('');
    expect(node.icon).toBeNull();
    expect(node.group).toEqual([]);
    expect(node.version).toBe('1');
  });

  it('should include category field in each categorized node', () => {
    const nodes = [
      makeNode('n8n-nodes-base.set', 'Set'),
      makeNode('n8n-nodes-pkg.x', 'X'),
      makeNode('custom.y', 'Y'),
    ];
    const result = categorizeNodes(nodes);
    expect(result.core[0].category).toBe('core');
    expect(result.community[0].category).toBe('community');
    expect(result.custom[0].category).toBe('custom');
  });

  it('should handle nodes with name instead of type', () => {
    const nodes = [{ name: 'n8n-nodes-base.set', displayName: 'Set' }];
    const result = categorizeNodes(nodes);
    expect(result.core).toHaveLength(1);
    expect(result.core[0].type).toBe('n8n-nodes-base.set');
  });

  it('should handle nodes with neither type nor name', () => {
    const nodes = [{ displayName: 'Unknown Node' }];
    const result = categorizeNodes(nodes);
    expect(result.custom).toHaveLength(1);
    expect(result.custom[0].type).toBeUndefined();
  });
});

// =============================================================================
// 7. loadCache
// =============================================================================

describe('loadCache', () => {
  it('should return parsed JSON from the cache file', async () => {
    const data = makeCache();
    mockReadFile.mockResolvedValue(JSON.stringify(data));
    const result = await loadCache();
    expect(result).toEqual(data);
  });

  it('should return null when the file does not exist', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const result = await loadCache();
    expect(result).toBeNull();
  });

  it('should return null when the file contains invalid JSON', async () => {
    mockReadFile.mockResolvedValue('not valid json {{{');
    const result = await loadCache();
    expect(result).toBeNull();
  });

  it('should read from the correct default cache path', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(makeCache()));
    await loadCache();
    expect(mockReadFile).toHaveBeenCalledWith(DEFAULT_CACHE_PATH, 'utf8');
  });

  it('should use custom cache path from config', async () => {
    mockGetConfigValue.mockResolvedValue('custom/cache.json');
    mockReadFile.mockResolvedValue(JSON.stringify(makeCache()));
    await loadCache();
    expect(mockReadFile).toHaveBeenCalledWith(
      path.resolve(FAKE_CWD, 'custom/cache.json'),
      'utf8',
    );
  });

  it('should return null when readFile returns empty string', async () => {
    mockReadFile.mockResolvedValue('');
    const result = await loadCache();
    expect(result).toBeNull();
  });
});

// =============================================================================
// 8. saveCache
// =============================================================================

describe('saveCache', () => {
  it('should create the cache directory recursively', async () => {
    await saveCache({ foo: 'bar' });
    expect(mockMkdir).toHaveBeenCalledWith(
      path.dirname(DEFAULT_CACHE_PATH),
      { recursive: true },
    );
  });

  it('should write JSON to the correct cache file path', async () => {
    await saveCache({ foo: 'bar' });
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const [filePath, , encoding] = mockWriteFile.mock.calls[0];
    expect(filePath).toBe(DEFAULT_CACHE_PATH);
    expect(encoding).toBe('utf8');
  });

  it('should include original data plus timestamp and version in saved output', async () => {
    const before = Date.now();
    await saveCache({ nodes: { core: [] }, stats: { total: 0 } });
    const after = Date.now();
    const parsed = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(parsed.nodes).toEqual({ core: [] });
    expect(parsed.stats).toEqual({ total: 0 });
    expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
    expect(parsed.timestamp).toBeLessThanOrEqual(after);
    expect(parsed.version).toBe('1.0.0');
  });

  it('should pretty-print the JSON with 2-space indentation', async () => {
    await saveCache({ x: 1 });
    const content = mockWriteFile.mock.calls[0][1];
    expect(content).toContain('\n');
    expect(content).toContain('  ');
  });

  it('should use custom cache path from config', async () => {
    mockGetConfigValue.mockResolvedValue('custom/cache.json');
    await saveCache({ test: true });
    expect(mockWriteFile).toHaveBeenCalledWith(
      path.resolve(FAKE_CWD, 'custom/cache.json'),
      expect.any(String),
      'utf8',
    );
  });
});

// =============================================================================
// 9. getApiConfig
// =============================================================================

describe('getApiConfig', () => {
  describe('environment variables', () => {
    it('should use N8N_API_URL env var when set', async () => {
      process.env.N8N_API_URL = 'http://my-n8n:5678';
      const result = await getApiConfig();
      expect(result.url).toBe('http://my-n8n:5678/api/v1');
    });

    it('should use N8N_INSTANCE_URL env var as fallback', async () => {
      process.env.N8N_INSTANCE_URL = 'http://instance:5678';
      const result = await getApiConfig();
      expect(result.url).toBe('http://instance:5678/api/v1');
    });

    it('should prefer N8N_API_URL over N8N_INSTANCE_URL', async () => {
      process.env.N8N_API_URL = 'http://api:5678';
      process.env.N8N_INSTANCE_URL = 'http://instance:5678';
      const result = await getApiConfig();
      expect(result.url).toBe('http://api:5678/api/v1');
    });

    it('should use N8N_API_KEY env var for apiKey', async () => {
      process.env.N8N_API_URL = 'http://host:5678';
      process.env.N8N_API_KEY = 'my-secret-key';
      const result = await getApiConfig();
      expect(result.apiKey).toBe('my-secret-key');
    });

    it('should return undefined apiKey when N8N_API_KEY is not set', async () => {
      process.env.N8N_API_URL = 'http://host:5678';
      const result = await getApiConfig();
      expect(result.apiKey).toBeUndefined();
    });
  });

  describe('config fallback', () => {
    it('should fall back to getN8nUrl when env vars are not set', async () => {
      mockGetN8nUrl.mockResolvedValue('http://config-url:5678');
      const result = await getApiConfig();
      expect(result.url).toContain('http://config-url:5678');
    });

    it('should throw when getN8nUrl also fails', async () => {
      mockGetN8nUrl.mockRejectedValue(new Error('no config'));
      await expect(getApiConfig()).rejects.toThrow('n8n API URL not configured');
    });
  });

  describe('/api/v1 appending', () => {
    it('should append /api/v1 when URL does not contain /api/', async () => {
      process.env.N8N_API_URL = 'http://localhost:5678';
      const result = await getApiConfig();
      expect(result.url).toBe('http://localhost:5678/api/v1');
    });

    it('should not append /api/v1 when URL already contains /api/', async () => {
      process.env.N8N_API_URL = 'http://localhost:5678/api/v1';
      const result = await getApiConfig();
      expect(result.url).toBe('http://localhost:5678/api/v1');
    });

    it('should strip trailing slash before appending /api/v1', async () => {
      process.env.N8N_API_URL = 'http://localhost:5678/';
      const result = await getApiConfig();
      expect(result.url).toBe('http://localhost:5678/api/v1');
    });

    it('should not modify URL that already has /api/v2', async () => {
      process.env.N8N_API_URL = 'http://localhost:5678/api/v2';
      const result = await getApiConfig();
      expect(result.url).toBe('http://localhost:5678/api/v2');
    });
  });

  describe('error conditions', () => {
    it('should throw with instructions to run init or set env var', async () => {
      mockGetN8nUrl.mockRejectedValue(new Error('no config'));
      await expect(getApiConfig()).rejects.toThrow('N8N_API_URL');
    });
  });
});

// =============================================================================
// 10. getCachedNodes
// =============================================================================

describe('getCachedNodes', () => {
  it('should return cached data when cache exists and is fresh', async () => {
    const cache = makeCache();
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const result = await getCachedNodes();
    expect(result).toBeTruthy();
    expect(result.nodes).toBeDefined();
  });

  it('should throw when cache does not exist and silent is false (default)', async () => {
    await expect(getCachedNodes()).rejects.toThrow('No cached node data available');
  });

  it('should return null when cache does not exist and silent is true', async () => {
    const result = await getCachedNodes({ silent: true });
    expect(result).toBeNull();
  });

  it('should mark stale cache with _stale flag when allowStale is true', async () => {
    const staleCache = makeCache({ timestamp: Date.now() - (48 * 60 * 60 * 1000) });
    mockReadFile.mockResolvedValue(JSON.stringify(staleCache));
    const result = await getCachedNodes({ allowStale: true });
    expect(result._stale).toBe(true);
  });

  it('should return stale cache when allowStale is true (default)', async () => {
    const staleCache = makeCache({ timestamp: Date.now() - (48 * 60 * 60 * 1000) });
    mockReadFile.mockResolvedValue(JSON.stringify(staleCache));
    const result = await getCachedNodes();
    expect(result).toBeTruthy();
    expect(result._stale).toBe(true);
  });

  it('should throw on stale cache when allowStale is false and silent is false', async () => {
    const staleCache = makeCache({ timestamp: Date.now() - (48 * 60 * 60 * 1000) });
    mockReadFile.mockResolvedValue(JSON.stringify(staleCache));
    await expect(getCachedNodes({ allowStale: false })).rejects.toThrow('stale');
  });

  it('should return null on stale cache when allowStale is false and silent is true', async () => {
    const staleCache = makeCache({ timestamp: Date.now() - (48 * 60 * 60 * 1000) });
    mockReadFile.mockResolvedValue(JSON.stringify(staleCache));
    const result = await getCachedNodes({ allowStale: false, silent: true });
    expect(result).toBeNull();
  });

  it('should not mark fresh cache as stale', async () => {
    const freshCache = makeCache({ timestamp: Date.now() });
    mockReadFile.mockResolvedValue(JSON.stringify(freshCache));
    const result = await getCachedNodes();
    expect(result._stale).toBeUndefined();
  });
});

// =============================================================================
// 11. searchInstalledNodes
// =============================================================================

describe('searchInstalledNodes', () => {
  const searchCache = makeCache({
    timestamp: Date.now(),
    nodes: {
      core: [
        { type: 'n8n-nodes-base.httpRequest', displayName: 'HTTP Request', description: 'Make HTTP calls', category: 'core' },
        { type: 'n8n-nodes-base.webhook', displayName: 'Webhook', description: 'Receive webhooks', category: 'core' },
        { type: 'n8n-nodes-base.code', displayName: 'Code', description: 'Run JavaScript code', category: 'core' },
      ],
      community: [
        { type: 'n8n-nodes-telegram.send', displayName: 'Telegram', description: 'Send Telegram messages', category: 'community' },
      ],
      custom: [
        { type: 'custom.crm', displayName: 'CRM Connector', description: 'Connect to internal CRM', category: 'custom' },
      ],
    },
  });

  beforeEach(() => {
    mockReadFile.mockResolvedValue(JSON.stringify(searchCache));
  });

  it('should find nodes by type (case-insensitive)', async () => {
    const results = await searchInstalledNodes('httprequest');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].type).toBe('n8n-nodes-base.httpRequest');
  });

  it('should find nodes by displayName (case-insensitive)', async () => {
    const results = await searchInstalledNodes('webhook');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].displayName).toBe('Webhook');
  });

  it('should find nodes by description (case-insensitive)', async () => {
    const results = await searchInstalledNodes('javascript');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].displayName).toBe('Code');
  });

  it('should return empty array for no matches', async () => {
    const results = await searchInstalledNodes('nonexistentnode');
    expect(results).toEqual([]);
  });

  it('should search across all categories by default', async () => {
    const results = await searchInstalledNodes('connect');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should restrict search to specified category type', async () => {
    const results = await searchInstalledNodes('telegram', { type: 'core' });
    expect(results).toHaveLength(0);
  });

  it('should filter by community type', async () => {
    const results = await searchInstalledNodes('telegram', { type: 'community' });
    expect(results).toHaveLength(1);
    expect(results[0].displayName).toBe('Telegram');
  });

  it('should filter by custom type', async () => {
    const results = await searchInstalledNodes('crm', { type: 'custom' });
    expect(results).toHaveLength(1);
    expect(results[0].displayName).toBe('CRM Connector');
  });

  it('should throw when no cache is available', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    await expect(searchInstalledNodes('test')).rejects.toThrow('No cached node data');
  });

  it('should match partial strings', async () => {
    const results = await searchInstalledNodes('web');
    expect(results.some((n) => n.displayName === 'Webhook')).toBe(true);
  });

  it('should handle empty query string (matches everything)', async () => {
    const results = await searchInstalledNodes('');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle query with special regex characters safely', async () => {
    const results = await searchInstalledNodes('.*+?^${}()|[]\\');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle an invalid type filter gracefully', async () => {
    const results = await searchInstalledNodes('test', { type: 'nonexistent' });
    expect(results).toEqual([]);
  });

  it('should not crash when a node has null description', async () => {
    const cacheWithNull = makeCache({
      timestamp: Date.now(),
      nodes: {
        core: [{ type: 'n8n-nodes-base.test', displayName: 'Test', description: null }],
        community: [],
        custom: [],
      },
    });
    mockReadFile.mockResolvedValue(JSON.stringify(cacheWithNull));
    const results = await searchInstalledNodes('test');
    expect(Array.isArray(results)).toBe(true);
  });
});

// =============================================================================
// 12. getCustomNodes
// =============================================================================

describe('getCustomNodes', () => {
  it('should return custom nodes from cache', async () => {
    const cache = makeCache({ timestamp: Date.now() });
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const result = await getCustomNodes();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].type).toBe('custom.myNode');
  });

  it('should return empty array when cache does not exist', async () => {
    const result = await getCustomNodes();
    expect(result).toEqual([]);
  });

  it('should return empty array when cache has no nodes property', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ timestamp: Date.now() }));
    const result = await getCustomNodes();
    expect(result).toEqual([]);
  });

  it('should return empty array when cache.nodes has no custom property', async () => {
    const cache = { timestamp: Date.now(), nodes: { core: [], community: [] } };
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const result = await getCustomNodes();
    expect(result).toEqual([]);
  });
});

// =============================================================================
// 13. getCacheStatus
// =============================================================================

describe('getCacheStatus', () => {
  it('should return status object with all expected fields when no cache exists', async () => {
    const status = await getCacheStatus();
    expect(status).toEqual(expect.objectContaining({
      cachePath: DEFAULT_CACHE_PATH,
      ttlHours: 24,
      exists: false,
      stale: true,
      stats: null,
      lastFetched: null,
      source: null,
    }));
    expect(status.ageHours).toBeUndefined();
  });

  it('should report exists=true and stale=false when cache is fresh', async () => {
    const cache = makeCache({ timestamp: Date.now() });
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const status = await getCacheStatus();
    expect(status.exists).toBe(true);
    expect(status.stale).toBe(false);
  });

  it('should report stale=true when cache is expired', async () => {
    const cache = makeCache({ timestamp: Date.now() - (48 * 60 * 60 * 1000) });
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const status = await getCacheStatus();
    expect(status.stale).toBe(true);
  });

  it('should include stats from the cache', async () => {
    const cache = makeCache({
      timestamp: Date.now(),
      stats: { total: 100, core: 80, community: 15, custom: 5 },
    });
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const status = await getCacheStatus();
    expect(status.stats).toEqual({ total: 100, core: 80, community: 15, custom: 5 });
  });

  it('should include source from cache', async () => {
    const cache = makeCache({ timestamp: Date.now(), source: 'http://my-n8n:5678/api/v1' });
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const status = await getCacheStatus();
    expect(status.source).toBe('http://my-n8n:5678/api/v1');
  });

  it('should include lastFetched from cache fetchedAt', async () => {
    const iso = '2025-01-15T10:30:00.000Z';
    const cache = makeCache({ timestamp: Date.now(), fetchedAt: iso });
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const status = await getCacheStatus();
    expect(status.lastFetched).toBe(iso);
  });

  it('should derive lastFetched from timestamp when fetchedAt is missing', async () => {
    const ts = Date.now() - 1000;
    const cache = { timestamp: ts, version: '1.0.0', nodes: {}, stats: {} };
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const status = await getCacheStatus();
    expect(status.lastFetched).toBe(new Date(ts).toISOString());
  });

  it('should include ageHours when cache has timestamp', async () => {
    const sixHoursMs = 6 * 60 * 60 * 1000;
    const now = Date.now();
    const cache = makeCache({ timestamp: now - sixHoursMs });
    mockReadFile.mockResolvedValue(JSON.stringify(cache));

    const originalNow = Date.now;
    Date.now = jest.fn(() => now);
    const status = await getCacheStatus();
    Date.now = originalNow;

    expect(typeof status.ageHours).toBe('number');
    expect(status.ageHours).toBeCloseTo(6, 0);
  });
});

// =============================================================================
// 14. Integration test: loadCache + saveCache round trip
// =============================================================================

describe('loadCache + saveCache round trip', () => {
  it('should save and load producing the same data structure', async () => {
    let savedContent = null;
    mockWriteFile.mockImplementation((filePath, content) => {
      savedContent = content;
      return Promise.resolve();
    });

    const data = { nodes: { core: [], community: [], custom: [] }, stats: { total: 0 } };
    await saveCache(data);

    mockReadFile.mockResolvedValue(savedContent);
    const loaded = await loadCache();

    expect(loaded.nodes).toEqual(data.nodes);
    expect(loaded.stats).toEqual(data.stats);
    expect(loaded.timestamp).toBeDefined();
    expect(loaded.version).toBe('1.0.0');
  });
});

// =============================================================================
// 15. getCachedNodes edge cases
// =============================================================================

describe('getCachedNodes edge cases', () => {
  it('should return cache even if nodes object is empty', async () => {
    const cache = { timestamp: Date.now(), nodes: {} };
    mockReadFile.mockResolvedValue(JSON.stringify(cache));
    const result = await getCachedNodes();
    expect(result).toBeTruthy();
    expect(result.nodes).toEqual({});
  });
});
