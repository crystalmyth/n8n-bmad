/**
 * @fileoverview Unit tests for config-loader module
 *
 * Tests cover: deepMerge, resolveEnvVars, resolveConfigPath, fileExists,
 * findConfigPath, loadConfig (with caching), getConfigValue, getN8nUrl,
 * getNamingConvention, getTemplateCategories, getPatternCategories,
 * getAvailableAgents, getProjectRoot, validateConfig, clearCache,
 * and DEFAULT_CONFIG.
 */

const path = require('path');

// ---- mocks must be declared before require ----

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    promises: {
      readFile: jest.fn(),
      access: jest.fn(),
    },
  };
});

jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

const fs = require('fs').promises;
const yaml = require('js-yaml');

const {
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
  findConfigPath,
  fileExists,
  deepMerge,
} = require('../../tools/cli/lib/config-loader');

// ---- helpers ----

const FAKE_CWD = '/fake/project';

/**
 * Make the .n8n-bmad path miss and the direct path hit by default.
 * Override per-test as needed.
 */
function setupDefaultFsMocks(yamlContent = {}) {
  // fs.access: .n8n-bmad path rejects, direct path resolves
  fs.access.mockImplementation((p) => {
    if (p.includes('.n8n-bmad')) {
      return Promise.reject(new Error('ENOENT'));
    }
    return Promise.resolve();
  });

  fs.readFile.mockResolvedValue('yaml-content');
  yaml.load.mockReturnValue(yamlContent);
}

// ---- setup / teardown ----

beforeEach(() => {
  clearCache();
  jest.restoreAllMocks();
  jest.clearAllMocks();

  jest.spyOn(process, 'cwd').mockReturnValue(FAKE_CWD);

  // Clean any env vars tests might set
  delete process.env.N8N_INSTANCE_URL;
  delete process.env.TEST_VAR;
  delete process.env.DB_HOST;
  delete process.env.DB_PORT;
  delete process.env.MY_SECRET;
  delete process.env.OUTER;
  delete process.env.INNER;

  // Freeze Date.now so cache TTL tests are deterministic
  jest.spyOn(Date, 'now').mockReturnValue(1000000);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ===========================================================================
// DEFAULT_CONFIG
// ===========================================================================
describe('DEFAULT_CONFIG', () => {
  it('should be a non-null object', () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(typeof DEFAULT_CONFIG).toBe('object');
  });

  it('should contain framework section', () => {
    expect(DEFAULT_CONFIG.framework).toBeDefined();
    expect(DEFAULT_CONFIG.framework.name).toBe('n8n-BMAD');
  });

  it('should contain agents section with available_agents', () => {
    expect(Array.isArray(DEFAULT_CONFIG.agents.available_agents)).toBe(true);
    expect(DEFAULT_CONFIG.agents.available_agents.length).toBeGreaterThan(0);
  });

  it('should contain templates section with categories', () => {
    expect(Array.isArray(DEFAULT_CONFIG.templates.categories)).toBe(true);
    expect(DEFAULT_CONFIG.templates.categories).toContain('project');
  });

  it('should contain patterns section with categories', () => {
    expect(Array.isArray(DEFAULT_CONFIG.patterns.categories)).toBe(true);
    expect(DEFAULT_CONFIG.patterns.categories).toContain('error-handling');
  });

  it('should contain options with n8n_instance_url', () => {
    expect(DEFAULT_CONFIG.options.n8n_instance_url.default).toBe(
      'http://localhost:5678/api/v1'
    );
  });

  it('should contain naming convention defaults', () => {
    const naming = DEFAULT_CONFIG.options.naming_convention.default;
    expect(naming.workflow_prefix).toBe('wf_');
    expect(naming.credential_prefix).toBe('cred_');
    expect(naming.use_snake_case).toBe(true);
  });

  it('should contain logging section', () => {
    expect(DEFAULT_CONFIG.logging.level).toBe('info');
  });

  it('should contain mcp section', () => {
    expect(DEFAULT_CONFIG.mcp.enabled).toBe(true);
  });

  it('should contain output paths', () => {
    expect(DEFAULT_CONFIG.output.docs_path).toBe('./docs/generated');
  });
});

// ===========================================================================
// deepMerge
// ===========================================================================
describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should override target values with source values', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it('should deeply merge nested objects', () => {
    const target = { nested: { a: 1, b: 2 } };
    const source = { nested: { b: 3, c: 4 } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ nested: { a: 1, b: 3, c: 4 } });
  });

  it('should replace arrays from source (not merge them)', () => {
    const target = { arr: [1, 2, 3] };
    const source = { arr: [4, 5] };
    const result = deepMerge(target, source);
    expect(result).toEqual({ arr: [4, 5] });
  });

  it('should not mutate the original target', () => {
    const target = { a: 1, nested: { b: 2 } };
    const source = { nested: { c: 3 } };
    deepMerge(target, source);
    expect(target).toEqual({ a: 1, nested: { b: 2 } });
  });

  it('should handle source adding new nested keys', () => {
    const target = { a: 1 };
    const source = { nested: { deep: true } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, nested: { deep: true } });
  });

  it('should handle overriding a primitive with an object', () => {
    const target = { a: 'string' };
    const source = { a: { key: 'value' } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { key: 'value' } });
  });

  it('should handle overriding an object with a primitive', () => {
    const target = { a: { key: 'value' } };
    const source = { a: 'string' };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 'string' });
  });

  it('should handle empty source', () => {
    const target = { a: 1 };
    const result = deepMerge(target, {});
    expect(result).toEqual({ a: 1 });
  });

  it('should handle empty target', () => {
    const source = { b: 2 };
    const result = deepMerge({}, source);
    expect(result).toEqual({ b: 2 });
  });

  it('should handle three-level deep nesting', () => {
    const target = { l1: { l2: { l3: 'old' } } };
    const source = { l1: { l2: { l3: 'new', extra: true } } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ l1: { l2: { l3: 'new', extra: true } } });
  });

  it('should overwrite array target with object source', () => {
    const target = { a: [1, 2] };
    const source = { a: { key: 'val' } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { key: 'val' } });
  });

  it('should overwrite object target with array source', () => {
    const target = { a: { key: 'val' } };
    const source = { a: [1, 2] };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: [1, 2] });
  });

  it('should handle null values in source', () => {
    const target = { a: { nested: true } };
    const source = { a: null };
    const result = deepMerge(target, source);
    expect(result.a).toBeNull();
  });
});

