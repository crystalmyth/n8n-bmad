/**
 * @fileoverview Unit tests for command-generator module
 *
 * Tests cover all exported functions from tools/cli/lib/command-generator.js:
 * - AGENT_ALIASES / ACTION_PROMPT_MAP constants
 * - getCommandFileName
 * - formatMenu (v2.0 array, v1.0 sections, null/empty)
 * - formatCollaborators
 * - formatExpertise
 * - formatResponsibilities
 * - extractActionPrompts
 * - generateSkillRouting
 * - generateAgentCommand (v1.0 and v2.0 formats)
 * - generateQuickFlowCommand
 * - loadAgentYaml
 * - generateClaudeCommands (including dryRun and ENOENT)
 * - generateQuickFlowCommands
 * - getAvailableCommands
 */

const path = require('path');

// -------------------------------------------------------------------
// Mock fs.promises and js-yaml before requiring the module under test
// -------------------------------------------------------------------
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      readFile: jest.fn(),
      readdir: jest.fn(),
      mkdir: jest.fn(),
      writeFile: jest.fn(),
    },
  };
});

jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

const fs = require('fs').promises;
const yaml = require('js-yaml');

const {
  AGENT_ALIASES,
  ACTION_PROMPT_MAP,
  getCommandFileName,
  formatMenu,
  formatCollaborators,
  formatExpertise,
  formatResponsibilities,
  extractActionPrompts,
  generateSkillRouting,
  generateAgentCommand,
  generateQuickFlowCommand,
  loadAgentYaml,
  generateClaudeCommands,
  generateQuickFlowCommands,
  getAvailableCommands,
} = require('../../tools/cli/lib/command-generator');

// ===================================================================
// 1. AGENT_ALIASES constant
// ===================================================================
describe('AGENT_ALIASES', () => {
  it('should be a non-empty object', () => {
    expect(typeof AGENT_ALIASES).toBe('object');
    expect(Object.keys(AGENT_ALIASES).length).toBeGreaterThan(0);
  });

  it('should map n8n-master to master', () => {
    expect(AGENT_ALIASES['n8n-master']).toBe('master');
  });

  it('should map developer to dev', () => {
    expect(AGENT_ALIASES['developer']).toBe('dev');
  });

  it('should map architect to arch', () => {
    expect(AGENT_ALIASES['architect']).toBe('arch');
  });

  it('should map data-analyst to data', () => {
    expect(AGENT_ALIASES['data-analyst']).toBe('data');
  });

  it('should map tech-writer to docs', () => {
    expect(AGENT_ALIASES['tech-writer']).toBe('docs');
  });

  it('should map po to po (identity mapping)', () => {
    expect(AGENT_ALIASES['po']).toBe('po');
  });

  it('should map pm to pm (identity mapping)', () => {
    expect(AGENT_ALIASES['pm']).toBe('pm');
  });

  it('should map sm to sm (identity mapping)', () => {
    expect(AGENT_ALIASES['sm']).toBe('sm');
  });

  it('should map qa to qa (identity mapping)', () => {
    expect(AGENT_ALIASES['qa']).toBe('qa');
  });

  it('should map devops to devops (identity mapping)', () => {
    expect(AGENT_ALIASES['devops']).toBe('devops');
  });

  it('should map ba to ba (identity mapping)', () => {
    expect(AGENT_ALIASES['ba']).toBe('ba');
  });

  it('should map security to security (identity mapping)', () => {
    expect(AGENT_ALIASES['security']).toBe('security');
  });

  it('should map integration to integration (identity mapping)', () => {
    expect(AGENT_ALIASES['integration']).toBe('integration');
  });

  it('should contain exactly 13 entries', () => {
    expect(Object.keys(AGENT_ALIASES).length).toBe(13);
  });
});

// ===================================================================
// 2. ACTION_PROMPT_MAP constant
// ===================================================================
describe('ACTION_PROMPT_MAP', () => {
  it('should be a non-empty object', () => {
    expect(typeof ACTION_PROMPT_MAP).toBe('object');
    expect(Object.keys(ACTION_PROMPT_MAP).length).toBeGreaterThan(0);
  });

  it('should map new-workflow to an array of prompt keys', () => {
    expect(Array.isArray(ACTION_PROMPT_MAP['new-workflow'])).toBe(true);
    expect(ACTION_PROMPT_MAP['new-workflow']).toContain('new_workflow');
  });

  it('should map create-prd to an array containing create_prd', () => {
    expect(ACTION_PROMPT_MAP['create-prd']).toContain('create_prd');
  });

  it('should map debug-mode to an array containing debug_mode', () => {
    expect(ACTION_PROMPT_MAP['debug-mode']).toContain('debug_mode');
  });

  it('should map create-epic to an array containing create_epic', () => {
    expect(ACTION_PROMPT_MAP['create-epic']).toContain('create_epic');
  });

  it('should map create-story to an array containing create_story', () => {
    expect(ACTION_PROMPT_MAP['create-story']).toContain('create_story');
  });

  it('should map expression-help to an array containing expression_help', () => {
    expect(ACTION_PROMPT_MAP['expression-help']).toContain('expression_help');
  });

  it('should map update-progress to an array containing update_progress', () => {
    expect(ACTION_PROMPT_MAP['update-progress']).toContain('update_progress');
  });
});

