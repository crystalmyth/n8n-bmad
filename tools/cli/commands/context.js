/**
 * Context command for n8n-BMAD CLI
 * Generate and manage project context files
 *
 * @module commands/context
 * @description Handles project context generation and LLM context building
 */

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');
const ora = require('ora');
const yaml = require('js-yaml');

const {
  displayError,
  displayInfo,
  displayHeader,
  displayBox,
} = require('../lib/display');

/**
 * Generate project context from template
 * @async
 * @param {Object} options - Command options
 */
async function generateContext(options) {
  const spinner = ora('Gathering project information...').start();

  try {
    // Collect project information
    spinner.stop();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: path.basename(process.cwd()),
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'n8n workflow automation project',
      },
      {
        type: 'list',
        name: 'environment',
        message: 'Primary environment:',
        choices: ['development', 'staging', 'production'],
        default: 'development',
      },
      {
        type: 'list',
        name: 'deployment',
        message: 'Deployment type:',
        choices: ['Self-hosted', 'n8n Cloud'],
        default: 'Self-hosted',
      },
      {
        type: 'input',
        name: 'n8nVersion',
        message: 'n8n version (leave blank if unknown):',
        default: '',
      },
      {
        type: 'checkbox',
        name: 'compliance',
        message: 'Compliance frameworks (select all that apply):',
        choices: ['None', 'GDPR', 'HIPAA', 'SOC2', 'PCI-DSS', 'ISO 27001'],
        default: ['None'],
      },
    ]);

    spinner.start('Generating project context...');

    // Read template
    const templatePaths = [
      path.join(__dirname, '..', '..', '..', 'templates', 'project', 'project-context.template.md'),
      path.join(process.cwd(), '.n8n-bmad', 'templates', 'project', 'project-context.template.md'),
    ];

    let templateContent;
    for (const templatePath of templatePaths) {
      try {
        templateContent = await fs.readFile(templatePath, 'utf8');
        break;
      } catch (e) {
        continue;
      }
    }

    if (!templateContent) {
      throw new Error('Project context template not found');
    }

    // Replace placeholders
    const context = templateContent
      .replace(/\${PROJECT_NAME}/g, answers.projectName)
      .replace(/\${PROJECT_DESCRIPTION}/g, answers.description)
      .replace(/\${PROJECT_STATUS}/g, 'Active')
      .replace(/\${GENERATED_DATE}/g, new Date().toISOString().split('T')[0])
      .replace(/\${FRAMEWORK_VERSION}/g, '2.0.0')
      .replace(/\${SCALE_PROFILE}/g, options.profile || 'auto')
      .replace(/\${N8N_VERSION}/g, answers.n8nVersion || 'Unknown')
      .replace(/\${DEPLOYMENT_TYPE}/g, answers.deployment)
      .replace(/\${N8N_INSTANCE_URL}/g, process.env.N8N_INSTANCE_URL || 'http://localhost:5678')
      .replace(/\${ENVIRONMENT}/g, answers.environment)
      .replace(/\${COMPLIANCE_FRAMEWORKS}/g, answers.compliance.filter(c => c !== 'None').join(', ') || 'None')
      .replace(/\${PRODUCTION_WORKFLOWS}/g, '- *To be discovered*')
      .replace(/\${DEVELOPMENT_WORKFLOWS}/g, '- *To be discovered*')
      .replace(/\${ERROR_WORKFLOWS}/g, '- *To be discovered*')
      .replace(/\${CREDENTIAL_INVENTORY}/g, '| *Pending audit* | - | - | - |')
      .replace(/\${CONNECTED_SERVICES}/g, '- *To be documented*')
      .replace(/\${API_DEPENDENCIES}/g, '| *Pending* | - | - | - |')
      .replace(/\${INBOUND_WEBHOOKS}/g, '| *Pending* | - | - | - |')
      .replace(/\${OUTBOUND_WEBHOOKS}/g, '| *Pending* | - | - |')
      .replace(/\${DATA_SOURCES}/g, '- *To be documented*')
      .replace(/\${DATA_DESTINATIONS}/g, '- *To be documented*')
      .replace(/\${DATA_TRANSFORMATIONS}/g, '- *To be documented*')
      .replace(/\${RATE_LIMITS}/g, '- *To be documented*')
      .replace(/\${DATA_RESIDENCY}/g, 'Not specified')
      .replace(/\${SLAS}/g, '- *To be defined*')
      .replace(/\${TECH_STACK}/g, '- n8n\n- *Add your technologies*')
      .replace(/\${NODES_IN_USE}/g, '- *Pending discovery*')
      .replace(/\${CUSTOM_CODE_NOTES}/g, 'None documented')
      .replace(/\${TEAM_OWNERSHIP}/g, '| Project Owner | *TBD* | - |')
      .replace(/\${PRD_LOCATION}/g, './docs/requirements/')
      .replace(/\${PRD_STATUS}/g, 'Not started')
      .replace(/\${ARCH_LOCATION}/g, './docs/architecture/')
      .replace(/\${ARCH_STATUS}/g, 'Not started')
      .replace(/\${BACKLOG_LOCATION}/g, './docs/backlog/')
      .replace(/\${BACKLOG_STATUS}/g, 'Not started')
      .replace(/\${PROJECT_NOTES}/g, '*Add project-specific notes here*');

    // Determine output path
    const outputPath = options.output ||
      path.join(process.cwd(), '.n8n-bmad', 'project-context.md') ||
      path.join(process.cwd(), 'project-context.md');

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, context, 'utf8');

    spinner.succeed('Project context generated');

    displayBox([
      `Project: ${answers.projectName}`,
      `File: ${outputPath}`,
      '',
      'Next steps:',
      '1. Review and update the generated context',
      '2. Fill in workflow and credential details',
      '3. Document integrations and data flows',
    ], { title: 'Context Generated', style: 'round' });

  } catch (error) {
    spinner.fail('Failed to generate context');
    throw error;
  }
}

