/**
 * @fileoverview Unit tests for display utilities module
 */

// --- Mock setup (must precede require of display.js) ---

// Pass-through chalk mock: every chalk method returns the input unchanged
const createChalkProxy = () => {
  const handler = {
    get(_target, prop) {
      if (prop === 'bold' || prop === 'cyan' || prop === 'magenta' ||
          prop === 'green' || prop === 'red' || prop === 'yellow' ||
          prop === 'blue' || prop === 'gray' || prop === 'white') {
        // Return a callable proxy that also supports chaining
        const fn = (str) => str;
        return new Proxy(fn, handler);
      }
      return undefined;
    },
    apply(_target, _thisArg, args) {
      return args[0];
    },
  };
  return new Proxy((str) => str, handler);
};

const mockChalk = createChalkProxy();

jest.mock('chalk', () => mockChalk);

jest.mock('figlet', () => ({
  textSync: jest.fn(() => 'MOCK_ASCII_ART_LINE1\nMOCK_ASCII_ART_LINE2\nMOCK_ASCII_ART_LINE3'),
}));

const mockTableFn = jest.fn((data) => `table:${JSON.stringify(data)}`);
const mockGetBorderCharacters = jest.fn((style) => `border:${style}`);

jest.mock('table', () => ({
  table: mockTableFn,
  getBorderCharacters: mockGetBorderCharacters,
}));

jest.mock('../../../package.json', () => ({ version: '1.0.0-test' }), { virtual: true });

// --- Require the module under test ---

const {
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
} = require('../../tools/cli/lib/display');

const figlet = require('figlet');

// --- Helpers ---

let logSpy;
let errorSpy;
let stdoutSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  stdoutSpy.mockRestore();
});

// =============================================================================
// 1. theme
// =============================================================================

describe('theme', () => {
  it('should export an object', () => {
    expect(typeof theme).toBe('object');
  });

  it('should have all expected color keys', () => {
    const expectedKeys = [
      'primary', 'secondary', 'success', 'warning',
      'error', 'info', 'muted', 'highlight', 'accent',
    ];
    expectedKeys.forEach((key) => {
      expect(theme).toHaveProperty(key);
    });
  });

  it('should have callable functions for every key', () => {
    Object.values(theme).forEach((fn) => {
      expect(typeof fn).toBe('function');
    });
  });

  it('should pass through text (because chalk is mocked)', () => {
    expect(theme.primary('hello')).toBe('hello');
    expect(theme.error('oops')).toBe('oops');
  });
});

// =============================================================================
// 2. displayBanner
// =============================================================================

describe('displayBanner', () => {
  it('should return a string in compact mode', () => {
    const result = displayBanner({ compact: true });
    expect(typeof result).toBe('string');
  });

  it('should contain framework name in compact mode', () => {
    const result = displayBanner({ compact: true });
    expect(result).toContain('n8n-BMAD');
  });

  it('should not call figlet.textSync in compact mode', () => {
    displayBanner({ compact: true });
    expect(figlet.textSync).not.toHaveBeenCalled();
  });

  it('should call figlet.textSync in full mode', () => {
    displayBanner();
    expect(figlet.textSync).toHaveBeenCalledWith('n8n-BMAD', expect.objectContaining({
      font: 'Standard',
    }));
  });

  it('should return a string containing figlet output in full mode', () => {
    const result = displayBanner();
    expect(result).toContain('MOCK_ASCII_ART_LINE1');
  });

  it('should include subtitle in full mode', () => {
    const result = displayBanner();
    expect(result).toContain('AI-powered methodology framework');
  });

  it('should include version in full mode', () => {
    const result = displayBanner();
    expect(result).toContain('Version:');
  });

  it('should return fallback string when figlet throws', () => {
    figlet.textSync.mockImplementationOnce(() => { throw new Error('font missing'); });
    const result = displayBanner();
    expect(result).toContain('n8n-BMAD');
    expect(result).toContain('AI-powered methodology framework');
  });
});

