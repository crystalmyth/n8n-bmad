# n8n-BMAD Task Reference

This document provides help and guidance for all available tasks in the n8n-BMAD framework.

## Available Tasks

| Task ID | Name | Category | Description |
|---------|------|----------|-------------|
| TASK-001 | workflow-review | quality | Review workflow for best practices |
| TASK-002 | expression-validate | validation | Validate n8n expressions |
| TASK-003 | security-scan | security | Scan for security vulnerabilities |
| TASK-004 | documentation-generate | documentation | Generate workflow documentation |
| TASK-005 | performance-audit | optimization | Audit performance issues |

---

## TASK-001: Workflow Review

### Purpose
Performs a comprehensive review of an n8n workflow JSON file, checking for best practices, potential issues, and areas for improvement.

### Usage
```bash
n8n-bmad task run workflow-review --workflow ./my-workflow.json
n8n-bmad task run workflow-review --workflow ./my-workflow.json --review-type thorough
```

### Parameters
- `workflow_json` (required): Path to the n8n workflow JSON file
- `review_type` (optional): Level of review depth
  - `quick`: Fast scan for critical issues only
  - `standard`: Normal review (default)
  - `thorough`: Deep analysis with all checks

### Output
Markdown report containing:
- Summary of findings by severity
- Detailed findings with descriptions and recommendations
- Prioritized action items

### Checks Performed
- **Structure**: Naming conventions, organization, complexity
- **Error Handling**: Error workflows, try-catch patterns, retry logic
- **Security**: Credentials, sensitive data, input validation
- **Data**: Null handling, type safety
- **Performance**: API optimization, large data handling

---

## TASK-002: Expression Validate

### Purpose
Validates n8n expressions for syntax errors and potential runtime issues.

### Usage
```bash
n8n-bmad task run expression-validate --expression "{{ \$json.items.map(i => i.name) }}"
n8n-bmad task run expression-validate --expression "{{ \$json.data }}" --context '{"data": "test"}'
```

### Parameters
- `expression` (required): The n8n expression to validate
- `context` (optional): Sample data context for runtime validation

### Output
JSON object containing:
- `valid`: Boolean indicating if expression is valid
- `errors`: Array of error messages
- `warnings`: Array of warning messages
- `suggestions`: Array of improvement suggestions

### Checks Performed
- Syntax validation (delimiters, brackets, quotes)
- Variable reference validation ($json, $node, etc.)
- Method call validation
- Common issue detection (null access, type mismatches)
- Runtime testing with provided context

---

## TASK-003: Security Scan

### Purpose
Scans workflows for security vulnerabilities and compliance issues.

### Usage
```bash
n8n-bmad task run security-scan --workflow ./my-workflow.json
n8n-bmad task run security-scan --workflow ./my-workflow.json --compliance soc2
```

### Parameters
- `workflow_json` (required): Path to the workflow JSON file
- `compliance_framework` (optional): Compliance framework to check
  - `general`: General security best practices (default)
  - `soc2`: SOC 2 compliance controls
  - `gdpr`: GDPR requirements
  - `hipaa`: HIPAA safeguards

### Output
Security report containing:
- Risk level assessment
- Findings by severity (critical, high, medium)
- Compliance status (if framework specified)
- Remediation recommendations

### Checks Performed
- **Credentials**: Hardcoded secrets, credential store usage
- **Data Exposure**: PII logging, data retention
- **Input Validation**: Webhook validation, injection prevention
- **Authentication**: Webhook auth, API auth methods
- **Network**: HTTPS usage, internal network access

---

## TASK-004: Documentation Generate

### Purpose
Automatically generates documentation from n8n workflow JSON.

### Usage
```bash
n8n-bmad task run documentation-generate --workflow ./my-workflow.json
n8n-bmad task run documentation-generate --workflow ./my-workflow.json --doc-type runbook
```

### Parameters
- `workflow_json` (required): Path to the workflow JSON file
- `doc_type` (optional): Type of documentation to generate
  - `summary`: Brief overview for stakeholders
  - `full`: Complete technical documentation (default)
  - `runbook`: Operational runbook for support
  - `api`: API documentation for webhooks
- `include_diagrams` (optional): Include flow diagrams (default: true)

### Output
Markdown documentation containing:
- Workflow overview and purpose
- Flow diagram (Mermaid format)
- Trigger documentation
- Node-by-node documentation
- Data transformation details
- Error handling documentation
- Dependencies and maintenance notes

---

## TASK-005: Performance Audit

### Purpose
Audits workflows for performance issues and optimization opportunities.

### Usage
```bash
n8n-bmad task run performance-audit --workflow ./my-workflow.json
n8n-bmad task run performance-audit --workflow ./my-workflow.json --sla '{"max_execution_time": 30}'
```

### Parameters
- `workflow_json` (required): Path to the workflow JSON file
- `execution_data` (optional): Sample execution data for analysis
- `sla_requirements` (optional): Performance SLA requirements
  - `max_execution_time`: Maximum execution time in seconds
  - `max_memory_mb`: Maximum memory usage in MB
  - `max_error_rate`: Maximum acceptable error rate

### Output
Performance audit report containing:
- Performance score
- SLA compliance status
- Performance metrics table
- Critical issues and warnings
- Optimization recommendations (quick wins, refactoring, architecture)
- Implementation priority list

### Checks Performed
- **Structure**: Node count, sequential vs parallel execution
- **API Calls**: Call count, redundant calls, N+1 patterns
- **Data Handling**: Large payloads, unnecessary data transfer, memory usage
- **Expressions**: Complex expressions, regex performance

---

## Running Tasks

### CLI Commands
```bash
# List available tasks
n8n-bmad task list

# Get task help
n8n-bmad task help <task-name>

# Run a task
n8n-bmad task run <task-name> [options]

# Run with verbose output
n8n-bmad task run <task-name> --verbose

# Output to file
n8n-bmad task run <task-name> --output ./report.md
```

### Programmatic Usage
```javascript
const { TaskRunner } = require('n8n-bmad');

const runner = new TaskRunner();
const result = await runner.run('workflow-review', {
  workflow_json: './my-workflow.json',
  review_type: 'thorough'
});

console.log(result.report);
```

---

## Task Categories

### Quality
Tasks focused on code quality and best practices.
- workflow-review

### Validation
Tasks that validate syntax and correctness.
- expression-validate

### Security
Tasks for security scanning and compliance.
- security-scan

### Documentation
Tasks that generate documentation.
- documentation-generate

### Optimization
Tasks for performance analysis.
- performance-audit