// ===================================================================
// 3. getCommandFileName
// ===================================================================
describe('getCommandFileName', () => {
  it('should return alias for known agent developer', () => {
    expect(getCommandFileName('developer')).toBe('dev');
  });

  it('should return alias for known agent architect', () => {
    expect(getCommandFileName('architect')).toBe('arch');
  });

  it('should return alias for known agent n8n-master', () => {
    expect(getCommandFileName('n8n-master')).toBe('master');
  });

  it('should return alias for known agent data-analyst', () => {
    expect(getCommandFileName('data-analyst')).toBe('data');
  });

  it('should return alias for known agent tech-writer', () => {
    expect(getCommandFileName('tech-writer')).toBe('docs');
  });

  it('should return the original agentId for unknown agents', () => {
    expect(getCommandFileName('unknown-agent')).toBe('unknown-agent');
  });

  it('should return the original agentId for prompt-engineer', () => {
    expect(getCommandFileName('prompt-engineer')).toBe('prompt-engineer');
  });

  it('should return identity mapping for qa', () => {
    expect(getCommandFileName('qa')).toBe('qa');
  });
});

// ===================================================================
// 4. formatMenu
// ===================================================================
describe('formatMenu', () => {
  describe('with v2.0 flat array format', () => {
    it('should produce a markdown table with header and rows', () => {
      const menu = [
        { trigger: 'CP Create PRD', action: 'create-prd', description: 'Create PRD' },
        { trigger: 'DS Dev Story', action: 'dev-story', description: 'Implement a story' },
      ];
      const result = formatMenu(menu);
      expect(result).toContain('| Trigger | Action | Description |');
      expect(result).toContain('| CP | create-prd | Create PRD |');
      expect(result).toContain('| DS | dev-story | Implement a story |');
    });

    it('should extract 2-letter trigger from longer string', () => {
      const menu = [
        { trigger: 'NW or new-workflow', action: 'new-workflow', description: 'Start workflow' },
      ];
      const result = formatMenu(menu);
      expect(result).toContain('| NW | new-workflow | Start workflow |');
    });

    it('should handle trigger that is already 2 letters', () => {
      const menu = [
        { trigger: 'CR', action: 'code-review', description: 'Code review' },
      ];
      const result = formatMenu(menu);
      expect(result).toContain('| CR | code-review | Code review |');
    });

    it('should handle trigger with no uppercase 2-letter prefix', () => {
      const menu = [
        { trigger: 'something lowercase', action: 'test', description: 'Test' },
      ];
      const result = formatMenu(menu);
      // trigger stays as-is since regex does not match
      expect(result).toContain('| something lowercase | test | Test |');
    });

    it('should clean description with bracketed trigger prefix', () => {
      const menu = [
        { trigger: 'CP', action: 'create-prd', description: '[CP] Create PRD: Makes a PRD' },
      ];
      const result = formatMenu(menu);
      expect(result).toContain('Makes a PRD');
    });

    it('should handle missing description gracefully', () => {
      const menu = [
        { trigger: 'CP', action: 'create-prd' },
      ];
      const result = formatMenu(menu);
      expect(result).toContain('| CP | create-prd |  |');
    });

    it('should handle missing trigger gracefully', () => {
      const menu = [
        { action: 'create-prd', description: 'Create PRD' },
      ];
      const result = formatMenu(menu);
      expect(result).toContain('|  | create-prd | Create PRD |');
    });

    it('should not append help row when items exist', () => {
      const menu = [
        { trigger: 'CP', action: 'create-prd', description: 'Create PRD' },
      ];
      const result = formatMenu(menu);
      expect(result).not.toContain('Show available commands');
    });

    it('should append help row when array is empty', () => {
      const result = formatMenu([]);
      expect(result).toContain('| HP | help | Show available commands |');
    });
  });

  describe('with v1.0 sections object format', () => {
    it('should process sections with commands', () => {
      const menu = {
        sections: [
          {
            commands: [
              { trigger: 'CP', action: 'create-prd', description: 'Create PRD' },
              { trigger: 'VP', action: 'validate-prd', description: 'Validate PRD' },
            ],
          },
        ],
      };
      const result = formatMenu(menu);
      expect(result).toContain('| CP | create-prd | Create PRD |');
      expect(result).toContain('| VP | validate-prd | Validate PRD |');
    });

    it('should support key field as fallback for trigger', () => {
      const menu = {
        sections: [
          {
            commands: [
              { key: 'DS', action: 'dev-story', description: 'Dev Story' },
            ],
          },
        ],
      };
      const result = formatMenu(menu);
      expect(result).toContain('| DS | dev-story | Dev Story |');
    });

    it('should handle multiple sections', () => {
      const menu = {
        sections: [
          { commands: [{ trigger: 'A1', action: 'act-1', description: 'Desc 1' }] },
          { commands: [{ trigger: 'B2', action: 'act-2', description: 'Desc 2' }] },
        ],
      };
      const result = formatMenu(menu);
      expect(result).toContain('| A1 | act-1 | Desc 1 |');
      expect(result).toContain('| B2 | act-2 | Desc 2 |');
    });

    it('should skip sections with empty commands array', () => {
      const menu = {
        sections: [
          { commands: [] },
          { commands: [{ trigger: 'X1', action: 'act-x', description: 'Desc X' }] },
        ],
      };
      const result = formatMenu(menu);
      expect(result).toContain('| X1 | act-x | Desc X |');
    });

    it('should append help row when all sections are empty', () => {
      const menu = {
        sections: [{ commands: [] }],
      };
      const result = formatMenu(menu);
      expect(result).toContain('| HP | help | Show available commands |');
    });
  });

  describe('with null/empty input', () => {
    it('should return default table with help row for null', () => {
      const result = formatMenu(null);
      expect(result).toContain('| Trigger | Action | Description |');
      expect(result).toContain('| HP | help | Show available commands |');
    });

    it('should return default table with help row for undefined', () => {
      const result = formatMenu(undefined);
      expect(result).toContain('| HP | help | Show available commands |');
    });

    it('should return default table for empty object without sections', () => {
      const result = formatMenu({});
      expect(result).toContain('| HP | help | Show available commands |');
    });
  });
});

