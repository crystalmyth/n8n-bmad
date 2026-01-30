# Agent Catalog

Complete reference for all AI agents available in the n8n-BMAD framework.

## Quick Reference

| Agent ID | Name | Primary Focus |
|----------|------|---------------|
| [n8n-master](#n8n-master) | Master Orchestrator | Help system, agent routing |
| [po](#po) | Product Owner | Requirements, backlog |
| [pm](#pm) | Project Manager | Sprints, releases |
| [sm](#sm) | Scrum Master | Ceremonies, coaching |
| [architect](#architect) | Solution Architect | Design, patterns |
| [developer](#developer) | Workflow Developer | Implementation, expressions |
| [qa](#qa) | QA Engineer | Testing, bug reports |
| [devops](#devops) | DevOps Engineer | Deployment, operations |
| [ba](#ba) | Business Analyst | Process mapping, ROI |
| [security](#security) | Security Specialist | Reviews, compliance |
| [integration](#integration) | Integration Specialist | APIs, webhooks |
| [data-analyst](#data-analyst) | Data Analyst | Transformation, modeling |
| [tech-writer](#tech-writer) | Technical Writer | Documentation |

---

## n8n-master

**Master Orchestrator**

The primary interface for the n8n-BMAD framework. Routes requests to specialized agents and provides help and guidance.

### Expertise

- Framework navigation and help
- Agent selection and routing
- Best practice guidance
- Project initialization
- Workflow pattern recommendations

### When to Use

- Starting a new task (will route to appropriate agent)
- Getting help on framework features
- Exploring available resources
- Unsure which agent to use

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| H | help | Show help topics |
| A | list-agents | List all available agents |
| T | list-templates | List all templates |
| P | list-patterns | List workflow patterns |
| V | validate | Validate current workflow |

### Usage

```bash
n8n-bmad agent load n8n-master
n8n-bmad agent menu n8n-master
```

---

## po

**Product Owner**

Specializes in requirements definition, backlog management, and acceptance criteria for workflow automation products.

### Expertise

- Requirements elicitation and documentation
- Backlog prioritization and grooming
- Acceptance criteria definition
- Stakeholder communication
- Value-driven decision making
- User story writing
- Product roadmap planning

### When to Use

- Defining what a workflow should do
- Writing user stories
- Prioritizing the backlog
- Setting acceptance criteria
- Communicating with stakeholders

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| R | create-requirement | Create new requirement |
| S | create-story | Write user story |
| P | view-prd-template | View PRD template |
| B | view-backlog | View current backlog |
| G | groom-backlog | Backlog grooming session |
| A | define-acceptance | Define acceptance criteria |

### Templates

- `templates/project/PRD.md`
- `templates/agile/epic.md`
- `templates/agile/story.md`
- `templates/testing/acceptance-criteria.md`

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| ba | Requirements gathering |
| architect | Technical feasibility |
| developer | Story refinement |
| qa | Acceptance criteria review |

---

## pm

**Project Manager**

Manages sprint planning, release coordination, and project status tracking.

### Expertise

- Sprint planning and tracking
- Release management
- Status reporting
- Risk management
- Resource coordination
- Timeline management

### When to Use

- Planning sprints
- Coordinating releases
- Tracking project status
- Managing timelines
- Reporting to stakeholders

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| S | sprint-plan | Plan sprint |
| R | release-plan | Plan release |
| T | status-report | Generate status report |
| I | risk-assessment | Assess risks |

### Templates

- `templates/project/project-charter.md`
- `templates/project/project-brief.md`
- `templates/agile/sprint-retrospective.md`

---

## sm

**Scrum Master**

Facilitates agile ceremonies, removes impediments, and coaches the team on agile practices.

### Expertise

- Agile ceremonies facilitation
- Impediment removal
- Team coaching
- Process improvement
- Conflict resolution

### When to Use

- Planning ceremonies (standup, retro, planning)
- Addressing team impediments
- Improving team processes
- Coaching on agile practices

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| D | daily-standup | Facilitate standup |
| R | retrospective | Run retrospective |
| I | impediment | Log impediment |
| C | coaching | Coaching session |

---

## architect

**Solution Architect**

Designs workflow architectures, creates technical decision records, and guides teams on design patterns.

### Expertise

- Workflow architecture design
- Integration pattern selection
- Technical decision making (ADRs)
- Performance optimization
- Security architecture
- Scalability planning
- Error handling strategies

### When to Use

- Designing workflow architecture
- Selecting integration patterns
- Making technical decisions
- Creating ADRs
- Reviewing existing architecture
- Planning for scale

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| D | design-workflow | Design new workflow |
| P | select-pattern | Pattern selection guide |
| R | review-architecture | Review existing architecture |
| A | create-adr | Create new ADR |
| L | list-adrs | List existing ADRs |
| F | feasibility | Technical feasibility assessment |

### Templates

- `templates/architecture/ADR.md`
- `templates/architecture/solution-design.md`
- `templates/architecture/integration-spec.md`
- `templates/architecture/workflow-architecture.md`

### Patterns Knowledge

**Error Handling:**
- Error Workflow
- Try-Catch Node
- Retry with Backoff

**Integration:**
- Webhook Gateway
- API Aggregation
- Queue-Based Processing

**Data:**
- Batch Processor
- Pagination Handler

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| developer | Implementation guidance |
| security | Security requirements |
| devops | Infrastructure architecture |
| integration | Integration patterns |
| data-analyst | Data architecture |

---

## developer

**Workflow Developer**

Implements n8n workflows, writes expressions, and handles error implementation.

### Expertise

- n8n workflow implementation
- Expression writing (JavaScript, JMESPath)
- Node configuration
- Error handling patterns
- Data transformation
- API integration
- Webhook handling
- Debugging and troubleshooting

### When to Use

- Implementing workflows
- Writing n8n expressions
- Configuring nodes
- Implementing error handling
- Debugging workflow issues
- Data transformation logic

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| N | new-workflow | Start new workflow |
| E | edit-workflow | Edit existing workflow |
| T | add-trigger | Configure trigger |
| X | expression-help | Expression syntax help |
| V | validate-expression | Validate expression |
| D | date-expressions | Date/time expressions |
| R | run-test | Test workflow |
| L | view-logs | View execution logs |
| B | debug-mode | Debug workflow |

### Templates

- `templates/n8n-specific/workflow-spec.md`
- `templates/n8n-specific/node-configuration.md`

### Expression Quick Reference

**Basic Access:**
```javascript
{{ $json.fieldName }}
{{ $('NodeName').item.json.field }}
{{ $input.item.json.field }}
```

**Conditional:**
```javascript
{{ $json.status === 'active' ? 'Yes' : 'No' }}
{{ $json.value ?? 'default' }}
```

**Array:**
```javascript
{{ $json.items.map(i => i.name).join(', ') }}
{{ $json.items.filter(i => i.active) }}
```

**Date:**
```javascript
{{ $now.toISO() }}
{{ DateTime.fromISO($json.date).toFormat('yyyy-MM-dd') }}
```

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| architect | Design guidance |
| qa | Testing and bug fixes |
| integration | API details |
| data-analyst | Data transformation |
| devops | Deployment support |

---

## qa

**QA Engineer**

Creates test plans, executes tests, and ensures workflow quality.

### Expertise

- Test planning and strategy
- Test case design
- Manual and automated testing
- Bug reporting and tracking
- Regression testing
- Performance testing
- Integration testing

### When to Use

- Creating test plans
- Writing test cases
- Executing tests
- Reporting bugs
- Validating workflow quality

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| P | create-test-plan | Create test plan |
| C | create-test-cases | Write test cases |
| M | test-matrix | View test coverage |
| R | run-tests | Execute test suite |
| E | execute-single | Run single test case |
| B | report-bug | Create bug report |
| T | test-report | Generate test report |

### Templates

- `templates/testing/test-plan.md`
- `templates/testing/test-case.md`
- `templates/testing/test-report.md`
- `templates/testing/acceptance-criteria.md`
- `templates/agile/bug-report.md`

### Quality Metrics

| Metric | Target |
|--------|--------|
| Test coverage | >= 80% |
| Defect density | < 1 per feature |
| Test pass rate | >= 95% |
| Escape rate | < 5% |

### n8n Test Scenarios

**Trigger Tests:**
- Webhook with valid/invalid payload
- Schedule trigger timing
- Manual trigger execution

**Node Tests:**
- HTTP request success/failure
- Data transformation accuracy
- Conditional branching logic

**Error Tests:**
- API failure recovery
- Invalid credentials
- Network timeout

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| po | Acceptance criteria |
| developer | Bug reproduction |
| devops | Test environments |
| architect | Test strategy |

---

## devops

**DevOps Engineer**

Manages deployment pipelines, environments, and incident response.

### Expertise

- CI/CD pipeline design
- n8n deployment strategies
- Environment management
- Monitoring and alerting
- Incident response
- Infrastructure as Code
- Container orchestration

### When to Use

- Setting up deployment pipelines
- Managing environments
- Handling incidents
- Configuring monitoring
- Planning deployments

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| D | deploy | Deploy workflow |
| R | rollback | Rollback deployment |
| P | pipeline-status | View pipeline status |
| E | env-status | Environment status |
| S | sync-env | Sync environments |
| I | incident-create | Create incident |
| T | incident-triage | Triage incident |
| M | metrics | View system metrics |

### Templates

- `templates/operations/runbook.md`
- `templates/operations/incident-report.md`
- `templates/operations/post-mortem.md`
- `templates/operations/change-request.md`
- `templates/operations/rollback-procedure.md`
- `templates/operations/disaster-recovery.md`

### Deployment Strategies

| Strategy | Description | Use When |
|----------|-------------|----------|
| Blue-Green | Two identical environments | Zero downtime required |
| Rolling | Gradual replacement | Large deployments |
| Canary | Deploy to subset first | Risk mitigation |

### Incident Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| SEV1 | Complete outage | Immediate |
| SEV2 | Major feature impacted | < 30 minutes |
| SEV3 | Minor impact | < 4 hours |

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| developer | Deployment support |
| security | Security configs |
| architect | Infrastructure |
| pm | Release coordination |

---

## ba

**Business Analyst**

Maps business processes, analyzes ROI, and manages stakeholder relationships.

### Expertise

- Process mapping and analysis
- ROI calculation
- Stakeholder management
- Requirements analysis
- Gap analysis
- Business case development

### When to Use

- Mapping current processes
- Identifying automation opportunities
- Calculating ROI
- Communicating with business stakeholders
- Building business cases

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| P | process-map | Create process map |
| R | roi-analysis | Calculate ROI |
| S | stakeholder-analysis | Analyze stakeholders |
| G | gap-analysis | Perform gap analysis |

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| po | Requirements gathering |
| architect | Technical feasibility |

---

## security

**Security Specialist**

Reviews security, manages credentials, and ensures compliance.

### Expertise

- Security reviews
- Credential management
- Compliance (SOC2, GDPR, HIPAA)
- Vulnerability assessment
- Access control
- Audit logging

### When to Use

- Reviewing workflow security
- Managing credentials
- Ensuring compliance
- Conducting security assessments
- Setting up access controls

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| R | security-review | Security review |
| C | credential-review | Review credentials |
| A | audit-log | Review audit logs |
| V | vulnerability-scan | Run vulnerability scan |

### Templates

- `templates/security/security-assessment.md`
- `templates/security/credential-rotation.md`
- `templates/security/access-review.md`

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| architect | Security architecture |
| devops | Security configs |
| developer | Secure implementation |

---

## integration

**Integration Specialist**

Designs and implements API integrations, webhooks, and third-party connections.

### Expertise

- REST and GraphQL APIs
- Webhook design and handling
- OAuth and authentication
- Third-party service integration
- API rate limiting
- Data synchronization

### When to Use

- Designing API integrations
- Setting up webhooks
- Configuring authentication
- Handling rate limits
- Syncing data between systems

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| A | api-design | Design API integration |
| W | webhook-setup | Set up webhook |
| O | oauth-config | Configure OAuth |
| R | rate-limit | Handle rate limiting |

### Templates

- `templates/architecture/integration-spec.md`
- `templates/n8n-specific/webhook-inventory.md`
- `templates/n8n-specific/credential-manifest.md`

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| architect | Integration patterns |
| developer | Implementation |
| security | Authentication |

---

## data-analyst

**Data Analyst**

Designs data models and transformation logic for workflows.

### Expertise

- Data modeling
- Data transformation
- Data mapping
- Data quality
- Analytics design
- Reporting

### When to Use

- Designing data models
- Planning data transformations
- Mapping data between systems
- Ensuring data quality
- Designing analytics

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| M | data-model | Design data model |
| T | transformation | Plan transformation |
| Q | data-quality | Check data quality |
| R | reporting | Design reports |

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| architect | Data architecture |
| developer | Transformation logic |
| integration | Data sync |

---

## tech-writer

**Technical Writer**

Creates documentation, runbooks, and technical content.

### Expertise

- Technical documentation
- API documentation
- Runbook writing
- User guides
- Knowledge base articles
- Training materials

### When to Use

- Writing workflow documentation
- Creating runbooks
- Documenting APIs
- Writing user guides
- Building knowledge bases

### Menu Commands

| Key | Action | Description |
|-----|--------|-------------|
| D | documentation | Write documentation |
| R | runbook | Create runbook |
| A | api-docs | Document API |
| G | user-guide | Write user guide |

### Templates

- `templates/operations/runbook.md`
- All templates (for documentation purposes)

### Collaborates With

| Agent | Relationship |
|-------|-------------|
| developer | Technical details |
| devops | Operations procedures |
| architect | Architecture docs |

---

## Using Agents

### Load an Agent

```bash
n8n-bmad agent load <agent-id>
```

### View Agent Menu

```bash
n8n-bmad agent menu <agent-id>
```

### Get Agent Info

```bash
n8n-bmad agent info <agent-id>
```

### List All Agents

```bash
n8n-bmad agent list
```

## Agent Selection Guide

| Task | Recommended Agent |
|------|-------------------|
| Define requirements | po |
| Map business process | ba |
| Design architecture | architect |
| Implement workflow | developer |
| Write tests | qa |
| Set up deployment | devops |
| Review security | security |
| Configure APIs | integration |
| Transform data | data-analyst |
| Write documentation | tech-writer |
| Unsure where to start | n8n-master |
