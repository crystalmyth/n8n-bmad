/**
 * Party Mode command for n8n-BMAD CLI
 * Multi-agent collaboration sessions
 *
 * @module commands/party
 * @description Manages party mode for multi-agent collaboration
 */

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const {
  displayError,
  displayInfo,
  displayHeader,
  displayBox,
  displayTable,
} = require('../lib/display');

/**
 * Load party mode configuration
 * @async
 * @returns {Promise<Object>} Party mode config
 */
async function loadPartyConfig() {
  const configPaths = [
    path.join(process.cwd(), '.n8n-bmad', 'src', 'core', 'teams', 'party-mode.yaml'),
    path.join(process.cwd(), 'src', 'core', 'teams', 'party-mode.yaml'),
    path.join(__dirname, '..', '..', '..', 'src', 'core', 'teams', 'party-mode.yaml'),
  ];

  for (const configPath of configPaths) {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      return yaml.load(content);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  throw new Error('Party mode configuration not found');
}

/**
 * List all available parties
 * @async
 */
async function listParties() {
  const config = await loadPartyConfig();
  const parties = config.parties;

  displayHeader('Available Party Modes', { style: 'prominent' });
  console.log();

  // Header row + data rows (displayTable expects 2D array)
  const tableData = [
    ['Trigger', 'Name', 'Agents', 'Description'],
    ...Object.entries(parties).map(([_id, party]) => [
      party.trigger,
      `${party.icon} ${party.name}`,
      party.agents.map(a => a.name).join(', '),
      party.description.substring(0, 50) + '...',
    ]),
  ];

  console.log(displayTable(tableData));

  console.log();
  displayInfo('Use "n8n-bmad party describe <name>" for details');
  displayInfo('Use "n8n-bmad party start <name>" to begin a party session');
}

/**
 * Describe a specific party
 * @async
 * @param {string} partyName - Party identifier
 */
async function describeParty(partyName) {
  const config = await loadPartyConfig();
  const party = config.parties[partyName];

  if (!party) {
    displayError(`Party "${partyName}" not found`);
    displayInfo('Available parties: ' + Object.keys(config.parties).join(', '));
    return;
  }

  displayHeader(`${party.icon} ${party.name}`, { style: 'prominent' });
  console.log();
  console.log(party.description);
  console.log();

  console.log('Trigger:', party.trigger);
  console.log('Next Workflow:', party.next_workflow || 'None');
  console.log();

  console.log('When to Use:');
  party.when_to_use.forEach(use => console.log(`  - ${use}`));
  console.log();

  console.log('Participants:');
  party.agents.forEach(agent => {
    const roleIcon = agent.role === 'lead' ? '👑' : '👤';
    console.log(`  ${roleIcon} ${agent.name} (${agent.agent}) - ${agent.role}`);
    console.log('     Contributes:');
    agent.contributes.forEach(c => console.log(`       • ${c}`));
    console.log();
  });
}

/**
 * Start a party session (generates prompt)
 * @async
 * @param {string} partyName - Party identifier
 */
async function startParty(partyName) {
  const config = await loadPartyConfig();
  const party = config.parties[partyName];

  if (!party) {
    displayError(`Party "${partyName}" not found`);
    displayInfo('Available parties: ' + Object.keys(config.parties).join(', '));
    return;
  }

  const leadAgent = party.agents.find(a => a.role === 'lead');
  const participants = party.agents.filter(a => a.role !== 'lead');

  const prompt = `# Party Mode: ${party.icon} ${party.name}

## Session Purpose
${party.description}

## Participants

### Lead: ${leadAgent.name} (${leadAgent.agent})
${leadAgent.contributes.map(c => `- ${c}`).join('\n')}

### Participants
${participants.map(p => `
**${p.name} (${p.agent})**
${p.contributes.map(c => `- ${c}`).join('\n')}
`).join('\n')}

## Protocol

1. **${leadAgent.name}** sets context and states the objective
2. Each participant shares their perspective from their domain expertise
3. Cross-functional insights are discussed
4. **${leadAgent.name}** facilitates resolution of any disagreements
5. Key decisions and action items are documented

## Output
This session will produce: ${party.output_template || 'Session summary'}
${party.next_workflow ? `\nNext workflow: ${party.next_workflow}` : ''}

---

**Ready to begin. ${leadAgent.name}, please set the context for this ${party.name} session.**
`;

  displayBox([
    `${party.icon} ${party.name} Party Started`,
    '',
    `Lead: ${leadAgent.name}`,
    `Participants: ${participants.map(p => p.name).join(', ')}`,
    '',
    'Copy the prompt below to your AI assistant:',
  ], { title: 'Party Mode', style: 'round' });

  console.log();
  console.log('------- COPY FROM HERE -------');
  console.log(prompt);
  console.log('------- COPY TO HERE -------');
  console.log();

  displayInfo(`Trigger: ${party.trigger}`);
  if (party.next_workflow) {
    displayInfo(`After party, run: ${party.next_workflow}`);
  }
}

/**
 * Create the party command
 * @returns {Command} Commander command instance
 */
function createPartyCommand() {
  const command = new Command('party');

  command
    .description('Multi-agent collaboration sessions')
    .addCommand(
      new Command('list')
        .description('List all available party modes')
        .action(async () => {
          try {
            await listParties();
          } catch (error) {
            displayError(`Failed to list parties: ${error.message}`);
            process.exit(1);
          }
        })
    )
    .addCommand(
      new Command('describe')
        .description('Describe a specific party mode')
        .argument('<name>', 'Party name (e.g., architecture-review)')
        .action(async (name) => {
          try {
            await describeParty(name);
          } catch (error) {
            displayError(`Failed to describe party: ${error.message}`);
            process.exit(1);
          }
        })
    )
    .addCommand(
      new Command('start')
        .description('Start a party session')
        .argument('<name>', 'Party name (e.g., architecture-review)')
        .action(async (name) => {
          try {
            await startParty(name);
          } catch (error) {
            displayError(`Failed to start party: ${error.message}`);
            process.exit(1);
          }
        })
    );

  // Default action shows list
  command.action(async () => {
    try {
      await listParties();
    } catch (error) {
      displayError(`Failed to load party config: ${error.message}`);
      process.exit(1);
    }
  });

  return command;
}

module.exports = createPartyCommand();