// ===================================================================
// 5. formatCollaborators
// ===================================================================
describe('formatCollaborators', () => {
  it('should format collaborators with "when" field', () => {
    const collaborators = [
      { agent: 'Developer', when: 'Implementation phase' },
    ];
    const result = formatCollaborators(collaborators);
    expect(result).toBe('- **Developer**: Implementation phase');
  });

  it('should format collaborators with "relationship" field', () => {
    const collaborators = [
      { agent: 'QA', relationship: 'Code review' },
    ];
    const result = formatCollaborators(collaborators);
    expect(result).toBe('- **QA**: Code review');
  });

  it('should prefer "when" over "relationship" when both present', () => {
    const collaborators = [
      { agent: 'Architect', when: 'Design phase', relationship: 'Architecture' },
    ];
    const result = formatCollaborators(collaborators);
    expect(result).toBe('- **Architect**: Design phase');
  });

  it('should fall back to default text when neither when nor relationship exists', () => {
    const collaborators = [
      { agent: 'PM' },
    ];
    const result = formatCollaborators(collaborators);
    expect(result).toBe('- **PM**: Collaborate as needed');
  });

  it('should format multiple collaborators separated by newlines', () => {
    const collaborators = [
      { agent: 'PM', when: 'Planning' },
      { agent: 'QA', when: 'Testing' },
    ];
    const result = formatCollaborators(collaborators);
    expect(result).toBe('- **PM**: Planning\n- **QA**: Testing');
  });

  it('should return default text for empty array', () => {
    expect(formatCollaborators([])).toBe('All n8n-BMAD agents as needed');
  });

  it('should return default text for null', () => {
    expect(formatCollaborators(null)).toBe('All n8n-BMAD agents as needed');
  });

  it('should return default text for undefined', () => {
    expect(formatCollaborators(undefined)).toBe('All n8n-BMAD agents as needed');
  });
});

// ===================================================================
// 6. formatExpertise
// ===================================================================
describe('formatExpertise', () => {
  it('should format a single expertise item', () => {
    const result = formatExpertise(['n8n workflow design']);
    expect(result).toBe('- n8n workflow design');
  });

  it('should format multiple expertise items', () => {
    const result = formatExpertise(['n8n workflows', 'JavaScript', 'REST APIs']);
    expect(result).toBe('- n8n workflows\n- JavaScript\n- REST APIs');
  });

  it('should return default for empty array', () => {
    expect(formatExpertise([])).toBe('- n8n workflow automation');
  });

  it('should return default for null', () => {
    expect(formatExpertise(null)).toBe('- n8n workflow automation');
  });

  it('should return default for undefined', () => {
    expect(formatExpertise(undefined)).toBe('- n8n workflow automation');
  });
});

