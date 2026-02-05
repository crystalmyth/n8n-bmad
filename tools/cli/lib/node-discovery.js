/**
 * Node Discovery module for n8n-BMAD CLI
 * Discovers installed nodes from n8n instance and manages cached results
 *
 * @module lib/node-discovery
 * @description Handles querying n8n API for installed nodes, categorization, and caching
 */

const fs = require('fs').promises;
const path = require('path');
const { getN8nUrl, getConfigValue } = require('./config-loader');

/**
 * Default cache TTL in milliseconds (24 hours)
 * @type {number}
 */
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Core node prefixes that identify built-in n8n nodes
 * @type {string[]}
 */
const CORE_NODE_PREFIXES = [
  'n8n-nodes-base.',
  '@n8n/n8n-nodes-',
  'n8n-nodes-langchain.',
];

/**
 * Community node prefixes (npm packages)
 * @type {string[]}
 */
const COMMUNITY_NODE_PREFIXES = [
  'n8n-nodes-',
  '@community/',
];

/**
 * Get the cache file path from config or default
 * @async
 * @returns {Promise<string>} Cache file path
 */
async function getCachePath() {
  try {
    const configPath = await getConfigValue('node_discovery.cache_path');
    if (configPath) {
      return path.resolve(process.cwd(), configPath);
    }
  } catch (e) {
    // Config not available, use default
  }
  return path.resolve(process.cwd(), '.n8n-bmad', 'cache', 'installed-nodes.json');
}

/**
 * Get cache TTL from config or use default
 * @async
 * @returns {Promise<number>} TTL in milliseconds
 */
async function getCacheTTL() {
  try {
    const hours = await getConfigValue('node_discovery.cache_ttl_hours');
    if (hours && typeof hours === 'number') {
      return hours * 60 * 60 * 1000;
    }
  } catch (e) {
    // Config not available
  }
  return DEFAULT_CACHE_TTL_MS;
}

/**
 * Check if cache is stale based on TTL
 * @param {Object} cache - Cache object with timestamp
 * @param {number} ttlMs - TTL in milliseconds
 * @returns {boolean} True if cache is stale
 */
function isCacheStale(cache, ttlMs) {
  if (!cache || !cache.timestamp) {
    return true;
  }
  const age = Date.now() - cache.timestamp;
  return age > ttlMs;
}

/**
 * Load cache from disk
 * @async
 * @returns {Promise<Object|null>} Cached data or null if not available
 */
