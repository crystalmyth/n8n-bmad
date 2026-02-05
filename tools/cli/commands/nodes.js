/**
 * Nodes command for n8n-BMAD CLI
 * Discover and manage installed n8n nodes
 *
 * @module commands/nodes
 * @description Handles node discovery, listing, and search for installed n8n nodes
 */

const { Command } = require('commander');
const ora = require('ora');
const chalk = require('chalk');

const {
  displayError,
  displayWarning,
  displayInfo,
  displayHeader,
  displayTable,
  displayBox,
  displayKeyValue,
} = require('../lib/display');

const {
  discoverInstalledNodes,
  getCachedNodes,
  searchInstalledNodes,
  getCacheStatus,
} = require('../lib/node-discovery');

/**
 * Format nodes for table display
 * @param {Array<Object>} nodes - List of nodes
 * @param {boolean} [showCategory=false] - Include category column
 * @returns {Array<Array>} Table data
 */
function formatNodeTable(nodes, showCategory = false) {
  const headers = showCategory
    ? ['Type', 'Display Name', 'Category', 'Description']
    : ['Type', 'Display Name', 'Description'];

  const rows = nodes.map(node => {
    const desc = (node.description || '').substring(0, 50);
    const truncatedDesc = desc.length === 50 ? desc + '...' : desc;

    const categoryColors = {
      core: chalk.blue,
      community: chalk.magenta,
      custom: chalk.green,
    };
    const categoryColor = categoryColors[node.category] || chalk.white;

    if (showCategory) {
      return [
        chalk.cyan(node.type || '-'),
        node.displayName || '-',
        categoryColor(node.category || '-'),
        chalk.gray(truncatedDesc || '-'),
      ];
    }

    return [
      chalk.cyan(node.type || '-'),
      node.displayName || '-',
      chalk.gray(truncatedDesc || '-'),
    ];
  });

  return [headers, ...rows];
}

/**
 * Create the discover subcommand
 * @returns {Command} Discover subcommand
 */