// ===================================================================
// 7. formatResponsibilities
// ===================================================================
describe('formatResponsibilities', () => {
  it('should format responsibilities with snake_case keys converted to spaces', () => {
    const responsibilities = {
      code_review: { description: 'Review workflow code' },
    };
    const result = formatResponsibilities(responsibilities);
    expect(result).toBe('- **code review**: Review workflow code');
  });

  it('should format multiple responsibilities', () => {
    const responsibilities = {
      requirement_analysis: { description: 'Analyze requirements' },
      sprint_planning: { description: 'Plan sprints' },
    };
    const result = formatResponsibilities(responsibilities);
    expect(result).toContain('- **requirement analysis**: Analyze requirements');
    expect(result).toContain('- **sprint planning**: Plan sprints');
  });

  it('should skip entries without description', () => {
    const responsibilities = {
      valid_entry: { description: 'Has a description' },
      no_desc: { some_other: 'data' },
    };
    const result = formatResponsibilities(responsibilities);
    expect(result).toContain('- **valid entry**: Has a description');
    expect(result).not.toContain('no desc');
  });

  it('should return empty string for null', () => {
    expect(formatResponsibilities(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatResponsibilities(undefined)).toBe('');
  });

  it('should return empty string for object with no describable entries', () => {
    const responsibilities = {
      item: { notes: 'no description field' },
    };
    expect(formatResponsibilities(responsibilities)).toBe('');
  });
});

// ===================================================================
// 8. extractActionPrompts
// ===================================================================
describe('extractActionPrompts', () => {
  it('should extract action, trigger, description, and prompt', () => {
    const menu = [
      { trigger: 'CP Create PRD', action: 'create-prd', description: 'Create PRD' },
    ];
    const prompts = {
      create_prd: 'Create a product requirements document',
    };
    const result = extractActionPrompts(menu, prompts);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('create-prd');
    expect(result[0].trigger).toBe('CP');
    expect(result[0].description).toBe('Create PRD');
    expect(result[0].prompt).toBe('Create a product requirements document');
  });

  it('should extract 2-letter trigger from longer string', () => {
    const menu = [
      { trigger: 'NW or new-workflow', action: 'new-workflow', description: 'Start' },
    ];
    const result = extractActionPrompts(menu, {});
    expect(result[0].trigger).toBe('NW');
  });

  it('should try underscore-converted key first', () => {
    const menu = [
      { trigger: 'DM', action: 'debug-mode', description: 'Debug' },
    ];
    const prompts = {
      debug_mode: 'Enter debug mode',
      'debug-mode': 'Should not use this',
    };
    const result = extractActionPrompts(menu, prompts);
    expect(result[0].prompt).toBe('Enter debug mode');
  });

  it('should fall back to dash key if underscore key missing', () => {
    const menu = [
      { trigger: 'DM', action: 'debug-mode', description: 'Debug' },
    ];
    const prompts = {
      'debug-mode': 'Fallback debug prompt',
    };
    const result = extractActionPrompts(menu, prompts);
    expect(result[0].prompt).toBe('Fallback debug prompt');
  });

  it('should fall back to ACTION_PROMPT_MAP alternatives', () => {
    const menu = [
      { trigger: 'NW', action: 'new-workflow', description: 'New' },
    ];
    const prompts = {
      // Not new_workflow or new-workflow, but implementation_start from the map
      implementation_start: 'Start implementation',
    };
    const result = extractActionPrompts(menu, prompts);
    expect(result[0].prompt).toBe('Start implementation');
  });

  it('should return empty prompt when no matching prompt key found', () => {
    const menu = [
      { trigger: 'XX', action: 'some-action', description: 'Desc' },
    ];
    const prompts = { unrelated: 'not matching' };
    const result = extractActionPrompts(menu, prompts);
    expect(result[0].prompt).toBe('');
  });

  it('should skip menu items without an action', () => {
    const menu = [
      { trigger: 'CP', description: 'No action here' },
      { trigger: 'DS', action: 'dev-story', description: 'Dev story' },
    ];
    const result = extractActionPrompts(menu, {});
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('dev-story');
  });

  it('should handle menu items with empty action string', () => {
    const menu = [
      { trigger: 'CP', action: '', description: 'Empty action' },
    ];
    const result = extractActionPrompts(menu, {});
    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-array menu', () => {
    expect(extractActionPrompts(null, {})).toEqual([]);
    expect(extractActionPrompts(undefined, {})).toEqual([]);
    expect(extractActionPrompts({}, {})).toEqual([]);
    expect(extractActionPrompts('string', {})).toEqual([]);
  });

  it('should handle prompt value that is a non-string (returns empty string)', () => {
    const menu = [
      { trigger: 'CP', action: 'create-prd', description: 'Create' },
    ];
    const prompts = {
      create_prd: { nested: 'object' },
    };
    const result = extractActionPrompts(menu, prompts);
    // typeof prompt !== 'string' so it becomes ''
    expect(result[0].prompt).toBe('');
  });

  it('should trim prompt strings', () => {
    const menu = [
      { trigger: 'CP', action: 'create-prd', description: 'Create' },
    ];
    const prompts = {
      create_prd: '  trimmed prompt  ',
    };
    const result = extractActionPrompts(menu, prompts);
    expect(result[0].prompt).toBe('trimmed prompt');
  });
});

// ===================================================================
// 9. generateSkillRouting
// ===================================================================
describe('generateSkillRouting', () => {
  it('should return empty string for empty actions array', () => {
    expect(generateSkillRouting([], 'Test Agent')).toBe('');
  });

  it('should generate skill routing header', () => {
    const actions = [
      { action: 'create-prd', trigger: 'CP', description: 'Create PRD', prompt: '' },
    ];
    const result = generateSkillRouting(actions, 'PM');
    expect(result).toContain('## Skill Routing');
    expect(result).toContain('direct skill invocation');
  });

  it('should generate skills table with action entries', () => {
    const actions = [
      { action: 'create-prd', trigger: 'CP', description: 'Create PRD', prompt: '' },
      { action: 'dev-story', trigger: 'DS', description: 'Dev story', prompt: '' },
    ];
    const result = generateSkillRouting(actions, 'PM');
    expect(result).toContain('| `*create-prd` | CP | Create PRD |');
    expect(result).toContain('| `*dev-story` | DS | Dev story |');
  });

  it('should generate skill tags for actions with prompts', () => {
    const actions = [
      { action: 'create-prd', trigger: 'CP', description: 'Create PRD', prompt: 'Create the PRD now' },
    ];
    const result = generateSkillRouting(actions, 'PM');
    expect(result).toContain('<skill name="create-prd">');
    expect(result).toContain('Create the PRD now');
    expect(result).toContain('</skill>');
  });

  it('should generate default skill prompt when no prompt provided', () => {
    const actions = [
      { action: 'new-workflow', trigger: 'NW', description: 'New workflow', prompt: '' },
    ];
    const result = generateSkillRouting(actions, 'Dev Agent');
    expect(result).toContain('Execute the "new-workflow" action for Dev Agent.');
  });

  it('should include routing logic instructions', () => {
    const actions = [
      { action: 'test', trigger: 'TE', description: 'Test', prompt: '' },
    ];
    const result = generateSkillRouting(actions, 'Agent');
    expect(result).toContain('**Routing Logic:**');
    expect(result).toContain('$ARGUMENTS');
  });

  it('should clean bracketed trigger from description in skill table', () => {
    const actions = [
      { action: 'test', trigger: 'TE', description: '[TE] Test Action: Does something', prompt: '' },
    ];
    const result = generateSkillRouting(actions, 'Agent');
    expect(result).toContain('Does something');
  });
});

// ===================================================================
// 10. generateAgentCommand
// ===================================================================
describe('generateAgentCommand', () => {
  describe('v1.0 format (flat agent object)', () => {
    const v1AgentData = {
      agent: {
        id: 'developer',
        name: 'Nate',
        role: 'n8n Developer',
        title: 'Developer Agent',
      },
      identity: {
        description: 'You are an expert n8n developer.',
        expertise: ['n8n workflows', 'JavaScript'],
      },
      menu: [
        { trigger: 'NW', action: 'new-workflow', description: 'Start new workflow' },
      ],
      collaborates_with: [
        { agent: 'QA', when: 'Code review' },
      ],
      responsibilities: {
        workflow_development: { description: 'Build n8n workflows' },
      },
      prompts: {},
    };

    it('should include the agent name and title in the heading', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('# n8n-BMAD Nate - Developer Agent');
    });

    it('should include the role', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('## Role: n8n Developer');
    });

    it('should include identity description', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('You are an expert n8n developer.');
    });

    it('should include expertise section', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('## Your Expertise');
      expect(result).toContain('- n8n workflows');
      expect(result).toContain('- JavaScript');
    });

    it('should include responsibilities section', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('## Core Responsibilities');
      expect(result).toContain('- **workflow development**: Build n8n workflows');
    });

    it('should include formatted menu', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('## Available Commands');
      expect(result).toContain('| NW | new-workflow | Start new workflow |');
    });

    it('should include collaborators', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('## Collaboration');
      expect(result).toContain('- **QA**: Code review');
    });

    it('should include $ARGUMENTS placeholder', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('**Arguments:** `$ARGUMENTS`');
    });

    it('should include document save locations', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('## Document Save Locations');
      expect(result).toContain('./docs/prd.md');
    });

    it('should include workflow order section', () => {
      const result = generateAgentCommand(v1AgentData);
      expect(result).toContain('## Workflow Order');
      expect(result).toContain('PRD');
    });
  });

  describe('v2.0 format (agent.metadata/persona)', () => {
    const v2AgentData = {
      agent: {
        metadata: {
          id: 'architect',
          name: 'Winston',
          title: 'Solution Architect',
        },
        persona: {
          role: 'Enterprise Architect',
          identity: 'You design scalable n8n architectures.',
        },
        critical_actions: [
          'Always validate before proceeding',
          'Check security implications',
        ],
      },
      menu: [
        { trigger: 'CA', action: 'create-architecture', description: 'Create architecture' },
      ],
      prompts: {
        welcome: 'Welcome to the Architect agent.',
      },
    };

    it('should use metadata.name for heading', () => {
      const result = generateAgentCommand(v2AgentData);
      expect(result).toContain('# n8n-BMAD Winston - Solution Architect');
    });

    it('should use persona.role for role section', () => {
      const result = generateAgentCommand(v2AgentData);
      expect(result).toContain('## Role: Enterprise Architect');
    });

    it('should use persona.identity for description', () => {
      const result = generateAgentCommand(v2AgentData);
      expect(result).toContain('You design scalable n8n architectures.');
    });

    it('should include critical actions section', () => {
      const result = generateAgentCommand(v2AgentData);
      expect(result).toContain('## Critical Actions');
      expect(result).toContain('- Always validate before proceeding');
      expect(result).toContain('- Check security implications');
    });

    it('should include welcome section from prompts', () => {
      const result = generateAgentCommand(v2AgentData);
      expect(result).toContain('## Welcome');
      expect(result).toContain('Welcome to the Architect agent.');
    });

    it('should not include expertise section when no expertise array', () => {
      const result = generateAgentCommand(v2AgentData);
      expect(result).not.toContain('## Your Expertise');
    });
  });

  describe('minimal / edge-case agent data', () => {
    it('should handle completely empty agent data', () => {
      const result = generateAgentCommand({});
      expect(result).toContain('# n8n-BMAD unknown - unknown');
      expect(result).toContain('## Role: unknown');
    });

    it('should fallback description when no persona.identity or identity.description', () => {
      const result = generateAgentCommand({ agent: { id: 'test', name: 'TestBot' } });
      expect(result).toContain('You are the TestBot.');
    });

    it('should not include critical actions section when empty', () => {
      const result = generateAgentCommand({ agent: { critical_actions: [] } });
      expect(result).not.toContain('## Critical Actions');
    });

    it('should not include welcome section when no welcome prompt', () => {
      const result = generateAgentCommand({ agent: { id: 'test' }, prompts: {} });
      expect(result).not.toContain('## Welcome');
    });

    it('should not include responsibilities section when no responsibilities', () => {
      const result = generateAgentCommand({ agent: { id: 'test' } });
      expect(result).not.toContain('## Core Responsibilities');
    });

    it('should include finding existing documents section', () => {
      const result = generateAgentCommand({ agent: { id: 'test' } });
      expect(result).toContain('## Finding Existing Documents');
    });

    it('should include guidelines section', () => {
      const result = generateAgentCommand({ agent: { id: 'test' } });
      expect(result).toContain('## Guidelines');
    });
  });
});

