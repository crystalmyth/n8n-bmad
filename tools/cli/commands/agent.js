/**
 * Agent command for n8n-BMAD CLI
 * Manages agent operations - list, load, and menu display
 *
 * @module commands/agent
 * @description Handles agent persona management and interaction
 */

const { Command } = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');

const {
  displaySuccess,
  displayError,
  displayWarning,
  displayInfo,
  displayHeader,
  displayTable,
  displayList,
  displayBox,
  displayAgentCard,
  displayMenu,
  displayKeyValue,
} = require('../lib/display');

const {
  loadAgent,
  listAgents,
  getAgentMenu,
  findAgentsByExpertise,
  routeToAgent,
  getCollaborators,
  formatAgentForDisplay,
} = require('../lib/agent-loader');

/**
 * Format agent list for table display
 * @param {Array<Object>} agents - List of agents
 * @returns {Array<Array>} Table data
 */
function formatAgentTable(agents) {
  const headers = ['ID', 'Name', 'Role', 'Status'];

  const rows = agents.map(agent => [
    agent.error ? chalk.red(agent.id) : chalk.cyan(agent.id),
    agent.name,
    agent.role,
    agent.error ? chalk.red('Error') : chalk.green('OK'),
  ]);

  return [headers, ...rows];
}

/**
 * Display detailed agent information
 * @param {Object} agent - Agent object
 */
function displayAgentDetails(agent) {
  displayHeader(agent.name, { style: 'prominent' });

  console.log();
  displayKeyValue('ID', agent.id);
  displayKeyValue('Role', agent.role);
  displayKeyValue('Version', agent.version || '1.0.0');
  console.log();

  if (agent.description) {
    displayHeader('Description', { style: 'compact' });
    console.log(chalk.gray(agent.description.trim()));
    console.log();
  }

  if (agent.expertise && agent.expertise.length > 0) {
    displayHeader('Expertise', { style: 'compact' });
    displayList(agent.expertise, { bullet: '-' });
    console.log();
  }

  if (agent.personality && agent.personality.length > 0) {
    displayHeader('Personality', { style: 'compact' });
    displayList(agent.personality, { bullet: '-' });
    console.log();
  }

  if (agent.capabilities && agent.capabilities.length > 0) {
    displayHeader('Capabilities', { style: 'compact' });
    displayList(agent.capabilities, { bullet: '-' });
    console.log();
  }

  if (agent.templates && agent.templates.length > 0) {
    displayHeader('Templates', { style: 'compact' });
    displayList(agent.templates, { bullet: '-' });
    console.log();
  }
}

/**
 * Create the agent list subcommand
 * @returns {Command} List subcommand
 */
