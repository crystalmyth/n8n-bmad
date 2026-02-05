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
const chalk = require('chalk');

const {
  displayError,
  displayWarning,
  displayInfo,
  displayHeader,
  displayList,
  displayBox,
} = require('../lib/display');

const { generateClaudeCommands } = require('../lib/command-generator');

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
      default: 'http://localhost:5678/api/v1',
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
 * Directory structure to create
 * @type {Array<string>}
 */
/**
 * Directory structure inside .n8n-bmad folder (framework files)
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
  'exports',
  'backups',
  'reports',
  'tools/cli/commands',
  'tools/cli/lib',
  'tools/scripts',
  'test',
];

/**
 * User-facing docs structure at project root (NOT inside .n8n-bmad)
 * Only create the base docs folder - subfolders created on-demand when needed
 *
 * Created on-demand by workflows:
 *   ./docs/backlog/stories/   - Created when first story is saved (CS)
 *   ./docs/backlog/epics/     - Created when first epic is saved (CE)
 *   ./docs/sprints/           - Created when first sprint is planned (SP)
 */
const ROOT_DOCS_STRUCTURE = [
  'docs',                      // Root docs folder only
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
 * Create directory structure inside .n8n-bmad folder AND root docs structure
 * @async
 * @param {string} baseDir - Base directory (project root)
 * @param {boolean} dryRun - If true, don't actually create
 * @returns {Promise<Object>} Object with bmadDir path and created directories array
 */
async function createDirectories(baseDir, dryRun = false) {
  const bmadDir = path.join(baseDir, '.n8n-bmad');
  const created = [];

  // Create .n8n-bmad root folder first
  if (!dryRun) {
    await fs.mkdir(bmadDir, { recursive: true });
  }
  created.push('.n8n-bmad');

  // Create subdirectories inside .n8n-bmad (framework files)
  for (const dir of DIRECTORY_STRUCTURE) {
    const fullPath = path.join(bmadDir, dir);

    try {
      await fs.access(fullPath);
      // Directory exists
    } catch {
      if (!dryRun) {
        await fs.mkdir(fullPath, { recursive: true });
      }
      created.push(`.n8n-bmad/${dir}`);
    }
  }

  // Create user-facing docs structure at project root (NOT inside .n8n-bmad)
  for (const dir of ROOT_DOCS_STRUCTURE) {
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

  return { bmadDir, created };
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

  // Add scale profile configuration
  if (answers.scaleProfile) {
    config.project = config.project || {};
    config.project.scale_profile = answers.scaleProfile;
    config.project.platform = answers.platform || 'claude-code';
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
 * Generate MCP configuration file at project root for Claude Code compatibility
 * @async
 * @param {string} baseDir - Project root directory (not .n8n-bmad)
 * @param {Object} answers - User answers
 * @param {boolean} dryRun - If true, don't actually write
 * @returns {Promise<string>} MCP config file path
 */
async function generateMcpConfig(baseDir, answers, dryRun = false) {
  const mcpPath = path.join(baseDir, '.mcp.json');

  // Build MCP config with actual values (Claude Code doesn't support variable placeholders)
  const mcpConfig = {
    mcpServers: {
      n8n: {
        command: 'npx',
        args: ['-y', 'n8n-mcp'],
        env: {
          MCP_MODE: 'stdio',                    // REQUIRED for Claude Code
          LOG_LEVEL: 'error',                   // Suppress debug output
          DISABLE_CONSOLE_OUTPUT: 'true',       // Keep output clean
          N8N_API_URL: answers.n8nUrl || 'http://localhost:5678/api/v1',
          N8N_API_KEY: answers.n8nApiKey || '',
        },
      },
    },
  };

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
N8N_INSTANCE_URL=http://localhost:5678/api/v1

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
 * Generate actual .env file with API key
 * @async
 * @param {string} baseDir - Base directory (.n8n-bmad folder)
 * @param {Object} answers - User answers
 * @param {boolean} dryRun - If true, don't actually write
 * @returns {Promise<string>} Env file path
 */
async function generateEnvFile(baseDir, answers, dryRun = false) {
  const envPath = path.join(baseDir, '.env');
  const content = `# n8n-BMAD Environment Configuration
N8N_INSTANCE_URL=${answers.n8nUrl || 'http://localhost:5678/api/v1'}
N8N_API_KEY=${answers.n8nApiKey || ''}
PROJECT_ROOT=.
`;

  if (!dryRun) {
    await fs.writeFile(envPath, content, 'utf8');
  }

  return envPath;
}

/**
 * Generate Claude Code slash command files from agent YAML
 * @async
 * @param {string} projectRoot - Project root directory (where .claude folder will be created)
 * @param {string} bmadDir - The .n8n-bmad directory path (source of agent files)
 * @param {boolean} dryRun - If true, don't actually create files
 * @returns {Promise<Array<Object>>} List of generated command info
 */
async function generateClaudeCommandFiles(projectRoot, bmadDir, dryRun = false) {
  // Source agent files are in .n8n-bmad/src/core/agents/
  const sourceAgentsPath = path.join(bmadDir, 'src', 'core', 'agents');

  // Target is .claude/commands/n8n/ in project root (for /n8n:{name} commands)
  const targetCommandsPath = path.join(projectRoot, '.claude', 'commands', 'n8n');

  return await generateClaudeCommands(sourceAgentsPath, targetCommandsPath, dryRun);
}

/**
 * Copy agent YAML files from package source to project
 * @async
 * @param {string} bmadDir - The .n8n-bmad directory path
 * @param {boolean} dryRun - If true, don't actually copy
 * @returns {Promise<Array<string>>} List of copied file names
 */
async function copyAgentFiles(bmadDir, dryRun = false) {
  // Get package root (init.js is at tools/cli/commands/)
  const packageRoot = path.resolve(__dirname, '..', '..', '..');
  const sourceAgentsPath = path.join(packageRoot, 'src', 'core', 'agents');
  const targetAgentsPath = path.join(bmadDir, 'src', 'core', 'agents');

  const copied = [];

  try {
    // Read all agent files from package source
    const files = await fs.readdir(sourceAgentsPath);
    const agentFiles = files.filter(f => f.endsWith('.agent.yaml'));

    for (const file of agentFiles) {
      const sourcePath = path.join(sourceAgentsPath, file);
      const targetPath = path.join(targetAgentsPath, file);

      if (!dryRun) {
        const content = await fs.readFile(sourcePath, 'utf8');
        await fs.writeFile(targetPath, content, 'utf8');
      }
      copied.push(file);
    }
  } catch (error) {
    // If source directory doesn't exist, skip silently
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return copied;
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
      n8nUrl: 'http://localhost:5678/api/v1',
      n8nApiKey: '',
      workflowPrefix: 'wf_',
      timezone: 'UTC',
      scaleProfile: 'auto',
      platform: 'claude-code',
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
      default: 'http://localhost:5678/api/v1',
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
      type: 'password',
      name: 'n8nApiKey',
      message: 'n8n API key (for MCP/Claude Code integration, press Enter to skip):',
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
      type: 'list',
      name: 'scaleProfile',
      message: 'Project scale profile:',
      choices: [
        {
          name: 'Quick Flow - Minimal ceremony (1-15 stories, bug fixes, PoCs)',
          value: 'quick',
          short: 'Quick Flow',
        },
        {
          name: 'Standard - Balanced process (10-50 stories, typical projects)',
          value: 'standard',
          short: 'Standard',
        },
        {
          name: 'Enterprise - Full ceremony (30+ stories, compliance required)',
          value: 'enterprise',
          short: 'Enterprise',
        },
        {
          name: 'Auto-detect - Let the framework decide based on context',
          value: 'auto',
          short: 'Auto-detect',
        },
      ],
      default: 'auto',
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
      // Global options are set on this command by the preAction hook in n8n-bmad-cli.js
      const globalOptions = command._globalOptions || command.parent?._globalOptions || {};
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

        // Create directory structure: framework files in .n8n-bmad, user docs at project root
        const spinner = ora('Creating directory structure...').start();
        const { bmadDir, created: createdDirs } = await createDirectories(targetDir, dryRun);
        spinner.succeed(`Created ${createdDirs.length} directories (framework in .n8n-bmad/, docs at project root)`);

        if (createdDirs.length > 0 && globalOptions.verbose) {
          displayList(createdDirs.slice(0, 10), { bullet: '+' });
          if (createdDirs.length > 10) {
            displayInfo(`... and ${createdDirs.length - 10} more`);
          }
        }

        // Generate configuration files
        // .mcp.json goes to project root for Claude Code compatibility
        // Other files go inside .n8n-bmad folder
        spinner.start('Generating configuration files...');
        await generateConfig(bmadDir, answers, dryRun);
        await generateMcpConfig(targetDir, answers, dryRun);  // Project root for Claude Code
        await generateGitignore(bmadDir, dryRun);
        await generateEnvExample(bmadDir, dryRun);
        await generateEnvFile(bmadDir, answers, dryRun);
        spinner.succeed('Configuration files generated');

        if (globalOptions.verbose) {
          displayList([
            '.n8n-bmad/src/core/module.yaml',
            '.mcp.json',  // At project root for Claude Code
            '.n8n-bmad/.gitignore',
            '.n8n-bmad/.env.example',
            '.n8n-bmad/.env',
          ], { bullet: '+' });
        }

        // Copy agent files from package
        spinner.start('Copying agent files...');
        const copiedAgents = await copyAgentFiles(bmadDir, dryRun);
        spinner.succeed(`Copied ${copiedAgents.length} agent files`);

        if (globalOptions.verbose) {
          displayList(copiedAgents, { bullet: '+' });
        }

        // Generate Claude Code slash commands
        spinner.start('Generating Claude Code commands...');
        const generatedCommands = await generateClaudeCommandFiles(targetDir, bmadDir, dryRun);
        spinner.succeed(`Generated ${generatedCommands.length} Claude Code slash commands`);

        if (globalOptions.verbose && generatedCommands.length > 0) {
          displayList(generatedCommands.map(c => c.slashCommand), { bullet: '+' });
        }

        // Initialize git if requested (in project root, not .n8n-bmad)
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

        // Install dependencies if requested (in .n8n-bmad folder)
        if (answers.installDeps && !options.skipNpm) {
          spinner.start('Installing npm dependencies...');
          if (!dryRun) {
            const { execSync } = require('child_process');
            try {
              execSync('npm install', { cwd: bmadDir, stdio: 'ignore' });
              spinner.succeed('Dependencies installed');
            } catch (error) {
              spinner.warn('Could not install dependencies. Run "npm install" manually in .n8n-bmad/');
            }
          } else {
            spinner.succeed('Dependencies installed (dry run)');
          }
        }

        // Display success message
        const profileNames = {
          quick: 'Quick Flow (minimal ceremony)',
          standard: 'Standard (balanced process)',
          enterprise: 'Enterprise (full ceremony)',
          auto: 'Auto-detect',
        };
        console.log();
        displayBox([
          'n8n-BMAD Project Initialized!',
          '',
          `Project: ${answers.projectName}`,
          `Scale: ${profileNames[answers.scaleProfile] || 'Auto-detect'}`,
        ], { title: 'Success', style: 'round' });

        // Clear next step guidance
        console.log();
        displayHeader('Your First Command', { style: 'compact' });
        console.log();
        console.log('  Start any project with:');
        console.log('    ' + chalk.cyan('/n8n:pm *create-prd') + '    ← Start here');
        console.log();
        console.log('  ' + chalk.gray('PRD auto-scales based on your project complexity.'));
        console.log('  ' + chalk.gray('Simple projects get lean PRD, complex ones get comprehensive PRD.'));
        console.log();

        // Agent + Skill Pattern
        displayHeader('Agent + Skill Pattern', { style: 'compact' });
        console.log();
        console.log('  ' + chalk.yellow('/n8n:agent *skill') + '   ← Primary (self-documenting)');
        console.log('  ' + chalk.gray('TRIGGER') + '              ← Shortcut (power users)');
        console.log();
        console.log('  Examples:');
        console.log('    ' + chalk.cyan('/n8n:pm *create-prd') + '       Create PRD');
        console.log('    ' + chalk.cyan('/n8n:po *validate-prd') + '     Validate PRD');
        console.log('    ' + chalk.cyan('/n8n:sm *story-draft') + '      Draft story');
        console.log('    ' + chalk.cyan('/n8n:po *validate-story') + '   Validate story');
        console.log();

        // Essential commands
        displayHeader('Discover Skills', { style: 'compact' });
        console.log();
        console.log('  ' + chalk.cyan('/n8n:pm') + '   Show PM skills (create PRD, epic, sprint)');
        console.log('  ' + chalk.cyan('/n8n:po') + '   Show PO skills (validate everything)');
        console.log('  ' + chalk.cyan('/n8n:sm') + '   Show SM skills (draft stories, ceremonies)');
        console.log('  ' + chalk.cyan('/n8n:dev') + '  Show Developer skills');
        console.log();

        // Workflow reference
        displayHeader('The Flow (PM creates → PO validates)', { style: 'compact' });
        console.log();
        console.log('  /n8n:pm *create-prd → /n8n:po *validate-prd → /n8n:arch *create-architecture');
        console.log('  /n8n:sm *story-draft → /n8n:po *validate-story → /n8n:dev *dev-story');
        console.log();

        // Claude Code ready
        displayHeader('Claude Code Ready', { style: 'compact' });
        console.log();
        console.log('  Run ' + chalk.cyan('/n8n:pm') + ' to see all PM skills');
        console.log('  Run ' + chalk.cyan('/n8n:po') + ' to see all validation skills');
        console.log();

        // Quick start reference
        console.log(chalk.gray('  See QUICKSTART.md for a 5-minute guide'));

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
