/**
 * Initialize command for n8n-BMAD CLI
 * Creates new project structure and configuration
 *
 * @module commands/init
 * @description Handles project initialization with interactive prompts
 */

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const ora = require('ora');

const {
  displayError,
  displayWarning,
  displayInfo,
  displayHeader,
  displayList,
  displayBox,
} = require('../lib/display');

/**
 * Default project configuration
 * @type {Object}
 */
const DEFAULT_PROJECT_CONFIG = {
  framework: {
    name: 'n8n-BMAD',
    version: '1.0.0',
    description: 'AI-powered methodology framework for n8n workflow automation teams',
  },
  options: {
    n8n_instance_url: {
      type: 'string',
      description: 'URL of your n8n instance',
      default: 'http://localhost:5678',
      env_var: 'N8N_INSTANCE_URL',
      required: true,
    },
    api_key: {
      type: 'string',
      description: 'n8n API key for authentication',
      env_var: 'N8N_API_KEY',
      required: false,
      sensitive: true,
    },
    naming_convention: {
      type: 'object',
      description: 'Naming conventions for workflows and credentials',
      default: {
        workflow_prefix: 'wf_',
        credential_prefix: 'cred_',
        environment_separator: '_',
        use_snake_case: true,
      },
    },
  },
  defaults: {
    workflow: {
      timezone: 'UTC',
      save_execution_progress: true,
      save_data_error_execution: 'all',
      save_data_success_execution: 'all',
    },
    validation: {
      check_naming: true,
      check_credentials: true,
      check_expressions: true,
      check_connections: true,
    },
  },
  output: {
    docs_path: './docs/generated',
    exports_path: './exports',
    backups_path: './backups',
    reports_path: './reports',
  },
  agents: {
    default_agent: 'n8n-master',
    agent_path: './src/core/agents',
    available_agents: [
      'n8n-master', 'po', 'pm', 'sm', 'architect', 'developer',
      'qa', 'devops', 'ba', 'security', 'integration', 'data-analyst', 'tech-writer',
    ],
  },
  templates: {
    path: './templates',
    categories: ['project', 'agile', 'architecture', 'operations', 'testing', 'n8n-specific', 'security'],
  },
  patterns: {
    path: './patterns',
    categories: ['error-handling', 'integration', 'data-transformation', 'scheduling'],
  },
  mcp: {
    enabled: true,
    config_path: './.mcp.json',
  },
  logging: {
    level: 'info',
    format: 'text',
    output: 'console',
  },
};

/**
 * Default MCP configuration
 * @type {Object}
 */
const DEFAULT_MCP_CONFIG = {
  '$schema': 'https://json-schema.org/draft/2020-12/schema',
  name: 'n8n-bmad',
  version: '1.0.0',
  description: 'MCP server configuration for n8n-BMAD framework',
  servers: {
    n8n: {
      command: 'npx',
      args: ['-y', '@anthropic/mcp-server-n8n'],
      env: {
        N8N_API_URL: '${N8N_INSTANCE_URL}',
        N8N_API_KEY: '${N8N_API_KEY}',
      },
      tools: [
        'list_workflows', 'get_workflow', 'create_workflow', 'update_workflow',
        'delete_workflow', 'activate_workflow', 'deactivate_workflow',
        'execute_workflow', 'get_executions', 'get_credentials',
      ],
    },
    filesystem: {
      command: 'npx',
      args: ['-y', '@anthropic/mcp-server-filesystem'],
      env: {
        ALLOWED_DIRECTORIES: '${PROJECT_ROOT}',
      },
    },
  },
  settings: {
    logLevel: 'info',
    timeout: 30000,
    retryAttempts: 3,
  },
  profiles: {
    development: {
      servers: ['n8n', 'filesystem'],
      env: {
        N8N_INSTANCE_URL: 'http://localhost:5678',
        DEBUG: 'true',
      },
    },
    production: {
      servers: ['n8n'],
      env: {
        N8N_INSTANCE_URL: '${PROD_N8N_URL}',
      },
    },
  },
};

/**
 * Directory structure to create
 * @type {Array<string>}
 */
const DIRECTORY_STRUCTURE = [
  'src/core/agents',
  'src/core/workflows',
  'src/core/tasks',
  'templates/project',
  'templates/agile',
  'templates/architecture',
  'templates/operations',
  'templates/testing',
  'templates/n8n-specific',
  'templates/security',
  'patterns/error-handling',
  'patterns/integration',
  'patterns/data-transformation',
  'patterns/scheduling',
  'reference/expressions',
  'reference/nodes',
  'reference/api',
  'reference/conventions',
  'docs',
  'exports',
  'backups',
  'reports',
  'tools/cli/commands',
  'tools/cli/lib',
  'tools/scripts',
  'test',
];

