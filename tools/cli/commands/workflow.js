/**
 * Workflow command for n8n-BMAD CLI
 * Manages workflow operations - list, run, and navigate multi-agent workflows
 *
 * @module commands/workflow
 * @description Handles workflow execution and navigation
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
  displayBox,
  displayKeyValue,
  displayDivider,
} = require('../lib/display');

const {
  findWorkflowByTrigger,
  loadWorkflowFile,
  listWorkflows,
  getWorkflowPaths,
  getNextWorkflows,
  formatWorkflowForDisplay,
} = require('../lib/workflow-loader');


/**
 * Format workflow list for table display
 * @param {Array<Object>} workflows - List of workflows
 * @returns {Array<Array>} Table data
 */
function formatWorkflowTable(workflows) {
  const headers = ['Trigger', 'Description', 'Agent', 'Category'];

  const rows = workflows.map(wf => [
    chalk.cyan(`[${wf.trigger}]`),
    wf.description.substring(0, 40) + (wf.description.length > 40 ? '...' : ''),
    wf.primaryAgent || '-',
    wf.category,
  ]);

  return [headers, ...rows];
}

/**
 * Display a workflow step with formatting
 * @param {Object} step - Step object
 * @param {number} totalSteps - Total number of steps
 */
function displayStep(step, totalSteps) {
  const stepLabel = step.isRoute
    ? chalk.magenta(`Route ${step.number}`)
    : chalk.cyan(`Step ${step.number}/${totalSteps}`);

  console.log();
  console.log(chalk.bold(`${stepLabel}: ${step.title}`));

  if (step.agent) {
    console.log(chalk.gray(`  Agent: ${step.agent.name} (${step.agent.role}) ${step.agent.icon || ''}`));
  }

  displayDivider({ width: 50, char: '─' });

  // Display step content with proper formatting
  const lines = step.content.split('\n');
  let inCodeBlock = false;
  let codeLines = [];

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block - display accumulated code
        console.log(chalk.gray('  ┌' + '─'.repeat(48)));
        codeLines.forEach(codeLine => {
          console.log(chalk.gray('  │ ') + chalk.yellow(codeLine));
        });
        console.log(chalk.gray('  └' + '─'.repeat(48)));
        codeLines = [];
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Format different line types
    if (line.startsWith('### ')) {
      console.log();
      console.log(chalk.bold.white('  ' + line.substring(4)));
    } else if (line.startsWith('- [ ]')) {
      console.log(chalk.gray('  ☐ ') + line.substring(6));
    } else if (line.startsWith('- [x]') || line.startsWith('- [X]')) {
      console.log(chalk.green('  ☑ ') + line.substring(6));
    } else if (line.startsWith('- ')) {
      console.log(chalk.cyan('  • ') + line.substring(2));
    } else if (line.startsWith('| ')) {
      // Table row - format nicely
      console.log(chalk.gray('  ' + line));
    } else if (line.startsWith('**🔀')) {
      // Decision point
      console.log();
      console.log(chalk.magenta('  ↳ ') + chalk.bold(line.replace(/\*\*/g, '')));
    } else if (line.trim()) {
      console.log('  ' + line);
    }
  }
}

/**
 * Run a workflow interactively
 * @param {Object} workflowDef - Workflow definition from manifest
 */
async function runWorkflowInteractive(workflowDef) {
  const spinner = ora(`Loading workflow: ${workflowDef.id}...`).start();

  try {
    const workflow = await loadWorkflowFile(workflowDef.file);
    spinner.succeed(`Loaded: ${workflow.title} [${workflow.trigger}]`);

    // Display workflow header
    console.log();
    displayBox([
      chalk.bold(workflow.title),
      '',
      `Trigger: ${chalk.cyan(workflow.trigger)}`,
      `Agents: ${workflow.agents.map(a => `${a.name} ${a.icon}`).join(' → ')}`,
      `Steps: ${workflow.steps.length}`,
    ], { title: 'Workflow', style: 'round' });

    let currentStepIndex = 0;

    while (currentStepIndex < workflow.steps.length) {
      const step = workflow.steps[currentStepIndex];
      displayStep(step, workflow.steps.length);

      const choices = [
        { name: 'Next step →', value: 'next' },
        { name: 'Previous step ←', value: 'prev' },
        new inquirer.Separator(),
        { name: 'Jump to step...', value: 'jump' },
        { name: 'Show all steps', value: 'list' },
        new inquirer.Separator(),
        { name: 'Mark step complete', value: 'complete' },
        { name: 'Exit workflow', value: 'exit' },
      ];

      // Remove "Previous" if at first step
      if (currentStepIndex === 0) {
        choices.splice(1, 1);
      }

      // Change "Next" to "Finish" on last step
      if (currentStepIndex === workflow.steps.length - 1) {
        choices[0] = { name: 'Finish workflow ✓', value: 'finish' };
      }

      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'Action:',
        choices,
      }]);

      switch (action) {
        case 'next':
          currentStepIndex++;
          break;
        case 'prev':
          currentStepIndex--;
          break;
        case 'jump': {
          const stepChoices = workflow.steps.map((s, i) => ({
            name: `${s.isRoute ? 'Route' : 'Step'} ${s.number}: ${s.title}`,
            value: i,
          }));
          const { stepIndex } = await inquirer.prompt([{
            type: 'list',
            name: 'stepIndex',
            message: 'Jump to:',
            choices: stepChoices,
          }]);
          currentStepIndex = stepIndex;
          break;
        }
        case 'list':
          displayHeader('Workflow Steps', { style: 'compact' });
          workflow.steps.forEach((s, i) => {
            const marker = i === currentStepIndex ? chalk.cyan('→') : ' ';
            const prefix = s.isRoute ? 'Route' : 'Step';
            console.log(`  ${marker} ${prefix} ${s.number}: ${s.title}`);
          });
          break;
        case 'complete':
          displaySuccess(`Step ${step.number} marked as complete`);
          break;
        case 'finish': {
          displaySuccess(`Workflow "${workflow.title}" completed!`);

          // Show next workflow suggestions
          const nextWorkflows = await getNextWorkflows(workflow.trigger);
          if (nextWorkflows.length > 0) {
            console.log();
            displayHeader('Suggested Next Workflows', { style: 'compact' });
            nextWorkflows.forEach(nw => {
              console.log(`  ${chalk.cyan(`[${nw.trigger}]`)} ${nw.description}`);
            });
          }
          return;
        }
        case 'exit':
          displayWarning('Workflow exited');
          return;
      }
    }

    displaySuccess(`Workflow "${workflow.title}" completed!`);

  } catch (error) {
    spinner.fail(`Failed to load workflow`);
    throw error;
  }
}