// ===================================================================
// 11. generateQuickFlowCommand
// ===================================================================
describe('generateQuickFlowCommand', () => {
  it('should generate markdown with workflow name', () => {
    const data = {
      workflow: { name: 'Quick Fix', trigger: 'QF', description: 'Quick bug fix' },
      purpose: 'Fix a bug fast',
      instructions: 'Follow these steps',
      checklist: ['Step 1', 'Step 2'],
    };
    const result = generateQuickFlowCommand(data);
    expect(result).toContain('# n8n-BMAD Quick Fix');
  });

  it('should include the trigger comment', () => {
    const data = {
      workflow: { name: 'Quick Fix', trigger: 'QF' },
      purpose: '',
      instructions: '',
    };
    const result = generateQuickFlowCommand(data);
    expect(result).toContain('<!-- Trigger: QF -->');
  });

  it('should include purpose section', () => {
    const data = {
      workflow: { name: 'Test' },
      purpose: 'The purpose of this workflow',
      instructions: '',
    };
    const result = generateQuickFlowCommand(data);
    expect(result).toContain('## Purpose');
    expect(result).toContain('The purpose of this workflow');
  });

  it('should include instructions section', () => {
    const data = {
      workflow: { name: 'Test' },
      purpose: '',
      instructions: 'Do this then that',
    };
    const result = generateQuickFlowCommand(data);
    expect(result).toContain('## Instructions');
    expect(result).toContain('Do this then that');
  });

  it('should render checklist as unchecked markdown items', () => {
    const data = {
      workflow: { name: 'Test' },
      purpose: '',
      instructions: '',
      checklist: ['Item A', 'Item B', 'Item C'],
    };
    const result = generateQuickFlowCommand(data);
    expect(result).toContain('## Checklist');
    expect(result).toContain('- [ ] Item A');
    expect(result).toContain('- [ ] Item B');
    expect(result).toContain('- [ ] Item C');
  });

  it('should omit checklist section when checklist is empty', () => {
    const data = {
      workflow: { name: 'Test' },
      purpose: '',
      instructions: '',
      checklist: [],
    };
    const result = generateQuickFlowCommand(data);
    expect(result).not.toContain('## Checklist');
  });

  it('should handle missing workflow object', () => {
    const data = { purpose: 'Some purpose', instructions: 'Instructions' };
    const result = generateQuickFlowCommand(data);
    expect(result).toContain('# n8n-BMAD Quick Flow');
  });

  it('should include related commands', () => {
    const data = { workflow: { name: 'X' }, purpose: '', instructions: '' };
    const result = generateQuickFlowCommand(data);
    expect(result).toContain('## Related Commands');
    expect(result).toContain('PRD');
  });
});