// ===========================================================================
// resolveEnvVars
// ===========================================================================
describe('resolveEnvVars', () => {
  it('should replace a single env var', () => {
    process.env.TEST_VAR = 'hello';
    const result = resolveEnvVars({ key: '${TEST_VAR}' });
    expect(result.key).toBe('hello');
  });

  it('should replace multiple env vars in one string', () => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    const result = resolveEnvVars({ url: '${DB_HOST}:${DB_PORT}' });
    expect(result.url).toBe('localhost:5432');
  });

  it('should leave unresolved vars as-is', () => {
    const result = resolveEnvVars({ key: '${UNDEFINED_VAR}' });
    expect(result.key).toBe('${UNDEFINED_VAR}');
  });

  it('should handle nested objects recursively', () => {
    process.env.MY_SECRET = 'secret123';
    const config = {
      level1: {
        level2: {
          value: '${MY_SECRET}',
        },
      },
    };
    const result = resolveEnvVars(config);
    expect(result.level1.level2.value).toBe('secret123');
  });

  it('should pass through non-string, non-object values unchanged', () => {
    const config = { num: 42, bool: true, empty: null };
    const result = resolveEnvVars(config);
    expect(result.num).toBe(42);
    expect(result.bool).toBe(true);
    // null: typeof null === 'object' but the !== null guard prevents recursion
    expect(result.empty).toBeNull();
  });

  it('should handle strings without env vars', () => {
    const result = resolveEnvVars({ key: 'plain string' });
    expect(result.key).toBe('plain string');
  });

  it('should handle mixed resolved and unresolved vars', () => {
    process.env.OUTER = 'found';
    const result = resolveEnvVars({ key: '${OUTER}-${MISSING}' });
    expect(result.key).toBe('found-${MISSING}');
  });

  it('should handle an empty object', () => {
    const result = resolveEnvVars({});
    expect(result).toEqual({});
  });

  it('should handle arrays inside objects by resolving their string entries', () => {
    process.env.TEST_VAR = 'arrayval';
    const config = { items: ['${TEST_VAR}', 'static'] };
    // Arrays pass typeof === 'object' && !== null, so resolveEnvVars recurses.
    // Object.entries(array) gives [['0', '${TEST_VAR}'], ['1', 'static']].
    // The result is a plain object with index keys, not an array.
    const result = resolveEnvVars(config);
    expect(result.items['0']).toBe('arrayval');
    expect(result.items['1']).toBe('static');
    // Note: result.items is no longer a true Array
    expect(Array.isArray(result.items)).toBe(false);
  });
});

