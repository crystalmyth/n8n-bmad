/**
 * Display utilities for n8n-BMAD CLI
 * Terminal output helpers with chalk and table formatting
 *
 * @module lib/display
 * @description Provides consistent terminal output formatting for the CLI
 */

const chalk = require('chalk');
const figlet = require('figlet');
const { table, getBorderCharacters } = require('table');

/**
 * Color theme for consistent styling
 * @type {Object}
 */
const theme = {
  primary: chalk.cyan,
  secondary: chalk.magenta,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  muted: chalk.gray,
  highlight: chalk.bold.white,
  accent: chalk.bold.cyan,
};

/**
 * Display ASCII art banner
 * @param {Object} [options] - Display options
 * @param {boolean} [options.compact=false] - Use compact banner
 * @returns {string} Formatted banner string
 */
function displayBanner(options = {}) {
  const { compact = false } = options;

  if (compact) {
    return chalk.cyan.bold('\n=== n8n-BMAD Framework ===\n');
  }

  try {
    const ascii = figlet.textSync('n8n-BMAD', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true,
    });

    const coloredAscii = ascii.split('\n').map((line, index) => {
      // Gradient effect from cyan to magenta
      const ratio = index / 5;
      if (ratio < 0.5) {
        return chalk.cyan(line);
      } else {
        return chalk.magenta(line);
      }
    }).join('\n');

    const subtitle = chalk.gray('  AI-powered methodology framework for n8n workflow automation\n');
    const version = chalk.gray(`  Version: ${require('../../../package.json').version}\n`);

    return '\n' + coloredAscii + '\n' + subtitle + version;
  } catch (error) {
    // Fallback if figlet fails
    return chalk.cyan.bold('\n=== n8n-BMAD Framework ===\n') +
           chalk.gray('  AI-powered methodology framework for n8n workflow automation\n');
  }
}

/**
 * Display a success message
 * @param {string} message - Message to display
 * @param {Object} [options] - Display options
 * @param {boolean} [options.prefix=true] - Show checkmark prefix
 */
function displaySuccess(message, options = {}) {
  const { prefix = true } = options;
  const icon = prefix ? chalk.green('✓') + ' ' : '';
  console.log(icon + theme.success(message));
}

/**
 * Display an error message
 * @param {string} message - Error message to display
 * @param {Object} [options] - Display options
 * @param {boolean} [options.prefix=true] - Show X prefix
 */
function displayError(message, options = {}) {
  const { prefix = true } = options;
  const icon = prefix ? chalk.red('✗') + ' ' : '';
  console.error(icon + theme.error(message));
}

/**
 * Display a warning message
 * @param {string} message - Warning message to display
 * @param {Object} [options] - Display options
 * @param {boolean} [options.prefix=true] - Show warning prefix
 */
function displayWarning(message, options = {}) {
  const { prefix = true } = options;
  const icon = prefix ? chalk.yellow('⚠') + ' ' : '';
  console.log(icon + theme.warning(message));
}

/**
 * Display an info message
 * @param {string} message - Info message to display
 * @param {Object} [options] - Display options
 * @param {boolean} [options.prefix=true] - Show info prefix
 */
function displayInfo(message, options = {}) {
  const { prefix = true } = options;
  const icon = prefix ? chalk.blue('ℹ') + ' ' : '';
  console.log(icon + theme.info(message));
}

/**
 * Display a section header
 * @param {string} title - Section title
 * @param {Object} [options] - Display options
 * @param {string} [options.style='default'] - Header style (default, compact, prominent)
 */
function displayHeader(title, options = {}) {
  const { style = 'default' } = options;

  switch (style) {
    case 'compact':
      console.log('\n' + theme.accent(title));
      console.log(theme.muted('─'.repeat(title.length)));
      break;
    case 'prominent': {
      const border = '═'.repeat(title.length + 4);
      console.log('\n' + theme.primary('╔' + border + '╗'));
      console.log(theme.primary('║  ') + theme.highlight(title) + theme.primary('  ║'));
      console.log(theme.primary('╚' + border + '╝') + '\n');
      break;
    }
    default:
      console.log('\n' + theme.primary('▶ ') + theme.highlight(title));
      break;
  }
}

/**
 * Display a data table
 * @param {Array<Array>} data - Table data (including header row)
 * @param {Object} [options] - Table options
 * @param {string} [options.style='norc'] - Border style (norc, void, honeywell)
 * @param {Array<string>} [options.alignment] - Column alignments (left, center, right)
 * @returns {string} Formatted table string
 */
function displayTable(data, options = {}) {
  const { style = 'norc', alignment = [] } = options;

  if (!data || data.length === 0) {
    return '';
  }

  // Apply header styling
  const styledData = data.map((row, rowIndex) => {
    return row.map((cell) => {
      if (rowIndex === 0) {
        return theme.accent(String(cell));
      }
      return String(cell);
    });
  });

  const config = {
    border: getBorderCharacters(style),
    columns: {},
  };

  // Apply column alignments
  alignment.forEach((align, index) => {
    config.columns[index] = { alignment: align };
  });

  return table(styledData, config);
}

/**
 * Display a list with bullet points
 * @param {Array<string|Object>} items - Items to display
 * @param {Object} [options] - Display options
 * @param {string} [options.bullet='•'] - Bullet character
 * @param {boolean} [options.numbered=false] - Use numbered list
 * @param {number} [options.indent=2] - Indentation level
 */
