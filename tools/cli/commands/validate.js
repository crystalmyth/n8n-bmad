/**
 * Validate command for n8n-BMAD CLI
 * Validates workflows and naming conventions
 *
 * @module commands/validate
 * @description Handles validation of n8n workflow JSON and naming conventions
 */

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');

const {
  displaySuccess,
  displayError,
  displayWarning,
  displayHeader,
  displayBox,
  displayKeyValue,
} = require('../lib/display');

const {
  getNamingConvention,
} = require('../lib/config-loader');

/**
 * Validation result types
 * @enum {string}
 */
const ValidationLevel = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

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
 * Read and parse JSON file
 * @async
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON content
 */
async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Validate workflow JSON structure
 * @param {Object} workflow - Workflow JSON object
 * @returns {Array<Object>} Validation issues
 */
function validateWorkflowStructure(workflow) {
  const issues = [];

  // Required fields
  const requiredFields = ['name', 'nodes', 'connections'];
  for (const field of requiredFields) {
    if (!workflow[field]) {
      issues.push({
        level: ValidationLevel.ERROR,
        rule: 'required-field',
        message: `Missing required field: ${field}`,
        location: 'root',
      });
    }
  }

  // Validate nodes array
  if (workflow.nodes) {
    if (!Array.isArray(workflow.nodes)) {
      issues.push({
        level: ValidationLevel.ERROR,
        rule: 'nodes-array',
        message: 'Nodes must be an array',
        location: 'nodes',
      });
    } else {
      workflow.nodes.forEach((node, index) => {
        // Check node has required properties
        if (!node.type) {
          issues.push({
            level: ValidationLevel.ERROR,
            rule: 'node-type',
            message: `Node at index ${index} missing type`,
            location: `nodes[${index}]`,
          });
        }

        if (!node.name) {
          issues.push({
            level: ValidationLevel.ERROR,
            rule: 'node-name',
            message: `Node at index ${index} missing name`,
            location: `nodes[${index}]`,
          });
        }

        // Check for position
        if (!node.position) {
          issues.push({
            level: ValidationLevel.WARNING,
            rule: 'node-position',
            message: `Node "${node.name || index}" missing position`,
            location: `nodes[${index}]`,
          });
        }

        // Check for duplicate node names
        const duplicates = workflow.nodes.filter((n, i) =>
          i !== index && n.name === node.name
        );
        if (duplicates.length > 0) {
          issues.push({
            level: ValidationLevel.ERROR,
            rule: 'duplicate-node-name',
            message: `Duplicate node name: "${node.name}"`,
            location: `nodes[${index}]`,
          });
        }
      });
    }
  }

  // Validate connections
  if (workflow.connections && typeof workflow.connections === 'object') {
    Object.entries(workflow.connections).forEach(([nodeName, outputs]) => {
      // Check if source node exists
      const sourceNode = workflow.nodes?.find(n => n.name === nodeName);
      if (!sourceNode) {
        issues.push({
          level: ValidationLevel.ERROR,
          rule: 'connection-source',
          message: `Connection references non-existent node: "${nodeName}"`,
          location: `connections.${nodeName}`,
        });
      }

      // Check connection targets
      if (outputs && outputs.main) {
        outputs.main.forEach((outputArray, outputIndex) => {
          if (Array.isArray(outputArray)) {
            outputArray.forEach((conn, connIndex) => {
              if (conn.node) {
                const targetNode = workflow.nodes?.find(n => n.name === conn.node);
                if (!targetNode) {
                  issues.push({
                    level: ValidationLevel.ERROR,
                    rule: 'connection-target',
                    message: `Connection from "${nodeName}" targets non-existent node: "${conn.node}"`,
                    location: `connections.${nodeName}.main[${outputIndex}][${connIndex}]`,
                  });
                }
              }
            });
          }
        });
      }
    });
  }

  // Check for trigger node
  if (workflow.nodes) {
    const triggerNodes = workflow.nodes.filter(n =>
      n.type?.includes('trigger') ||
      n.type?.includes('Trigger') ||
      n.type === 'n8n-nodes-base.webhook' ||
      n.type === 'n8n-nodes-base.manualTrigger'
    );

    if (triggerNodes.length === 0) {
      issues.push({
        level: ValidationLevel.WARNING,
        rule: 'no-trigger',
        message: 'Workflow has no trigger node',
        location: 'nodes',
      });
    }
  }

  return issues;
}