/**
 * Build LLM context file with all framework documentation
 * @async
 * @param {Object} options - Command options
 */
async function buildLlmContext(options) {
  const spinner = ora('Building LLM context...').start();

  try {
    const sections = [];
    const basePath = process.cwd();

    // Add header
    sections.push(`# n8n-BMAD Framework Context
# Generated: ${new Date().toISOString()}
# Use this file to provide context to AI assistants

`);

    // Add CLAUDE.md if exists
    const claudeMdPaths = [
      path.join(basePath, 'CLAUDE.md'),
      path.join(basePath, '.n8n-bmad', 'CLAUDE.md'),
    ];
    for (const claudePath of claudeMdPaths) {
      try {
        const content = await fs.readFile(claudePath, 'utf8');
        sections.push('## Framework Instructions (CLAUDE.md)\n\n' + content + '\n\n');
        break;
      } catch (e) {
        continue;
      }
    }

    // Add project context if exists
    const contextPaths = [
      path.join(basePath, '.n8n-bmad', 'project-context.md'),
      path.join(basePath, 'project-context.md'),
    ];
    for (const contextPath of contextPaths) {
      try {
        const content = await fs.readFile(contextPath, 'utf8');
        sections.push('## Project Context\n\n' + content + '\n\n');
        break;
      } catch (e) {
        continue;
      }
    }

    // Add trigger reference
    const triggerPaths = [
      path.join(basePath, 'src', 'core', 'trigger-help.csv'),
      path.join(basePath, '.n8n-bmad', 'src', 'core', 'trigger-help.csv'),
    ];
    for (const triggerPath of triggerPaths) {
      try {
        const content = await fs.readFile(triggerPath, 'utf8');
        sections.push('## Workflow Triggers Reference\n\n```csv\n' + content + '\n```\n\n');
        break;
      } catch (e) {
        continue;
      }
    }

    // Add agent summaries
    const agentPaths = [
      path.join(basePath, 'src', 'core', 'agents'),
      path.join(basePath, '.n8n-bmad', 'src', 'core', 'agents'),
    ];
    for (const agentPath of agentPaths) {
      try {
        const files = await fs.readdir(agentPath);
        const agentFiles = files.filter(f => f.endsWith('.agent.yaml'));

        if (agentFiles.length > 0) {
          sections.push('## Available Agents\n\n');

          for (const file of agentFiles) {
            try {
              const content = await fs.readFile(path.join(agentPath, file), 'utf8');
              const agent = yaml.load(content);
              if (agent.agent?.metadata) {
                const meta = agent.agent.metadata;
                const persona = agent.agent?.persona || {};
                sections.push(`### ${meta.name || meta.id} (${meta.title || 'Agent'})\n`);
                sections.push(`- **ID:** ${meta.id}\n`);
                sections.push(`- **Role:** ${persona.role || 'Not specified'}\n`);
                if (persona.identity) {
                  sections.push(`- **Identity:** ${persona.identity.substring(0, 200).trim()}...\n`);
                }
                sections.push('\n');
              }
            } catch (e) {
              continue;
            }
          }
        }
        break;
      } catch (e) {
        continue;
      }
    }

    // Add handler summaries
    const handlerPath = path.join(basePath, 'src', 'core', 'handlers');
    try {
      const files = await fs.readdir(handlerPath);
      const handlerFiles = files.filter(f => f.endsWith('.handler.md'));

      if (handlerFiles.length > 0) {
        sections.push('## Handler Components\n\n');
        sections.push('Available handlers for n8n workflow development:\n\n');

        for (const file of handlerFiles) {
          const name = file.replace('.handler.md', '');
          sections.push(`- **${name}**: See \`src/core/handlers/${file}\`\n`);
        }
        sections.push('\n');
      }
    } catch (e) {
      // Handlers not found, skip
    }

    // Add installed custom nodes from cache
    try {
      const { getCachedNodes } = require('../lib/node-discovery');
      const cached = await getCachedNodes({ silent: true, allowStale: true });

      if (cached && cached.nodes) {
        // Add custom nodes section
        if (cached.nodes.custom && cached.nodes.custom.length > 0) {
          sections.push('## Installed Custom Nodes\n\n');
          sections.push('Custom nodes discovered on this n8n instance:\n\n');
          sections.push('| Node Type | Display Name | Description |\n');
          sections.push('|-----------|--------------|-------------|\n');

          for (const node of cached.nodes.custom) {
            const desc = (node.description || '-').replace(/\|/g, '\\|').substring(0, 80);
            sections.push(`| ${node.type} | ${node.displayName || '-'} | ${desc} |\n`);
          }
          sections.push('\n');
        }

        // Add community nodes section
        if (cached.nodes.community && cached.nodes.community.length > 0) {
          sections.push('## Installed Community Nodes\n\n');
          sections.push('Community nodes available on this n8n instance:\n\n');
          sections.push('| Node Type | Display Name | Description |\n');
          sections.push('|-----------|--------------|-------------|\n');

          for (const node of cached.nodes.community.slice(0, 20)) {
            const desc = (node.description || '-').replace(/\|/g, '\\|').substring(0, 80);
            sections.push(`| ${node.type} | ${node.displayName || '-'} | ${desc} |\n`);
          }

          if (cached.nodes.community.length > 20) {
            sections.push(`\n*...and ${cached.nodes.community.length - 20} more community nodes*\n`);
          }
          sections.push('\n');
        }

        // Add cache info
        if (cached._stale) {
          sections.push('> **Note:** Node cache is stale. Run `n8n-bmad nodes discover` to refresh.\n\n');
        }
      }
    } catch (e) {
      // Node cache not available, skip silently
    }

    // Combine all sections
    const fullContext = sections.join('');

    // Write output
    const outputPath = options.output ||
      path.join(basePath, '.n8n-bmad', 'llms-context.txt');

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, fullContext, 'utf8');

    spinner.succeed(`LLM context built: ${outputPath}`);

    const stats = {
      size: Math.round(fullContext.length / 1024),
      tokens: Math.round(fullContext.length / 4), // Rough estimate
    };

    displayBox([
      `Output: ${outputPath}`,
      `Size: ~${stats.size}KB`,
      `Estimated tokens: ~${stats.tokens}`,
      '',
      'This file can be provided to AI assistants',
      'for comprehensive framework context.',
    ], { title: 'LLM Context Built', style: 'round' });

  } catch (error) {
    spinner.fail('Failed to build LLM context');
    throw error;
  }
}

/**
 * Create the context command
 * @returns {Command} Commander command instance
 */
function createContextCommand() {
  const command = new Command('context');

  command
    .description('Generate and manage project context files')
    .addCommand(
      new Command('generate')
        .description('Generate project context from template')
        .option('-o, --output <path>', 'Output file path')
        .option('-p, --profile <profile>', 'Scale profile (quick, standard, enterprise)', 'auto')
        .action(async (options) => {
          try {
            await generateContext(options);
          } catch (error) {
            displayError(`Failed to generate context: ${error.message}`);
            process.exit(1);
          }
        })
    )
    .addCommand(
      new Command('build')
        .description('Build consolidated LLM context file')
        .option('-o, --output <path>', 'Output file path')
        .action(async (options) => {
          try {
            await buildLlmContext(options);
          } catch (error) {
            displayError(`Failed to build LLM context: ${error.message}`);
            process.exit(1);
          }
        })
    );

  // Default action
  command.action(async () => {
    displayHeader('Context Commands');
    console.log();
    displayInfo('n8n-bmad context generate  - Generate project context');
    displayInfo('n8n-bmad context build     - Build LLM context file');
  });

  return command;
}

module.exports = createContextCommand();