async function loadCache() {
  try {
    const cachePath = await getCachePath();
    const content = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * Save cache to disk
 * @async
 * @param {Object} data - Data to cache
 * @returns {Promise<void>}
 */
async function saveCache(data) {
  const cachePath = await getCachePath();
  const cacheDir = path.dirname(cachePath);

  // Ensure cache directory exists
  await fs.mkdir(cacheDir, { recursive: true });

  const cacheData = {
    ...data,
    timestamp: Date.now(),
    version: '1.0.0',
  };

  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
}

/**
 * Get n8n API configuration
 * @async
 * @returns {Promise<{url: string, apiKey: string|null}>} API configuration
 * @throws {Error} If n8n URL is not configured
 */
async function getApiConfig() {
  // Check environment variables first
  let apiUrl = process.env.N8N_API_URL || process.env.N8N_INSTANCE_URL;
  const apiKey = process.env.N8N_API_KEY;

  // Fall back to config
  if (!apiUrl) {
    try {
      apiUrl = await getN8nUrl();
    } catch (e) {
      // getN8nUrl returns default if not set
    }
  }

  // Ensure URL ends with /api/v1
  if (apiUrl && !apiUrl.includes('/api/')) {
    apiUrl = apiUrl.replace(/\/$/, '') + '/api/v1';
  }

  if (!apiUrl) {
    throw new Error('n8n API URL not configured. Run "n8n-bmad init" or set N8N_API_URL environment variable.');
  }

  return { url: apiUrl, apiKey };
}

/**
 * Categorize a node by its type
 * @param {Object} node - Node object with type property
 * @returns {'core'|'community'|'custom'} Node category
 */
function categorizeNode(node) {
  const nodeType = node.type || node.name || '';

  // Check for core nodes
  for (const prefix of CORE_NODE_PREFIXES) {
    if (nodeType.startsWith(prefix) || nodeType.includes(prefix)) {
      return 'core';
    }
  }

  // Check for community nodes (npm packages starting with n8n-nodes-)
  for (const prefix of COMMUNITY_NODE_PREFIXES) {
    if (nodeType.startsWith(prefix) && !nodeType.startsWith('n8n-nodes-base.')) {
      return 'community';
    }
  }

  // Everything else is custom
  return 'custom';
}

/**
 * Categorize all nodes into groups
 * @param {Array<Object>} nodes - Array of node objects
 * @returns {Object} Nodes grouped by category
 */
function categorizeNodes(nodes) {
  const categorized = {
    core: [],
    community: [],
    custom: [],
  };

  for (const node of nodes) {
    const category = categorizeNode(node);
    categorized[category].push({
      type: node.type || node.name,
      displayName: node.displayName || node.type || node.name,
      description: node.description || '',
      icon: node.icon || null,
      group: node.group || [],
      version: node.version || '1',
      category,
    });
  }

  // Sort each category by display name
  for (const category of Object.keys(categorized)) {
    categorized[category].sort((a, b) =>
      (a.displayName || '').localeCompare(b.displayName || '')
    );
  }

  return categorized;
}

/**
 * Discover installed nodes from n8n instance
 * @async
 * @param {Object} [options] - Discovery options
 * @param {boolean} [options.force=false] - Force refresh, ignore cache
 * @returns {Promise<Object>} Discovered nodes categorized
 * @throws {Error} If API request fails and no cache available
 */
async function discoverInstalledNodes(options = {}) {
  const { force = false } = options;

  const { url, apiKey } = await getApiConfig();

  // Build request headers
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['X-N8N-API-KEY'] = apiKey;
  }

  try {
    // Try to fetch from n8n API
    // n8n exposes node types at different endpoints depending on version
    // Try /node-types first (newer), then /nodes
    const endpoints = [
      `${url}/node-types`,
      `${url}/nodes`,
      `${url.replace('/api/v1', '')}/rest/node-types`,
    ];

    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const fetchModule = await import('node-fetch');
        const fetch = fetchModule.default || fetchModule;

        response = await fetch(endpoint, {
          method: 'GET',
          headers,
          timeout: 10000,
        });

        if (response.ok) {
          break;
        }
        response = null;
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to fetch nodes from n8n API`);
    }

    const data = await response.json();

    // Handle different response formats
    let nodes = [];
    if (Array.isArray(data)) {
      nodes = data;
    } else if (data.data && Array.isArray(data.data)) {
      nodes = data.data;
    } else if (data.nodeTypes && Array.isArray(data.nodeTypes)) {
      nodes = data.nodeTypes;
    }

    // Categorize nodes
    const categorized = categorizeNodes(nodes);

    // Build result
    const result = {
      nodes: categorized,
      stats: {
        total: nodes.length,
        core: categorized.core.length,
        community: categorized.community.length,
        custom: categorized.custom.length,
      },
      source: url,
      fetchedAt: new Date().toISOString(),
    };

    // Save to cache
    await saveCache(result);

    return result;

  } catch (error) {
    // If fetch fails, try to return cached data with warning
    if (!force) {
      const cached = await loadCache();
      if (cached) {
        cached._warning = `Using cached data (fetch failed: ${error.message})`;
        cached._stale = true;
        return cached;
      }
    }

    throw new Error(`Failed to discover nodes: ${error.message}. Run "n8n-bmad init" to configure n8n connection.`);
  }
}

/**
 * Get cached nodes, optionally refreshing if stale
 * @async
 * @param {Object} [options] - Options
 * @param {boolean} [options.silent=false] - Don't throw on missing cache
 * @param {boolean} [options.allowStale=true] - Return stale cache if available
 * @returns {Promise<Object|null>} Cached nodes or null
 */
async function getCachedNodes(options = {}) {
  const { silent = false, allowStale = true } = options;

  const cache = await loadCache();

  if (!cache) {
    if (silent) {
      return null;
    }
    throw new Error('No cached node data available. Run "n8n-bmad nodes discover" first.');
  }

  const ttl = await getCacheTTL();
  const stale = isCacheStale(cache, ttl);

  if (stale) {
    cache._stale = true;
    if (!allowStale) {
      if (silent) {
        return null;
      }
      throw new Error('Cached node data is stale. Run "n8n-bmad nodes discover" to refresh.');
    }
  }

  return cache;
}

/**
 * Search installed nodes by query
 * @async
 * @param {string} query - Search query
 * @param {Object} [options] - Search options
 * @param {string} [options.type] - Filter by type (core, community, custom)
 * @returns {Promise<Array<Object>>} Matching nodes
 */
async function searchInstalledNodes(query, options = {}) {
  const { type } = options;

  const cache = await getCachedNodes({ silent: true });

  if (!cache || !cache.nodes) {
    throw new Error('No cached node data available. Run "n8n-bmad nodes discover" first.');
  }

  const queryLower = query.toLowerCase();
  const results = [];

  const categories = type ? [type] : ['core', 'community', 'custom'];

  for (const category of categories) {
    const nodes = cache.nodes[category] || [];
    for (const node of nodes) {
      const searchFields = [
        node.type,
        node.displayName,
        node.description,
      ].filter(Boolean).join(' ').toLowerCase();

      if (searchFields.includes(queryLower)) {
        results.push(node);
      }
    }
  }

  return results;
}

/**
 * Get only custom nodes
 * @async
 * @returns {Promise<Array<Object>>} Custom nodes
 */
async function getCustomNodes() {
  const cache = await getCachedNodes({ silent: true });

  if (!cache || !cache.nodes) {
    return [];
  }

  return cache.nodes.custom || [];
}

/**
 * Get cache status information
 * @async
 * @returns {Promise<Object>} Cache status
 */
async function getCacheStatus() {
  const cachePath = await getCachePath();
  const ttl = await getCacheTTL();
  const cache = await loadCache();

  const status = {
    cachePath,
    ttlHours: ttl / (60 * 60 * 1000),
    exists: !!cache,
    stale: true,
    stats: null,
    lastFetched: null,
    source: null,
  };

  if (cache) {
    status.stale = isCacheStale(cache, ttl);
    status.stats = cache.stats || null;
    status.lastFetched = cache.fetchedAt || (cache.timestamp ? new Date(cache.timestamp).toISOString() : null);
    status.source = cache.source || null;

    if (cache.timestamp) {
      const ageMs = Date.now() - cache.timestamp;
      const ageHours = Math.round(ageMs / (60 * 60 * 1000) * 10) / 10;
      status.ageHours = ageHours;
    }
  }

  return status;
}

module.exports = {
  discoverInstalledNodes,
  getCachedNodes,
  searchInstalledNodes,
  getCustomNodes,
  getCacheStatus,
  categorizeNode,
  categorizeNodes,
  isCacheStale,
  loadCache,
  saveCache,
  getCachePath,
  getCacheTTL,
  getApiConfig,
  CORE_NODE_PREFIXES,
  COMMUNITY_NODE_PREFIXES,
};
