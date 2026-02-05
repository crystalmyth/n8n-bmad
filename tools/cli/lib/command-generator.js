/**
 * Claude Code Command Generator for n8n-BMAD CLI
 * Converts agent YAML files to Claude Code slash command markdown files
 *
 * @module lib/command-generator
 * @description Generates .claude/commands/n8n/*.md files from agent definitions
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Agent ID to command file name mapping
 * Short aliases for common agents
 * @type {Object}
 */
const AGENT_ALIASES = {
  'n8n-master': 'master',
  'developer': 'dev',
  'architect': 'arch',
  'data-analyst': 'data',
  'tech-writer': 'docs',
  // Others keep their original name
  'po': 'po',
  'pm': 'pm',
  'sm': 'sm',
  'qa': 'qa',
  'devops': 'devops',
  'ba': 'ba',
  'security': 'security',
  'integration': 'integration',
};

/**
 * Get the command file name for an agent
 * @param {string} agentId - The agent ID
 * @returns {string} The command file name (without .md extension)
 */
function getCommandFileName(agentId) {
  return AGENT_ALIASES[agentId] || agentId;
}

/**
 * Format menu sections into readable markdown
 * Supports both old-style sections object and new flat array format
 * @param {Object|Array} menu - Menu object or array from agent YAML
 * @returns {string} Formatted menu markdown
 */
function formatMenu(menu) {
  const lines = ['| Trigger | Action | Description |', '|---------|--------|-------------|'];

  // Handle new flat array format (v2.0)
  if (Array.isArray(menu)) {
    for (const cmd of menu) {
      // Extract 2-letter trigger from "NW or fuzzy match on..." format
      let trigger = cmd.trigger || '';
      const triggerMatch = trigger.match(/^([A-Z]{2})/);
      if (triggerMatch) {
        trigger = triggerMatch[1];
      }
      // Clean description - remove bracketed trigger if present
      let desc = cmd.description || '';
      desc = desc.replace(/^\[[A-Z]{2}\]\s*[^:]+:\s*/, '');
      lines.push(`| ${trigger} | ${cmd.action} | ${desc} |`);
    }
    return lines.length > 2 ? lines.join('\n') : lines.join('\n') + '\n| HP | help | Show available commands |';
  }

  // Handle old sections object format (v1.0)
  if (menu && menu.sections) {
    for (const section of menu.sections) {
      if (section.commands && section.commands.length > 0) {
        for (const cmd of section.commands) {
          const trigger = cmd.trigger || cmd.key || '';
          lines.push(`| ${trigger} | ${cmd.action} | ${cmd.description} |`);
        }
      }
    }
    return lines.length > 2 ? lines.join('\n') : lines.join('\n') + '\n| HP | help | Show available commands |';
  }

  return '| Trigger | Action | Description |\n|---------|--------|-------------|\n| HP | help | Show available commands |';
}

/**
 * Format collaborates_with into readable markdown
 * Supports both v1.0 (relationship) and v2.0 (when) formats
 * @param {Array} collaborators - Array of collaboration objects
 * @returns {string} Formatted collaboration list
 */
function formatCollaborators(collaborators) {
  if (!collaborators || collaborators.length === 0) {
    return 'All n8n-BMAD agents as needed';
  }

  return collaborators
    .map(c => `- **${c.agent}**: ${c.when || c.relationship || 'Collaborate as needed'}`)
    .join('\n');
}

/**
 * Format expertise list
 * @param {Array} expertise - Array of expertise strings
 * @returns {string} Formatted expertise list
 */
function formatExpertise(expertise) {
  if (!expertise || expertise.length === 0) {
    return '- n8n workflow automation';
  }

  return expertise.map(e => `- ${e}`).join('\n');
}

/**
 * Format responsibilities into markdown
 * @param {Object} responsibilities - Responsibilities object from agent YAML
 * @returns {string} Formatted responsibilities
 */
