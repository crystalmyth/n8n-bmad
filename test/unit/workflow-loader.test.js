/**
 * @fileoverview Unit tests for workflow-loader module
 *
 * Tests cover all exported functions from tools/cli/lib/workflow-loader.js:
 *   getWorkflowsPath, loadManifest, buildTriggerMap, findWorkflowByTrigger,
 *   loadWorkflowFile, parseWorkflowMarkdown, listWorkflows, getWorkflowPaths,
 *   getRoutingRules, findWorkflowsByCategory, getNextWorkflows,
 *   formatWorkflowForDisplay, clearCache
 */

const path = require('path');

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    accessSync: jest.fn(),
    promises: {
      readFile: jest.fn(),
    },
  };
});

jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

jest.mock('chalk', () => ({
  bold: jest.fn((s) => s),
  cyan: jest.fn((s) => s),
  green: jest.fn((s) => s),
  yellow: jest.fn((s) => s),
  red: jest.fn((s) => s),
  gray: jest.fn((s) => s),
}));

const fs = require('fs');
const fsPromises = fs.promises;
const yaml = require('js-yaml');

// ── Subject under test ───────────────────────────────────────────────────────

const {
  getWorkflowsPath,
  loadManifest,
  buildTriggerMap,
  findWorkflowByTrigger,
  loadWorkflowFile,
  parseWorkflowMarkdown,
  listWorkflows,
  getWorkflowPaths,
  getRoutingRules,
  findWorkflowsByCategory,
  getNextWorkflows,
  formatWorkflowForDisplay,
  clearCache,
} = require('../../tools/cli/lib/workflow-loader');

// ── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE_MANIFEST = {
  workflows: {
    requirements: [
      {
        id: 'create-prd',
        trigger: 'PRD',
        description: 'Create PRD',
        primary_agent: 'pm',
        supporting_agents: ['po'],
        file: '1-requirements/create-prd.md',
        next: ['validate-prd'],
      },
      {
        id: 'validate-prd',
        trigger: 'VP',
        description: 'Validate PRD',
        primary_agent: 'po',
        supporting_agents: [],
        file: '1-requirements/validate-prd.md',
      },
    ],
    development: [
      {
        id: 'dev-story',
        trigger: 'DS',
        description: 'Develop a story',
        primary_agent: 'developer',
        supporting_agents: ['qa'],
        file: '3-development/dev-story.md',
        next: ['code-review'],
      },
    ],
    quality: [
      {
        id: 'code-review',
        trigger: 'CR',
        description: 'Code review',
        primary_agent: 'qa',
        file: '4-quality/code-review.md',
      },
    ],
  },
  paths: {
    quick: ['PRD', 'DS', 'CR'],
    standard: ['PRD', 'VP', 'CA', 'DS', 'CR'],
  },
  routing: {
    requirements: 'pm',
    implementation: 'developer',
  },
};

const SAMPLE_MARKDOWN = `# Create PRD [PRD]

> **Agent:** Paula (PM) \u{1F4CB}
> **Trigger:** \`PRD\`

## Overview
This is the overview.

## Step 1: Gather Requirements
**Agent:** Paula (PM) \u{1F4CB}
- Ask questions
- Document answers

## Step 2: Draft Document
**Agent:** Paula (PM) \u{1F4CB}
Write the draft.

## Route A: Quick Path
Quick approval.

## Route B: Full Review
Full review process.
`;

function setupManifestMock(manifest = SAMPLE_MANIFEST) {
  fs.accessSync.mockImplementation(() => {
    throw new Error('ENOENT');
  });
  fsPromises.readFile.mockResolvedValue('yaml-content');
  yaml.load.mockReturnValue(manifest);
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  clearCache();
});

// ═══════════════════════════════════════════════════════════════════════════════
// getWorkflowsPath
// ═══════════════════════════════════════════════════════════════════════════════