/**
 * Display workflow summary (non-interactive)
 * @param {Object} workflowDef - Workflow definition from manifest
 */
async function displayWorkflowSummary(workflowDef) {
  const spinner = ora(`Loading workflow: ${workflowDef.id}...`).start();

  try {
    const workflow = await loadWorkflowFile(workflowDef.file);
    spinner.succeed(`Loaded: ${workflow.title}`);

    displayHeader(`${workflow.title} [${workflow.trigger}]`, { style: 'prominent' });

    // Agents
    console.log();
    displayKeyValue('Agents', workflow.agents.map(a => `${a.name} (${a.role}) ${a.icon}`).join(' → '));
    displayKeyValue('Steps', String(workflow.steps.length));
    displayKeyValue('Category', workflowDef.category);

    // Steps overview
    console.log();
    displayHeader('Steps', { style: 'compact' });
    workflow.steps.forEach(step => {
      const prefix = step.isRoute ? chalk.magenta('Route') : chalk.cyan('Step');
      const agent = step.agent ? chalk.gray(` [${step.agent.name}]`) : '';
      console.log(`  ${prefix} ${step.number}: ${step.title}${agent}`);
    });

    // Quick reference
    console.log();
    displayInfo(`Run "n8n-bmad workflow run ${workflow.trigger}" to start this workflow interactively`);

  } catch (error) {
    spinner.fail(`Failed to load workflow`);
    throw error;
  }
}

/**
 * Create the workflow list subcommand
 * @returns {Command} List subcommand
 */