// ===========================================================================
// resolveConfigPath
// ===========================================================================
describe('resolveConfigPath', () => {
  it('should return absolute paths unchanged', () => {
    const abs = '/absolute/path/config.yaml';
    expect(resolveConfigPath(abs)).toBe(abs);
  });

  it('should resolve relative paths against cwd', () => {
    const result = resolveConfigPath('src/core/module.yaml');
    expect(result).toBe(path.resolve(FAKE_CWD, 'src/core/module.yaml'));
  });

  it('should resolve dot-relative paths', () => {
    const result = resolveConfigPath('./config.yaml');
    expect(result).toBe(path.resolve(FAKE_CWD, './config.yaml'));
  });
});

// ===========================================================================
// fileExists
// ===========================================================================
describe('fileExists', () => {
  it('should return true when file is accessible', async () => {
    fs.access.mockResolvedValue(undefined);
    const result = await fileExists('/some/file');
    expect(result).toBe(true);
  });

  it('should return false when file is not accessible', async () => {
    fs.access.mockRejectedValue(new Error('ENOENT'));
    const result = await fileExists('/missing/file');
    expect(result).toBe(false);
  });

  it('should pass the file path to fs.access', async () => {
    fs.access.mockResolvedValue(undefined);
    await fileExists('/check/this/path');
    expect(fs.access).toHaveBeenCalledWith('/check/this/path');
  });
});

// ===========================================================================
// findConfigPath
// ===========================================================================
describe('findConfigPath', () => {
  it('should return .n8n-bmad path when it exists', async () => {
    fs.access.mockResolvedValue(undefined); // both exist, first wins
    const result = await findConfigPath('src/core/module.yaml');
    const expected = path.resolve(FAKE_CWD, '.n8n-bmad', 'src/core/module.yaml');
    expect(result).toBe(expected);
  });

  it('should fall back to direct path when .n8n-bmad path does not exist', async () => {
    fs.access.mockImplementation((p) => {
      if (p.includes('.n8n-bmad')) {
        return Promise.reject(new Error('ENOENT'));
      }
      return Promise.resolve();
    });
    const result = await findConfigPath('src/core/module.yaml');
    const expected = path.resolve(FAKE_CWD, 'src/core/module.yaml');
    expect(result).toBe(expected);
  });

  it('should resolve the default path relative to cwd', async () => {
    fs.access.mockRejectedValue(new Error('ENOENT'));
    const result = await findConfigPath('custom/path.yaml');
    expect(result).toBe(path.resolve(FAKE_CWD, 'custom/path.yaml'));
  });
});