// ===================================================================
// 12. loadAgentYaml
// ===================================================================
describe('loadAgentYaml', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read the file and parse it with js-yaml', async () => {
    const mockContent = 'agent:\n  id: pm\n';
    const mockParsed = { agent: { id: 'pm' } };
    fs.readFile.mockResolvedValue(mockContent);
    yaml.load.mockReturnValue(mockParsed);

    const result = await loadAgentYaml('/path/to/pm.agent.yaml');

    expect(fs.readFile).toHaveBeenCalledWith('/path/to/pm.agent.yaml', 'utf8');
    expect(yaml.load).toHaveBeenCalledWith(mockContent);
    expect(result).toEqual(mockParsed);
  });

  it('should propagate readFile errors', async () => {
    fs.readFile.mockRejectedValue(new Error('ENOENT'));
    await expect(loadAgentYaml('/nonexistent.yaml')).rejects.toThrow('ENOENT');
  });

  it('should propagate yaml parse errors', async () => {
    fs.readFile.mockResolvedValue('invalid: yaml: [');
    yaml.load.mockImplementation(() => { throw new Error('bad YAML'); });
    await expect(loadAgentYaml('/bad.yaml')).rejects.toThrow('bad YAML');
  });
});

// ===================================================================
// 13. generateClaudeCommands
// ===================================================================
describe('generateClaudeCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read agent files, generate commands, and write output files', async () => {
    fs.readdir.mockResolvedValue(['pm.agent.yaml', 'qa.agent.yaml', 'README.md']);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue('mocked yaml');
    yaml.load.mockImplementation((content) => ({
      agent: { id: 'pm', name: 'Paula', role: 'PM', title: 'Project Manager' },
      identity: { description: 'You are PM.' },
      prompts: {},
    }));

    const result = await generateClaudeCommands('/src/agents', '/target/commands');

    expect(fs.readdir).toHaveBeenCalledWith('/src/agents');
    expect(fs.mkdir).toHaveBeenCalledWith('/target/commands', { recursive: true });
    // Only .agent.yaml files processed - README.md excluded
    expect(fs.readFile).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('should filter to only .agent.yaml files', async () => {
    fs.readdir.mockResolvedValue(['dev.agent.yaml', 'notes.txt', 'config.yaml']);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue('yaml');
    yaml.load.mockReturnValue({
      agent: { id: 'developer', name: 'Nate' },
      prompts: {},
    });

    const result = await generateClaudeCommands('/src/agents', '/target');
    expect(result).toHaveLength(1);
    expect(result[0].agentId).toBe('developer');
  });

  it('should use alias for command file name', async () => {
    fs.readdir.mockResolvedValue(['developer.agent.yaml']);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue('yaml');
    yaml.load.mockReturnValue({
      agent: { id: 'developer', name: 'Nate' },
      prompts: {},
    });

    const result = await generateClaudeCommands('/src', '/target');
    expect(result[0].commandFile).toBe('dev.md');
    expect(result[0].slashCommand).toBe('n8n:dev');
  });

  it('should extract agentId from filename when agent.id is missing', async () => {
    fs.readdir.mockResolvedValue(['custom.agent.yaml']);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue('yaml');
    yaml.load.mockReturnValue({
      agent: { name: 'Custom' },
      prompts: {},
    });

    const result = await generateClaudeCommands('/src', '/target');
    expect(result[0].agentId).toBe('custom');
  });

  it('should not write files in dryRun mode', async () => {
    fs.readdir.mockResolvedValue(['pm.agent.yaml']);
    fs.readFile.mockResolvedValue('yaml');
    yaml.load.mockReturnValue({
      agent: { id: 'pm', name: 'Paula' },
      prompts: {},
    });

    const result = await generateClaudeCommands('/src', '/target', true);

    expect(fs.mkdir).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].commandFile).toBe('pm.md');
  });

  it('should return empty array and not throw when source dir does not exist (ENOENT)', async () => {
    const enoentError = new Error('ENOENT');
    enoentError.code = 'ENOENT';
    fs.readdir.mockRejectedValue(enoentError);

    const result = await generateClaudeCommands('/nonexistent', '/target');
    expect(result).toEqual([]);
  });

  it('should throw non-ENOENT errors from readdir', async () => {
    const permError = new Error('EACCES');
    permError.code = 'EACCES';
    fs.readdir.mockRejectedValue(permError);

    await expect(generateClaudeCommands('/src', '/target')).rejects.toThrow('EACCES');
  });

  it('should continue processing when one agent file fails', async () => {
    fs.readdir.mockResolvedValue(['bad.agent.yaml', 'good.agent.yaml']);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    let callCount = 0;
    fs.readFile.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('parse error'));
      return Promise.resolve('yaml');
    });
    yaml.load.mockReturnValue({
      agent: { id: 'good', name: 'Good Agent' },
      prompts: {},
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await generateClaudeCommands('/src', '/target');

    expect(result).toHaveLength(1);
    expect(result[0].agentId).toBe('good');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('bad.agent.yaml'));
    consoleSpy.mockRestore();
  });

  it('should write files to the correct target path', async () => {
    fs.readdir.mockResolvedValue(['architect.agent.yaml']);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue('yaml');
    yaml.load.mockReturnValue({
      agent: { id: 'architect', name: 'Winston' },
      prompts: {},
    });

    await generateClaudeCommands('/src', '/my/target/path');

    const expectedTargetPath = path.join('/my/target/path', 'arch.md');
    expect(fs.writeFile).toHaveBeenCalledWith(
      expectedTargetPath,
      expect.any(String),
      'utf8'
    );
  });
});