function displayList(items, options = {}) {
  const { bullet = '•', numbered = false, indent = 2 } = options;
  const padding = ' '.repeat(indent);

  items.forEach((item, index) => {
    const prefix = numbered ? theme.muted(`${index + 1}.`) : theme.primary(bullet);
    const text = typeof item === 'object' ? item.text : item;
    const description = typeof item === 'object' && item.description
      ? theme.muted(` - ${item.description}`)
      : '';

    console.log(`${padding}${prefix} ${text}${description}`);
  });
}

/**
 * Display a key-value pair
 * @param {string} key - Key to display
 * @param {string} value - Value to display
 * @param {Object} [options] - Display options
 * @param {number} [options.keyWidth=20] - Minimum key width for alignment
 */
function displayKeyValue(key, value, options = {}) {
  const { keyWidth = 20 } = options;
  const paddedKey = key.padEnd(keyWidth);
  console.log(`  ${theme.muted(paddedKey)} ${theme.highlight(value)}`);
}

/**
 * Display a progress indicator (simple text-based)
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @param {Object} [options] - Display options
 * @param {number} [options.width=40] - Progress bar width
 */
function displayProgress(current, total, options = {}) {
  const { width = 40 } = options;
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const bar = theme.success('█'.repeat(filled)) + theme.muted('░'.repeat(empty));
  const text = theme.muted(`${current}/${total}`) + ' ' + theme.primary(`${percentage}%`);

  process.stdout.write(`\r  [${bar}] ${text}`);

  if (current === total) {
    console.log(); // New line when complete
  }
}

/**
 * Display a box with content
 * @param {string|Array<string>} content - Content to display
 * @param {Object} [options] - Display options
 * @param {string} [options.title] - Box title
 * @param {string} [options.style='single'] - Border style (single, double, round)
 * @param {number} [options.padding=1] - Internal padding
 */
function displayBox(content, options = {}) {
  const { title = '', style = 'single', padding = 1 } = options;

  const borders = {
    single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
    round: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  };

  const b = borders[style] || borders.single;
  const lines = Array.isArray(content) ? content : content.split('\n');
  const maxWidth = Math.max(...lines.map(l => l.length), title.length);
  const width = maxWidth + (padding * 2);

  // Top border with optional title
  let topBorder = b.tl + b.h.repeat(width) + b.tr;
  if (title) {
    const titleText = ` ${title} `;
    const titlePos = Math.floor((width - titleText.length) / 2);
    topBorder = b.tl +
      b.h.repeat(titlePos) +
      theme.accent(titleText) +
      b.h.repeat(width - titlePos - titleText.length) +
      b.tr;
  }

  console.log(theme.primary(topBorder));

  // Content lines
  const padStr = ' '.repeat(padding);
  lines.forEach(line => {
    const paddedLine = padStr + line + ' '.repeat(maxWidth - line.length) + padStr;
    console.log(theme.primary(b.v) + paddedLine + theme.primary(b.v));
  });

  // Bottom border
  console.log(theme.primary(b.bl + b.h.repeat(width) + b.br));
}

/**
 * Display an agent card
 * @param {Object} agent - Agent data
 * @param {string} agent.id - Agent ID
 * @param {string} agent.name - Agent name
 * @param {string} agent.role - Agent role
 * @param {string} [agent.description] - Agent description
 * @param {Array<string>} [agent.expertise] - Agent expertise areas
 */
function displayAgentCard(agent) {
  console.log();
  displayBox([
    theme.highlight(agent.name),
    theme.muted(`Role: ${agent.role}`),
    '',
    agent.description ? agent.description.substring(0, 60) + '...' : '',
    '',
    agent.expertise ? theme.muted('Expertise: ' + agent.expertise.slice(0, 3).join(', ')) : '',
  ], {
    title: agent.id,
    style: 'round',
  });
}

/**
 * Display a menu with selectable options
 * @param {Object} menu - Menu configuration
 * @param {Array<Object>} menu.sections - Menu sections
 * @param {string} menu.sections[].name - Section name
 * @param {Array<Object>} menu.sections[].commands - Section commands
 */
function displayMenu(menu) {
  console.log();

  if (!menu || !menu.sections) {
    displayWarning('No menu available');
    return;
  }

  menu.sections.forEach(section => {
    displayHeader(section.name, { style: 'compact' });

    if (section.commands) {
      section.commands.forEach(cmd => {
        const key = theme.accent(`[${cmd.key}]`.padEnd(5));
        const desc = cmd.description;
        console.log(`  ${key} ${desc}`);
      });
    }
    console.log();
  });
}

/**
 * Clear the terminal screen
 */
function clearScreen() {
  process.stdout.write('\x1Bc');
}

/**
 * Display a divider line
 * @param {Object} [options] - Display options
 * @param {number} [options.width=60] - Divider width
 * @param {string} [options.char='─'] - Divider character
 */
function displayDivider(options = {}) {
  const { width = 60, char = '─' } = options;
  console.log(theme.muted(char.repeat(width)));
}

module.exports = {
  theme,
  displayBanner,
  displaySuccess,
  displayError,
  displayWarning,
  displayInfo,
  displayHeader,
  displayTable,
  displayList,
  displayKeyValue,
  displayProgress,
  displayBox,
  displayAgentCard,
  displayMenu,
  clearScreen,
  displayDivider,
};