/**
 * Validate expressions in workflow
 * @param {Object} workflow - Workflow JSON object
 * @returns {Array<Object>} Validation issues
 */
function validateExpressions(workflow) {
  const issues = [];

  if (!workflow.nodes) return issues;

  const expressionRegex = /\{\{([^}]+)\}\}/g;
  const nodeNames = workflow.nodes.map(n => n.name);

  workflow.nodes.forEach((node, nodeIndex) => {
    // Recursively check all string properties for expressions
    const checkValue = (value, path) => {
      if (typeof value === 'string') {
        let match;
        while ((match = expressionRegex.exec(value)) !== null) {
          const expression = match[1];

          // Check for common expression issues
          // Reference to node that doesn't exist
          const nodeRefMatch = expression.match(/\$\(['"]([^'"]+)['"]\)/);
          if (nodeRefMatch) {
            const referencedNode = nodeRefMatch[1];
            if (!nodeNames.includes(referencedNode)) {
              issues.push({
                level: ValidationLevel.ERROR,
                rule: 'expression-node-ref',
                message: `Expression references non-existent node: "${referencedNode}"`,
                location: `nodes[${nodeIndex}].${path}`,
                expression: match[0],
              });
            }
          }

          // Check for potentially undefined access
          if (expression.includes('.') && !expression.includes('??') && !expression.includes('?.')) {
            issues.push({
              level: ValidationLevel.INFO,
              rule: 'expression-null-safety',
              message: `Expression may need null-safe access (?. or ??)`,
              location: `nodes[${nodeIndex}].${path}`,
              expression: match[0],
            });
          }
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => checkValue(item, `${path}[${i}]`));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => checkValue(val, `${path}.${key}`));
      }
    };

    if (node.parameters) {
      checkValue(node.parameters, 'parameters');
    }
  });

  return issues;
}

/**
 * Validate naming conventions
 * @param {Object} workflow - Workflow JSON object
 * @param {Object} conventions - Naming conventions from config
 * @returns {Array<Object>} Validation issues
 */
function validateNaming(workflow, conventions) {
  const issues = [];

  const {
    workflow_prefix = 'wf_',
    use_snake_case = true,
  } = conventions;

  // Validate workflow name
  if (workflow.name) {
    if (workflow_prefix && !workflow.name.startsWith(workflow_prefix)) {
      issues.push({
        level: ValidationLevel.WARNING,
        rule: 'workflow-prefix',
        message: `Workflow name should start with "${workflow_prefix}"`,
        location: 'name',
        current: workflow.name,
        suggestion: `${workflow_prefix}${workflow.name}`,
      });
    }

    if (use_snake_case) {
      const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;
      const nameWithoutPrefix = workflow.name.replace(workflow_prefix, '');
      if (!snakeCaseRegex.test(nameWithoutPrefix) && nameWithoutPrefix.length > 0) {
        issues.push({
          level: ValidationLevel.WARNING,
          rule: 'workflow-snake-case',
          message: 'Workflow name should use snake_case',
          location: 'name',
          current: workflow.name,
        });
      }
    }
  }

  // Validate node names
  if (workflow.nodes) {
    workflow.nodes.forEach((node, index) => {
      if (node.name) {
        // Check for generic names
        const genericNames = ['Set', 'Code', 'HTTP Request', 'If', 'Switch', 'Function'];
        if (genericNames.includes(node.name)) {
          issues.push({
            level: ValidationLevel.INFO,
            rule: 'generic-node-name',
            message: `Node "${node.name}" has a generic name - consider making it more descriptive`,
            location: `nodes[${index}].name`,
          });
        }

        // Check for numbered generic names (e.g., "Set1", "HTTP Request2")
        const numberedGenericRegex = /^(Set|Code|HTTP Request|If|Switch|Function)\d+$/;
        if (numberedGenericRegex.test(node.name)) {
          issues.push({
            level: ValidationLevel.WARNING,
            rule: 'numbered-node-name',
            message: `Node "${node.name}" should have a descriptive name`,
            location: `nodes[${index}].name`,
          });
        }
      }
    });
  }

  return issues;
}