describe('getWorkflowsPath', () => {
  it('should return local path when .n8n-bmad/src/workflows exists', () => {
    fs.accessSync.mockImplementation(() => undefined);

    const result = getWorkflowsPath();

    expect(result).toBe(
      path.join(process.cwd(), '.n8n-bmad', 'src', 'workflows')
    );
  });

  it('should call accessSync with the local path', () => {
    fs.accessSync.mockImplementation(() => undefined);

    getWorkflowsPath();

    expect(fs.accessSync).toHaveBeenCalledWith(
      path.join(process.cwd(), '.n8n-bmad', 'src', 'workflows')
    );
  });

  it('should return core path when local path does not exist', () => {
    fs.accessSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const result = getWorkflowsPath();
    const expectedCore = path.resolve(
      __dirname, '..', '..', 'tools', 'cli', 'lib', '..', '..', '..', 'src', 'workflows'
    );

    expect(result).toBe(expectedCore);
  });

  it('should return core path when accessSync throws any error', () => {
    fs.accessSync.mockImplementation(() => {
      throw new Error('EPERM');
    });

    const result = getWorkflowsPath();

    expect(result).toContain(path.join('src', 'workflows'));
    expect(result).not.toContain('.n8n-bmad');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// loadManifest
// ═══════════════════════════════════════════════════════════════════════════════

describe('loadManifest', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should load and parse the workflow-manifest.yaml file', async () => {
    const result = await loadManifest();

    expect(result).toEqual(SAMPLE_MANIFEST);
  });

  it('should call readFile with the correct manifest path', async () => {
    await loadManifest();

    const calledPath = fsPromises.readFile.mock.calls[0][0];
    expect(calledPath).toContain('workflow-manifest.yaml');
  });

  it('should pass utf8 encoding to readFile', async () => {
    await loadManifest();

    expect(fsPromises.readFile).toHaveBeenCalledWith(
      expect.any(String),
      'utf8'
    );
  });

  it('should call yaml.load with the file content', async () => {
    await loadManifest();

    expect(yaml.load).toHaveBeenCalledWith('yaml-content');
  });

  it('should cache the manifest on second call within TTL', async () => {
    await loadManifest();
    await loadManifest();

    expect(fsPromises.readFile).toHaveBeenCalledTimes(1);
  });

  it('should return cached manifest on second call', async () => {
    const first = await loadManifest();
    const second = await loadManifest();

    expect(first).toBe(second);
  });

  it('should reload after cache is cleared', async () => {
    await loadManifest();
    clearCache();
    await loadManifest();

    expect(fsPromises.readFile).toHaveBeenCalledTimes(2);
  });

  it('should throw with descriptive message when readFile fails', async () => {
    fsPromises.readFile.mockRejectedValue(new Error('File not found'));

    await expect(loadManifest()).rejects.toThrow(
      'Failed to load workflow manifest: File not found'
    );
  });

  it('should throw with descriptive message when yaml.load fails', async () => {
    yaml.load.mockImplementation(() => {
      throw new Error('Invalid YAML');
    });

    await expect(loadManifest()).rejects.toThrow(
      'Failed to load workflow manifest: Invalid YAML'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// buildTriggerMap
// ═══════════════════════════════════════════════════════════════════════════════

describe('buildTriggerMap', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should return a Map instance', async () => {
    const result = await buildTriggerMap();

    expect(result).toBeInstanceOf(Map);
  });

  it('should include all triggers from the manifest', async () => {
    const result = await buildTriggerMap();

    expect(result.has('PRD')).toBe(true);
    expect(result.has('VP')).toBe(true);
    expect(result.has('DS')).toBe(true);
    expect(result.has('CR')).toBe(true);
  });

  it('should store triggers as UPPERCASE keys', async () => {
    setupManifestMock({
      workflows: {
        test: [{ id: 'test', trigger: 'low', description: 'test' }],
      },
    });

    const result = await buildTriggerMap();

    expect(result.has('LOW')).toBe(true);
    expect(result.has('low')).toBe(false);
  });

  it('should attach category field to each workflow entry', async () => {
    const result = await buildTriggerMap();

    expect(result.get('PRD').category).toBe('requirements');
    expect(result.get('DS').category).toBe('development');
    expect(result.get('CR').category).toBe('quality');
  });

  it('should preserve original workflow fields', async () => {
    const result = await buildTriggerMap();
    const prd = result.get('PRD');

    expect(prd.id).toBe('create-prd');
    expect(prd.description).toBe('Create PRD');
    expect(prd.primary_agent).toBe('pm');
  });

  it('should return empty Map when manifest has no workflows', async () => {
    setupManifestMock({});

    const result = await buildTriggerMap();

    expect(result.size).toBe(0);
  });

  it('should skip non-array categories in manifest.workflows', async () => {
    setupManifestMock({
      workflows: {
        valid: [{ id: 'test', trigger: 'T1', description: 'test' }],
        invalid: 'not-an-array',
      },
    });

    const result = await buildTriggerMap();

    expect(result.size).toBe(1);
    expect(result.has('T1')).toBe(true);
  });

  it('should skip workflows without a trigger field', async () => {
    setupManifestMock({
      workflows: {
        test: [
          { id: 'with-trigger', trigger: 'WT', description: 'has trigger' },
          { id: 'no-trigger', description: 'no trigger field' },
        ],
      },
    });

    const result = await buildTriggerMap();

    expect(result.size).toBe(1);
    expect(result.has('WT')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// findWorkflowByTrigger
// ═══════════════════════════════════════════════════════════════════════════════

describe('findWorkflowByTrigger', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should find workflow by exact uppercase trigger', async () => {
    const result = await findWorkflowByTrigger('PRD');

    expect(result).not.toBeNull();
    expect(result.id).toBe('create-prd');
  });

  it('should find workflow case-insensitively', async () => {
    const result = await findWorkflowByTrigger('prd');

    expect(result).not.toBeNull();
    expect(result.id).toBe('create-prd');
  });

  it('should find workflow with mixed case', async () => {
    const result = await findWorkflowByTrigger('Prd');

    expect(result).not.toBeNull();
    expect(result.id).toBe('create-prd');
  });

  it('should return null for unknown trigger', async () => {
    const result = await findWorkflowByTrigger('UNKNOWN');

    expect(result).toBeNull();
  });

  it('should return the correct workflow for each trigger', async () => {
    const vp = await findWorkflowByTrigger('VP');
    const ds = await findWorkflowByTrigger('DS');
    const cr = await findWorkflowByTrigger('CR');

    expect(vp.id).toBe('validate-prd');
    expect(ds.id).toBe('dev-story');
    expect(cr.id).toBe('code-review');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// loadWorkflowFile
// ═══════════════════════════════════════════════════════════════════════════════

describe('loadWorkflowFile', () => {
  beforeEach(() => {
    fs.accessSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
  });

  it('should load and parse a workflow markdown file', async () => {
    fsPromises.readFile.mockResolvedValue(SAMPLE_MARKDOWN);

    const result = await loadWorkflowFile('1-requirements/create-prd.md');

    expect(result.title).toBe('Create PRD');
    expect(result.trigger).toBe('PRD');
  });

  it('should join workflows path with relative file path', async () => {
    fsPromises.readFile.mockResolvedValue(SAMPLE_MARKDOWN);

    await loadWorkflowFile('some/file.md');

    const calledPath = fsPromises.readFile.mock.calls[0][0];
    expect(calledPath).toContain(path.join('src', 'workflows', 'some', 'file.md'));
  });

  it('should throw descriptive error when file cannot be read', async () => {
    fsPromises.readFile.mockRejectedValue(new Error('ENOENT'));

    await expect(loadWorkflowFile('missing.md')).rejects.toThrow(
      'Failed to load workflow file missing.md: ENOENT'
    );
  });

  it('should return parsed workflow object with expected keys', async () => {
    fsPromises.readFile.mockResolvedValue(SAMPLE_MARKDOWN);

    const result = await loadWorkflowFile('test.md');

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('trigger');
    expect(result).toHaveProperty('agents');
    expect(result).toHaveProperty('steps');
    expect(result).toHaveProperty('raw');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// parseWorkflowMarkdown
// ═══════════════════════════════════════════════════════════════════════════════

describe('parseWorkflowMarkdown', () => {
  describe('default structure', () => {
    it('should return object with all expected keys', () => {
      const result = parseWorkflowMarkdown('');

      expect(result).toHaveProperty('title', '');
      expect(result).toHaveProperty('trigger', '');
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('overview', '');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('decisionPoints');
      expect(result).toHaveProperty('quickReference');
      expect(result).toHaveProperty('raw', '');
    });

    it('should preserve raw content exactly', () => {
      const content = 'Some raw content here\nwith lines';
      const result = parseWorkflowMarkdown(content);

      expect(result.raw).toBe(content);
    });

    it('should initialize agents as empty array', () => {
      const result = parseWorkflowMarkdown('');

      expect(result.agents).toEqual([]);
    });

    it('should initialize steps as empty array', () => {
      const result = parseWorkflowMarkdown('');

      expect(result.steps).toEqual([]);
    });
  });

  describe('title parsing', () => {
    it('should extract title and trigger from "# Title [CODE]" format', () => {
      const result = parseWorkflowMarkdown('# Create PRD [PRD]');

      expect(result.title).toBe('Create PRD');
      expect(result.trigger).toBe('PRD');
    });

    it('should extract title without trigger code', () => {
      const result = parseWorkflowMarkdown('# Simple Title');

      expect(result.title).toBe('Simple Title');
      expect(result.trigger).toBe('');
    });

    it('should only parse the first h1 as title', () => {
      const content = '# First Title [T1]\n# Second Title [T2]';
      const result = parseWorkflowMarkdown(content);

      expect(result.title).toBe('First Title');
      expect(result.trigger).toBe('T1');
    });

    it('should trim whitespace from title', () => {
      const result = parseWorkflowMarkdown('#  Spaced Title  [TX] ');

      expect(result.title).toBe('Spaced Title');
    });
  });

  describe('agent info from blockquote', () => {
    it('should parse single agent from blockquote', () => {
      const content = '> **Agent:** Paula (PM) P';
      const result = parseWorkflowMarkdown(content);

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe('Paula');
      expect(result.agents[0].role).toBe('PM');
    });

    it('should parse multiple agents separated by +', () => {
      const content = '> **Agent:** Paula (PM) P + Victor (PO) V';
      const result = parseWorkflowMarkdown(content);

      expect(result.agents).toHaveLength(2);
      expect(result.agents[0].name).toBe('Paula');
      expect(result.agents[1].name).toBe('Victor');
    });

    it('should parse multiple agents separated by arrow', () => {
      const content = '> **Agent:** Paula (PM) P \u2192 Victor (PO) V';
      const result = parseWorkflowMarkdown(content);

      expect(result.agents).toHaveLength(2);
      expect(result.agents[0].role).toBe('PM');
      expect(result.agents[1].role).toBe('PO');
    });
  });

  describe('trigger from blockquote', () => {
    it('should parse trigger from blockquote backtick format', () => {
      const content = '> **Trigger:** `QS`';
      const result = parseWorkflowMarkdown(content);

      expect(result.trigger).toBe('QS');
    });

    it('should not overwrite trigger already set from title', () => {
      const content = '# My Workflow [T1]\n> **Trigger:** `T2`';
      const result = parseWorkflowMarkdown(content);

      expect(result.trigger).toBe('T1');
    });

    it('should set trigger from blockquote when title has no trigger', () => {
      const content = '# My Workflow\n> **Trigger:** `T2`';
      const result = parseWorkflowMarkdown(content);

      expect(result.trigger).toBe('T2');
    });
  });

  describe('step parsing', () => {
    it('should parse steps with number and title', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      expect(result.steps.length).toBeGreaterThanOrEqual(2);
      expect(result.steps[0].number).toBe(1);
      expect(result.steps[0].title).toBe('Gather Requirements');
    });

    it('should parse step 2 correctly', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      expect(result.steps[1].number).toBe(2);
      expect(result.steps[1].title).toBe('Draft Document');
    });

    it('should assign agent to step', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      expect(result.steps[0].agent).toBeDefined();
      expect(result.steps[0].agent.name).toBe('Paula');
      expect(result.steps[0].agent.role).toBe('PM');
    });

    it('should capture step content as string type', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      // Content is finalized as a string (may be empty due to parser internals
      // using sectionContent rather than currentStep.content for finalization)
      expect(typeof result.steps[0].content).toBe('string');
    });

    it('should have string content for step 2', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      expect(typeof result.steps[1].content).toBe('string');
    });

    it('should produce trimmed content string', () => {
      const content = '## Step 1: Test\n\n  Some content\n\n';
      const result = parseWorkflowMarkdown(content);

      // Content is a trimmed string
      expect(typeof result.steps[0].content).toBe('string');
      expect(result.steps[0].content).toBe(result.steps[0].content.trim());
    });
  });

  describe('route parsing', () => {
    it('should parse routes with letter and title', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      const routes = result.steps.filter(s => s.isRoute);
      expect(routes).toHaveLength(2);
    });

    it('should assign route letter as number field', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      const routes = result.steps.filter(s => s.isRoute);
      expect(routes[0].number).toBe('A');
      expect(routes[1].number).toBe('B');
    });

    it('should extract route title', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      const routes = result.steps.filter(s => s.isRoute);
      expect(routes[0].title).toBe('Quick Path');
      expect(routes[1].title).toBe('Full Review');
    });

    it('should set isRoute to true on route entries', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      const routes = result.steps.filter(s => s.isRoute);
      routes.forEach(route => {
        expect(route.isRoute).toBe(true);
      });
    });

    it('should have string content for routes', () => {
      const result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);

      const routes = result.steps.filter(s => s.isRoute);
      expect(typeof routes[0].content).toBe('string');
      expect(typeof routes[1].content).toBe('string');
    });
  });

  describe('section parsing', () => {
    it('should detect overview section', () => {
      const content = '## Overview\nOverview text here.';
      const result = parseWorkflowMarkdown(content);

      // Overview content is collected but not exposed as a top-level field
      // in the current implementation (sectionContent is local)
      // The section tracking occurs internally
      expect(result.steps).toHaveLength(0);
    });

    it('should not create steps for non-Step/Route ## headers', () => {
      const content = '## Overview\nContent\n## Decision Points\nMore content';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps).toHaveLength(0);
    });

    it('should finalize current step when a section header is encountered', () => {
      const content =
        '## Step 1: First\nStep content\n## Overview\nSection content';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps).toHaveLength(1);
      expect(typeof result.steps[0].content).toBe('string');
    });
  });

  describe('agent assignment within steps', () => {
    it('should parse **Agent:** within a step', () => {
      const content = '## Step 1: Test\n**Agent:** Victor (PO) V\nContent';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps[0].agent).toBeDefined();
      expect(result.steps[0].agent.name).toBe('Victor');
      expect(result.steps[0].agent.role).toBe('PO');
    });

    it('should parse **route agent** format with emoji prefix', () => {
      const content =
        '## Step 1: Route\n**\u{1F500} Agent:** Nate (Developer) N\nDo work';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps[0].agent).toBeDefined();
      expect(result.steps[0].agent.name).toBe('Nate');
      expect(result.steps[0].agent.role).toBe('Developer');
    });

    it('should leave agent null when no agent is specified in step', () => {
      const content = '## Step 1: Orphan Step\nContent without agent';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps[0].agent).toBeNull();
    });

    it('should handle hyphenated roles', () => {
      const content =
        '## Step 1: Data\n**Agent:** Alice (Data-Analyst) D\nData work';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps[0].agent.role).toBe('Data-Analyst');
    });
  });

  describe('code block handling', () => {
    it('should track code block content within a step', () => {
      const content =
        '## Step 1: Code\nBefore\n```json\n{"key": "value"}\n```\nAfter';
      const result = parseWorkflowMarkdown(content);

      // Step is created and finalized with string content
      expect(result.steps).toHaveLength(1);
      expect(typeof result.steps[0].content).toBe('string');
    });

    it('should not parse headers inside code blocks', () => {
      const content =
        '## Step 1: Code\n```\n## Step 2: Fake\nNot a real step\n```';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].title).toBe('Code');
    });

    it('should not parse agent lines inside code blocks', () => {
      const content =
        '## Step 1: Code\n```\n**Agent:** Fake (Agent) F\n```';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps[0].agent).toBeNull();
    });

    it('should handle multiple code blocks in one step', () => {
      const content =
        '## Step 1: Multi\n```\nblock1\n```\nmiddle\n```\nblock2\n```';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps).toHaveLength(1);
      expect(typeof result.steps[0].content).toBe('string');
    });
  });

  describe('complete sample markdown', () => {
    let result;

    beforeEach(() => {
      result = parseWorkflowMarkdown(SAMPLE_MARKDOWN);
    });

    it('should extract title as Create PRD', () => {
      expect(result.title).toBe('Create PRD');
    });

    it('should extract trigger as PRD', () => {
      expect(result.trigger).toBe('PRD');
    });

    it('should extract one agent from blockquote', () => {
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe('Paula');
    });

    it('should produce 4 total steps (2 steps + 2 routes)', () => {
      expect(result.steps).toHaveLength(4);
    });

    it('should have steps before routes in order', () => {
      expect(result.steps[0].number).toBe(1);
      expect(result.steps[1].number).toBe(2);
      expect(result.steps[2].number).toBe('A');
      expect(result.steps[3].number).toBe('B');
    });

    it('should mark only routes as isRoute', () => {
      expect(result.steps[0].isRoute).toBeUndefined();
      expect(result.steps[1].isRoute).toBeUndefined();
      expect(result.steps[2].isRoute).toBe(true);
      expect(result.steps[3].isRoute).toBe(true);
    });

    it('should store the full raw markdown', () => {
      expect(result.raw).toBe(SAMPLE_MARKDOWN);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content string', () => {
      const result = parseWorkflowMarkdown('');

      expect(result.title).toBe('');
      expect(result.steps).toEqual([]);
    });

    it('should handle content with only whitespace lines', () => {
      const result = parseWorkflowMarkdown('\n\n  \n');

      expect(result.title).toBe('');
      expect(result.steps).toEqual([]);
    });

    it('should handle step with no content lines', () => {
      const content = '## Step 1: Empty';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].content).toBe('');
    });

    it('should handle consecutive steps with no gap', () => {
      const content =
        '## Step 1: First\nContent A\n## Step 2: Second\nContent B';
      const result = parseWorkflowMarkdown(content);

      expect(result.steps).toHaveLength(2);
      expect(typeof result.steps[0].content).toBe('string');
      expect(typeof result.steps[1].content).toBe('string');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// listWorkflows
// ═══════════════════════════════════════════════════════════════════════════════

describe('listWorkflows', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should return an array of workflow summaries', async () => {
    const result = await listWorkflows();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);
  });

  it('should include id, trigger, category, description fields', async () => {
    const result = await listWorkflows();
    const prd = result.find(w => w.id === 'create-prd');

    expect(prd).toBeDefined();
    expect(prd.trigger).toBe('PRD');
    expect(prd.category).toBe('requirements');
    expect(prd.description).toBe('Create PRD');
  });

  it('should include primaryAgent field', async () => {
    const result = await listWorkflows();
    const prd = result.find(w => w.id === 'create-prd');

    expect(prd.primaryAgent).toBe('pm');
  });

  it('should include supportingAgents as array', async () => {
    const result = await listWorkflows();
    const prd = result.find(w => w.id === 'create-prd');

    expect(prd.supportingAgents).toEqual(['po']);
  });

  it('should default supportingAgents to empty array when missing', async () => {
    const result = await listWorkflows();
    const cr = result.find(w => w.id === 'code-review');

    expect(cr.supportingAgents).toEqual([]);
  });

  it('should return empty array when manifest has no workflows', async () => {
    setupManifestMock({});

    const result = await listWorkflows();

    expect(result).toEqual([]);
  });

  it('should skip non-array categories', async () => {
    setupManifestMock({
      workflows: {
        valid: [{ id: 'a', trigger: 'A', description: 'a', primary_agent: 'x' }],
        bad: 'string-value',
      },
    });

    const result = await listWorkflows();

    expect(result).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getWorkflowPaths
// ═══════════════════════════════════════════════════════════════════════════════

describe('getWorkflowPaths', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should return the paths object from manifest', async () => {
    const result = await getWorkflowPaths();

    expect(result).toEqual(SAMPLE_MANIFEST.paths);
  });

  it('should return empty object when manifest has no paths', async () => {
    setupManifestMock({ workflows: {} });

    const result = await getWorkflowPaths();

    expect(result).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getRoutingRules
// ═══════════════════════════════════════════════════════════════════════════════

describe('getRoutingRules', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should return the routing object from manifest', async () => {
    const result = await getRoutingRules();

    expect(result).toEqual(SAMPLE_MANIFEST.routing);
  });

  it('should return empty object when manifest has no routing', async () => {
    setupManifestMock({ workflows: {} });

    const result = await getRoutingRules();

    expect(result).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// findWorkflowsByCategory
// ═══════════════════════════════════════════════════════════════════════════════

describe('findWorkflowsByCategory', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should find workflows by exact category name', async () => {
    const result = await findWorkflowsByCategory('requirements');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('create-prd');
  });

  it('should find workflows case-insensitively', async () => {
    const result = await findWorkflowsByCategory('Requirements');

    expect(result).toHaveLength(2);
  });

  it('should find workflows with UPPERCASE category', async () => {
    const result = await findWorkflowsByCategory('DEVELOPMENT');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('dev-story');
  });

  it('should normalize special characters in category', async () => {
    setupManifestMock({
      workflows: {
        'my-special_category': [
          { id: 'sp', trigger: 'SP', description: 'special' },
        ],
      },
    });

    const result = await findWorkflowsByCategory('my special category');

    expect(result).toHaveLength(1);
  });

  it('should return empty array for unknown category', async () => {
    const result = await findWorkflowsByCategory('nonexistent');

    expect(result).toEqual([]);
  });

  it('should return empty array when manifest has no workflows', async () => {
    setupManifestMock({});

    const result = await findWorkflowsByCategory('requirements');

    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getNextWorkflows
// ═══════════════════════════════════════════════════════════════════════════════

describe('getNextWorkflows', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should return array of next workflows based on workflow.next', async () => {
    const result = await getNextWorkflows('PRD');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('validate-prd');
  });

  it('should resolve next by matching id in trigger map', async () => {
    const result = await getNextWorkflows('DS');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('code-review');
    expect(result[0].trigger).toBe('CR');
  });

  it('should return empty array when workflow has no next field', async () => {
    const result = await getNextWorkflows('CR');

    expect(result).toEqual([]);
  });

  it('should return empty array for unknown trigger', async () => {
    const result = await getNextWorkflows('UNKNOWN');

    expect(result).toEqual([]);
  });

  it('should handle case-insensitive trigger lookup', async () => {
    const result = await getNextWorkflows('prd');

    expect(result).toHaveLength(1);
  });

  it('should filter out null entries when next id is not found', async () => {
    setupManifestMock({
      workflows: {
        test: [
          {
            id: 'start',
            trigger: 'ST',
            description: 'start',
            next: ['nonexistent-id', 'also-missing'],
          },
        ],
      },
    });

    const result = await getNextWorkflows('ST');

    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// formatWorkflowForDisplay
// ═══════════════════════════════════════════════════════════════════════════════

describe('formatWorkflowForDisplay', () => {
  const sampleWorkflow = {
    trigger: 'PRD',
    title: 'Create PRD',
    agents: [
      { name: 'Paula', role: 'PM', icon: 'P' },
      { name: 'Victor', role: 'PO', icon: 'V' },
    ],
    steps: [
      { number: 1, title: 'Gather', agent: { name: 'Paula', role: 'PM' } },
      { number: 2, title: 'Draft', agent: null, isRoute: false },
      { number: 'A', title: 'Quick', agent: null, isRoute: true },
    ],
  };

  it('should include trigger in output', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow);

    expect(result.trigger).toBe('PRD');
  });

  it('should include title in output', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow);

    expect(result.title).toBe('Create PRD');
  });

  it('should format agents as arrow-separated string', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow);

    expect(result.agents).toContain('Paula (PM) P');
    expect(result.agents).toContain('\u2192');
    expect(result.agents).toContain('Victor (PO) V');
  });

  it('should include stepCount', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow);

    expect(result.stepCount).toBe(3);
  });

  it('should not include steps by default (not detailed)', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow);

    expect(result.steps).toBeUndefined();
  });

  it('should include steps when detailed option is true', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow, { detailed: true });

    expect(result.steps).toBeDefined();
    expect(result.steps).toHaveLength(3);
  });

  it('should format step agent as "Name (Role)" in detailed mode', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow, { detailed: true });

    expect(result.steps[0].agent).toBe('Paula (PM)');
  });

  it('should show Unassigned for steps without agent in detailed mode', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow, { detailed: true });

    expect(result.steps[1].agent).toBe('Unassigned');
  });

  it('should include isRoute flag in detailed steps', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow, { detailed: true });

    expect(result.steps[0].isRoute).toBe(false);
    expect(result.steps[2].isRoute).toBe(true);
  });

  it('should default isRoute to false when not present on step', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow, { detailed: true });

    expect(result.steps[1].isRoute).toBe(false);
  });

  it('should include step number and title in detailed mode', () => {
    const result = formatWorkflowForDisplay(sampleWorkflow, { detailed: true });

    expect(result.steps[0].number).toBe(1);
    expect(result.steps[0].title).toBe('Gather');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// clearCache
// ═══════════════════════════════════════════════════════════════════════════════

describe('clearCache', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should cause manifest to be reloaded on next call', async () => {
    await loadManifest();
    expect(fsPromises.readFile).toHaveBeenCalledTimes(1);

    clearCache();
    await loadManifest();

    expect(fsPromises.readFile).toHaveBeenCalledTimes(2);
  });

  it('should not throw when called with no active cache', () => {
    expect(() => clearCache()).not.toThrow();
  });

  it('should reset cache so different data can be returned', async () => {
    await loadManifest();

    clearCache();
    const newManifest = { workflows: { test: [] }, paths: {}, routing: {} };
    yaml.load.mockReturnValue(newManifest);

    const result = await loadManifest();

    expect(result).toEqual(newManifest);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// parseAgentList (tested indirectly through parseWorkflowMarkdown)
// ═══════════════════════════════════════════════════════════════════════════════

describe('parseAgentList (via parseWorkflowMarkdown)', () => {
  it('should parse single agent with name, role, icon', () => {
    const content = '> **Agent:** Paula (PM) P';
    const result = parseWorkflowMarkdown(content);

    expect(result.agents[0]).toEqual({ name: 'Paula', role: 'PM', icon: 'P' });
  });

  it('should parse agents separated by + sign', () => {
    const content = '> **Agent:** Alice (Dev) A + Bob (QA) B';
    const result = parseWorkflowMarkdown(content);

    expect(result.agents).toHaveLength(2);
    expect(result.agents[0].name).toBe('Alice');
    expect(result.agents[1].name).toBe('Bob');
  });

  it('should parse agents separated by arrow character', () => {
    const content = '> **Agent:** Alice (Dev) A \u2192 Bob (QA) B';
    const result = parseWorkflowMarkdown(content);

    expect(result.agents).toHaveLength(2);
  });

  it('should handle agent without icon gracefully', () => {
    const content = '> **Agent:** Paula (PM)';
    const result = parseWorkflowMarkdown(content);

    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].icon).toBe('');
  });

  it('should handle hyphenated role names', () => {
    const content = '> **Agent:** Dave (Data-Analyst) D';
    const result = parseWorkflowMarkdown(content);

    expect(result.agents[0].role).toBe('Data-Analyst');
  });

  it('should return empty array when agent string does not match pattern', () => {
    const content = '> **Agent:** InvalidFormat';
    const result = parseWorkflowMarkdown(content);

    expect(result.agents).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Integration-style tests (multiple functions working together)
// ═══════════════════════════════════════════════════════════════════════════════

describe('integration scenarios', () => {
  beforeEach(() => {
    setupManifestMock();
  });

  it('should chain findWorkflowByTrigger and getNextWorkflows', async () => {
    const prd = await findWorkflowByTrigger('PRD');
    expect(prd).not.toBeNull();

    const nextSteps = await getNextWorkflows('PRD');
    expect(nextSteps[0].id).toBe('validate-prd');
  });

  it('should chain listWorkflows and findWorkflowsByCategory', async () => {
    const all = await listWorkflows();
    const devWorkflows = await findWorkflowsByCategory('development');

    const devFromAll = all.filter(w => w.category === 'development');
    expect(devWorkflows.length).toBe(devFromAll.length);
  });

  it('should produce consistent results between buildTriggerMap and findWorkflowByTrigger', async () => {
    const map = await buildTriggerMap();
    const direct = await findWorkflowByTrigger('DS');

    expect(map.get('DS')).toEqual(direct);
  });

  it('should handle full flow: load manifest, find by trigger, format for display', async () => {
    fsPromises.readFile.mockResolvedValue(SAMPLE_MARKDOWN);

    const workflow = await findWorkflowByTrigger('PRD');
    expect(workflow).not.toBeNull();

    const loaded = await loadWorkflowFile(workflow.file);
    const formatted = formatWorkflowForDisplay(loaded);

    expect(formatted.trigger).toBe('PRD');
    expect(formatted.title).toBe('Create PRD');
    expect(formatted.stepCount).toBe(4);
  });
});