function createListCommand() {
  const cmd = new Command('list');

  cmd
    .description('List all available workflows')
    .option('-c, --category <category>', 'Filter by category')
    .option('-f, --format <format>', 'Output format (table, json, simple)', 'table')
    .action(async (options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora('Loading workflows...').start();
        let workflows = await listWorkflows();

        if (options.category) {
          workflows = workflows.filter(wf =>
            wf.category.toLowerCase().includes(options.category.toLowerCase())
          );
        }

        spinner.succeed(`Found ${workflows.length} workflows`);

        if (workflows.length === 0) {
          displayWarning('No workflows found');
          return;
        }

        switch (options.format) {
          case 'json':
            console.log(JSON.stringify(workflows, null, 2));
            break;

          case 'simple':
            workflows.forEach(wf => {
              console.log(`${chalk.cyan(`[${wf.trigger}]`.padEnd(6))} ${wf.description}`);
            });
            break;

          case 'table':
          default: {
            displayHeader('Available Workflows');
            console.log(displayTable(formatWorkflowTable(workflows)));

            // Group by category
            const categories = [...new Set(workflows.map(w => w.category))];
            displayInfo(`Categories: ${categories.join(', ')}`);
            displayInfo(`Use "n8n-bmad workflow run <trigger>" to run a workflow`);
            break;
          }
        }

      } catch (error) {
        displayError(`Failed to list workflows: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the workflow run subcommand
 * @returns {Command} Run subcommand
 */
function createRunCommand() {
  const cmd = new Command('run');

  cmd
    .description('Run a workflow by trigger code')
    .argument('<trigger>', 'Workflow trigger (e.g., PRD, CA, CS, DS, CR)')
    .option('-i, --interactive', 'Run in interactive mode (default)', true)
    .option('-s, --summary', 'Show workflow summary only')
    .action(async (trigger, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora(`Finding workflow: ${trigger}...`).start();
        const workflowDef = await findWorkflowByTrigger(trigger);

        if (!workflowDef) {
          spinner.fail(`Workflow not found for trigger: ${trigger}`);
          displayInfo('Use "n8n-bmad workflow list" to see available triggers');
          process.exit(1);
        }

        spinner.stop();

        if (options.summary) {
          await displayWorkflowSummary(workflowDef);
        } else {
          await runWorkflowInteractive(workflowDef);
        }

      } catch (error) {
        displayError(`Failed to run workflow: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the workflow show subcommand
 * @returns {Command} Show subcommand
 */
function createShowCommand() {
  const cmd = new Command('show');

  cmd
    .description('Show workflow details')
    .argument('<trigger>', 'Workflow trigger (e.g., PRD, DS, CR)')
    .option('--json', 'Output as JSON')
    .action(async (trigger, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const workflowDef = await findWorkflowByTrigger(trigger);

        if (!workflowDef) {
          displayError(`Workflow not found for trigger: ${trigger}`);
          process.exit(1);
        }

        if (options.json) {
          const workflow = await loadWorkflowFile(workflowDef.file);
          console.log(JSON.stringify(formatWorkflowForDisplay(workflow, { detailed: true }), null, 2));
        } else {
          await displayWorkflowSummary(workflowDef);
        }

      } catch (error) {
        displayError(`Failed to show workflow: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the workflow paths subcommand
 * @returns {Command} Paths subcommand
 */
function createPathsCommand() {
  const cmd = new Command('paths');

  cmd
    .description('Show common workflow paths')
    .action(async () => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora('Loading workflow paths...').start();
        const paths = await getWorkflowPaths();
        spinner.succeed('Loaded workflow paths');

        if (Object.keys(paths).length === 0) {
          displayWarning('No workflow paths defined');
          return;
        }

        displayHeader('Common Workflow Paths', { style: 'prominent' });

        for (const [key, path] of Object.entries(paths)) {
          console.log();
          displayBox([
            chalk.bold(path.name),
            '',
            path.description,
            '',
            `Steps: ${path.steps.map(s => chalk.cyan(`[${s}]`)).join(' → ')}`,
            `Agents: ${path.agents.join(', ')}`,
          ], { title: key, style: 'round' });
        }

        console.log();
        displayInfo('Use "n8n-bmad workflow run <trigger>" to start at any step');

      } catch (error) {
        displayError(`Failed to load paths: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the workflow triggers subcommand (quick reference)
 * @returns {Command} Triggers subcommand
 */
function createTriggersCommand() {
  const cmd = new Command('triggers');

  cmd
    .alias('t')
    .description('Quick reference of all workflow triggers')
    .action(async () => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const workflows = await listWorkflows();

        displayHeader('Workflow Triggers Quick Reference', { style: 'prominent' });

        // Group by category
        const byCategory = {};
        for (const wf of workflows) {
          if (!byCategory[wf.category]) {
            byCategory[wf.category] = [];
          }
          byCategory[wf.category].push(wf);
        }

        for (const [category, wfs] of Object.entries(byCategory)) {
          console.log();
          displayHeader(category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), { style: 'compact' });

          wfs.forEach(wf => {
            const trigger = chalk.cyan(`[${wf.trigger}]`.padEnd(6));
            console.log(`  ${trigger} ${wf.description}`);
          });
        }

        console.log();
        displayInfo('Run: n8n-bmad workflow run <TRIGGER>');

      } catch (error) {
        displayError(`Failed to list triggers: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the main workflow command
 * @returns {Command} Workflow command with subcommands
 */
function createWorkflowCommand() {
  const command = new Command('workflow');

  command
    .alias('wf')
    .description('Workflow operations - run and navigate multi-agent workflows')
    .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('n8n-bmad workflow list')}             List all workflows
  ${chalk.cyan('n8n-bmad workflow list -c quick')}    Filter by category
  ${chalk.cyan('n8n-bmad workflow run PRD')}          Run PRD workflow (auto-scales)
  ${chalk.cyan('n8n-bmad workflow run DS -s')}        Show Dev Story summary
  ${chalk.cyan('n8n-bmad workflow show PRD')}         Show PRD workflow details
  ${chalk.cyan('n8n-bmad workflow paths')}            Show common workflow paths
  ${chalk.cyan('n8n-bmad workflow triggers')}         Quick trigger reference

${chalk.bold('Essential Triggers:')}
  ${chalk.cyan('[PRD]')} Create PRD    ${chalk.cyan('[CA]')} Architecture   ${chalk.cyan('[CS]')} Create Story
  ${chalk.cyan('[DS]')} Dev Story      ${chalk.cyan('[CR]')} Code Review    ${chalk.cyan('[DW]')} Deploy
`);

  // Add subcommands
  command.addCommand(createListCommand());
  command.addCommand(createRunCommand());
  command.addCommand(createShowCommand());
  command.addCommand(createPathsCommand());
  command.addCommand(createTriggersCommand());

  // Default action - show triggers
  command.action(async () => {
    // If no subcommand, show triggers
    const cmd = createTriggersCommand();
    await cmd.parseAsync(['triggers'], { from: 'user' });
  });

  return command;
}

module.exports = createWorkflowCommand();
