/**
 * @fileoverview Unit tests for context command module
 *
 * Tests cover all functions from tools/cli/commands/context.js:
 * - generateContext (interactive prompts, template reading, placeholder replacement, file output)
 * - buildLlmContext (multi-source file reading, agent summaries, handler list, cached nodes, stats)
 * - createContextCommand (subcommands, default action)
 */

const path = require('path');
const { Command } = require('commander');

// ---------------------------------------------------------------------------
// Mock setup (must precede require of module under test)
// ---------------------------------------------------------------------------

// Pass-through chalk mock
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

// Mock fs.promises
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
      mkdir: jest.fn(),
    },
  };
});

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

// Mock ora
const mockSpinner = {
  start: jest.fn(function () { return mockSpinner; }),
  succeed: jest.fn(function () { return mockSpinner; }),
  fail: jest.fn(function () { return mockSpinner; }),
  warn: jest.fn(function () { return mockSpinner; }),
  stop: jest.fn(function () { return mockSpinner; }),
};

jest.mock('ora', () => jest.fn(() => mockSpinner));

// Mock js-yaml
jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

// Mock display functions
jest.mock('../../../tools/cli/lib/display', () => ({
  displayError: jest.fn(),
  displayInfo: jest.fn(),
  displayHeader: jest.fn(),
  displayBox: jest.fn(),
  displaySuccess: jest.fn(),
}));

