/**
 * Template command for n8n-BMAD CLI
 * Manages template operations - list and generate
 *
 * @module commands/template
 * @description Handles template listing and generation from the template library
 */

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');
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
  displayKeyValue,
} = require('../lib/display');

const {
  getProjectRoot,
  getConfigValue,
  getTemplateCategories,
} = require('../lib/config-loader');

/**
 * Check if a file exists
 * @async
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get templates directory path
 * @async
 * @param {string} [configPath] - Config file path
 * @returns {Promise<string>} Templates directory path
 */
async function getTemplatesPath(configPath) {
  const templatesPath = await getConfigValue('templates.path', './templates', configPath);
  const projectRoot = await getProjectRoot(configPath);
  return path.resolve(projectRoot, templatesPath);
}

/**
 * List all templates by category
 * @async
 * @param {Object} [options] - Options
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.configPath] - Config file path
 * @returns {Promise<Object>} Templates organized by category
 */
async function listTemplates(options = {}) {
  const { category, configPath } = options;

  const templatesPath = await getTemplatesPath(configPath);
  const categories = await getTemplateCategories(configPath);

  const templates = {};

  // Filter categories if specified
  const targetCategories = category
    ? categories.filter(c => c.toLowerCase().includes(category.toLowerCase()))
    : categories;

  for (const cat of targetCategories) {
    const categoryPath = path.join(templatesPath, cat);

    try {
      const files = await fs.readdir(categoryPath);
      const templateFiles = files.filter(f => f.endsWith('.md'));

      templates[cat] = await Promise.all(templateFiles.map(async (file) => {
        const filePath = path.join(categoryPath, file);
        const content = await fs.readFile(filePath, 'utf8');

        // Extract title from first line
        const titleMatch = content.match(/^#\s+(.+)/m);
        const title = titleMatch ? titleMatch[1] : file.replace('.md', '');

        // Extract description from content (first paragraph after title)
        const descMatch = content.match(/^#.+\n+([^#\n].+)/m);
        const description = descMatch ? descMatch[1].substring(0, 100) : '';

        return {
          name: file.replace('.md', ''),
          file,
          title,
          description: description.trim(),
          path: filePath,
          category: cat,
        };
      }));
    } catch (error) {
      // Category directory doesn't exist or is empty
      templates[cat] = [];
    }
  }

  return templates;
}

/**
 * Get a single template by category and name
 * @async
 * @param {string} category - Template category
 * @param {string} name - Template name
 * @param {Object} [options] - Options
 * @returns {Promise<Object>} Template data with content
 */
async function getTemplate(category, name, options = {}) {
  const { configPath } = options;

  const templatesPath = await getTemplatesPath(configPath);
  const fileName = name.endsWith('.md') ? name : `${name}.md`;
  const filePath = path.join(templatesPath, category, fileName);

  if (!await fileExists(filePath)) {
    throw new Error(`Template not found: ${category}/${name}`);
  }

  const content = await fs.readFile(filePath, 'utf8');

  // Extract title
  const titleMatch = content.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1] : name;

  // Extract variables (placeholders like {{variable}})
  const variables = [];
  const varRegex = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return {
    name,
    file: fileName,
    title,
    content,
    variables,
    path: filePath,
    category,
  };
}

/**
 * Generate template content with variable substitution
 * @param {string} content - Template content
 * @param {Object} variables - Variable values
 * @returns {string} Generated content
 */
function generateContent(content, variables) {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Format templates for table display
 * @param {Object} templates - Templates by category
 * @returns {Array<Array>} Table data
 */
function formatTemplateTable(templates) {
  const headers = ['Category', 'Template', 'Title'];
  const rows = [];

  for (const [category, items] of Object.entries(templates)) {
    items.forEach((item, index) => {
      rows.push([
        index === 0 ? chalk.cyan(category) : '',
        item.name,
        item.title.substring(0, 40) + (item.title.length > 40 ? '...' : ''),
      ]);
    });

    if (items.length > 0) {
      rows.push(['', '', '']); // Empty row between categories
    }
  }

  return [headers, ...rows.filter(r => r[1] !== '')];
}

/**
 * Create the template list subcommand
 * @returns {Command} List subcommand
 */
function createListCommand() {
  const cmd = new Command('list');

  cmd
    .description('List available templates')
    .option('-c, --category <name>', 'Filter by category')
    .option('-f, --format <format>', 'Output format (table, json, tree)', 'table')
    .action(async (options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora('Loading templates...').start();

        const templates = await listTemplates({
          category: options.category,
        });

        // Count total templates
        const totalCount = Object.values(templates).reduce((sum, arr) => sum + arr.length, 0);
        spinner.succeed(`Loaded ${totalCount} templates`);

        if (totalCount === 0) {
          displayWarning('No templates found');
          return;
        }

        switch (options.format) {
          case 'json':
            console.log(JSON.stringify(templates, null, 2));
            break;

          case 'tree':
            displayHeader('Template Library');
            for (const [category, items] of Object.entries(templates)) {
              if (items.length > 0) {
                console.log(`\n${chalk.cyan(category)}/`);
                items.forEach(item => {
                  console.log(`  ${chalk.gray('├─')} ${item.name}`);
                  if (globalOptions.verbose) {
                    console.log(`  ${chalk.gray('│  ')} ${chalk.gray(item.description)}`);
                  }
                });
              }
            }
            break;

          case 'table':
          default:
            displayHeader('Template Library');
            console.log(displayTable(formatTemplateTable(templates)));
            break;
        }

        console.log();
        displayInfo('Use "n8n-bmad template generate <category> <template>" to generate from a template');

      } catch (error) {
        displayError(`Failed to list templates: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the template generate subcommand
 * @returns {Command} Generate subcommand
 */
function createGenerateCommand() {
  const cmd = new Command('generate');

  cmd
    .description('Generate a document from a template')
    .argument('<category>', 'Template category (e.g., project, agile)')
    .argument('<template>', 'Template name')
    .option('-o, --output <path>', 'Output file path')
    .option('-i, --interactive', 'Prompt for variable values', true)
    .option('--var <key=value...>', 'Variable values (can be specified multiple times)')
    .option('--preview', 'Preview generated content without saving')
    .action(async (category, templateName, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};
      const dryRun = globalOptions.dryRun || false;

      try {
        const spinner = ora(`Loading template: ${category}/${templateName}...`).start();

        const template = await getTemplate(category, templateName);
        spinner.succeed(`Template loaded: ${template.title}`);

        // Collect variable values
        let variables = {};

        // Parse --var arguments
        if (options.var) {
          const varArray = Array.isArray(options.var) ? options.var : [options.var];
          varArray.forEach(v => {
            const [key, ...valueParts] = v.split('=');
            if (key && valueParts.length > 0) {
              variables[key] = valueParts.join('=');
            }
          });
        }

        // Interactive prompts for missing variables
        if (options.interactive && template.variables.length > 0) {
          const missingVars = template.variables.filter(v => !variables[v]);

          if (missingVars.length > 0 && !globalOptions.yes) {
            displayHeader('Template Variables', { style: 'compact' });
            console.log(chalk.gray(`This template has ${template.variables.length} variables.\n`));

            const questions = missingVars.map(varName => ({
              type: 'input',
              name: varName,
              message: `${varName}:`,
              default: varName.includes('date')
                ? new Date().toISOString().split('T')[0]
                : undefined,
            }));

            const answers = await inquirer.prompt(questions);
            variables = { ...variables, ...answers };
          }
        }

        // Generate content
        const generatedContent = generateContent(template.content, variables);

        // Preview mode
        if (options.preview) {
          displayHeader('Generated Content Preview');
          console.log(chalk.gray('─'.repeat(60)));
          console.log(generatedContent);
          console.log(chalk.gray('─'.repeat(60)));
          return;
        }

        // Determine output path
        let outputPath = options.output;
        if (!outputPath && !globalOptions.yes) {
          const { output } = await inquirer.prompt([{
            type: 'input',
            name: 'output',
            message: 'Output file path:',
            default: `./${templateName.replace('.md', '')}-${Date.now()}.md`,
          }]);
          outputPath = output;
        }

        if (!outputPath) {
          outputPath = `./${templateName.replace('.md', '')}-${Date.now()}.md`;
        }

        // Resolve output path
        outputPath = path.resolve(process.cwd(), outputPath);

        // Check if output file exists
        if (await fileExists(outputPath)) {
          if (!globalOptions.yes) {
            const { overwrite } = await inquirer.prompt([{
              type: 'confirm',
              name: 'overwrite',
              message: `File ${outputPath} already exists. Overwrite?`,
              default: false,
            }]);

            if (!overwrite) {
              displayInfo('Generation cancelled');
              return;
            }
          }
        }

        // Write the file
        if (dryRun) {
          displayInfo(`Would write to: ${outputPath}`);
          displayInfo(`Content length: ${generatedContent.length} characters`);
        } else {
          // Ensure directory exists
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await fs.writeFile(outputPath, generatedContent, 'utf8');
          displaySuccess(`Generated: ${outputPath}`);
        }

        // Show summary
        console.log();
        displayBox([
          `Template: ${template.title}`,
          `Category: ${category}`,
          `Output: ${outputPath}`,
          '',
          `Variables: ${Object.keys(variables).length}`,
          `Size: ${generatedContent.length} characters`,
        ], { title: 'Generated', style: 'round' });

      } catch (error) {
        displayError(`Failed to generate template: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the template show subcommand
 * @returns {Command} Show subcommand
 */
function createShowCommand() {
  const cmd = new Command('show');

  cmd
    .description('Show template content and variables')
    .argument('<category>', 'Template category')
    .argument('<template>', 'Template name')
    .option('--vars-only', 'Show only variables')
    .action(async (category, templateName, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora(`Loading template...`).start();

        const template = await getTemplate(category, templateName);
        spinner.succeed(`Loaded: ${template.title}`);

        console.log();
        displayKeyValue('Title', template.title);
        displayKeyValue('Category', template.category);
        displayKeyValue('Path', template.path);
        console.log();

        if (template.variables.length > 0) {
          displayHeader('Variables', { style: 'compact' });
          displayList(template.variables.map(v => `{{${v}}}`), { bullet: '-' });
          console.log();
        } else {
          displayInfo('This template has no variables');
          console.log();
        }

        if (!options.varsOnly) {
          displayHeader('Content', { style: 'compact' });
          console.log(chalk.gray('─'.repeat(60)));
          // Show first 30 lines or full content
          const lines = template.content.split('\n');
          const displayLines = lines.slice(0, 30);
          console.log(displayLines.join('\n'));
          if (lines.length > 30) {
            console.log(chalk.gray(`\n... and ${lines.length - 30} more lines`));
          }
          console.log(chalk.gray('─'.repeat(60)));
        }

      } catch (error) {
        displayError(`Failed to show template: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the template categories subcommand
 * @returns {Command} Categories subcommand
 */
function createCategoriesCommand() {
  const cmd = new Command('categories');

  cmd
    .description('List template categories')
    .action(async () => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const categories = await getTemplateCategories();

        displayHeader('Template Categories');

        const descriptions = {
          'project': 'Project planning documents (PRD, charter, brief)',
          'agile': 'Agile artifacts (epics, stories, sprints)',
          'architecture': 'Technical design documents (ADR, solution design)',
          'operations': 'Ops documents (runbooks, incident reports)',
          'testing': 'QA documents (test plans, test cases)',
          'n8n-specific': 'n8n workflow documentation',
          'security': 'Security assessments and reviews',
        };

        categories.forEach(cat => {
          console.log(`  ${chalk.cyan(cat.padEnd(15))} ${chalk.gray(descriptions[cat] || '')}`);
        });

        console.log();
        displayInfo('Use "n8n-bmad template list -c <category>" to see templates in a category');

      } catch (error) {
        displayError(`Failed to list categories: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the main template command
 * @returns {Command} Template command with subcommands
 */
function createTemplateCommand() {
  const command = new Command('template');

  command
    .description('Template operations - list and generate from template library')
    .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('n8n-bmad template list')}                      List all templates
  ${chalk.cyan('n8n-bmad template list -c agile')}             List agile templates
  ${chalk.cyan('n8n-bmad template list -f tree')}              Show templates as tree
  ${chalk.cyan('n8n-bmad template categories')}                List template categories
  ${chalk.cyan('n8n-bmad template show project PRD')}          Show PRD template
  ${chalk.cyan('n8n-bmad template generate project PRD')}      Generate from PRD template
  ${chalk.cyan('n8n-bmad template generate agile story -o story.md')}  Generate to specific file

${chalk.bold('Template Variables:')}
  Templates may contain {{variable}} placeholders.
  Use --var to provide values: ${chalk.cyan('--var "name=My Project" --var "date=2024-01-15"')}
`);

  // Add subcommands
  command.addCommand(createListCommand());
  command.addCommand(createGenerateCommand());
  command.addCommand(createShowCommand());
  command.addCommand(createCategoriesCommand());

  // Default action when no subcommand
  command.action(async () => {
    command.help();
  });

  return command;
}

module.exports = createTemplateCommand();