// ===================================================================
// 14. generateQuickFlowCommands
// ===================================================================
describe('generateQuickFlowCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read workflow files from quick-flow subdirectory', async () => {
    fs.readdir.mockResolvedValue(['sprint.workflow.yaml']);
    fs.readFile.mockResolvedValue('yaml content');
    fs.writeFile.mockResolvedValue(undefined);
    yaml.load.mockReturnValue({
      workflow: { id: 'sprint', name: 'Sprint Flow', trigger: 'SF' },
      purpose: 'Sprint management',
      instructions: 'Follow process',
    });

    const result = await generateQuickFlowCommands('/workflows', '/target');

    const expectedReaddir = path.join('/workflows', 'quick-flow');
    expect(fs.readdir).toHaveBeenCalledWith(expectedReaddir);
    expect(result).toHaveLength(1);
    expect(result[0].workflowId).toBe('sprint');
    expect(result[0].commandFile).toBe('sprint.md');
  });

  it('should filter to only .workflow.yaml files', async () => {
    fs.readdir.mockResolvedValue(['flow.workflow.yaml', 'README.md', 'config.yaml']);
    fs.readFile.mockResolvedValue('yaml');
    fs.writeFile.mockResolvedValue(undefined);
    yaml.load.mockReturnValue({
      workflow: { id: 'flow', name: 'Flow', trigger: 'FL' },
      purpose: '',
      instructions: '',
    });

    const result = await generateQuickFlowCommands('/wf', '/target');
    expect(result).toHaveLength(1);
  });

  it('should return empty array for ENOENT (missing quick-flow dir)', async () => {
    const enoentError = new Error('ENOENT');
    enoentError.code = 'ENOENT';
    fs.readdir.mockRejectedValue(enoentError);

    const result = await generateQuickFlowCommands('/workflows', '/target');
    expect(result).toEqual([]);
  });

  it('should throw non-ENOENT errors', async () => {
    const permError = new Error('Permission denied');
    permError.code = 'EACCES';
    fs.readdir.mockRejectedValue(permError);

    await expect(generateQuickFlowCommands('/wf', '/target')).rejects.toThrow('Permission denied');
  });

  it('should continue processing when one workflow file fails', async () => {
    fs.readdir.mockResolvedValue(['bad.workflow.yaml', 'good.workflow.yaml']);

    let readCount = 0;
    fs.readFile.mockImplementation(() => {
      readCount++;
      if (readCount === 1) return Promise.reject(new Error('bad file'));
      return Promise.resolve('yaml');
    });
    fs.writeFile.mockResolvedValue(undefined);
    yaml.load.mockReturnValue({
      workflow: { id: 'good', name: 'Good', trigger: 'GD' },
      purpose: '',
      instructions: '',
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await generateQuickFlowCommands('/wf', '/target');

    expect(result).toHaveLength(1);
    expect(result[0].workflowId).toBe('good');
    consoleSpy.mockRestore();
  });

  it('should set slashCommand with /n8n- prefix', async () => {
    fs.readdir.mockResolvedValue(['quick-fix.workflow.yaml']);
    fs.readFile.mockResolvedValue('yaml');
    fs.writeFile.mockResolvedValue(undefined);
    yaml.load.mockReturnValue({
      workflow: { id: 'qf', name: 'Quick Fix', trigger: 'QF' },
      purpose: '',
      instructions: '',
    });

    const result = await generateQuickFlowCommands('/wf', '/target');
    expect(result[0].slashCommand).toBe('/n8n-quick-fix');
  });

  it('should fall back to filename-based id when workflow.id is missing', async () => {
    fs.readdir.mockResolvedValue(['my-flow.workflow.yaml']);
    fs.readFile.mockResolvedValue('yaml');
    fs.writeFile.mockResolvedValue(undefined);
    yaml.load.mockReturnValue({
      workflow: { name: 'My Flow' },
      purpose: '',
      instructions: '',
    });

    const result = await generateQuickFlowCommands('/wf', '/target');
    expect(result[0].workflowId).toBe('my-flow');
  });
});