// =============================================================================
// 3. displaySuccess
// =============================================================================

describe('displaySuccess', () => {
  it('should log to console.log', () => {
    displaySuccess('done');
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should include the message in output', () => {
    displaySuccess('done');
    expect(logSpy.mock.calls[0][0]).toContain('done');
  });

  it('should include checkmark prefix by default', () => {
    displaySuccess('done');
    const output = logSpy.mock.calls[0][0];
    expect(output).toMatch(/✓/);
  });

  it('should omit prefix when prefix=false', () => {
    displaySuccess('done', { prefix: false });
    const output = logSpy.mock.calls[0][0];
    expect(output).not.toMatch(/✓/);
  });
});

// =============================================================================
// 4. displayError
// =============================================================================

describe('displayError', () => {
  it('should log to console.error', () => {
    displayError('fail');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('should include the message in output', () => {
    displayError('fail');
    expect(errorSpy.mock.calls[0][0]).toContain('fail');
  });

  it('should include X prefix by default', () => {
    displayError('fail');
    const output = errorSpy.mock.calls[0][0];
    expect(output).toMatch(/✗/);
  });

  it('should omit prefix when prefix=false', () => {
    displayError('fail', { prefix: false });
    const output = errorSpy.mock.calls[0][0];
    expect(output).not.toMatch(/✗/);
  });
});

// =============================================================================
// 5. displayWarning
// =============================================================================

describe('displayWarning', () => {
  it('should log to console.log', () => {
    displayWarning('caution');
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should include the message in output', () => {
    displayWarning('caution');
    expect(logSpy.mock.calls[0][0]).toContain('caution');
  });

  it('should include warning prefix by default', () => {
    displayWarning('caution');
    expect(logSpy.mock.calls[0][0]).toMatch(/⚠/);
  });

  it('should omit prefix when prefix=false', () => {
    displayWarning('caution', { prefix: false });
    expect(logSpy.mock.calls[0][0]).not.toMatch(/⚠/);
  });
});

// =============================================================================
// 6. displayInfo
// =============================================================================

describe('displayInfo', () => {
  it('should log to console.log', () => {
    displayInfo('note');
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should include the message in output', () => {
    displayInfo('note');
    expect(logSpy.mock.calls[0][0]).toContain('note');
  });

  it('should include info prefix by default', () => {
    displayInfo('note');
    expect(logSpy.mock.calls[0][0]).toContain('ℹ');
  });

  it('should omit prefix when prefix=false', () => {
    displayInfo('note', { prefix: false });
    expect(logSpy.mock.calls[0][0]).not.toContain('ℹ');
  });
});

// =============================================================================
// 7. displayHeader
// =============================================================================

describe('displayHeader', () => {
  it('should output default style with arrow prefix', () => {
    displayHeader('Section');
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('Section');
  });

  it('should call console.log once for default style', () => {
    displayHeader('Section');
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should output compact style with accent title and divider', () => {
    displayHeader('Compact Title', { style: 'compact' });
    expect(logSpy).toHaveBeenCalledTimes(2);
    const titleOutput = logSpy.mock.calls[0][0];
    expect(titleOutput).toContain('Compact Title');
  });

  it('should draw a divider in compact style matching title length', () => {
    const title = 'Test';
    displayHeader(title, { style: 'compact' });
    const dividerOutput = logSpy.mock.calls[1][0];
    expect(dividerOutput).toContain('─'.repeat(title.length));
  });

  it('should output prominent style with double-line border', () => {
    displayHeader('Important', { style: 'prominent' });
    expect(logSpy).toHaveBeenCalledTimes(3);
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('Important');
    expect(allOutput).toContain('╔');
    expect(allOutput).toContain('╝');
  });
});

// =============================================================================
// 8. displayTable
// =============================================================================

describe('displayTable', () => {
  it('should return empty string for null data', () => {
    expect(displayTable(null)).toBe('');
  });

  it('should return empty string for empty array', () => {
    expect(displayTable([])).toBe('');
  });

  it('should return a string for valid data', () => {
    const data = [['Name', 'Age'], ['Alice', '30']];
    const result = displayTable(data);
    expect(typeof result).toBe('string');
  });

  it('should call the table package with styled data', () => {
    const data = [['Header'], ['Row']];
    displayTable(data);
    expect(mockTableFn).toHaveBeenCalledTimes(1);
    const styledData = mockTableFn.mock.calls[0][0];
    // Header row (index 0) cells go through theme.accent (pass-through mock)
    expect(styledData[0][0]).toBe('Header');
    expect(styledData[1][0]).toBe('Row');
  });

  it('should call getBorderCharacters with the requested style', () => {
    displayTable([['A'], ['B']], { style: 'honeywell' });
    expect(mockGetBorderCharacters).toHaveBeenCalledWith('honeywell');
  });

  it('should use norc as default border style', () => {
    displayTable([['A'], ['B']]);
    expect(mockGetBorderCharacters).toHaveBeenCalledWith('norc');
  });

  it('should pass column alignment config', () => {
    displayTable([['A', 'B'], ['1', '2']], { alignment: ['left', 'right'] });
    const config = mockTableFn.mock.calls[0][1];
    expect(config.columns[0]).toEqual({ alignment: 'left' });
    expect(config.columns[1]).toEqual({ alignment: 'right' });
  });
});

// =============================================================================
// 9. displayList
// =============================================================================

describe('displayList', () => {
  it('should log each item to console', () => {
    displayList(['one', 'two', 'three']);
    expect(logSpy).toHaveBeenCalledTimes(3);
  });

  it('should use bullet character by default', () => {
    displayList(['item']);
    expect(logSpy.mock.calls[0][0]).toContain('item');
  });

  it('should use numbered prefix when numbered=true', () => {
    displayList(['first', 'second'], { numbered: true });
    expect(logSpy.mock.calls[0][0]).toContain('1.');
    expect(logSpy.mock.calls[1][0]).toContain('2.');
  });

  it('should apply custom bullet character', () => {
    displayList(['item'], { bullet: '-' });
    expect(logSpy.mock.calls[0][0]).toContain('-');
  });

  it('should apply indentation', () => {
    displayList(['item'], { indent: 4 });
    const output = logSpy.mock.calls[0][0];
    expect(output.startsWith('    ')).toBe(true);
  });

  it('should use default indent of 2 spaces', () => {
    displayList(['item']);
    const output = logSpy.mock.calls[0][0];
    expect(output.startsWith('  ')).toBe(true);
  });

  it('should handle object items with text property', () => {
    displayList([{ text: 'Main text' }]);
    expect(logSpy.mock.calls[0][0]).toContain('Main text');
  });

  it('should display description for object items', () => {
    displayList([{ text: 'Key', description: 'Details here' }]);
    expect(logSpy.mock.calls[0][0]).toContain('Details here');
  });

  it('should not include description separator for string items', () => {
    displayList(['plain']);
    expect(logSpy.mock.calls[0][0]).not.toContain(' - ');
  });
});

// =============================================================================
// 10. displayKeyValue
// =============================================================================

describe('displayKeyValue', () => {
  it('should log key and value to console', () => {
    displayKeyValue('Name', 'Alice');
    expect(logSpy).toHaveBeenCalledTimes(1);
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain('Name');
    expect(output).toContain('Alice');
  });

  it('should pad key to default width of 20', () => {
    displayKeyValue('K', 'V');
    const output = logSpy.mock.calls[0][0];
    // 'K' padded to 20 chars = 'K' + 19 spaces
    expect(output).toContain('K' + ' '.repeat(19));
  });

  it('should pad key to custom width', () => {
    displayKeyValue('AB', 'V', { keyWidth: 10 });
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain('AB' + ' '.repeat(8));
  });
});

// =============================================================================
// 11. displayProgress
// =============================================================================

describe('displayProgress', () => {
  it('should write to process.stdout', () => {
    displayProgress(5, 10);
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('should include percentage in output', () => {
    displayProgress(5, 10);
    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain('50%');
  });

  it('should include current and total counts', () => {
    displayProgress(3, 12);
    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain('3/12');
  });

  it('should write newline via console.log when complete', () => {
    displayProgress(10, 10);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should not write newline when not complete', () => {
    displayProgress(5, 10);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should show 100% when current equals total', () => {
    displayProgress(8, 8);
    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain('100%');
  });

  it('should respect custom width option', () => {
    displayProgress(5, 10, { width: 20 });
    const output = stdoutSpy.mock.calls[0][0];
    // 50% filled = 10 filled blocks + 10 empty blocks
    const filledCount = (output.match(/█/g) || []).length;
    const emptyCount = (output.match(/░/g) || []).length;
    expect(filledCount).toBe(10);
    expect(emptyCount).toBe(10);
  });
});

// =============================================================================
// 12. displayBox
// =============================================================================

describe('displayBox', () => {
  it('should log top border, content lines, and bottom border', () => {
    displayBox('hello');
    // top border + 1 content line + bottom border = 3
    expect(logSpy).toHaveBeenCalledTimes(3);
  });

  it('should use single border characters by default', () => {
    displayBox('test');
    const topLine = logSpy.mock.calls[0][0];
    expect(topLine).toContain('┌');
    expect(topLine).toContain('┐');
    const bottomLine = logSpy.mock.calls[2][0];
    expect(bottomLine).toContain('└');
    expect(bottomLine).toContain('┘');
  });

  it('should use double border characters when style=double', () => {
    displayBox('test', { style: 'double' });
    const topLine = logSpy.mock.calls[0][0];
    expect(topLine).toContain('╔');
    expect(topLine).toContain('╗');
    const bottomLine = logSpy.mock.calls[2][0];
    expect(bottomLine).toContain('╚');
    expect(bottomLine).toContain('╝');
  });

  it('should use round border characters when style=round', () => {
    displayBox('test', { style: 'round' });
    const topLine = logSpy.mock.calls[0][0];
    expect(topLine).toContain('╭');
    expect(topLine).toContain('╮');
    const bottomLine = logSpy.mock.calls[2][0];
    expect(bottomLine).toContain('╰');
    expect(bottomLine).toContain('╯');
  });

  it('should include title in top border when provided', () => {
    displayBox('content', { title: 'My Box' });
    const topLine = logSpy.mock.calls[0][0];
    expect(topLine).toContain('My Box');
  });

  it('should handle array content', () => {
    displayBox(['line one', 'line two']);
    // top + 2 content lines + bottom = 4
    expect(logSpy).toHaveBeenCalledTimes(4);
  });

  it('should handle multiline string content by splitting on newlines', () => {
    displayBox('line1\nline2\nline3');
    // top + 3 content lines + bottom = 5
    expect(logSpy).toHaveBeenCalledTimes(5);
  });

  it('should fall back to single border for unknown style', () => {
    displayBox('test', { style: 'unknown' });
    const topLine = logSpy.mock.calls[0][0];
    expect(topLine).toContain('┌');
  });
});

// =============================================================================
// 13. displayAgentCard
// =============================================================================

describe('displayAgentCard', () => {
  const mockAgent = {
    id: 'dev-001',
    name: 'Nate',
    role: 'Developer',
    description: 'A skilled developer who builds n8n workflows with precision and best practices always.',
    expertise: ['n8n', 'javascript', 'api-design', 'testing'],
  };

  it('should log an empty line before the card', () => {
    displayAgentCard(mockAgent);
    expect(logSpy.mock.calls[0][0]).toBeUndefined();
  });

  it('should output box content containing agent name', () => {
    displayAgentCard(mockAgent);
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('Nate');
  });

  it('should output box content containing agent role', () => {
    displayAgentCard(mockAgent);
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('Role: Developer');
  });

  it('should truncate long descriptions to 60 chars plus ellipsis', () => {
    displayAgentCard(mockAgent);
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('...');
  });

  it('should display first 3 expertise areas', () => {
    displayAgentCard(mockAgent);
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('n8n');
    expect(allOutput).toContain('javascript');
    expect(allOutput).toContain('api-design');
    expect(allOutput).not.toContain('testing');
  });

  it('should handle agent without description', () => {
    const minimal = { id: 'x', name: 'X', role: 'R' };
    expect(() => displayAgentCard(minimal)).not.toThrow();
  });

  it('should handle agent without expertise', () => {
    const noExpert = { id: 'x', name: 'X', role: 'R', description: 'Some desc that is long enough to test' };
    expect(() => displayAgentCard(noExpert)).not.toThrow();
  });
});

// =============================================================================
// 14. displayMenu
// =============================================================================

describe('displayMenu', () => {
  it('should display warning for null menu', () => {
    displayMenu(null);
    // displayWarning writes to console.log with prefix
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('No menu available');
  });

  it('should display warning for menu without sections', () => {
    displayMenu({});
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('No menu available');
  });

  it('should display section headers', () => {
    const menu = {
      sections: [
        { name: 'Commands', commands: [] },
      ],
    };
    displayMenu(menu);
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('Commands');
  });

  it('should display commands with key and description', () => {
    const menu = {
      sections: [
        {
          name: 'Core',
          commands: [
            { key: 'p', description: 'Create PRD' },
            { key: 'e', description: 'Create Epic' },
          ],
        },
      ],
    };
    displayMenu(menu);
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('Create PRD');
    expect(allOutput).toContain('Create Epic');
  });

  it('should handle sections without commands array', () => {
    const menu = {
      sections: [{ name: 'Empty Section' }],
    };
    expect(() => displayMenu(menu)).not.toThrow();
  });

  it('should handle multiple sections', () => {
    const menu = {
      sections: [
        { name: 'Section A', commands: [{ key: 'a', description: 'Action A' }] },
        { name: 'Section B', commands: [{ key: 'b', description: 'Action B' }] },
      ],
    };
    displayMenu(menu);
    const allOutput = logSpy.mock.calls.map(c => c[0]).join('\n');
    expect(allOutput).toContain('Section A');
    expect(allOutput).toContain('Section B');
    expect(allOutput).toContain('Action A');
    expect(allOutput).toContain('Action B');
  });
});

// =============================================================================
// 15. clearScreen
// =============================================================================

describe('clearScreen', () => {
  it('should write escape code to stdout', () => {
    clearScreen();
    expect(stdoutSpy).toHaveBeenCalledWith('\x1Bc');
  });

  it('should call stdout.write exactly once', () => {
    clearScreen();
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// 16. displayDivider
// =============================================================================

describe('displayDivider', () => {
  it('should log a divider to console', () => {
    displayDivider();
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should use default width of 60', () => {
    displayDivider();
    const output = logSpy.mock.calls[0][0];
    expect(output).toBe('─'.repeat(60));
  });

  it('should use custom width', () => {
    displayDivider({ width: 30 });
    const output = logSpy.mock.calls[0][0];
    expect(output).toBe('─'.repeat(30));
  });

  it('should use custom character', () => {
    displayDivider({ char: '=' });
    const output = logSpy.mock.calls[0][0];
    expect(output).toBe('='.repeat(60));
  });

  it('should use both custom width and character', () => {
    displayDivider({ width: 10, char: '*' });
    const output = logSpy.mock.calls[0][0];
    expect(output).toBe('*'.repeat(10));
  });
});