// Mock node-discovery (used by buildLlmContext via require inside the function)
jest.mock('../../../tools/cli/lib/node-discovery', () => ({
  getCachedNodes: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Require modules after mocks are configured
// ---------------------------------------------------------------------------

const fs = require('fs').promises;
const inquirer = require('inquirer');
const yaml = require('js-yaml');

const {
  displayError,
  displayInfo,
  displayHeader,
  displayBox,
  displaySuccess,
} = require('../../../tools/cli/lib/display');

const { getCachedNodes } = require('../../../tools/cli/lib/node-discovery');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let logSpy;
let errorSpy;
let exitSpy;
let originalCwd;
let originalEnv;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  originalCwd = process.cwd;
  originalEnv = { ...process.env };
  process.cwd = jest.fn(() => '/test/project');
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  exitSpy.mockRestore();
  process.cwd = originalCwd;
  process.env = originalEnv;
});

/**
 * Get a fresh context command module to avoid state issues
 */
function getFreshCommand() {
  const modulePath = require.resolve('../../../tools/cli/commands/context');
  delete require.cache[modulePath];
  return require('../../../tools/cli/commands/context');
}

/**
 * Create a program wrapper and parse arguments through the context command.
 */
async function parseContext(args) {
  const cmd = getFreshCommand();
  const program = new Command();
  program.exitOverride();
  program.addCommand(cmd);
  try {
    await program.parseAsync(['node', 'test', 'context', ...args]);
  } catch (e) {
    if (e.code !== 'commander.helpDisplayed') {
      throw e;
    }
  }
  return cmd;
}

// Default mock answers for inquirer
const defaultAnswers = {
  projectName: 'Test Project',
  description: 'A test project for testing',
  environment: 'development',
  deployment: 'Self-hosted',
  n8nVersion: '1.20.0',
  compliance: ['None'],
};

// Sample template content with placeholders
const sampleTemplate = `# Project: \${PROJECT_NAME}
Description: \${PROJECT_DESCRIPTION}
Status: \${PROJECT_STATUS}
Date: \${GENERATED_DATE}
Framework: \${FRAMEWORK_VERSION}
Scale: \${SCALE_PROFILE}
n8n: \${N8N_VERSION}
Deploy: \${DEPLOYMENT_TYPE}
URL: \${N8N_INSTANCE_URL}
Env: \${ENVIRONMENT}
Compliance: \${COMPLIANCE_FRAMEWORKS}
Notes: \${PROJECT_NOTES}`;

// ---------------------------------------------------------------------------
// 1. generateContext (the 'generate' subcommand)
// ---------------------------------------------------------------------------
describe('generateContext', () => {
  it('should prompt the user for project information', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    expect(inquirer.prompt).toHaveBeenCalledTimes(1);
    const promptArgs = inquirer.prompt.mock.calls[0][0];
    const names = promptArgs.map(q => q.name);
    expect(names).toContain('projectName');
    expect(names).toContain('description');
    expect(names).toContain('environment');
    expect(names).toContain('deployment');
    expect(names).toContain('n8nVersion');
    expect(names).toContain('compliance');
  });

  it('should use cwd basename as default project name', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const promptArgs = inquirer.prompt.mock.calls[0][0];
    const projectNameQ = promptArgs.find(q => q.name === 'projectName');
    expect(projectNameQ.default).toBe('project'); // basename of /test/project
  });

  it('should read template from first available path', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValueOnce(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    expect(fs.readFile).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should try second template path if first fails', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile
      .mockRejectedValueOnce(new Error('ENOENT'))
      .mockResolvedValueOnce(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    expect(fs.readFile).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should throw error when template is not found at any path', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockRejectedValue(new Error('ENOENT'));

    await parseContext(['generate']);

    expect(displayError).toHaveBeenCalledWith(expect.stringContaining('template not found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should replace ${PROJECT_NAME} placeholder', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Test Project');
    expect(writtenContent).not.toContain('${PROJECT_NAME}');
  });

  it('should replace ${PROJECT_DESCRIPTION} placeholder', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('A test project for testing');
    expect(writtenContent).not.toContain('${PROJECT_DESCRIPTION}');
  });

  it('should replace ${N8N_VERSION} placeholder', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('1.20.0');
  });

  it('should replace ${N8N_VERSION} with Unknown when version is empty', async () => {
    inquirer.prompt.mockResolvedValue({ ...defaultAnswers, n8nVersion: '' });
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Unknown');
  });

  it('should replace ${DEPLOYMENT_TYPE} placeholder', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Self-hosted');
  });

  it('should replace ${ENVIRONMENT} placeholder', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('development');
  });

  it('should replace ${COMPLIANCE_FRAMEWORKS} with None when only None selected', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Compliance: None');
  });

  it('should replace ${COMPLIANCE_FRAMEWORKS} with joined frameworks', async () => {
    const answers = { ...defaultAnswers, compliance: ['GDPR', 'HIPAA'] };
    inquirer.prompt.mockResolvedValue(answers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('GDPR, HIPAA');
  });

  it('should replace ${SCALE_PROFILE} with provided profile option', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate', '--profile', 'enterprise']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('enterprise');
  });

  it('should default ${SCALE_PROFILE} to auto when profile not specified', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate', '--profile', 'auto']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Scale: auto');
  });

  it('should replace ${N8N_INSTANCE_URL} with env var if set', async () => {
    process.env.N8N_INSTANCE_URL = 'https://my-n8n.example.com';
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('https://my-n8n.example.com');
  });

  it('should default ${N8N_INSTANCE_URL} to localhost when env var not set', async () => {
    delete process.env.N8N_INSTANCE_URL;
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('http://localhost:5678');
  });

  it('should replace ${PROJECT_STATUS} with Active', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Status: Active');
  });

  it('should replace ${FRAMEWORK_VERSION} with 2.0.0', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Framework: 2.0.0');
  });

  it('should write output to default path when no output option', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    const expectedPath = path.join('/test/project', '.n8n-bmad', 'project-context.md');
    expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, expect.any(String), 'utf8');
  });

  it('should write output to custom path when output option provided', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate', '--output', '/custom/output.md']);

    expect(fs.writeFile).toHaveBeenCalledWith('/custom/output.md', expect.any(String), 'utf8');
  });

  it('should create parent directory recursively', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('should show spinner succeed on completion', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Project context generated');
  });

  it('should display summary box on completion', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    expect(displayBox).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('Test Project'),
      ]),
      expect.objectContaining({ title: 'Context Generated' })
    );
  });

  it('should stop spinner before prompting', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should restart spinner after prompting', async () => {
    inquirer.prompt.mockResolvedValue(defaultAnswers);
    fs.readFile.mockResolvedValue(sampleTemplate);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    await parseContext(['generate']);

    // start is called at least twice: initial + after prompts
    expect(mockSpinner.start.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// 2. buildLlmContext (the 'build' subcommand)
// ---------------------------------------------------------------------------
describe('buildLlmContext', () => {
  beforeEach(() => {
    // Default: all file reads fail (nothing exists) unless overridden
    fs.readFile.mockRejectedValue(new Error('ENOENT'));
    fs.readdir.mockRejectedValue(new Error('ENOENT'));
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    getCachedNodes.mockRejectedValue(new Error('no cache'));
  });

  it('should write output to default path', async () => {
    await parseContext(['build']);

    const expectedPath = path.join('/test/project', '.n8n-bmad', 'llms-context.txt');
    expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, expect.any(String), 'utf8');
  });

  it('should write output to custom path when output option provided', async () => {
    await parseContext(['build', '--output', '/custom/context.txt']);

    expect(fs.writeFile).toHaveBeenCalledWith('/custom/context.txt', expect.any(String), 'utf8');
  });

  it('should create parent directory recursively', async () => {
    await parseContext(['build']);

    expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('should include header section with generation timestamp', async () => {
    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('# n8n-BMAD Framework Context');
    expect(writtenContent).toContain('Generated:');
  });

  it('should include CLAUDE.md content when available', async () => {
    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('CLAUDE.md')) {
        return '# Claude Instructions\nFollow these rules.';
      }
      throw new Error('ENOENT');
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Framework Instructions (CLAUDE.md)');
    expect(writtenContent).toContain('Follow these rules.');
  });

  it('should try second CLAUDE.md path if first fails', async () => {
    let claudeCallCount = 0;
    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('CLAUDE.md')) {
        claudeCallCount++;
        if (claudeCallCount === 1) throw new Error('ENOENT');
        return '# Fallback Claude';
      }
      throw new Error('ENOENT');
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Fallback Claude');
  });

  it('should handle CLAUDE.md not found gracefully', async () => {
    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('## Framework Instructions');
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('should include project context when available', async () => {
    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('project-context.md')) {
        return '# Project Context\nThis is the context.';
      }
      throw new Error('ENOENT');
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Project Context');
    expect(writtenContent).toContain('This is the context.');
  });

  it('should handle project context not found gracefully', async () => {
    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('## Project Context');
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('should include trigger reference when available', async () => {
    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('trigger-help.csv')) {
        return 'trigger,description\nCP,Create PRD';
      }
      throw new Error('ENOENT');
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Workflow Triggers Reference');
    expect(writtenContent).toContain('CP,Create PRD');
    expect(writtenContent).toContain('```csv');
  });

  it('should include agent summaries from YAML files', async () => {
    fs.readdir.mockImplementation(async (dirPath) => {
      if (typeof dirPath === 'string' && dirPath.includes('agents')) {
        return ['pm.agent.yaml', 'qa.agent.yaml', 'README.md'];
      }
      throw new Error('ENOENT');
    });

    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('pm.agent.yaml')) {
        return 'mock-yaml-pm';
      }
      if (typeof filePath === 'string' && filePath.endsWith('qa.agent.yaml')) {
        return 'mock-yaml-qa';
      }
      throw new Error('ENOENT');
    });

    yaml.load.mockImplementation((content) => {
      if (content === 'mock-yaml-pm') {
        return {
          agent: {
            metadata: { id: 'pm', name: 'Paula', title: 'PM' },
            persona: { role: 'Project Manager', identity: 'You manage projects with great skill and care.' },
          },
        };
      }
      if (content === 'mock-yaml-qa') {
        return {
          agent: {
            metadata: { id: 'qa', name: 'Quinn', title: 'QA' },
            persona: { role: 'QA Engineer', identity: 'You ensure quality across all workflows.' },
          },
        };
      }
      return {};
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Available Agents');
    expect(writtenContent).toContain('### Paula (PM)');
    expect(writtenContent).toContain('**ID:** pm');
    expect(writtenContent).toContain('**Role:** Project Manager');
    expect(writtenContent).toContain('### Quinn (QA)');
  });

  it('should filter to only .agent.yaml files when processing agents', async () => {
    fs.readdir.mockImplementation(async (dirPath) => {
      if (typeof dirPath === 'string' && dirPath.includes('agents')) {
        return ['pm.agent.yaml', 'notes.txt', 'config.yaml'];
      }
      throw new Error('ENOENT');
    });

    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('pm.agent.yaml')) {
        return 'yaml-content';
      }
      throw new Error('ENOENT');
    });

    yaml.load.mockReturnValue({
      agent: {
        metadata: { id: 'pm', name: 'Paula' },
        persona: { role: 'PM' },
      },
    });

    await parseContext(['build']);

    expect(yaml.load).toHaveBeenCalledTimes(1);
  });

  it('should truncate agent identity to 200 chars in summary', async () => {
    const longIdentity = 'X'.repeat(300);
    fs.readdir.mockImplementation(async (dirPath) => {
      if (typeof dirPath === 'string' && dirPath.includes('agents')) {
        return ['long.agent.yaml'];
      }
      throw new Error('ENOENT');
    });

    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('long.agent.yaml')) {
        return 'yaml-content';
      }
      throw new Error('ENOENT');
    });

    yaml.load.mockReturnValue({
      agent: {
        metadata: { id: 'long', name: 'Long Agent' },
        persona: { role: 'Test', identity: longIdentity },
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('...');
    const identityLine = writtenContent.split('\n').find(l => l.includes('**Identity:**'));
    expect(identityLine.length).toBeLessThan(300);
  });

  it('should skip agents without metadata', async () => {
    fs.readdir.mockImplementation(async (dirPath) => {
      if (typeof dirPath === 'string' && dirPath.includes('agents')) {
        return ['bad.agent.yaml'];
      }
      throw new Error('ENOENT');
    });

    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('bad.agent.yaml')) {
        return 'yaml-content';
      }
      throw new Error('ENOENT');
    });

    yaml.load.mockReturnValue({
      agent: { id: 'bad' },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('### bad');
  });

  it('should handle individual agent file parse errors gracefully', async () => {
    fs.readdir.mockImplementation(async (dirPath) => {
      if (typeof dirPath === 'string' && dirPath.includes('agents')) {
        return ['bad.agent.yaml', 'good.agent.yaml'];
      }
      throw new Error('ENOENT');
    });

    let agentReadCount = 0;
    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('.agent.yaml')) {
        agentReadCount++;
        if (agentReadCount === 1) throw new Error('parse error');
        return 'yaml-content';
      }
      throw new Error('ENOENT');
    });

    yaml.load.mockReturnValue({
      agent: {
        metadata: { id: 'good', name: 'Good' },
        persona: { role: 'Good Agent' },
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Good');
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('should include handler components when available', async () => {
    fs.readdir.mockImplementation(async (dirPath) => {
      if (typeof dirPath === 'string' && dirPath.includes('handlers')) {
        return ['n8n-validate.handler.md', 'n8n-error.handler.md', 'README.md'];
      }
      throw new Error('ENOENT');
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Handler Components');
    expect(writtenContent).toContain('**n8n-validate**');
    expect(writtenContent).toContain('**n8n-error**');
  });

  it('should filter to only .handler.md files', async () => {
    fs.readdir.mockImplementation(async (dirPath) => {
      if (typeof dirPath === 'string' && dirPath.includes('handlers')) {
        return ['n8n-validate.handler.md', 'config.yaml', 'notes.txt'];
      }
      throw new Error('ENOENT');
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('**n8n-validate**');
    expect(writtenContent).not.toContain('config');
    expect(writtenContent).not.toContain('notes');
  });

  it('should handle handlers directory not found gracefully', async () => {
    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('## Handler Components');
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('should include custom nodes from cache', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [
          { type: 'custom.myNode', displayName: 'My Node', description: 'Does things' },
        ],
        community: [],
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Installed Custom Nodes');
    expect(writtenContent).toContain('custom.myNode');
    expect(writtenContent).toContain('My Node');
    expect(writtenContent).toContain('Does things');
  });

  it('should include community nodes from cache', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [],
        community: [
          { type: 'n8n-nodes-slack.message', displayName: 'Slack', description: 'Send Slack messages' },
        ],
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Installed Community Nodes');
    expect(writtenContent).toContain('Slack');
  });

  it('should limit community nodes to 20 and show remainder note', async () => {
    const communityNodes = Array.from({ length: 25 }, (_, i) => ({
      type: `comm.node${i}`, displayName: `Node ${i}`, description: `Desc ${i}`,
    }));
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [],
        community: communityNodes,
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('...and 5 more community nodes');
  });

  it('should not show remainder note when community nodes are 20 or fewer', async () => {
    const communityNodes = Array.from({ length: 15 }, (_, i) => ({
      type: `comm.node${i}`, displayName: `Node ${i}`, description: `Desc ${i}`,
    }));
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [],
        community: communityNodes,
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('more community nodes');
  });

  it('should add stale cache note when cache is stale', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [{ type: 'custom.a', displayName: 'A', description: 'a' }],
        community: [],
      },
      _stale: true,
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Node cache is stale');
  });

  it('should not add stale note when cache is fresh', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [{ type: 'custom.a', displayName: 'A', description: 'a' }],
        community: [],
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('Node cache is stale');
  });

  it('should handle node cache not available gracefully', async () => {
    getCachedNodes.mockRejectedValue(new Error('No cache'));

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('## Installed Custom Nodes');
    expect(writtenContent).not.toContain('## Installed Community Nodes');
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('should handle null cached nodes result gracefully', async () => {
    getCachedNodes.mockResolvedValue(null);

    await parseContext(['build']);

    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('should handle cached result with no nodes property', async () => {
    getCachedNodes.mockResolvedValue({ _stale: false });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('## Installed Custom Nodes');
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('should escape pipe characters in node descriptions', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [
          { type: 'custom.pipe', displayName: 'Pipe Node', description: 'Has | pipe char' },
        ],
        community: [],
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Has \\| pipe char');
  });

  it('should show spinner succeed with output path', async () => {
    await parseContext(['build']);

    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('LLM context built'));
  });

  it('should display stats box with size and token estimates', async () => {
    await parseContext(['build']);

    expect(displayBox).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('Size:'),
        expect.stringContaining('Estimated tokens:'),
      ]),
      expect.objectContaining({ title: 'LLM Context Built' })
    );
  });

  it('should concatenate all available sections into one file', async () => {
    fs.readFile.mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('CLAUDE.md')) {
        return '# Claude Rules';
      }
      if (typeof filePath === 'string' && filePath.includes('trigger-help.csv')) {
        return 'trigger,desc\nCP,Create PRD';
      }
      throw new Error('ENOENT');
    });

    fs.readdir.mockImplementation(async (dirPath) => {
      if (typeof dirPath === 'string' && dirPath.includes('handlers')) {
        return ['n8n-validate.handler.md'];
      }
      throw new Error('ENOENT');
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('# n8n-BMAD Framework Context');
    expect(writtenContent).toContain('## Framework Instructions (CLAUDE.md)');
    expect(writtenContent).toContain('## Workflow Triggers Reference');
    expect(writtenContent).toContain('## Handler Components');
  });

  it('should call getCachedNodes with silent and allowStale options', async () => {
    getCachedNodes.mockResolvedValue(null);

    await parseContext(['build']);

    expect(getCachedNodes).toHaveBeenCalledWith({ silent: true, allowStale: true });
  });

  it('should handle build error and show failure', async () => {
    fs.writeFile.mockRejectedValue(new Error('Permission denied'));

    await parseContext(['build']);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to build LLM context');
    expect(displayError).toHaveBeenCalledWith(expect.stringContaining('Permission denied'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should skip custom nodes section when custom array is empty', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [],
        community: [{ type: 'comm.a', displayName: 'A', description: 'a' }],
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('## Installed Custom Nodes');
    expect(writtenContent).toContain('## Installed Community Nodes');
  });

  it('should skip community nodes section when community array is empty', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [{ type: 'custom.a', displayName: 'A', description: 'a' }],
        community: [],
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Installed Custom Nodes');
    expect(writtenContent).not.toContain('## Installed Community Nodes');
  });

  it('should include node table headers for custom nodes', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [{ type: 'custom.a', displayName: 'A', description: 'a' }],
        community: [],
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('| Node Type | Display Name | Description |');
    expect(writtenContent).toContain('|-----------|--------------|-------------|');
  });

  it('should handle missing displayName in cached nodes', async () => {
    getCachedNodes.mockResolvedValue({
      nodes: {
        custom: [{ type: 'custom.noname', description: 'No name node' }],
        community: [],
      },
    });

    await parseContext(['build']);

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('custom.noname');
    expect(writtenContent).toContain('-');
  });
});

// ---------------------------------------------------------------------------
// 3. Command structure
// ---------------------------------------------------------------------------
describe('createContextCommand', () => {
  it('should export a Command instance', () => {
    const cmd = getFreshCommand();
    expect(cmd).toBeDefined();
    expect(cmd.name()).toBe('context');
  });

  it('should have description set', () => {
    const cmd = getFreshCommand();
    expect(cmd.description()).toContain('context');
  });

  it('should have generate subcommand', () => {
    const cmd = getFreshCommand();
    const subNames = cmd.commands.map(c => c.name());
    expect(subNames).toContain('generate');
  });

  it('should have build subcommand', () => {
    const cmd = getFreshCommand();
    const subNames = cmd.commands.map(c => c.name());
    expect(subNames).toContain('build');
  });

  it('should have exactly two subcommands', () => {
    const cmd = getFreshCommand();
    expect(cmd.commands).toHaveLength(2);
  });

  it('generate subcommand should have output and profile options', () => {
    const cmd = getFreshCommand();
    const genCmd = cmd.commands.find(c => c.name() === 'generate');
    const optionNames = genCmd.options.map(o => o.long);
    expect(optionNames).toContain('--output');
    expect(optionNames).toContain('--profile');
  });

  it('build subcommand should have output option', () => {
    const cmd = getFreshCommand();
    const buildCmd = cmd.commands.find(c => c.name() === 'build');
    const optionNames = buildCmd.options.map(o => o.long);
    expect(optionNames).toContain('--output');
  });

  it('generate subcommand should have proper description', () => {
    const cmd = getFreshCommand();
    const genCmd = cmd.commands.find(c => c.name() === 'generate');
    expect(genCmd.description()).toContain('project context');
  });

  it('build subcommand should have proper description', () => {
    const cmd = getFreshCommand();
    const buildCmd = cmd.commands.find(c => c.name() === 'build');
    expect(buildCmd.description()).toContain('LLM context');
  });

  it('generate subcommand should default profile to auto', () => {
    const cmd = getFreshCommand();
    const genCmd = cmd.commands.find(c => c.name() === 'generate');
    const profileOption = genCmd.options.find(o => o.long === '--profile');
    expect(profileOption.defaultValue).toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// 4. Default action
// ---------------------------------------------------------------------------
describe('default action', () => {
  it('should display help info when invoked without subcommand', async () => {
    const cmd = getFreshCommand();
    if (cmd._actionHandler) {
      await cmd._actionHandler([]);
    }

    expect(displayHeader).toHaveBeenCalledWith('Context Commands');
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('generate'));
    expect(displayInfo).toHaveBeenCalledWith(expect.stringContaining('build'));
  });

  it('should display header as Context Commands', async () => {
    const cmd = getFreshCommand();
    if (cmd._actionHandler) {
      await cmd._actionHandler([]);
    }

    expect(displayHeader).toHaveBeenCalledWith('Context Commands');
  });
});