function createListCommand() {
  const cmd = new Command('list');

  cmd
    .description('List all available agents')
    .option('-f, --format <format>', 'Output format (table, json, simple)', 'table')
    .option('--filter <keyword>', 'Filter agents by keyword')
    .action(async (options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora('Loading agents...').start();

        let agents;
        if (options.filter) {
          agents = await findAgentsByExpertise(options.filter);
          spinner.succeed(`Found ${agents.length} matching agents`);
        } else {
          agents = await listAgents();
          spinner.succeed(`Loaded ${agents.length} agents`);
        }

        if (agents.length === 0) {
          displayWarning('No agents found');
          return;
        }

        switch (options.format) {
          case 'json':
            console.log(JSON.stringify(agents, null, 2));
            break;

          case 'simple':
            agents.forEach(agent => {
              const status = agent.error ? chalk.red('[ERR]') : chalk.green('[OK]');
              console.log(`${status} ${chalk.cyan(agent.id.padEnd(15))} ${agent.name}`);
            });
            break;

          case 'table':
          default:
            displayHeader('Available Agents');
            console.log(displayTable(formatAgentTable(agents)));

            displayInfo(`Use "n8n-bmad agent load <id>" to load an agent`);
            break;
        }

      } catch (error) {
        displayError(`Failed to list agents: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the agent load subcommand
 * @returns {Command} Load subcommand
 */
function createLoadCommand() {
  const cmd = new Command('load');

  cmd
    .description('Load an agent persona')
    .argument('<agent-id>', 'Agent identifier (e.g., developer, architect)')
    .option('-d, --detailed', 'Show detailed agent information')
    .option('--json', 'Output as JSON')
    .action(async (agentId, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora(`Loading agent: ${agentId}...`).start();

        const agent = await loadAgent(agentId);
        spinner.succeed(`Agent loaded: ${agent.name}`);

        if (options.json) {
          console.log(JSON.stringify(formatAgentForDisplay(agent, { detailed: true }), null, 2));
          return;
        }

        if (options.detailed) {
          displayAgentDetails(agent);
        } else {
          displayAgentCard(agent);
        }

        // Show welcome prompt if available
        if (agent.prompts && agent.prompts.welcome) {
          console.log();
          displayBox(agent.prompts.welcome.split('\n').slice(0, 10), {
            title: 'Welcome',
            style: 'round',
          });
        }

        // Show collaborators
        const collaborators = await getCollaborators(agentId);
        if (collaborators.length > 0) {
          console.log();
          displayHeader('Collaborates With', { style: 'compact' });
          collaborators.forEach(collab => {
            console.log(`  ${chalk.cyan(collab.name)} - ${chalk.gray(collab.relationship)}`);
          });
        }

        // Show quick tip
        console.log();
        displayInfo(`Run "n8n-bmad agent menu ${agentId}" to see available commands`);

      } catch (error) {
        displayError(`Failed to load agent: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the agent menu subcommand
 * @returns {Command} Menu subcommand
 */
function createMenuCommand() {
  const cmd = new Command('menu');

  cmd
    .description('Display agent menu and commands')
    .argument('[agent-id]', 'Agent identifier (default: n8n-master)', 'n8n-master')
    .option('-i, --interactive', 'Enable interactive menu selection')
    .action(async (agentId, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora(`Loading menu for: ${agentId}...`).start();

        const agent = await loadAgent(agentId);
        const menu = await getAgentMenu(agentId);
        spinner.succeed(`Menu loaded for: ${agent.name}`);

        if (!menu || !menu.sections) {
          displayWarning(`No menu defined for agent: ${agentId}`);
          return;
        }

        displayHeader(`${agent.name} - Commands`, { style: 'prominent' });
        displayMenu(menu);

        if (options.interactive) {
          // Build choices from menu
          const choices = [];
          menu.sections.forEach(section => {
            choices.push(new inquirer.Separator(`-- ${section.name} --`));
            if (section.commands) {
              section.commands.forEach(cmd => {
                choices.push({
                  name: `[${cmd.key}] ${cmd.description}`,
                  value: cmd,
                });
              });
            }
          });
          choices.push(new inquirer.Separator());
          choices.push({ name: 'Exit', value: null });

          const { selected } = await inquirer.prompt([{
            type: 'list',
            name: 'selected',
            message: 'Select a command:',
            choices,
            pageSize: 15,
          }]);

          if (selected) {
            displayInfo(`Selected: ${selected.action} - ${selected.description}`);
            // In a full implementation, this would execute the action
          }
        }

      } catch (error) {
        displayError(`Failed to load menu: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the agent route subcommand
 * @returns {Command} Route subcommand
 */
function createRouteCommand() {
  const cmd = new Command('route');

  cmd
    .description('Find the best agent for a given task')
    .argument('<query>', 'Task or query description')
    .action(async (query) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora('Analyzing query...').start();

        const result = await routeToAgent(query);
        spinner.stop();

        if (!result) {
          displayWarning('No specific agent recommended for this query.');
          displayInfo('The n8n-master agent can help with general questions.');
          return;
        }

        displaySuccess(`Recommended agent: ${result.agent.name}`);
        console.log();

        displayBox([
          `Agent: ${result.agent.name}`,
          `Role: ${result.agent.role}`,
          '',
          `Reason: ${result.reason}`,
          `Matched: "${result.matchedKeyword}"`,
        ], { title: 'Recommendation', style: 'round' });

        console.log();
        displayInfo(`Run "n8n-bmad agent load ${result.agent.id}" to load this agent`);

      } catch (error) {
        displayError(`Routing failed: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the agent info subcommand
 * @returns {Command} Info subcommand
 */
function createInfoCommand() {
  const cmd = new Command('info');

  cmd
    .description('Show detailed information about an agent')
    .argument('<agent-id>', 'Agent identifier')
    .action(async (agentId) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora(`Loading agent info: ${agentId}...`).start();

        const agent = await loadAgent(agentId);
        spinner.succeed(`Agent info loaded`);

        displayAgentDetails(agent);

        // Show raw responsibilities if verbose
        if (globalOptions.verbose && agent.responsibilities) {
          displayHeader('Responsibilities', { style: 'compact' });
          Object.entries(agent.responsibilities).forEach(([key, value]) => {
            console.log(`\n  ${chalk.cyan(key)}:`);
            if (value.description) {
              console.log(`    ${chalk.gray(value.description)}`);
            }
          });
        }

      } catch (error) {
        displayError(`Failed to get agent info: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the main agent command
 * @returns {Command} Agent command with subcommands
 */
function createAgentCommand() {
  const command = new Command('agent');

  command
    .description('Agent operations - manage and interact with agent personas')
    .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('n8n-bmad agent list')}                List all available agents
  ${chalk.cyan('n8n-bmad agent list --filter api')}   Filter agents by keyword
  ${chalk.cyan('n8n-bmad agent load developer')}      Load the developer agent
  ${chalk.cyan('n8n-bmad agent menu')}                Show master agent menu
  ${chalk.cyan('n8n-bmad agent menu developer -i')}   Interactive developer menu
  ${chalk.cyan('n8n-bmad agent route "build webhook"')} Find best agent for task
  ${chalk.cyan('n8n-bmad agent info architect')}      Show architect agent details
`);

  // Add subcommands
  command.addCommand(createListCommand());
  command.addCommand(createLoadCommand());
  command.addCommand(createMenuCommand());
  command.addCommand(createRouteCommand());
  command.addCommand(createInfoCommand());

  // Default action when no subcommand
  command.action(async () => {
    // Show help if no subcommand provided
    command.help();
  });

  return command;
}

module.exports = createAgentCommand();
