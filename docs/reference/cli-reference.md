# CLI Reference

Complete reference for the n8n-BMAD command-line interface.

## Installation

```bash
# Global installation
npm install -g n8n-bmad

# Using npx (no installation required)
npx n8n-bmad <command>
```

## Global Options

These options apply to all commands:

| Option | Description |
|--------|-------------|
| `--version`, `-v` | Display version number |
| `--help`, `-h` | Display help for command |
| `--config <path>` | Path to config file (default: `n8n-bmad.config.yaml`) |
| `--verbose` | Enable verbose output |
| `--quiet`, `-q` | Suppress non-essential output |

## Commands

### init

Initialize a new n8n-BMAD project.

```bash
n8n-bmad init [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--name <name>` | Project name | Interactive prompt |
| `--url <url>` | n8n instance URL | `http://localhost:5678` |
| `--api-key <key>` | n8n API key | Interactive prompt |
| `--mcp` | Set up MCP integration | `false` |
| `--force`, `-f` | Overwrite existing configuration | `false` |

**Examples:**

```bash
# Interactive initialization
n8n-bmad init

# Non-interactive initialization
n8n-bmad init --name "My Project" --url "https://n8n.example.com"

# Initialize with MCP
n8n-bmad init --mcp
```

**Output:**

Creates:
- `n8n-bmad.config.yaml` - Project configuration
- `.mcp.json` - MCP configuration (if `--mcp` specified)
- `docs/` - Documentation directory
- `exports/` - Workflow exports directory
- `backups/` - Backup directory
- `reports/` - Validation reports directory

---

### agent

Manage and interact with AI agents.

#### agent list

List all available agents.

```bash
n8n-bmad agent list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--format <format>` | Output format: `table`, `json`, `yaml` |

**Example:**

```bash
n8n-bmad agent list
n8n-bmad agent list --format json
```

#### agent load

Load an agent for interaction.

```bash
n8n-bmad agent load <agent-id>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `agent-id` | The agent identifier (e.g., `developer`, `architect`) |

**Example:**

```bash
n8n-bmad agent load developer
n8n-bmad agent load po
```

#### agent menu

Display an agent's action menu.

```bash
n8n-bmad agent menu <agent-id>
```

**Example:**

```bash
n8n-bmad agent menu developer
```

#### agent info

Display detailed information about an agent.

```bash
n8n-bmad agent info <agent-id>
```

**Example:**

```bash
n8n-bmad agent info architect
```

---

### template

Manage document templates.

#### template list

List all available templates.

```bash
n8n-bmad template list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--category <cat>` | Filter by category |
| `--agent <agent>` | Filter by agent |
| `--format <format>` | Output format: `table`, `json`, `yaml` |

**Categories:**
- `project` - PRD, charter, brief
- `agile` - Epic, story, task, sprint
- `architecture` - ADR, solution design
- `operations` - Runbook, incident report
- `testing` - Test plan, test case
- `n8n-specific` - Workflow spec, credentials
- `security` - Security assessment

**Examples:**

```bash
n8n-bmad template list
n8n-bmad template list --category agile
n8n-bmad template list --agent developer
```

#### template generate

Generate a document from a template.

```bash
n8n-bmad template generate <template-name> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `template-name` | Name of the template to generate |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--output <path>`, `-o` | Output file path | stdout |
| `--vars <json>` | Template variables as JSON | `{}` |
| `--interactive`, `-i` | Prompt for variables | `false` |

**Examples:**

```bash
# Output to file
n8n-bmad template generate workflow-spec --output ./docs/my-workflow.md

# With variables
n8n-bmad template generate story --vars '{"title": "User Login", "role": "user"}'