/**
 * Check if directory is empty or non-existent
 * @async
 * @param {string} dir - Directory path
 * @returns {Promise<boolean>} True if empty or non-existent
 */
async function isEmptyOrNonExistent(dir) {
  try {
    const files = await fs.readdir(dir);
    // Allow .git and other hidden files
    const visibleFiles = files.filter(f => !f.startsWith('.'));
    return visibleFiles.length === 0;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true;
    }
    throw error;
  }
}

/**
 * Create directory structure
 * @async
 * @param {string} baseDir - Base directory
 * @param {boolean} dryRun - If true, don't actually create
 * @returns {Promise<Array<string>>} Created directories
 */
async function createDirectories(baseDir, dryRun = false) {
  const created = [];

  for (const dir of DIRECTORY_STRUCTURE) {
    const fullPath = path.join(baseDir, dir);

    try {
      await fs.access(fullPath);
      // Directory exists
    } catch {
      if (!dryRun) {
        await fs.mkdir(fullPath, { recursive: true });
      }
      created.push(dir);
    }
  }

  return created;
}

/**
 * Generate project configuration file
 * @async
 * @param {string} baseDir - Base directory
 * @param {Object} answers - User answers
 * @param {boolean} dryRun - If true, don't actually write
 * @returns {Promise<string>} Config file path
 */
async function generateConfig(baseDir, answers, dryRun = false) {
  const configPath = path.join(baseDir, 'src/core/module.yaml');

  // Merge answers with default config
  const config = { ...DEFAULT_PROJECT_CONFIG };

  if (answers.projectName) {
    config.framework.description = `n8n-BMAD framework for ${answers.projectName}`;
  }

  if (answers.n8nUrl) {
    config.options.n8n_instance_url.default = answers.n8nUrl;
  }

  if (answers.workflowPrefix) {
    config.options.naming_convention.default.workflow_prefix = answers.workflowPrefix;
  }

  if (answers.timezone) {
    config.defaults.workflow.timezone = answers.timezone;
  }

  const yamlContent = '# n8n-BMAD Framework Configuration\n' +
    '# Generated by n8n-bmad init\n\n' +
    yaml.dump(config, { lineWidth: 120 });

  if (!dryRun) {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, yamlContent, 'utf8');
  }

  return configPath;
}

/**
 * Generate MCP configuration file
 * @async
 * @param {string} baseDir - Base directory
 * @param {Object} answers - User answers
 * @param {boolean} dryRun - If true, don't actually write
 * @returns {Promise<string>} MCP config file path
 */
async function generateMcpConfig(baseDir, answers, dryRun = false) {
  const mcpPath = path.join(baseDir, '.mcp.json');

  const mcpConfig = { ...DEFAULT_MCP_CONFIG };

  if (answers.n8nUrl) {
    mcpConfig.profiles.development.env.N8N_INSTANCE_URL = answers.n8nUrl;
  }

  if (!dryRun) {
    await fs.writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
  }

  return mcpPath;
}

/**
 * Generate .gitignore file
 * @async
 * @param {string} baseDir - Base directory
 * @param {boolean} dryRun - If true, don't actually write
 * @returns {Promise<string>} Gitignore file path
 */
async function generateGitignore(baseDir, dryRun = false) {
  const gitignorePath = path.join(baseDir, '.gitignore');

  const content = `# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Sensitive files
*.pem
*.key
credentials*.json

# Generated files
docs/generated/
exports/
backups/
reports/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/

# Build
dist/
build/
`;

  if (!dryRun) {
    await fs.writeFile(gitignorePath, content, 'utf8');
  }

  return gitignorePath;
}

/**
 * Generate .env.example file
 * @async
 * @param {string} baseDir - Base directory
 * @param {boolean} dryRun - If true, don't actually write
 * @returns {Promise<string>} Env file path
 */
async function generateEnvExample(baseDir, dryRun = false) {
  const envPath = path.join(baseDir, '.env.example');

  const content = `# n8n-BMAD Environment Configuration
# Copy this file to .env and fill in your values

# n8n Instance URL
N8N_INSTANCE_URL=http://localhost:5678

# n8n API Key (optional, for API access)
N8N_API_KEY=

# Production n8n URL (optional)
PROD_N8N_URL=

# Project root directory
PROJECT_ROOT=.
`;

  if (!dryRun) {
    await fs.writeFile(envPath, content, 'utf8');
  }

  return envPath;
}

/**
 * Interactive initialization prompts
 * @async
 * @param {Object} options - Command options
 * @returns {Promise<Object>} User answers
 */