/**
 * Validate credentials usage
 * @param {Object} workflow - Workflow JSON object
 * @returns {Array<Object>} Validation issues
 */
function validateCredentials(workflow) {
  const issues = [];

  if (!workflow.nodes) return issues;

  workflow.nodes.forEach((node, index) => {
    // Check for hardcoded credentials in parameters
    if (node.parameters) {
      const paramStr = JSON.stringify(node.parameters).toLowerCase();

      // Common credential patterns to flag
      const sensitivePatterns = [
        /api[_-]?key[\s]*[=:][\s]*['"][^'"]+['"]/i,
        /password[\s]*[=:][\s]*['"][^'"]+['"]/i,
        /secret[\s]*[=:][\s]*['"][^'"]+['"]/i,
        /token[\s]*[=:][\s]*['"][^'"]+['"]/i,
        /bearer[\s]+[a-zA-Z0-9_-]+/i,
      ];

      for (const pattern of sensitivePatterns) {
        if (pattern.test(paramStr)) {
          issues.push({
            level: ValidationLevel.ERROR,
            rule: 'hardcoded-credential',
            message: `Node "${node.name}" may contain hardcoded credentials`,
            location: `nodes[${index}].parameters`,
          });
          break;
        }
      }
    }

    // Check that credential-requiring nodes have credentials configured
    const credentialNodes = [
      'n8n-nodes-base.httpRequest',
      'n8n-nodes-base.postgres',
      'n8n-nodes-base.mysql',
      'n8n-nodes-base.mongodb',
      'n8n-nodes-base.redis',
      'n8n-nodes-base.slack',
      'n8n-nodes-base.github',
    ];

    if (credentialNodes.some(cn => node.type?.includes(cn.split('.')[1]))) {
      if (!node.credentials || Object.keys(node.credentials).length === 0) {
        // This might be intentional for some nodes, so just info level
        issues.push({
          level: ValidationLevel.INFO,
          rule: 'missing-credentials',
          message: `Node "${node.name}" may need credentials configured`,
          location: `nodes[${index}]`,
        });
      }
    }
  });

  return issues;
}

/**
 * Format validation results for display
 * @param {Array<Object>} issues - Validation issues
 * @returns {Object} Formatted results
 */
function formatValidationResults(issues) {
  const errors = issues.filter(i => i.level === ValidationLevel.ERROR);
  const warnings = issues.filter(i => i.level === ValidationLevel.WARNING);
  const infos = issues.filter(i => i.level === ValidationLevel.INFO);

  return {
    errors,
    warnings,
    infos,
    totalCount: issues.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    infoCount: infos.length,
    passed: errors.length === 0,
  };
}

/**
 * Display validation issue
 * @param {Object} issue - Validation issue
 */