# Interactive mode
n8n-bmad template generate ADR --interactive
```

#### template show

Display a template's content.

```bash
n8n-bmad template show <template-name>
```

**Example:**

```bash
n8n-bmad template show PRD
```

---

### pattern

Manage workflow patterns.

#### pattern list

List all available patterns.

```bash
n8n-bmad pattern list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--category <cat>` | Filter by category |
| `--format <format>` | Output format: `table`, `json`, `yaml` |

**Categories:**
- `error-handling` - Retry, DLQ, circuit breaker
- `integration` - API, webhook, database
- `data-transformation` - Batch, pagination
- `scheduling` - Cron, polling

**Examples:**

```bash
n8n-bmad pattern list
n8n-bmad pattern list --category error-handling
```

#### pattern show

Display pattern details.

```bash
n8n-bmad pattern show <pattern-name>
```

**Example:**

```bash
n8n-bmad pattern show retry-with-backoff
```

#### pattern export

Export a pattern for import into n8n.

```bash
n8n-bmad pattern export <pattern-name> [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--output <path>`, `-o` | Output file path | stdout |
| `--format <format>` | Output format: `json`, `yaml` | `json` |

**Examples:**

```bash
n8n-bmad pattern export retry-with-backoff --output ./patterns/retry.json
n8n-bmad pattern export error-handling --output ./patterns/  # Export all in category
```

---

### validate

Validate workflows and expressions.

#### validate workflow

Validate an n8n workflow file.

```bash
n8n-bmad validate workflow <path> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `path` | Path to workflow JSON file or directory |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--review-type <type>` | Review depth: `quick`, `standard`, `thorough` | `standard` |
| `--output <path>`, `-o` | Save report to file | stdout |
| `--format <format>` | Report format: `text`, `json`, `markdown` | `text` |
| `--fail-on <level>` | Fail if issues at level: `error`, `warning`, `info` | `error` |

**Examples:**

```bash
# Validate single file
n8n-bmad validate workflow ./my-workflow.json

# Validate directory
n8n-bmad validate workflow ./workflows/

# Thorough review with markdown output
n8n-bmad validate workflow ./workflow.json --review-type thorough --format markdown

# CI/CD usage (fail on warnings)
n8n-bmad validate workflow ./workflow.json --fail-on warning
```

#### validate naming

Check naming convention compliance.

```bash
n8n-bmad validate naming <path> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--fix` | Suggest fixes for naming issues |

**Example:**

```bash
n8n-bmad validate naming ./workflows/
n8n-bmad validate naming ./workflows/ --fix
```

#### validate expression

Validate an n8n expression.

```bash
n8n-bmad validate expression <expression> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--context <json>` | Sample data context for testing |

**Examples:**

```bash
n8n-bmad validate expression '{{ $json.items.map(i => i.name) }}'

n8n-bmad validate expression '{{ $json.data }}' --context '{"data": "test"}'
```

---

### task

Run framework tasks.

#### task list

List available tasks.

```bash
n8n-bmad task list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--category <cat>` | Filter by category |

**Example:**

```bash
n8n-bmad task list
n8n-bmad task list --category security
```

#### task run

Execute a task.

```bash
n8n-bmad task run <task-name> [options]
```

**Available Tasks:**

| Task | Description |
|------|-------------|
| `workflow-review` | Review workflow for best practices |
| `expression-validate` | Validate n8n expressions |
| `security-scan` | Scan for security issues |
| `documentation-generate` | Generate workflow documentation |
| `performance-audit` | Audit performance issues |

**Common Options:**

| Option | Description |
|--------|-------------|
| `--workflow <path>` | Path to workflow JSON |
| `--output <path>`, `-o` | Save output to file |
| `--verbose` | Show detailed output |

**Task-Specific Options:**

`workflow-review`:
| Option | Description |
|--------|-------------|
| `--review-type <type>` | `quick`, `standard`, `thorough` |

`security-scan`:
| Option | Description |
|--------|-------------|
| `--compliance <framework>` | `general`, `soc2`, `gdpr`, `hipaa` |

`documentation-generate`:
| Option | Description |
|--------|-------------|
| `--doc-type <type>` | `summary`, `full`, `runbook`, `api` |
| `--include-diagrams` | Include flow diagrams |

`performance-audit`:
| Option | Description |
|--------|-------------|
| `--sla <json>` | SLA requirements |

**Examples:**

```bash
# Workflow review
n8n-bmad task run workflow-review --workflow ./workflow.json

# Security scan with SOC 2
n8n-bmad task run security-scan --workflow ./workflow.json --compliance soc2

# Generate runbook
n8n-bmad task run documentation-generate --workflow ./workflow.json --doc-type runbook

# Performance audit with SLA
n8n-bmad task run performance-audit --workflow ./workflow.json --sla '{"max_execution_time": 30}'
```

#### task help

Get help for a specific task.

```bash
n8n-bmad task help <task-name>
```

**Example:**

```bash
n8n-bmad task help security-scan
```

---

### mcp-server

Start the MCP server for AI assistant integration.

```bash
n8n-bmad mcp-server [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--port <port>` | Server port | Auto-selected |
| `--config <path>` | MCP configuration path | `.mcp.json` |

**Example:**

```bash
n8n-bmad mcp-server
```

---

### config

Manage configuration.

#### config show

Display current configuration.

```bash
n8n-bmad config show [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--format <format>` | Output format: `yaml`, `json` |

**Example:**

```bash
n8n-bmad config show
```

#### config set

Set a configuration value.

```bash
n8n-bmad config set <key> <value>
```

**Example:**

```bash
n8n-bmad config set n8n.instance_url "https://n8n.example.com"
n8n-bmad config set naming.workflow_prefix "wf_"
```

#### config validate

Validate configuration file.

```bash
n8n-bmad config validate
```

---

### help

Display help information.

```bash
n8n-bmad help [command]
```

**Examples:**

```bash
n8n-bmad help
n8n-bmad help agent
n8n-bmad help validate workflow
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `N8N_INSTANCE_URL` | n8n instance URL | `http://localhost:5678` |
| `N8N_API_KEY` | n8n API key | None |
| `N8N_BMAD_CONFIG` | Config file path | `n8n-bmad.config.yaml` |
| `N8N_BMAD_LOG_LEVEL` | Log level: `debug`, `info`, `warn`, `error` | `info` |

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |
| `3` | Configuration error |
| `4` | Validation failed |
| `5` | Network/API error |

## Configuration File

The `n8n-bmad.config.yaml` file configures project settings:

```yaml
# n8n Instance Configuration
n8n:
  instance_url: http://localhost:5678
  api_key: ${N8N_API_KEY}  # Environment variable reference

# Naming Conventions
naming:
  workflow_prefix: "wf_"
  credential_prefix: "cred_"
  use_snake_case: true

# Validation Settings
validation:
  check_naming: true
  check_credentials: true
  check_expressions: true
  check_connections: true

# Output Paths
output:
  docs_path: ./docs
  exports_path: ./exports
  backups_path: ./backups
  reports_path: ./reports

# Default Settings
defaults:
  workflow:
    timezone: "UTC"
    save_execution_progress: true

# MCP Configuration
mcp:
  enabled: true
  config_path: ./.mcp.json
```

## Programmatic Usage

n8n-BMAD can be used programmatically:

```javascript
const { BMAD } = require('n8n-bmad');

const bmad = new BMAD({
  configPath: './n8n-bmad.config.yaml'
});

// Run a task
const result = await bmad.task.run('workflow-review', {
  workflow_json: './my-workflow.json',
  review_type: 'thorough'
});

// Validate expression
const validation = await bmad.validate.expression(
  '{{ $json.items.map(i => i.name) }}',
  { items: [{ name: 'test' }] }
);

// Generate template
const doc = await bmad.template.generate('workflow-spec', {
  name: 'My Workflow',
  description: 'A sample workflow'
});
```

## Troubleshooting

### Command not found

```bash
# Check installation
which n8n-bmad

# Reinstall globally
npm install -g n8n-bmad
```

### Configuration not loading

```bash
# Specify config explicitly
n8n-bmad --config ./path/to/config.yaml <command>

# Check config is valid
n8n-bmad config validate
```

### API connection failed

```bash
# Test n8n connection
curl -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows

# Check environment variable
echo $N8N_API_KEY
```

### Verbose debugging

```bash
# Enable verbose output
n8n-bmad --verbose <command>

# Debug log level
N8N_BMAD_LOG_LEVEL=debug n8n-bmad <command>
```