function formatResponsibilities(responsibilities) {
  if (!responsibilities) {
    return '';
  }

  const lines = [];
  for (const [key, value] of Object.entries(responsibilities)) {
    if (value.description) {
      lines.push(`- **${key.replace(/_/g, ' ')}**: ${value.description}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : '';
}

/**
 * Common action-to-prompt key mappings
 * Some actions have different prompt key names
 * @type {Object}
 */
const ACTION_PROMPT_MAP = {
  'new-workflow': ['new_workflow', 'implementation_start', 'new_workflow_start'],
  'debug-mode': ['debug_mode', 'debugging_guide', 'debug'],
  'expression-help': ['expression_help', 'expressions', 'expression_guide'],
  'update-progress': ['update_progress', 'progress_update', 'story_progress'],
  'create-prd': ['create_prd', 'prd_creation', 'prd'],
  'create-story': ['create_story', 'story_creation', 'story'],
  'create-epic': ['create_epic', 'epic_creation', 'epic'],
};

/**
 * Format action prompts for skill routing
 * Extracts action-to-prompt mappings from menu and prompts
 * @param {Array} menu - Menu array from agent YAML
 * @param {Object} prompts - Prompts object from agent YAML
 * @returns {Array} Array of {action, trigger, prompt} objects
 */
function extractActionPrompts(menu, prompts) {
  const actions = [];

  if (!Array.isArray(menu)) return actions;

  for (const cmd of menu) {
    const action = cmd.action || '';
    if (!action) continue;

    // Extract 2-letter trigger
    let trigger = cmd.trigger || '';
    const triggerMatch = trigger.match(/^([A-Z]{2})/);
    if (triggerMatch) {
      trigger = triggerMatch[1];
    }

    // Look for matching prompt template with multiple key attempts
    const promptKey = action.replace(/-/g, '_');
    const keysToTry = [
      promptKey,
      action,
      ...(ACTION_PROMPT_MAP[action] || []),
    ];

    let prompt = '';
    for (const key of keysToTry) {
      if (prompts[key]) {
        prompt = prompts[key];
        break;
      }
    }

    actions.push({
      action,
      trigger,
      description: cmd.description || '',
      prompt: typeof prompt === 'string' ? prompt.trim() : '',
    });
  }

  return actions;
}

/**
 * Generate skill routing section for *action-name support
 * @param {Array} actions - Array of action objects from extractActionPrompts
 * @param {string} agentName - Agent display name
 * @returns {string} Markdown for skill routing
 */
function generateSkillRouting(actions, agentName) {
  if (actions.length === 0) return '';

  const lines = [
    '## Skill Routing',
    '',
    'This agent supports direct skill invocation with `*action-name` syntax.',
    '',
    '**Usage:** `/n8n:agent *action-name` (e.g., `/n8n:dev *new-workflow`)',
    '',
    '### Available Skills',
    '',
    '| Skill | Trigger | Description |',
    '|-------|---------|-------------|',
  ];

  for (const action of actions) {
    lines.push(`| \`*${action.action}\` | ${action.trigger} | ${action.description.replace(/^\[[A-Z]{2}\]\s*[^:]+:\s*/, '')} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('### Skill Execution');
  lines.push('');
  lines.push('**Check `$ARGUMENTS` for skill request:**');
  lines.push('');

  for (const action of actions) {
    lines.push(`<skill name="${action.action}">`);
    if (action.prompt) {
      lines.push('');
      lines.push(action.prompt);
      lines.push('');
    } else {
      lines.push('');
      lines.push(`Execute the "${action.action}" action for ${agentName}.`);
      lines.push('');
    }
    lines.push('</skill>');
    lines.push('');
  }

  lines.push('**Routing Logic:**');
  lines.push('- If `$ARGUMENTS` starts with `*`, extract the action name after `*`');
  lines.push('- Match against available skills above');
  lines.push('- Execute the corresponding skill prompt directly');
  lines.push('- If no `*` argument, show the welcome menu below');
  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate Claude Code command markdown from agent YAML data
 * Supports both v1.0 (flat agent object) and v2.0 (agent.metadata/persona) formats
 * @param {Object} agentData - Parsed agent YAML data
 * @returns {string} Markdown content for the command file
 */
function generateAgentCommand(agentData) {
  const agent = agentData.agent || {};

  // Support both v1.0 and v2.0 agent YAML structures
  const metadata = agent.metadata || agent;
  const persona = agent.persona || {};
  const identity = agentData.identity || {};
  const menu = agentData.menu;
  const collaborators = agentData.collaborates_with;
  const responsibilities = agentData.responsibilities;

  // Extract fields from appropriate location based on version
  const agentId = metadata.id || agent.id || 'unknown';
  const agentName = metadata.name || agent.name || agentId;
  const agentTitle = metadata.title || agent.title || agentName;
  const agentRole = persona.role || agent.role || agentTitle;

  // Description from persona.identity (v2.0) or identity.description (v1.0)
  const description = persona.identity || identity.description || `You are the ${agentName}.`;

  // Expertise from identity (v1.0) - v2.0 doesn't have explicit expertise array
  const expertise = identity.expertise || [];

  // Critical actions from v2.0 format
  const criticalActions = agent.critical_actions || [];

  // Welcome prompt from prompts section
  const prompts = agentData.prompts || {};
  const welcomePrompt = prompts.welcome || '';

  // Extract action prompts for skill routing
  const actions = extractActionPrompts(menu, prompts);
  const skillRoutingSection = generateSkillRouting(actions, agentName);

  // Format critical actions if present
  const criticalActionsSection = criticalActions.length > 0
    ? `## Critical Actions

${criticalActions.map(a => `- ${a}`).join('\n')}

`
    : '';

  // Format welcome section if present
  const welcomeSection = welcomePrompt
    ? `## Welcome

${welcomePrompt.trim()}

`
    : '';

  const content = `# n8n-BMAD ${agentName} - ${agentTitle}

**Arguments:** \`$ARGUMENTS\`

When this command is invoked, adopt the following n8n-BMAD agent persona:

<!-- Powered by n8n-BMAD Framework - https://github.com/bmad-method/n8n-bmad -->

---

## Role: ${agentRole}

${description.trim()}

${skillRoutingSection}${welcomeSection}${criticalActionsSection}${expertise.length > 0 ? `## Your Expertise

${formatExpertise(expertise)}

` : ''}${responsibilities ? `## Core Responsibilities

${formatResponsibilities(responsibilities)}

` : ''}## Available Commands

Use 2-letter trigger codes to invoke actions (BMAD convention):

${formatMenu(menu)}

**How to use:** Simply type the 2-letter trigger code (e.g., \`CP\` for Create PRD).

## Essential Commands

The core workflow triggers:
- \`PRD\` - Create PRD (auto-scales to project size)
- \`CA\` - Create Architecture
- \`CS\` - Create Story
- \`DS\` - Dev Story (implement a story)
- \`CR\` - Code Review (quality review)

## Collaboration

You work closely with other n8n-BMAD agents:

${formatCollaborators(collaborators)}

## Document Save Locations

**IMPORTANT:** Always save user documents to \`./docs/\` at project root (NOT inside .n8n-bmad):

| Document | Path | Sharded |
|----------|------|---------|
| PRD | \`./docs/prd.md\` | \`./docs/prd/index.md\` + sections |
| Architecture | \`./docs/architecture.md\` | \`./docs/architecture/index.md\` + sections |
| Epic | \`./docs/backlog/epics/epic-{id}-{name}.md\` | - |
| Story | \`./docs/backlog/stories/story-{id}-{name}.md\` | - |
| Sprint | \`./docs/sprints/sprint-{n}-plan.md\` | - |

**Sharding:** For large docs (>500 lines), convert single file to folder with \`index.md\` + sections.

## Finding Existing Documents

**IMPORTANT:** Before creating documents, CHECK for and READ existing ones:

| Document | Check First | Then Check (if sharded) |
|----------|-------------|-------------------------|
| PRD | \`./docs/prd.md\` | \`./docs/prd/index.md\` |
| Architecture | \`./docs/architecture.md\` | \`./docs/architecture/index.md\` |
| Epics | \`./docs/backlog/epics/epic-*.md\` | - |
| Stories | \`./docs/backlog/stories/story-*.md\` | - |
| Sprints | \`./docs/sprints/sprint-*-plan.md\` | - |
| Quick Brief | \`./docs/quick-brief.md\` | - |
| Project Brief | \`./docs/project-brief.md\` | - |

**Discovery Steps:**
1. Use \`ls ./docs/\` to see what exists in the docs folder
2. If PRD/Architecture is a **folder**, read the \`index.md\` inside it
3. For epics/stories, list files with \`ls ./docs/backlog/epics/\` or \`ls ./docs/backlog/stories/\`
4. **Always read the relevant documents** before drafting or creating new ones

## Workflow Order

**CRITICAL:** Follow this order - never skip steps:
\`\`\`
PRD → CA → CS → DS → CR
(Requirements → Architecture → Stories → Implement → Review)
\`\`\`

## Guidelines

- Stay focused on n8n workflow automation
- Follow best practices from the n8n-BMAD framework
- Reference templates in \`./templates/\` (framework) or \`.n8n-bmad/templates/\` (projects)
- Use patterns from \`./patterns/\` (framework) or \`.n8n-bmad/patterns/\` (projects)
- Coordinate with other agents when work crosses domain boundaries
- Always consider error handling, security, and maintainability

## Getting Started

To begin, describe what you need help with or use a trigger code.

Type \`HP\` for help topics or see the trigger table above.
`;

  return content;
}

/**
 * Load and parse an agent YAML file
 * @async
 * @param {string} filePath - Path to the agent YAML file
 * @returns {Promise<Object>} Parsed agent data
 */
async function loadAgentYaml(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return yaml.load(content);
}

/**
 * Generate Claude Code commands for all agents
 * @async
 * @param {string} sourceAgentsPath - Path to source agent YAML files
 * @param {string} targetCommandsPath - Path to write command files (.claude/commands/n8n/)
 * @param {boolean} [dryRun=false] - If true, don't actually write files
 * @returns {Promise<Array<{agentId: string, commandFile: string, slashCommand: string}>>} List of generated commands
 */
async function generateClaudeCommands(sourceAgentsPath, targetCommandsPath, dryRun = false) {
  const generated = [];

  try {
    // Read all agent files
    const files = await fs.readdir(sourceAgentsPath);
    const agentFiles = files.filter(f => f.endsWith('.agent.yaml'));

    // Create target directory if needed
    if (!dryRun) {
      await fs.mkdir(targetCommandsPath, { recursive: true });
    }

    for (const file of agentFiles) {
      const sourcePath = path.join(sourceAgentsPath, file);

      try {
        // Load and parse agent YAML
        const agentData = await loadAgentYaml(sourcePath);
        const agentId = agentData.agent?.id || file.replace('.agent.yaml', '');

        // Generate command markdown
        const commandContent = generateAgentCommand(agentData);

        // Determine output file name
        const commandFileName = getCommandFileName(agentId);
        const targetPath = path.join(targetCommandsPath, `${commandFileName}.md`);

        // Write command file
        if (!dryRun) {
          await fs.writeFile(targetPath, commandContent, 'utf8');
        }

        generated.push({
          agentId,
          commandFile: `${commandFileName}.md`,
          slashCommand: `n8n:${commandFileName}`,
        });
      } catch (error) {
        // Log but continue with other agents
        console.error(`Warning: Could not process ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    // Source directory doesn't exist, return empty
  }

  return generated;
}

/**
 * Get the list of all available slash commands that would be generated
 * @returns {Array<{agentId: string, commandFile: string, slashCommand: string}>} Command list
 */
function getAvailableCommands() {
  return Object.entries(AGENT_ALIASES).map(([agentId, alias]) => ({
    agentId,
    commandFile: `${alias}.md`,
    slashCommand: `n8n:${alias}`,
  }));
}

/**
 * Generate quick-flow command markdown
 * These are standalone commands that work without loading an agent
 * @param {Object} workflowData - Parsed workflow YAML data
 * @returns {string} Markdown content for the quick-flow command
 */
function generateQuickFlowCommand(workflowData) {
  const workflow = workflowData.workflow || {};
  const name = workflow.name || 'Quick Flow';
  const trigger = workflow.trigger || '';
  const description = workflow.description || '';
  const purpose = workflowData.purpose || '';
  const instructions = workflowData.instructions || '';
  const checklist = workflowData.checklist || [];

  const checklistMd = Array.isArray(checklist)
    ? checklist.map(item => `- [ ] ${item}`).join('\n')
    : '';

  return `# n8n-BMAD ${name}

<!-- Quick Flow Command - Works standalone without loading an agent -->
<!-- Trigger: ${trigger} -->

---

## ${name}

${description}

## Purpose

${purpose.trim()}

## Instructions

${instructions.trim()}

${checklistMd ? `## Checklist

${checklistMd}
` : ''}
## Usage

Type \`${trigger}\` to start this workflow.

## Related Commands

- \`PRD\` - Create PRD (auto-scales to project size)
- \`DS\` - Dev Story (implement a story)
- \`CR\` - Code Review (quality review)

---
*Powered by n8n-BMAD Framework*
`;
}

/**
 * Generate Claude Code commands for quick-flow workflows
 * @async
 * @param {string} workflowsPath - Path to workflows directory
 * @param {string} targetCommandsPath - Path to write command files
 * @returns {Promise<Array>} List of generated quick-flow commands
 */
async function generateQuickFlowCommands(workflowsPath, targetCommandsPath) {
  const generated = [];
  const quickFlowPath = path.join(workflowsPath, 'quick-flow');

  try {
    const files = await fs.readdir(quickFlowPath);
    const workflowFiles = files.filter(f => f.endsWith('.workflow.yaml'));

    for (const file of workflowFiles) {
      const sourcePath = path.join(quickFlowPath, file);
      try {
        const content = await fs.readFile(sourcePath, 'utf8');
        const workflowData = yaml.load(content);
        const commandContent = generateQuickFlowCommand(workflowData);

        const commandName = file.replace('.workflow.yaml', '');
        const targetPath = path.join(targetCommandsPath, `${commandName}.md`);

        await fs.writeFile(targetPath, commandContent, 'utf8');

        generated.push({
          workflowId: workflowData.workflow?.id || commandName,
          commandFile: `${commandName}.md`,
          slashCommand: `/n8n-${commandName}`,
          trigger: workflowData.workflow?.trigger || '',
        });
      } catch (error) {
        console.error(`Warning: Could not process ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return generated;
}

module.exports = {
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
};
