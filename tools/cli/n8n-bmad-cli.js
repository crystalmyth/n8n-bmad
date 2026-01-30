#!/usr/bin/env node

/**
 * n8n-BMAD CLI
 * Main entry point for the n8n-BMAD Framework command-line interface
 *
 * @module n8n-bmad-cli
 * @description AI-powered methodology framework CLI for n8n workflow automation teams
 * @version 1.0.0
 */

const { Command } = require('commander');
const figlet = require('figlet');
const chalk = require('chalk');
const path = require('path');

// Import command modules
const initCommand = require('./commands/init');
const agentCommand = require('./commands/agent');
const templateCommand = require('./commands/template');
const validateCommand = require('./commands/validate');

// Import utilities
const { loadConfig } = require('./lib/config-loader');
const { displayBanner, displayError, displaySuccess } = require('./lib/display');

/**
 * Package information
 * @type {Object}
 */
const pkg = require('../../package.json');

/**
 * Create and configure the CLI program
 * @returns {Command} Configured Commander program instance
 */
function createProgram() {
  const program = new Command();

  // Basic program configuration
  program
    .name('n8n-bmad')
    .version(pkg.version, '-V, --version', 'Display version number')
    .description(chalk.cyan('n8n-BMAD Framework CLI') + '\n' +
      chalk.gray('AI-powered methodology framework for n8n workflow automation teams'))
    .usage('<command> [options]');

  // Global options
  program
    .option('-c, --config <path>', 'Path to config file', './src/core/module.yaml')
    .option('-v, --verbose', 'Enable verbose output', false)
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .option('--dry-run', 'Show what would happen without executing', false);

  // Hook to display banner before help
  program.hook('preAction', async (thisCommand, actionCommand) => {
    // Load configuration if available
    const options = thisCommand.opts();

    if (options.verbose) {
      console.log(chalk.gray(`Loading config from: ${options.config}`));
    }

    try {
      const config = await loadConfig(options.config);
      // Attach config to command for use in subcommands
      actionCommand._config = config;
      actionCommand._globalOptions = options;
    } catch (error) {
      if (options.verbose) {
        console.log(chalk.yellow(`Config not found, using defaults`));
      }
      actionCommand._config = null;
      actionCommand._globalOptions = options;
    }
  });

  // Register commands
  program.addCommand(initCommand);
  program.addCommand(agentCommand);
  program.addCommand(templateCommand);
  program.addCommand(validateCommand);

  // Custom help header with ASCII art banner
  program.addHelpText('beforeAll', () => {
    return displayBanner() + '\n';
  });

  // Custom help footer
  program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('n8n-bmad init')}                  Initialize a new n8n-BMAD project
  ${chalk.cyan('n8n-bmad agent list')}            List all available agents
  ${chalk.cyan('n8n-bmad agent load developer')}  Load the developer agent
  ${chalk.cyan('n8n-bmad template list')}         List all available templates
  ${chalk.cyan('n8n-bmad validate workflow')}     Validate workflow JSON
  ${chalk.cyan('n8n-bmad --help')}                Show this help message

${chalk.bold('Documentation:')}
  ${chalk.gray('https://github.com/your-org/n8n-bmad#readme')}

${chalk.bold('Report Issues:')}
  ${chalk.gray('https://github.com/your-org/n8n-bmad/issues')}
`);

  // Error handling
  program.exitOverride();
  program.configureOutput({
    outputError: (str, write) => {
      displayError(str.replace('error: ', ''));
    }
  });

  return program;
}

/**
 * Main CLI execution function
 * @async
 * @returns {Promise<void>}
 */
async function main() {
  const program = createProgram();

  try {
    // Show banner when run without arguments
    if (process.argv.length === 2) {
      console.log(displayBanner());
      console.log(chalk.yellow('\nUse "n8n-bmad --help" to see available commands.\n'));
      program.help();
    }

    await program.parseAsync(process.argv);
  } catch (error) {
    if (error.code === 'commander.helpDisplayed' ||
        error.code === 'commander.version') {
      process.exit(0);
    }

    if (error.code === 'commander.unknownCommand') {
      displayError(`Unknown command. Use "n8n-bmad --help" for available commands.`);
      process.exit(1);
    }

    displayError(error.message);
    if (program.opts().verbose) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

// Export for testing
module.exports = { createProgram, main };

// Run CLI if executed directly
if (require.main === module) {
  main();
}