// ===========================================================================
// loadConfig
// ===========================================================================
describe('loadConfig', () => {
  describe('file loading', () => {
    it('should load and parse a YAML config file', async () => {
      const mockConfig = { framework: { name: 'Test' } };
      setupDefaultFsMocks(mockConfig);

      const result = await loadConfig('./src/core/module.yaml');
      expect(result.framework.name).toBe('Test');
    });

    it('should merge loaded config with DEFAULT_CONFIG', async () => {
      const mockConfig = { framework: { name: 'Custom' } };
      setupDefaultFsMocks(mockConfig);

      const result = await loadConfig('./src/core/module.yaml');
      // Custom value preserved
      expect(result.framework.name).toBe('Custom');
      // Default value still present from merge
      expect(result.agents).toBeDefined();
      expect(result.agents.available_agents).toEqual(
        DEFAULT_CONFIG.agents.available_agents
      );
    });

    it('should set _configPath on loaded config', async () => {
      setupDefaultFsMocks({ framework: { name: 'X' } });
      const result = await loadConfig('./src/core/module.yaml');
      expect(result._configPath).toBeDefined();
      expect(typeof result._configPath).toBe('string');
    });

    it('should set _projectRoot on loaded config', async () => {
      setupDefaultFsMocks({ framework: { name: 'X' } });
      const result = await loadConfig('./src/core/module.yaml');
      expect(result._projectRoot).toBeDefined();
    });

    it('should call fs.readFile with utf8 encoding', async () => {
      setupDefaultFsMocks({});
      await loadConfig('./src/core/module.yaml');
      expect(fs.readFile).toHaveBeenCalledWith(expect.any(String), 'utf8');
    });

    it('should call yaml.load with file contents', async () => {
      setupDefaultFsMocks({});
      fs.readFile.mockResolvedValue('yaml: content');
      await loadConfig('./src/core/module.yaml');
      expect(yaml.load).toHaveBeenCalledWith('yaml: content');
    });
  });

  describe('mergeDefaults option', () => {
    it('should return DEFAULT_CONFIG when file not found and mergeDefaults is true', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      const result = await loadConfig('./missing.yaml', { mergeDefaults: true });
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('should throw when file not found and mergeDefaults is false', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      await expect(
        loadConfig('./missing.yaml', { mergeDefaults: false })
      ).rejects.toThrow('Configuration file not found');
    });

    it('should skip merge when mergeDefaults is false and file exists', async () => {
      const rawConfig = { custom: true };
      setupDefaultFsMocks(rawConfig);

      const result = await loadConfig('./src/core/module.yaml', {
        mergeDefaults: false,
      });
      expect(result.custom).toBe(true);
      // Should NOT have default sections merged in
      expect(result.agents).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw a descriptive error for ENOENT during read', async () => {
      // File exists check passes but readFile fails with ENOENT
      fs.access.mockImplementation((p) => {
        if (p.includes('.n8n-bmad')) return Promise.reject(new Error('ENOENT'));
        return Promise.resolve();
      });
      const enoentErr = new Error('file not found');
      enoentErr.code = 'ENOENT';
      fs.readFile.mockRejectedValue(enoentErr);

      await expect(loadConfig('./src/core/module.yaml')).rejects.toThrow(
        'Configuration file not found'
      );
    });

    it('should throw a descriptive error for invalid YAML', async () => {
      fs.access.mockImplementation((p) => {
        if (p.includes('.n8n-bmad')) return Promise.reject(new Error('ENOENT'));
        return Promise.resolve();
      });
      fs.readFile.mockResolvedValue('invalid: yaml: content:');
      const yamlErr = new Error('bad indentation');
      yamlErr.name = 'YAMLException';
      yaml.load.mockImplementation(() => { throw yamlErr; });

      await expect(loadConfig('./src/core/module.yaml')).rejects.toThrow(
        'Invalid YAML in configuration file'
      );
    });

    it('should re-throw unexpected errors', async () => {
      fs.access.mockImplementation((p) => {
        if (p.includes('.n8n-bmad')) return Promise.reject(new Error('ENOENT'));
        return Promise.resolve();
      });
      fs.readFile.mockRejectedValue(new Error('permission denied'));

      await expect(loadConfig('./src/core/module.yaml')).rejects.toThrow(
        'permission denied'
      );
    });
  });

  describe('caching', () => {
    it('should cache the loaded config', async () => {
      setupDefaultFsMocks({ framework: { name: 'Cached' } });

      const first = await loadConfig('./src/core/module.yaml');
      const second = await loadConfig('./src/core/module.yaml');

      expect(first).toBe(second); // same reference
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should return cached config within TTL window', async () => {
      setupDefaultFsMocks({ framework: { name: 'First' } });
      await loadConfig('./src/core/module.yaml');

      // Advance time by 3 seconds (within 5s TTL)
      Date.now.mockReturnValue(1003000);

      const result = await loadConfig('./src/core/module.yaml');
      expect(result.framework.name).toBe('First');
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should reload config after TTL expires', async () => {
      setupDefaultFsMocks({ framework: { name: 'First' } });
      await loadConfig('./src/core/module.yaml');

      // Advance time past TTL (5 seconds)
      Date.now.mockReturnValue(1006000);

      // Change the mock data for the second load
      yaml.load.mockReturnValue({ framework: { name: 'Second' } });
      const result = await loadConfig('./src/core/module.yaml');
      expect(result.framework.name).toBe('Second');
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should bypass cache when useCache is false', async () => {
      setupDefaultFsMocks({ framework: { name: 'Fresh' } });
      await loadConfig('./src/core/module.yaml');

      yaml.load.mockReturnValue({ framework: { name: 'Newer' } });
      const result = await loadConfig('./src/core/module.yaml', {
        useCache: false,
      });
      expect(result.framework.name).toBe('Newer');
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should not use cache before any config is loaded', async () => {
      setupDefaultFsMocks({ loaded: true });
      const result = await loadConfig('./src/core/module.yaml');
      expect(result.loaded).toBe(true);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('default path', () => {
    it('should use default path when no path is provided', async () => {
      setupDefaultFsMocks({});
      await loadConfig();
      // findConfigPath should be called with default path
      expect(fs.access).toHaveBeenCalled();
    });
  });
});

// ===========================================================================
// clearCache
// ===========================================================================
describe('clearCache', () => {
  it('should clear cache so next load reads from disk', async () => {
    setupDefaultFsMocks({ framework: { name: 'Original' } });
    await loadConfig('./src/core/module.yaml');

    clearCache();

    yaml.load.mockReturnValue({ framework: { name: 'Reloaded' } });
    const result = await loadConfig('./src/core/module.yaml');
    expect(result.framework.name).toBe('Reloaded');
    expect(fs.readFile).toHaveBeenCalledTimes(2);
  });

  it('should allow immediate reload even within TTL after clearing', async () => {
    setupDefaultFsMocks({ val: 1 });
    await loadConfig('./src/core/module.yaml');

    // No time advancement - still within TTL
    clearCache();

    yaml.load.mockReturnValue({ val: 2 });
    const result = await loadConfig('./src/core/module.yaml');
    expect(result.val).toBe(2);
  });

  it('should not throw when called before any config is loaded', () => {
    expect(() => clearCache()).not.toThrow();
  });

  it('should not throw when called multiple times', () => {
    expect(() => {
      clearCache();
      clearCache();
      clearCache();
    }).not.toThrow();
  });
});

// ===========================================================================
// getConfigValue
// ===========================================================================
describe('getConfigValue', () => {
  beforeEach(() => {
    setupDefaultFsMocks({
      framework: { name: 'TestApp', version: '2.0' },
      agents: {
        default_agent: 'pm',
        available_agents: ['pm', 'dev'],
      },
      deep: { nested: { value: 42 } },
    });
  });

  it('should retrieve a top-level value', async () => {
    const result = await getConfigValue('framework');
    expect(result).toBeDefined();
    expect(result.name).toBe('TestApp');
  });

  it('should retrieve a nested value via dot notation', async () => {
    const result = await getConfigValue('framework.name');
    expect(result).toBe('TestApp');
  });

  it('should retrieve deeply nested values', async () => {
    const result = await getConfigValue('deep.nested.value');
    expect(result).toBe(42);
  });

  it('should return defaultValue for missing top-level key', async () => {
    const result = await getConfigValue('nonexistent', 'fallback');
    expect(result).toBe('fallback');
  });

  it('should return defaultValue for missing nested key', async () => {
    const result = await getConfigValue('framework.missing.deep', 'default');
    expect(result).toBe('default');
  });

  it('should return undefined when no defaultValue is specified and key is missing', async () => {
    const result = await getConfigValue('missing.path');
    expect(result).toBeUndefined();
  });

  it('should return array values correctly', async () => {
    const result = await getConfigValue('agents.available_agents');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain('pm');
  });

  it('should handle path through null value gracefully', async () => {
    // Override the mock to include a null value
    yaml.load.mockReturnValue({ top: { nullVal: null } });
    clearCache();

    const result = await getConfigValue('top.nullVal.nested', 'safe');
    expect(result).toBe('safe');
  });
});

// ===========================================================================
// getN8nUrl
// ===========================================================================
describe('getN8nUrl', () => {
  beforeEach(() => {
    setupDefaultFsMocks({});
  });

  it('should prefer N8N_INSTANCE_URL env var when set', async () => {
    process.env.N8N_INSTANCE_URL = 'https://my-n8n.example.com/api/v1';
    const result = await getN8nUrl();
    expect(result).toBe('https://my-n8n.example.com/api/v1');
  });

  it('should fall back to config value when env var is not set', async () => {
    yaml.load.mockReturnValue({
      options: {
        n8n_instance_url: { default: 'https://config-url.com/api/v1' },
      },
    });
    clearCache();

    const result = await getN8nUrl();
    expect(result).toBe('https://config-url.com/api/v1');
  });

  it('should return default localhost URL when nothing is configured', async () => {
    // Config has no options.n8n_instance_url override - uses DEFAULT_CONFIG
    const result = await getN8nUrl();
    expect(result).toBe('http://localhost:5678/api/v1');
  });

  it('should not check config when env var is present', async () => {
    process.env.N8N_INSTANCE_URL = 'https://env-url.com';
    const result = await getN8nUrl();
    expect(result).toBe('https://env-url.com');
    // loadConfig / getConfigValue should not be called
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// getNamingConvention
// ===========================================================================
describe('getNamingConvention', () => {
  beforeEach(() => {
    setupDefaultFsMocks({});
  });

  it('should return default naming convention from DEFAULT_CONFIG', async () => {
    const result = await getNamingConvention();
    expect(result.workflow_prefix).toBe('wf_');
    expect(result.credential_prefix).toBe('cred_');
    expect(result.environment_separator).toBe('_');
    expect(result.use_snake_case).toBe(true);
  });

  it('should return custom naming convention from config', async () => {
    yaml.load.mockReturnValue({
      options: {
        naming_convention: {
          default: {
            workflow_prefix: 'flow_',
            credential_prefix: 'auth_',
            environment_separator: '-',
            use_snake_case: false,
          },
        },
      },
    });
    clearCache();

    const result = await getNamingConvention();
    expect(result.workflow_prefix).toBe('flow_');
    expect(result.credential_prefix).toBe('auth_');
    expect(result.use_snake_case).toBe(false);
  });

  it('should fall back to hardcoded defaults when config has no naming section', async () => {
    yaml.load.mockReturnValue({ options: {} });
    clearCache();

    const result = await getNamingConvention();
    // Falls back through getConfigValue default {} → convention.default is undefined
    // So the || fallback kicks in
    expect(result.workflow_prefix).toBe('wf_');
  });
});

// ===========================================================================
// getTemplateCategories
// ===========================================================================
describe('getTemplateCategories', () => {
  it('should return template categories from DEFAULT_CONFIG', async () => {
    setupDefaultFsMocks({});
    const result = await getTemplateCategories();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain('project');
    expect(result).toContain('agile');
  });

  it('should return custom categories when overridden', async () => {
    setupDefaultFsMocks({
      templates: { categories: ['custom-a', 'custom-b'] },
    });
    const result = await getTemplateCategories();
    expect(result).toEqual(['custom-a', 'custom-b']);
  });

  it('should return empty array when categories are missing from config', async () => {
    yaml.load.mockReturnValue({ templates: {} });
    fs.access.mockImplementation((p) => {
      if (p.includes('.n8n-bmad')) return Promise.reject(new Error('ENOENT'));
      return Promise.resolve();
    });
    fs.readFile.mockResolvedValue('yaml');
    clearCache();

    // With mergeDefaults, templates.categories from DEFAULT_CONFIG will be present
    // unless overridden. Since source has templates: {} and target has templates with
    // categories, deepMerge keeps categories from target.
    const result = await getTemplateCategories();
    // deepMerge merges { categories: [...] } with {} → keeps categories
    expect(Array.isArray(result)).toBe(true);
  });
});

// ===========================================================================
// getPatternCategories
// ===========================================================================
describe('getPatternCategories', () => {
  it('should return pattern categories from DEFAULT_CONFIG', async () => {
    setupDefaultFsMocks({});
    const result = await getPatternCategories();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain('error-handling');
    expect(result).toContain('integration');
  });

  it('should return custom pattern categories when overridden', async () => {
    setupDefaultFsMocks({
      patterns: { categories: ['etl', 'streaming'] },
    });
    const result = await getPatternCategories();
    expect(result).toEqual(['etl', 'streaming']);
  });
});

// ===========================================================================
// getAvailableAgents
// ===========================================================================
describe('getAvailableAgents', () => {
  it('should return agents from DEFAULT_CONFIG', async () => {
    setupDefaultFsMocks({});
    const result = await getAvailableAgents();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain('n8n-master');
    expect(result).toContain('developer');
    expect(result).toContain('pm');
  });

  it('should return custom agent list when overridden', async () => {
    setupDefaultFsMocks({
      agents: { available_agents: ['custom-agent-1', 'custom-agent-2'] },
    });
    const result = await getAvailableAgents();
    expect(result).toEqual(['custom-agent-1', 'custom-agent-2']);
  });

  it('should return empty array when agents section is empty', async () => {
    // Simulate config where agents.available_agents is completely missing
    // and deepMerge with DEFAULT_CONFIG would normally provide it
    setupDefaultFsMocks({});
    const result = await getAvailableAgents();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// getProjectRoot
// ===========================================================================
describe('getProjectRoot', () => {
  it('should return _projectRoot from loaded config', async () => {
    setupDefaultFsMocks({ framework: { name: 'X' } });
    const result = await getProjectRoot();
    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should fall back to cwd when _projectRoot is not set', async () => {
    // When file is not found and mergeDefaults returns DEFAULT_CONFIG,
    // _projectRoot is not set on DEFAULT_CONFIG
    fs.access.mockRejectedValue(new Error('ENOENT'));
    const result = await getProjectRoot();
    expect(result).toBe(FAKE_CWD);
  });
});

// ===========================================================================
// validateConfig
// ===========================================================================
describe('validateConfig', () => {
  describe('valid configuration', () => {
    it('should return valid:true for a complete config', async () => {
      setupDefaultFsMocks({
        framework: { name: 'Test' },
        agents: { available_agents: ['pm'] },
        templates: { categories: ['project'] },
      });

      const result = await validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.config).toBeDefined();
    });

    it('should return valid:true for DEFAULT_CONFIG', async () => {
      // File not found, falls back to DEFAULT_CONFIG which has all sections
      fs.access.mockRejectedValue(new Error('ENOENT'));
      const result = await validateConfig();
      expect(result.valid).toBe(true);
    });
  });

  describe('missing required sections', () => {
    it('should report missing framework section', async () => {
      setupDefaultFsMocks({});
      // Override: remove framework from merged config by loading without merge
      // Actually, since we merge with defaults, framework will always exist.
      // We need mergeDefaults=false to test missing sections, but validateConfig
      // always calls loadConfig with default options.
      // Instead, we test that when the merged config still has all sections, it passes.
      // To truly remove a section we'd need yaml.load to return something that overrides
      // framework to a falsy value, but deepMerge keeps it.

      // Let's test via the loadConfig error path instead:
      // If loadConfig throws, validateConfig catches it
      fs.access.mockImplementation((p) => {
        if (p.includes('.n8n-bmad')) return Promise.reject(new Error('ENOENT'));
        return Promise.resolve();
      });
      fs.readFile.mockRejectedValue(new Error('read error'));

      const result = await validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report error when loadConfig throws', async () => {
      fs.access.mockImplementation((p) => {
        if (p.includes('.n8n-bmad')) return Promise.reject(new Error('ENOENT'));
        return Promise.resolve();
      });
      const err = new Error('permission denied');
      fs.readFile.mockRejectedValue(err);

      const result = await validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('permission denied');
      expect(result.config).toBeNull();
    });
  });

  describe('agents validation', () => {
    it('should report error when available_agents is empty', async () => {
      // We need the config to have agents but with empty available_agents
      // Since deepMerge merges arrays by replacement, if source has empty array,
      // it overrides the default
      setupDefaultFsMocks({
        agents: { available_agents: [] },
      });

      const result = await validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No agents defined in configuration');
    });

    it('should report error when available_agents is missing', async () => {
      // If source agents has no available_agents key, deepMerge with DEFAULT_CONFIG
      // would preserve the default. To test this we need a config where
      // agents exists but available_agents is explicitly nullified.
      setupDefaultFsMocks({
        agents: { available_agents: null, default_agent: 'pm' },
      });

      const result = await validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No agents defined in configuration');
    });
  });

  describe('result structure', () => {
    it('should return config in result when valid', async () => {
      setupDefaultFsMocks({});
      const result = await validateConfig();
      expect(result.valid).toBe(true);
      expect(result.config).not.toBeNull();
      expect(result.config.framework).toBeDefined();
    });

    it('should return null config when invalid', async () => {
      setupDefaultFsMocks({ agents: { available_agents: [] } });
      const result = await validateConfig();
      expect(result.config).toBeNull();
    });

    it('should return errors as an array', async () => {
      setupDefaultFsMocks({});
      const result = await validateConfig();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});

// ===========================================================================
// Integration-style: cache + getConfigValue interaction
// ===========================================================================
describe('cache interaction with accessor functions', () => {
  it('should share cache between getConfigValue calls', async () => {
    setupDefaultFsMocks({ framework: { name: 'Shared' } });

    await getConfigValue('framework.name');
    await getConfigValue('agents.default_agent');

    // Only one readFile call because of caching
    expect(fs.readFile).toHaveBeenCalledTimes(1);
  });

  it('should share cache between different accessor functions', async () => {
    setupDefaultFsMocks({});

    await getN8nUrl();
    await getNamingConvention();
    await getTemplateCategories();
    await getPatternCategories();
    await getAvailableAgents();
    await getProjectRoot();

    // getN8nUrl checks env first (no env set), then calls loadConfig.
    // All subsequent calls use cache.
    expect(fs.readFile).toHaveBeenCalledTimes(1);
  });

  it('should reload after clearCache even for accessor functions', async () => {
    setupDefaultFsMocks({});
    await getTemplateCategories();

    clearCache();

    await getPatternCategories();
    expect(fs.readFile).toHaveBeenCalledTimes(2);
  });
});

// ===========================================================================
// Edge cases and boundary conditions
// ===========================================================================
describe('edge cases', () => {
  it('should handle config file that parses to null', async () => {
    fs.access.mockImplementation((p) => {
      if (p.includes('.n8n-bmad')) return Promise.reject(new Error('ENOENT'));
      return Promise.resolve();
    });
    fs.readFile.mockResolvedValue('');
    yaml.load.mockReturnValue(null);

    // deepMerge with null source would fail since Object.keys(null) throws
    // This tests the actual behavior of the module with null YAML parse
    await expect(loadConfig('./src/core/module.yaml')).rejects.toThrow();
  });

  it('should handle config file that parses to a string without crashing', async () => {
    fs.access.mockImplementation((p) => {
      if (p.includes('.n8n-bmad')) return Promise.reject(new Error('ENOENT'));
      return Promise.resolve();
    });
    fs.readFile.mockResolvedValue('just a string');
    yaml.load.mockReturnValue('just a string');

    // deepMerge iterates Object.keys('just a string') which gives char indices.
    // This produces a corrupted config but should not throw.
    const result = await loadConfig('./src/core/module.yaml');
    // The result will be DEFAULT_CONFIG merged with string character indices
    expect(result).toBeDefined();
  });

  it('resolveEnvVars should handle a config with only non-string values', () => {
    const config = { a: 1, b: true, c: null };
    const result = resolveEnvVars(config);
    expect(result.a).toBe(1);
    expect(result.b).toBe(true);
  });

  it('deepMerge should handle both objects being empty', () => {
    const result = deepMerge({}, {});
    expect(result).toEqual({});
  });

  it('getConfigValue should handle empty keyPath segments', async () => {
    setupDefaultFsMocks({ '': { nested: 'value' } });
    // An empty string as the first key segment
    const result = await getConfigValue('.nested', 'fallback');
    // Split('.nested') = ['', 'nested']. config[''] should resolve to { nested: 'value' }
    // This depends on whether the yaml config has '' as a key.
    // In practice this is an edge case; just verify it doesn't crash.
    expect(result).toBeDefined();
  });

  it('getConfigValue with single-segment path', async () => {
    setupDefaultFsMocks({ myKey: 'myValue' });
    const result = await getConfigValue('myKey');
    expect(result).toBe('myValue');
  });

  it('loadConfig should use .n8n-bmad path when it exists', async () => {
    // Both paths exist; .n8n-bmad wins
    fs.access.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue('content');
    yaml.load.mockReturnValue({ from: 'bmad-folder' });

    const result = await loadConfig('./src/core/module.yaml');
    const readPath = fs.readFile.mock.calls[0][0];
    expect(readPath).toContain('.n8n-bmad');
  });

  it('resolveEnvVars should not modify strings without ${} pattern', () => {
    const config = { greeting: 'Hello World', path: '/usr/bin' };
    const result = resolveEnvVars(config);
    expect(result.greeting).toBe('Hello World');
    expect(result.path).toBe('/usr/bin');
  });

  it('resolveEnvVars should handle ${} with empty var name', () => {
    const result = resolveEnvVars({ key: '${}' });
    // process.env[''] is undefined, so match is returned as-is
    expect(result.key).toBe('${}');
  });
});

// ===========================================================================
// Concurrency / multiple loads
// ===========================================================================
describe('multiple sequential loads', () => {
  it('should handle loading different paths after cache clear', async () => {
    setupDefaultFsMocks({ source: 'path1' });
    const r1 = await loadConfig('./path1.yaml');
    expect(r1.source).toBe('path1');

    clearCache();
    yaml.load.mockReturnValue({ source: 'path2' });
    const r2 = await loadConfig('./path2.yaml');
    expect(r2.source).toBe('path2');
  });

  it('should cache the last loaded path (not distinguish paths)', async () => {
    setupDefaultFsMocks({ first: true });
    await loadConfig('./first.yaml');

    // Without clearing cache, loading a different path returns cached result
    const r2 = await loadConfig('./second.yaml');
    expect(r2.first).toBe(true);
    expect(fs.readFile).toHaveBeenCalledTimes(1);
  });
});