function displayIssue(issue) {
  const icons = {
    [ValidationLevel.ERROR]: chalk.red('✗'),
    [ValidationLevel.WARNING]: chalk.yellow('⚠'),
    [ValidationLevel.INFO]: chalk.blue('ℹ'),
  };

  const colors = {
    [ValidationLevel.ERROR]: chalk.red,
    [ValidationLevel.WARNING]: chalk.yellow,
    [ValidationLevel.INFO]: chalk.blue,
  };

  console.log(`  ${icons[issue.level]} ${colors[issue.level](issue.message)}`);
  console.log(`    ${chalk.gray(`Rule: ${issue.rule} | Location: ${issue.location}`)}`);

  if (issue.suggestion) {
    console.log(`    ${chalk.green(`Suggestion: ${issue.suggestion}`)}`);
  }
  if (issue.expression) {
    console.log(`    ${chalk.gray(`Expression: ${issue.expression}`)}`);
  }
}

/**
 * Create the workflow validation subcommand
 * @returns {Command} Workflow subcommand
 */
function createWorkflowCommand() {
  const cmd = new Command('workflow');

  cmd
    .description('Validate n8n workflow JSON file')
    .argument('<file>', 'Path to workflow JSON file')
    .option('--no-structure', 'Skip structure validation')
    .option('--no-expressions', 'Skip expression validation')
    .option('--no-naming', 'Skip naming convention validation')
    .option('--no-credentials', 'Skip credential validation')
    .option('--strict', 'Treat warnings as errors')
    .option('-f, --format <format>', 'Output format (text, json)', 'text')
    .action(async (file, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const filePath = path.resolve(file);

        // Check file exists
        if (!await fileExists(filePath)) {
          displayError(`File not found: ${filePath}`);
          process.exit(1);
        }

        const spinner = ora(`Validating workflow: ${path.basename(filePath)}...`).start();

        // Read workflow
        let workflow;
        try {
          workflow = await readJsonFile(filePath);
        } catch (error) {
          spinner.fail('Invalid JSON');
          displayError(`Failed to parse JSON: ${error.message}`);
          process.exit(1);
        }

        // Collect all issues
        const allIssues = [];

        // Structure validation
        if (options.structure !== false) {
          const structureIssues = validateWorkflowStructure(workflow);
          allIssues.push(...structureIssues);
        }

        // Expression validation
        if (options.expressions !== false) {
          const expressionIssues = validateExpressions(workflow);
          allIssues.push(...expressionIssues);
        }

        // Naming validation
        if (options.naming !== false) {
          const conventions = await getNamingConvention();
          const namingIssues = validateNaming(workflow, conventions);
          allIssues.push(...namingIssues);
        }

        // Credential validation
        if (options.credentials !== false) {
          const credentialIssues = validateCredentials(workflow);
          allIssues.push(...credentialIssues);
        }

        const results = formatValidationResults(allIssues);
        spinner.stop();

        // JSON output
        if (options.format === 'json') {
          console.log(JSON.stringify({
            file: filePath,
            workflow: workflow.name,
            ...results,
            issues: allIssues,
          }, null, 2));
          process.exit(results.passed ? 0 : 1);
        }

        // Text output
        displayHeader(`Validation: ${workflow.name || path.basename(filePath)}`);
        console.log();

        if (results.errorCount > 0) {
          displayHeader('Errors', { style: 'compact' });
          results.errors.forEach(displayIssue);
          console.log();
        }

        if (results.warningCount > 0) {
          displayHeader('Warnings', { style: 'compact' });
          results.warnings.forEach(displayIssue);
          console.log();
        }

        if (globalOptions.verbose && results.infoCount > 0) {
          displayHeader('Info', { style: 'compact' });
          results.infos.forEach(displayIssue);
          console.log();
        }

        // Summary
        displayBox([
          `Errors: ${results.errorCount}`,
          `Warnings: ${results.warningCount}`,
          `Info: ${results.infoCount}`,
          '',
          results.passed
            ? chalk.green('Validation PASSED')
            : chalk.red('Validation FAILED'),
        ], { title: 'Summary', style: 'round' });

        // Exit code based on results
        const exitCode = options.strict
          ? (results.errorCount + results.warningCount > 0 ? 1 : 0)
          : (results.errorCount > 0 ? 1 : 0);

        process.exit(exitCode);

      } catch (error) {
        displayError(`Validation failed: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the naming validation subcommand
 * @returns {Command} Naming subcommand
 */
function createNamingCommand() {
  const cmd = new Command('naming');

  cmd
    .description('Validate naming conventions')
    .argument('<name>', 'Name to validate (workflow or credential name)')
    .option('-t, --type <type>', 'Type of name (workflow, credential, node)', 'workflow')
    .action(async (name, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const conventions = await getNamingConvention();
        const issues = [];

        displayHeader('Naming Convention Check');
        console.log();

        displayKeyValue('Name', name);
        displayKeyValue('Type', options.type);
        console.log();

        if (options.type === 'workflow') {
          const prefix = conventions.workflow_prefix || 'wf_';

          if (!name.startsWith(prefix)) {
            issues.push({
              rule: 'prefix',
              message: `Should start with "${prefix}"`,
              suggestion: `${prefix}${name}`,
            });
          }

          if (conventions.use_snake_case) {
            const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;
            const nameWithoutPrefix = name.replace(prefix, '');
            if (!snakeCaseRegex.test(nameWithoutPrefix) && nameWithoutPrefix.length > 0) {
              issues.push({
                rule: 'snake_case',
                message: 'Should use snake_case format',
                suggestion: nameWithoutPrefix.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
              });
            }
          }
        }

        if (options.type === 'credential') {
          const prefix = conventions.credential_prefix || 'cred_';

          if (!name.startsWith(prefix)) {
            issues.push({
              rule: 'prefix',
              message: `Should start with "${prefix}"`,
              suggestion: `${prefix}${name}`,
            });
          }
        }

        // Display results
        if (issues.length === 0) {
          displaySuccess('Name follows all conventions');
        } else {
          displayWarning(`Found ${issues.length} convention issues:`);
          console.log();

          issues.forEach(issue => {
            console.log(`  ${chalk.yellow('⚠')} ${issue.message}`);
            if (issue.suggestion) {
              console.log(`    ${chalk.green('Suggestion:')} ${issue.suggestion}`);
            }
          });
        }

        console.log();
        displayHeader('Convention Settings', { style: 'compact' });
        displayKeyValue('Workflow prefix', conventions.workflow_prefix || 'wf_');
        displayKeyValue('Credential prefix', conventions.credential_prefix || 'cred_');
        displayKeyValue('Use snake_case', conventions.use_snake_case ? 'Yes' : 'No');

      } catch (error) {
        displayError(`Validation failed: ${error.message}`);
        if (globalOptions.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the main validate command
 * @returns {Command} Validate command with subcommands
 */
function createValidateCommand() {
  const command = new Command('validate');

  command
    .description('Validation operations - check workflows and naming conventions')
    .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('n8n-bmad validate workflow ./my-workflow.json')}       Validate workflow JSON
  ${chalk.cyan('n8n-bmad validate workflow workflow.json --strict')}   Strict validation
  ${chalk.cyan('n8n-bmad validate workflow workflow.json -f json')}    JSON output
  ${chalk.cyan('n8n-bmad validate naming "my_workflow"')}              Check naming convention
  ${chalk.cyan('n8n-bmad validate naming "prod_api_creds" -t credential')}  Check credential name

${chalk.bold('Validation Rules:')}
  ${chalk.cyan('Structure')}     - Required fields, node types, connections
  ${chalk.cyan('Expressions')}   - Node references, null safety
  ${chalk.cyan('Naming')}        - Prefixes, snake_case, descriptive names
  ${chalk.cyan('Credentials')}   - No hardcoded secrets, proper configuration
`);

  // Add subcommands
  command.addCommand(createWorkflowCommand());
  command.addCommand(createNamingCommand());

  // Default action when no subcommand
  command.action(async () => {
    command.help();
  });

  return command;
}

module.exports = createValidateCommand();