async function promptUser(options) {
  if (options.yes) {
    return {
      projectName: 'My n8n Project',
      n8nUrl: 'http://localhost:5678',
      workflowPrefix: 'wf_',
      timezone: 'UTC',
      initGit: true,
      installDeps: true,
    };
  }

  displayHeader('Project Initialization', { style: 'prominent' });

  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(process.cwd()),
      validate: (input) => input.length > 0 || 'Project name is required',
    },
    {
      type: 'input',
      name: 'n8nUrl',
      message: 'n8n instance URL:',
      default: 'http://localhost:5678',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
    {
      type: 'input',
      name: 'workflowPrefix',
      message: 'Workflow naming prefix:',
      default: 'wf_',
    },
    {
      type: 'list',
      name: 'timezone',
      message: 'Default timezone:',
      choices: [
        'UTC',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Singapore',
        'Australia/Sydney',
      ],
      default: 'UTC',
    },
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Initialize git repository?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: 'Install npm dependencies?',
      default: true,
    },
  ];

  return await inquirer.prompt(questions);
}

/**
 * Create the init command
 * @returns {Command} Commander command instance
 */
function createInitCommand() {
  const command = new Command('init');

  command
    .description('Initialize a new n8n-BMAD project')
    .option('-d, --directory <path>', 'Project directory', '.')
    .option('--skip-git', 'Skip git initialization')
    .option('--skip-npm', 'Skip npm install')
    .option('-t, --template <name>', 'Use a project template', 'default')
    .action(async (options) => {
      const globalOptions = command.parent?._globalOptions || {};
      const dryRun = globalOptions.dryRun || false;
      const skipConfirm = globalOptions.yes || false;

      try {
        // Determine target directory
        const targetDir = path.resolve(options.directory);

        // Check if directory is suitable
        const isEmpty = await isEmptyOrNonExistent(targetDir);

        if (!isEmpty) {
          displayWarning(`Directory ${targetDir} is not empty.`);

          if (!skipConfirm) {
            const { proceed } = await inquirer.prompt([{
              type: 'confirm',
              name: 'proceed',
              message: 'Continue and merge with existing files?',
              default: false,
            }]);

            if (!proceed) {
              displayInfo('Initialization cancelled.');
              return;
            }
          }
        }

        // Get user input
        const answers = await promptUser({ yes: skipConfirm });

        if (dryRun) {
          displayHeader('Dry Run - No changes will be made');
        }

        // Create directory structure
        const spinner = ora('Creating directory structure...').start();
        const createdDirs = await createDirectories(targetDir, dryRun);
        spinner.succeed(`Created ${createdDirs.length} directories`);

        if (createdDirs.length > 0 && globalOptions.verbose) {
          displayList(createdDirs.slice(0, 10), { bullet: '+' });
          if (createdDirs.length > 10) {
            displayInfo(`... and ${createdDirs.length - 10} more`);
          }
        }

        // Generate configuration
        spinner.start('Generating configuration files...');
        await generateConfig(targetDir, answers, dryRun);
        await generateMcpConfig(targetDir, answers, dryRun);
        await generateGitignore(targetDir, dryRun);
        await generateEnvExample(targetDir, dryRun);
        spinner.succeed('Configuration files generated');

        if (globalOptions.verbose) {
          displayList([
            'src/core/module.yaml',
            '.mcp.json',
            '.gitignore',
            '.env.example',
          ], { bullet: '+' });
        }

        // Initialize git if requested
        if (answers.initGit && !options.skipGit) {
          spinner.start('Initializing git repository...');
          if (!dryRun) {
            const { execSync } = require('child_process');
            try {
              execSync('git init', { cwd: targetDir, stdio: 'ignore' });
              spinner.succeed('Git repository initialized');
            } catch (error) {
              spinner.warn('Could not initialize git repository');
            }
          } else {
            spinner.succeed('Git repository initialized (dry run)');
          }
        }

        // Install dependencies if requested
        if (answers.installDeps && !options.skipNpm) {
          spinner.start('Installing npm dependencies...');
          if (!dryRun) {
            const { execSync } = require('child_process');
            try {
              execSync('npm install', { cwd: targetDir, stdio: 'ignore' });
              spinner.succeed('Dependencies installed');
            } catch (error) {
              spinner.warn('Could not install dependencies. Run "npm install" manually.');
            }
          } else {
            spinner.succeed('Dependencies installed (dry run)');
          }
        }

        // Display success message
        console.log();
        displayBox([
          'n8n-BMAD Project Initialized!',
          '',
          `Project: ${answers.projectName}`,
          `Location: ${targetDir}`,
          '',
          'Next steps:',
          '  1. Review src/core/module.yaml',
          '  2. Copy .env.example to .env',
          '  3. Run "n8n-bmad agent list" to see agents',
          '  4. Run "n8n-bmad --help" for more commands',
        ], { title: 'Success', style: 'round' });

      } catch (error) {
        displayError(`Initialization failed: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return command;
}

module.exports = createInitCommand();