// ===================================================================
// 15. getAvailableCommands
// ===================================================================
describe('getAvailableCommands', () => {
  it('should return an array of command objects', () => {
    const commands = getAvailableCommands();
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBe(Object.keys(AGENT_ALIASES).length);
  });

  it('should include agentId, commandFile, and slashCommand for each entry', () => {
    const commands = getAvailableCommands();
    for (const cmd of commands) {
      expect(cmd).toHaveProperty('agentId');
      expect(cmd).toHaveProperty('commandFile');
      expect(cmd).toHaveProperty('slashCommand');
    }
  });

  it('should format commandFile as alias.md', () => {
    const commands = getAvailableCommands();
    const devCmd = commands.find(c => c.agentId === 'developer');
    expect(devCmd.commandFile).toBe('dev.md');
  });

  it('should format slashCommand as n8n:alias', () => {
    const commands = getAvailableCommands();
    const archCmd = commands.find(c => c.agentId === 'architect');
    expect(archCmd.slashCommand).toBe('n8n:arch');
  });

  it('should include all agents from AGENT_ALIASES', () => {
    const commands = getAvailableCommands();
    const agentIds = commands.map(c => c.agentId);
    for (const key of Object.keys(AGENT_ALIASES)) {
      expect(agentIds).toContain(key);
    }
  });

  it('should map n8n-master correctly', () => {
    const commands = getAvailableCommands();
    const masterCmd = commands.find(c => c.agentId === 'n8n-master');
    expect(masterCmd.commandFile).toBe('master.md');
    expect(masterCmd.slashCommand).toBe('n8n:master');
  });

  it('should map identity aliases correctly (pm -> pm)', () => {
    const commands = getAvailableCommands();
    const pmCmd = commands.find(c => c.agentId === 'pm');
    expect(pmCmd.commandFile).toBe('pm.md');
    expect(pmCmd.slashCommand).toBe('n8n:pm');
  });
});