function createDiscoverCommand() {
  const cmd = new Command('discover');

  cmd
    .description('Fetch installed nodes from n8n instance and cache results')
    .option('-f, --force', 'Force refresh, ignore existing cache')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      const spinner = ora('Discovering installed nodes from n8n instance...').start();

      try {
        const result = await discoverInstalledNodes({ force: options.force });

        spinner.succeed(`Discovered ${result.stats.total} nodes from n8n instance`);

        if (result._warning) {
          displayWarning(result._warning);
        }

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        // Display summary
        console.log();
        displayBox([
          `Total Nodes: ${result.stats.total}`,
          '',
          `${chalk.blue('Core:')}       ${result.stats.core} nodes`,
          `${chalk.magenta('Community:')}  ${result.stats.community} nodes`,
          `${chalk.green('Custom:')}     ${result.stats.custom} nodes`,
          '',
          `Source: ${result.source}`,
          `Cached at: ${result.fetchedAt}`,
        ], { title: 'Node Discovery Complete', style: 'round' });

        // Show custom nodes if any
        if (result.stats.custom > 0) {
          console.log();
          displayHeader('Custom Nodes Found', { style: 'compact' });
          const customTable = formatNodeTable(result.nodes.custom, false);
          console.log(displayTable(customTable));
        }

        console.log();
        displayInfo('Use "n8n-bmad nodes list" to view cached nodes');
        displayInfo('Use "n8n-bmad nodes search <query>" to search nodes');

      } catch (error) {
        spinner.fail('Failed to discover nodes');
        displayError(error.message);

        if (error.message.includes('API URL not configured')) {
          console.log();
          displayInfo('Run "n8n-bmad init" to configure your n8n connection.');
          displayInfo('Or set N8N_API_URL and N8N_API_KEY environment variables.');
        }

        if (globalOptions.verbose) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the list subcommand
 * @returns {Command} List subcommand
 */
function createListCommand() {
  const cmd = new Command('list');

  cmd
    .description('List cached installed nodes')
    .option('-t, --type <type>', 'Filter by type: core, community, custom, all', 'all')
    .option('--json', 'Output as JSON')
    .option('-l, --limit <number>', 'Limit number of results', '50')
    .action(async (options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora('Loading cached nodes...').start();

        const cache = await getCachedNodes({ silent: false, allowStale: true });

        if (cache._stale) {
          spinner.warn('Using stale cache data');
          displayWarning('Cache is stale. Run "n8n-bmad nodes discover" to refresh.');
        } else {
          spinner.succeed('Loaded cached nodes');
        }

        if (!cache.nodes) {
          displayWarning('No node data in cache');
          return;
        }

        // Collect nodes based on type filter
        let nodes = [];
        const type = options.type.toLowerCase();

        if (type === 'all') {
          nodes = [
            ...(cache.nodes.custom || []),
            ...(cache.nodes.community || []),
            ...(cache.nodes.core || []),
          ];
        } else if (cache.nodes[type]) {
          nodes = cache.nodes[type];
        } else {
          displayError(`Invalid type: ${type}. Use: core, community, custom, or all`);
          process.exit(1);
        }

        if (options.json) {
          console.log(JSON.stringify(nodes, null, 2));
          return;
        }

        const limit = parseInt(options.limit, 10) || 50;
        const displayNodes = nodes.slice(0, limit);

        const title = type === 'all'
          ? `All Installed Nodes (${nodes.length} total)`
          : `${type.charAt(0).toUpperCase() + type.slice(1)} Nodes (${nodes.length} total)`;

        displayHeader(title);
        console.log(displayTable(formatNodeTable(displayNodes, type === 'all')));

        if (nodes.length > limit) {
          displayInfo(`Showing ${limit} of ${nodes.length} nodes. Use --limit to show more.`);
        }

        // Show stats
        console.log();
        displayKeyValue('Core', cache.stats?.core || 0);
        displayKeyValue('Community', cache.stats?.community || 0);
        displayKeyValue('Custom', cache.stats?.custom || 0);

      } catch (error) {
        displayError(error.message);

        if (error.message.includes('No cached node data')) {
          displayInfo('Run "n8n-bmad nodes discover" to fetch nodes from your n8n instance.');
        }

        if (globalOptions.verbose) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the search subcommand
 * @returns {Command} Search subcommand
 */
function createSearchCommand() {
  const cmd = new Command('search');

  cmd
    .description('Search installed nodes by keyword')
    .argument('<query>', 'Search query')
    .option('-t, --type <type>', 'Filter by type: core, community, custom')
    .option('--json', 'Output as JSON')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .action(async (query, options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const spinner = ora(`Searching for "${query}"...`).start();

        const results = await searchInstalledNodes(query, { type: options.type });

        spinner.succeed(`Found ${results.length} matching nodes`);

        if (results.length === 0) {
          displayWarning(`No nodes found matching "${query}"`);
          displayInfo('Try a different search term or run "n8n-bmad nodes discover" to refresh cache.');
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }

        const limit = parseInt(options.limit, 10) || 20;
        const displayResults = results.slice(0, limit);

        displayHeader(`Search Results for "${query}"`);
        console.log(displayTable(formatNodeTable(displayResults, true)));

        if (results.length > limit) {
          displayInfo(`Showing ${limit} of ${results.length} results. Use --limit to show more.`);
        }

      } catch (error) {
        displayError(error.message);

        if (error.message.includes('No cached node data')) {
          displayInfo('Run "n8n-bmad nodes discover" to fetch nodes from your n8n instance.');
        }

        if (globalOptions.verbose) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the status subcommand
 * @returns {Command} Status subcommand
 */
function createStatusCommand() {
  const cmd = new Command('status');

  cmd
    .description('Show cache status and statistics')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const globalOptions = cmd.parent?.parent?._globalOptions || {};

      try {
        const status = await getCacheStatus();

        if (options.json) {
          console.log(JSON.stringify(status, null, 2));
          return;
        }

        displayHeader('Node Cache Status');
        console.log();

        if (!status.exists) {
          displayWarning('No cache file found');
          displayInfo('Run "n8n-bmad nodes discover" to fetch nodes from your n8n instance.');
          return;
        }

        const statusIcon = status.stale ? chalk.yellow('STALE') : chalk.green('FRESH');

        displayKeyValue('Status', statusIcon);
        displayKeyValue('Cache Path', status.cachePath);
        displayKeyValue('TTL', `${status.ttlHours} hours`);

        if (status.ageHours !== undefined) {
          displayKeyValue('Age', `${status.ageHours} hours`);
        }

        if (status.lastFetched) {
          displayKeyValue('Last Fetched', status.lastFetched);
        }

        if (status.source) {
          displayKeyValue('Source', status.source);
        }

        if (status.stats) {
          console.log();
          displayHeader('Node Statistics', { style: 'compact' });
          displayKeyValue('Total', status.stats.total);
          displayKeyValue('Core', status.stats.core);
          displayKeyValue('Community', status.stats.community);
          displayKeyValue('Custom', status.stats.custom);
        }

        if (status.stale) {
          console.log();
          displayWarning('Cache is stale. Run "n8n-bmad nodes discover" to refresh.');
        }

      } catch (error) {
        displayError(error.message);

        if (globalOptions.verbose) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Create the main nodes command
 * @returns {Command} Nodes command with subcommands
 */
function createNodesCommand() {
  const command = new Command('nodes');

  command
    .description('Discover and manage installed n8n nodes')
    .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('n8n-bmad nodes discover')}              Fetch and cache installed nodes from n8n
  ${chalk.cyan('n8n-bmad nodes discover --force')}      Force refresh, ignore existing cache
  ${chalk.cyan('n8n-bmad nodes list')}                  List all cached nodes
  ${chalk.cyan('n8n-bmad nodes list --type custom')}    List only custom nodes
  ${chalk.cyan('n8n-bmad nodes list --type community')} List only community nodes
  ${chalk.cyan('n8n-bmad nodes search slack')}          Search nodes by keyword
  ${chalk.cyan('n8n-bmad nodes search webhook -t custom')} Search custom nodes only
  ${chalk.cyan('n8n-bmad nodes status')}                Show cache status

${chalk.bold('Node Categories:')}
  ${chalk.blue('core')}       Built-in n8n nodes (n8n-nodes-base.*, n8n-nodes-langchain.*)
  ${chalk.magenta('community')}  Community-published npm packages (n8n-nodes-*)
  ${chalk.green('custom')}     User-installed custom nodes (everything else)

${chalk.bold('Usage in Agent Context:')}
  Discovered custom nodes are included in LLM context when running
  "n8n-bmad context build", enabling agents to recommend installed nodes.
`);

  // Add subcommands
  command.addCommand(createDiscoverCommand());
  command.addCommand(createListCommand());
  command.addCommand(createSearchCommand());
  command.addCommand(createStatusCommand());

  // Default action shows help
  command.action(async () => {
    displayHeader('Node Discovery Commands');
    console.log();
    displayInfo('n8n-bmad nodes discover  - Fetch nodes from n8n instance');
    displayInfo('n8n-bmad nodes list      - List cached nodes');
    displayInfo('n8n-bmad nodes search    - Search nodes by keyword');
    displayInfo('n8n-bmad nodes status    - Show cache status');
    console.log();
    displayInfo('Run "n8n-bmad nodes --help" for more details.');
  });

  return command;
}

module.exports = createNodesCommand();
