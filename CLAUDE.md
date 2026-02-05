# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference: Agent + Skill Invocation

**Syntax:** `/n8n:agent *skill` (self-documenting and discoverable)

### Essential Commands

| Agent + Skill | What It Does |
|---------------|--------------|
| `/n8n:pm *create-prd` | Start any project (auto-scales) |
| `/n8n:po *validate-prd` | Validate PRD for business value |
| `/n8n:arch *create-architecture` | Design workflow architecture |
| `/n8n:pm *create-epic` | Create epic (6+ stories) |
| `/n8n:po *validate-epic` | Validate epic scope |
| `/n8n:sm *story-draft` | Draft story with context review |
| `/n8n:po *validate-story` | Validate story (DoR) |
| `/n8n:dev *dev-story` | Implement a story (auto-saves) |
| `/n8n:qa *code-review` | Quality review |
| `/n8n:quick-flow *save-brief` | Save Quick Flow state |
| `/n8n:quick-flow *load-brief` | Resume Quick Flow |

### Agent Menu (No Skill)

```bash
/n8n:pm      # Show PM menu with all available skills
/n8n:po      # Show PO menu with all validation skills
/n8n:sm      # Show SM menu with ceremony skills
/n8n:dev     # Show Developer menu
```

> **Pattern:** PM creates → PO validates (four-eyes principle)

**The Essential Flow (PM creates → PO validates):**
```
*create-prd → *validate-prd → *create-architecture → *create-epic → *validate-epic → *story-draft → *validate-story → *dev-story → *code-review
   (PM)          (PO)              (Arch)              (PM)           (PO)           (SM)           (PO)            (Dev)         (QA)
```

**Role Separation:**
- **PM (Paula):** Creates PRD, Epic
- **PO (Victor):** Validates PRD, Epic, Story
- **SM (Sam):** Drafts stories

**Note:** `*create-prd` auto-scales based on project complexity - you don't choose between "quick" and "full" formats.

> Run workflows with: `n8n-bmad workflow run {skill-name}`

---

## Project Overview

n8n-BMAD is an AI-powered methodology framework for n8n workflow automation teams. It provides 15 specialized AI agent personas, reusable workflow patterns, and CLI tooling for project management. The framework integrates with Claude Code via MCP servers and auto-generated slash commands.

### Key Features (v2.0)

- **Scale-Adaptive Intelligence**: Automatically adjusts ceremony based on project complexity
- **Direct Skill Invocation**: Use `*action-name` syntax for direct agent+skill calls (bmad-method style)
- **Party Mode**: Multi-agent collaboration for complex decisions
- **Smart Help**: AI-powered contextual guidance (`*help` skill)
- **Handler Components**: Reusable patterns for validation, expressions, errors
- **Custom Agents**: Create specialized agents from base personas
- **LLM Context Builder**: Generate consolidated context for AI assistants
- **Node Discovery**: Discover custom nodes installed on your n8n instance for agent recommendations

### Agent + Skill Invocation (Primary Interface)

**This is the recommended way to interact with n8n-bmad agents.**

```bash
/n8n:agent *skill-name      # Load agent + execute specific skill
/n8n:agent                  # Load agent + show menu (discover skills)
```

#### Examples

```bash
# PM creates artifacts
/n8n:pm *create-prd         # Create PRD
/n8n:pm *create-epic        # Create epic

# PO validates artifacts (four-eyes)
/n8n:po *validate-prd       # Validate PRD
/n8n:po *validate-epic      # Validate epic
/n8n:po *validate-story     # Validate story

# SM drafts stories
/n8n:sm *story-draft        # Draft story with context review

# Development
/n8n:dev *dev-story         # Implement a story
/n8n:dev *new-workflow      # Start new workflow
/n8n:arch *create-architecture  # Design architecture
/n8n:qa *code-review        # Quality review
```

#### Discover Agent Skills

```bash
/n8n:pm                     # Show PM menu - see all PM skills
/n8n:po                     # Show PO menu - see all validation skills
/n8n:sm                     # Show SM menu - see all ceremony skills
```

#### Why Agent + Skill?

| Benefit | Description |
|---------|-------------|
| **Self-documenting** | `/n8n:po *validate-prd` tells you who and what |
| **Discoverable** | `/n8n:po` shows all available skills |
| **Context-aware** | Agent persona is loaded with the skill |
| **Scalable** | Unlimited skills per agent |

## Development Commands

```bash
npm install          # Install dependencies
npm start            # Run CLI
npm test             # Run Jest tests
npm test:watch       # Watch mode
npm run lint         # Run ESLint
npm run validate     # Validate workflows via CLI
```

### CLI Usage

```bash
# Initialization
n8n-bmad init                          # Initialize project (interactive)

# Agent Commands
n8n-bmad agent list                    # List all 15 agent personas
n8n-bmad agent load {agent-id}         # Show agent details
n8n-bmad agent create                  # Create custom agent (interactive)
n8n-bmad agent route "build webhook"   # Find best agent for task

# Workflow Commands
n8n-bmad workflow triggers             # Quick reference of all triggers
n8n-bmad workflow run {trigger}        # Run workflow interactively (e.g., PRD, DS)
n8n-bmad workflow list                 # List all available workflows
n8n-bmad workflow paths                # Show common workflow paths

# Party Mode (Multi-Agent)
n8n-bmad party list                    # List party modes
n8n-bmad party start architecture-review  # Start multi-agent session

# Context & Documentation
n8n-bmad context generate              # Generate project context
n8n-bmad context build                 # Build LLM context file

# Node Discovery
n8n-bmad nodes discover                # Fetch installed nodes from n8n instance
n8n-bmad nodes discover --force        # Force refresh cache
n8n-bmad nodes list                    # List all cached nodes
n8n-bmad nodes list --type custom      # List only custom nodes
n8n-bmad nodes search <query>          # Search installed nodes
n8n-bmad nodes status                  # Show cache status

# Templates & Validation
n8n-bmad template list                 # List templates by category
n8n-bmad template generate {name}      # Generate from template
n8n-bmad validate workflow {file}      # Validate n8n workflow JSON
n8n-bmad validate naming {dir}         # Check naming conventions
```

## Architecture

### Core Components

- **CLI** (`tools/cli/n8n-bmad-cli.js`) - Commander.js-based entry point with subcommands
- **Agent System** (`src/core/agents/*.agent.yaml`) - 15 YAML-defined AI personas with menus, prompts, and collaboration rules
- **Workflow System** (`src/workflows/`) - Multi-agent workflow definitions with step-by-step guidance
- **Workflow Loader** (`tools/cli/lib/workflow-loader.js`) - Parses workflow manifest and markdown files
- **Config Loader** (`tools/cli/lib/config-loader.js`) - YAML config with env var resolution (`${VAR}` syntax), 5-second cache TTL
- **Agent Loader** (`tools/cli/lib/agent-loader.js`) - Agent routing, expertise search, collaboration discovery
- **Command Generator** (`tools/cli/lib/command-generator.js`) - Generates Claude Code slash commands from agent YAMLs
- **Node Discovery** (`tools/cli/lib/node-discovery.js`) - Discovers custom nodes installed on n8n instance (24hr cache)

### Agent Alias Mapping

The command generator maps agent IDs to shorter aliases:
- `developer` → `dev`, `architect` → `arch`, `data-analyst` → `data`, `tech-writer` → `docs`
- Skills become `n8n:{alias}` (e.g., `/n8n:dev`, `/n8n:arch`)

### Configuration Flow

1. CLI loads `src/core/module.yaml` (or project's `.n8n-bmad/src/core/module.yaml`)
2. Config values support `${ENV_VAR}` resolution
3. Agent YAMLs are loaded from configured `agent_path`
4. MCP config is read from `.mcp.json` at project root

### Project Initialization Structure

When `n8n-bmad init` runs, it creates:
```
project/
├── .mcp.json                    # MCP server config (Claude Code)
├── .claude/commands/n8n/        # Generated slash commands
├── docs/                        # User-facing documents (at root)
│   ├── prd.md                  # PRD (single file)
│   ├── architecture.md         # Architecture (single file)
│   └── backlog/
│       ├── epics/              # Epic documents (6+ stories)
│       └── stories/            # User stories
└── .n8n-bmad/                   # Framework files (hidden)
    ├── src/core/agents/         # Copied agent YAMLs
    ├── src/core/module.yaml     # Project config
    └── .env                     # Secrets (N8N_API_KEY)
```

### Document Sharding

For large documents (>500 lines), convert single file to folder with index:

```
./docs/prd.md                    # Single file (small projects)
        ↓ shard when large
./docs/prd/                      # Folder (large projects)
├── index.md                     # Overview + table of contents
├── 01-problem.md
├── 02-requirements.md
└── 03-personas.md
```

Same pattern applies to `architecture.md` → `architecture/`.

## Key Patterns

### Agent YAML Structure

Each agent file contains:
- `agent` - Metadata (id, name, role, version)
- `identity` - Description, expertise, personality
- `responsibilities` - Core duties with processes
- `menu` - Interactive command sections with BMAD-style triggers
- `templates` - Associated markdown templates
- `collaborates_with` - Related agents
- `prompts` - Scenario-specific prompt templates

### Menu Command Format

```yaml
menu:
  - trigger: create-prd
    action: create-prd
    description: "Create PRD (auto-scales to project complexity)"
```

Triggers use the action name directly for clarity and discoverability.

### Agent Document Finalization Pattern

Agents that create documents (PO, PM, etc.) should have:
1. A **create** command to draft the document interactively
2. A **finalize** command to save the document to disk
3. A `finalize_*` prompt template with:
   - Save path convention (e.g., `./docs/requirements/{name}-prd.md`)
   - CLI alternative command
   - Required information checklist
   - Post-save instructions

### Workflow Pattern JSON

Patterns in `/patterns/` are valid n8n workflow JSON with:
- `nodes[]` - Node definitions with parameters and positions
- `connections` - Node connection graph
- `meta` - Usage instructions and category

### Naming Conventions

- Snake_case for files and IDs
- Workflow prefix: `wf_` (configurable)
- Credential prefix: `cred_` (configurable)
- Agent files: `{id}.agent.yaml`

### Story Naming Convention

**Epic-Scoped (6+ stories):**
- Format: `story-{epic}.{story}-{slug}.md`
- Example: `story-1.3-webhook-setup.md` (Epic 1, Story 3)

**Standalone (< 6 stories or Quick Flow):**
- Format: `{type}-{sequence}-{slug}.md`
- Types: `feat`, `bug`, `hotfix`, `chore`
- Examples: `feat-001-crm-sync.md`, `bug-002-timeout.md`

**Detection Logic:**
1. Check `./docs/backlog/epics/` for epic files
2. If epics exist → use `story-X.Y` format
3. If no epics → use `feat-xxx`, `bug-xxx`, etc.

**Story ID Quick Reference:**

| Context | Format | Example |
|---------|--------|---------|
| Epic 1, Story 1 | `story-1.1-{slug}` | `story-1.1-webhook-setup.md` |
| Epic 1, Story 2 | `story-1.2-{slug}` | `story-1.2-validation.md` |
| Epic 2, Story 1 | `story-2.1-{slug}` | `story-2.1-oauth-login.md` |
| Standalone feature | `feat-{nnn}-{slug}` | `feat-001-quick-export.md` |
| Bug fix | `bug-{nnn}-{slug}` | `bug-001-null-check.md` |
| Hotfix | `hotfix-{nnn}-{slug}` | `hotfix-001-urgent-patch.md` |
| Chore | `chore-{nnn}-{slug}` | `chore-001-refactor.md` |

**Key Rules:**
- Epic numbers and story numbers start at 1 (not 0)
- Standalone sequences are zero-padded to 3 digits
- Stories within an epic are numbered sequentially (1.1, 1.2, 1.3)

### PRD Method Choice

When creating a PRD (`/n8n:pm *create-prd`), you can choose your method:

| Method | Description | Best For |
|--------|-------------|----------|
| `incremental` | Guided questions, step-by-step | New projects, unclear scope |
| `yolo` | Dump all requirements at once | Clear vision, quick capture |

**Default:** `incremental`

**YOLO Mode:** Paste all project info → PM structures it → Asks only for truly missing info → Confirm and proceed.

## Epic-Based Development Workflow

### Document Structure
```
./docs/
├── prd.md                 # Requirements (single file or ./prd/ if sharded)
├── architecture.md        # Architecture (single file or ./architecture/ if sharded)
└── backlog/
    ├── epics/            # Epic documents (for 6+ stories)
    │   └── epic-{id}-{name}.md
    └── stories/          # User stories
        ├── story-1.1-{slug}.md   # Epic-scoped (if epics exist)
        ├── story-1.2-{slug}.md
        └── feat-001-{slug}.md    # Standalone (no epics)
```

### Workflow Flow
```
PM: PRD → Epic
         ↓
PO: Validate → Stories (backlog)
         ↓
Developer: Implement story, update progress
         ↓
SM: Track via standups, run retrospective
```

### Complete Skill Reference

#### PM (Paula) - The Planner

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:pm *create-prd` | Create PRD (auto-scales) |
| `/n8n:pm *finalize-prd` | Save PRD document |
| `/n8n:pm *edit-prd` | Edit existing PRD |
| `/n8n:pm *shard-prd` | Shard large PRD |
| `/n8n:pm *create-epic` | Create epic (6+ stories) |
| `/n8n:pm *edit-epic` | Edit existing epic |

#### PO (Victor) - The Value Guardian

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:po *validate-prd` | Validate PRD for business value |
| `/n8n:po *validate-epic` | Validate epic scope |
| `/n8n:po *validate-story` | Validate story (DoR) |
| `/n8n:po *create-story` | Quick create story |
| `/n8n:po *edit-story` | Edit existing story |
| `/n8n:po *finalize-backlog` | Save to backlog |
| `/n8n:po *view-backlog` | Display backlog |
| `/n8n:po *groom-backlog` | Refinement session |
| `/n8n:po *prioritize-backlog` | MoSCoW prioritization |

#### SM (Sam) - The Context Gatherer

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:sm *story-draft` | Draft story with context review |
| `/n8n:sm *standup` | Facilitate standup |
| `/n8n:sm *retrospective` | Milestone retrospective |
| `/n8n:sm *refinement` | Backlog refinement |
| `/n8n:sm *impediment-review` | Review blockers |
| `/n8n:sm *team-health` | Assess team health |
| `/n8n:sm *correct-course` | Handle mid-project changes |

#### Architect (Winston)

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:arch *create-architecture` | Design architecture |
| `/n8n:arch *validate-architecture` | Validate architecture |
| `/n8n:arch *save-architecture` | Save architecture |
| `/n8n:arch *shard-architecture` | Shard large architecture |
| `/n8n:arch *implementation-readiness` | Ready for dev check |

#### Developer (Nate)

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:dev *develop-story` | Developer-centric story implementation |
| `/n8n:dev *dev-story` | Implement a story (via Quick Flow) |
| `/n8n:dev *new-workflow` | Start new workflow |
| `/n8n:dev *review-qa` | Fix issues from QA code review |
| `/n8n:dev *update-progress` | Update story progress |

#### QA (Quinn)

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:qa *review` | Code review (developer workflow chain) |
| `/n8n:qa *code-review` | Quality review |
| `/n8n:qa *create-test-plan` | Create test plan |
| `/n8n:qa *report-bug` | Report bug |

#### Quick Flow (Barry)

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:quick-flow *dev-story` | Implement a story (auto-saves) |
| `/n8n:quick-flow *save-brief` | Save Quick Flow state |
| `/n8n:quick-flow *load-brief` | Resume Quick Flow |
| `/n8n:quick-flow *quick-fix` | Rapid bug fix |
| `/n8n:quick-flow *spike` | Technical exploration |

#### Other Agents

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:security *security-review` | Security audit |
| `/n8n:integration *integration-spec` | Integration spec |
| `/n8n:prompt-engineer *ai-agent` | AI workflow |
| `/n8n:devops *deploy-workflow` | Deploy to env |
| `/n8n:devops *rollback` | Rollback deployment |
| `/n8n:master *update-brief` | Update project brief |
| `/n8n:master *resume-context` | Resume from brief (checks quick-brief first) |

### Course Correction Workflow

When requirements or plans change mid-project:

```
/n8n:sm *correct-course → Routes to appropriate agent:
     ├── PRD change    → /n8n:pm *edit-prd
     ├── Epic change   → /n8n:pm *edit-epic
     └── Story change  → /n8n:po *edit-story
```

Each edit command:
1. Loads the existing document
2. Guides through the change
3. Updates change log
4. Notifies affected parties

### Document Lifecycle (PM Creates → PO Validates)

Each document type follows the four-eyes pattern:

```
PM Creates → PO Validates → Edit if needed
```

| Document | Created By | Validated By | Edit |
|----------|------------|--------------|------|
| PRD | PM (`*create-prd`) | **PO (`*validate-prd`)** | PM (`*edit-prd`) |
| Epic | **PM (`*create-epic`)** | PO (`*validate-epic`) | **PM (`*edit-epic`)** |
| Story | SM (`*story-draft`) | PO (`*validate-story`) | PO (`*edit-story`) |

**Role Separation:**
- **PM (Paula):** Creates all planning artifacts (PRD, Epic)
- **PO (Victor):** Validates all artifacts for business value
- **SM (Sam):** Drafts stories with context review

**Story Creation Options:**
- `*story-draft` (recommended): SM drafts after reviewing PRD/epic/stories → `*validate-story` for validation
- `*create-story` (quick): PO creates directly (skip context review) → `*validate-story` for validation

**Validation checks:**
- `*validate-prd` - PRD has all required sections (problem, goals, requirements, etc.)
- `*validate-epic` - Epic has scope, stories, success metrics
- `*validate-story` - Story meets Definition of Ready (AC, estimates, subtasks)

### Workflow System

The workflow system provides multi-agent orchestration through markdown workflow files.

**Running Workflows:**
```bash
n8n-bmad workflow run create-prd    # Run PRD workflow interactively
n8n-bmad workflow run dev-story -s  # Show Dev Story summary only
n8n-bmad workflow triggers          # Quick reference of all triggers
```

**Workflow Structure:**
```
src/workflows/
├── workflow-manifest.yaml    # Index of all workflows
├── quick-flow/               # Implementation commands
├── 1-requirements/           # PRD, epic, story creation
├── 2-planning/               # Architecture design
├── 3-development/            # Implementation workflows
├── 4-quality/                # Testing and security review
├── 5-release/                # Deploy and rollback
└── cross-cutting/            # Course correction
```

**Workflow File Format:**
```markdown
# Workflow Title

> **Agent:** Name (Role) 🎨
> **Skill:** `*skill-name`
> **Output:** What it produces

## Step 1: Step Name

**Agent:** Name (Role) 🎨

### Section
Content...

**🔀 If condition:** Route to Other Agent with `*skill-name`.
```

**Common Workflow Paths by Project Size:**

| Size | Path | Skills | Epics? |
|------|------|--------|--------|
| **Tiny** (1-3 stories) | Quick Flow | `*create-prd` → `*dev-story` → `*code-review` → `*deploy-workflow` | No |
| **Small** (3-5 stories) | Quick + Arch | `*create-prd` → `*create-architecture` → `*dev-story` → `*code-review` → `*deploy-workflow` | No |
| **Medium** (6-15 stories) | Standard | `*create-prd` → `*validate-prd` → `*create-architecture` → `*create-epic` → `*validate-epic` → `*story-draft` → `*validate-story` → `*dev-story` → `*code-review` → `*deploy-workflow` | **Yes** |
| **Large** (15+ stories) | With Multiple Epics | Same as Standard + `*security-review` | **Yes** |

**Developer-Centric Flow (Alternative to Quick Flow):**
```
*develop-story → *review → (*review-qa → *review)* → *deploy-workflow
```
Use `*develop-story` instead of `*dev-story` for direct developer control without Quick Flow orchestration.
- `*develop-story` - Nate implements
- `*review` - Quinn reviews
- `*review-qa` - Nate fixes issues if needed
- `*deploy-workflow` - Rex deploys after approval

**Visual Flow:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW PATHS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  QUICK FLOW (1-5 stories, solo work)                                        │
│  ┌────┐    ┌────┐    ┌────┐    ┌────┐                                       │
│  │PRD │───▶│ CA │───▶│ DS │───▶│ CR │───▶ Deploy                            │
│  └────┘    └────┘    └────┘    └────┘                                       │
│  Reqs      Arch      Story    Review                                        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STANDARD (6-15 stories, team work)                                         │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐   │
│  │PRD │─▶│ VP │─▶│ CA │─▶│ CE │─▶│ VE │─▶│ SD │─▶│ VS │─▶│ DS │─▶│ CR │─▶D│
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘   │
│  Paula   Victor          Paula  Victor  Sam    Victor                       │
│  (PM)    (PO)            (PM)   (PO)   (SM)    (PO)                         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FULL PROCESS (15+ stories, complex projects)                               │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐              │
│  │PRD│▶│VP │▶│CA │▶│CE │▶│VE │▶│SD │▶│VS │▶│DS │▶│CR │▶│DW │              │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘              │
│  Paula Victr       Paula Victr Sam  Victr                                   │
│  (PM)  (PO)        (PM)  (PO)  (SM) (PO)                                    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DEVELOPER-CENTRIC (Alternative to Quick Flow - direct control)             │
│  ┌────┐    ┌────┐    ┌────┐    ┌────┐                                       │
│  │ DV │───▶│ RV │───▶│ DW │    │ RQ │◀──┐                                   │
│  └────┘    └────┘    └────┘    └────┘   │                                   │
│  Nate      Quinn     Rex       Nate     │ (if needs changes)                │
│  (Dev)     (QA)      (Ops)     (Dev)    │                                   │
│              │                   │      │                                   │
│              └───────────────────┴──────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### When to Use Epics (*create-epic)

**Use Epics when:**
- 6+ stories that can be grouped by theme/feature
- Multiple related features in one project
- Need to track progress at a higher level
- Multiple team members working on different areas

**Skip Epics when:**
- Less than 6 stories
- All stories are for one feature
- Solo developer work

**Example Epic Structure:**
```
Epic: "User Authentication" (*create-epic)
├── Story: Login with email/password
├── Story: Password reset flow
├── Story: OAuth integration
└── Story: Session management
```

### Decision Tree: Which Path?

```
Start Here
    │
    ▼
How many stories?
    │
    ├── 1-5 stories ──────────────▶ QUICK FLOW (*create-prd → *create-architecture? → *dev-story → *code-review)
    │                                No validation steps, no epics
    │
    └── 6+ stories ───────────────▶ STANDARD (*create-prd → *validate-prd → *create-architecture → *create-epic → *validate-epic → *story-draft → *validate-story → *dev-story → *code-review)
                                     USE validation, USE epics
```

**⚠️ CRITICAL: Workflow Order**
```
*create-prd → *validate-prd → *create-architecture → [*create-epic → *validate-epic] → *story-draft → *validate-story → *dev-story → *code-review
    (PM)          (PO)              (Arch)               (PM)           (PO)              (SM)            (PO)           (Dev)         (QA)
```

**The Pattern: PM Creates → PO Validates**
- `*create-prd` (PM) → `*validate-prd` (PO validates)
- `*create-epic` (PM) → `*validate-epic` (PO validates) - if 6+ stories
- `*story-draft` (SM drafts) → `*validate-story` (PO validates)

**Key Rules:**
- Never start architecture without validated PRD
- Use `*create-epic` + `*validate-epic` if 6+ stories (epics)
- Use `*story-draft` to draft stories (SM reviews context) → `*validate-story` to validate
- Never jump directly from `*create-architecture` to implementation!

**Four-Eyes Principle Throughout:**
```
Paula creates  → Victor validates → Proceed
(PM)             (PO)
```

### Document Status Lifecycle

Each document type has a status field that tracks its lifecycle. Agents automatically update status as work progresses.

#### PRD / Architecture / Epic Status
```
📝 Draft → ✅ Approved (by PO validation)
```

| Status | Set By | When |
|--------|--------|------|
| `📝 Draft` | PM/Architect | Document created (`*finalize-prd`, `*save-architecture`, `*create-epic`) |
| `✅ Approved` | PO | Validation passed (`*validate-prd`, `*validate-architecture`, `*validate-epic`) |
| `⚠️ Needs Revision` | PO | Validation failed - needs work |

#### Story Status
```
📋 Backlog → ✅ Approved → 🔄 In Progress → 👀 Review → ✅ Done
```

| Status | Set By | When |
|--------|--------|------|
| `📋 Backlog` | SM | Story drafted (`*story-draft`) |
| `✅ Approved` | PO | Validated, meets DoR (`*validate-story`) |
| `🔄 In Progress` | Developer | Implementation started (`*dev-story`) |
| `👀 Review` | Developer | Implementation complete |
| `✅ Done` | QA | Code review approved (`*code-review`) |

Stories stay in `./docs/backlog/stories/` - status field tracks progress.

## MCP Integration

The `.mcp.json` configures the n8n-mcp server for Claude Code:
- Connects to n8n instance via `N8N_API_URL` and `N8N_API_KEY`
- Enables direct workflow manipulation from Claude Code
- Uses stdio mode for seamless integration

## Making Changes

When modifying this codebase:
1. Analyze impact across CLI commands, agent loaders, and config system
2. Maintain YAML schema compatibility in agent files
3. Update command generator if adding new agents or changing alias mappings
4. Run `npm test` and `npm run lint` before committing
5. Update this file if architectural changes are made

## New Features (v2.0)

### Scale-Adaptive Intelligence

Projects automatically get appropriate ceremony based on detected complexity.
**The PRD command auto-scales based on project complexity.**

**Complexity Thresholds (auto-detected):**
| Metric | Threshold | When Exceeded |
|--------|-----------|---------------|
| Stories | > 5 | Escalate to full process |
| Integrations | > 3 | Escalate to full process |
| Stakeholders | > 2 | Escalate to full process |
| Security/Compliance | Any | Escalate to full process |

**Scale Profiles:**
| Profile | Stories | Epics | Flow |
|---------|---------|-------|------|
| **Quick Flow** | 1-5 | No | `*create-prd` → `*create-architecture`? → `*dev-story` → `*code-review` → `*deploy-workflow` |
| **Standard** | 6-15 | **Yes** | `*create-prd` → `*validate-prd` → `*create-architecture` → `*create-epic` → `*validate-epic` → `*story-draft` → `*validate-story` → `*dev-story` → `*code-review` |
| **Enterprise** | 15+ | **Yes** | Same as Standard + `*security-review` |

**How it works:**
1. User describes project → Master routes to `*create-prd`
2. During requirements capture, complexity is analyzed
3. If thresholds exceeded → PRD auto-scales to comprehensive format
4. No manual choice needed - framework adapts automatically

### Party Mode

Multi-agent collaboration for complex decisions:

```bash
n8n-bmad party list                    # See available parties
n8n-bmad party start architecture-review  # Start AR party
```

Available parties:
| Party | Agents |
|-------|--------|
| Architecture Review | Architect, Security, Developer, DevOps |
| Story Refinement | PO, Developer, QA |
| Security Audit | Security, Architect, DevOps |
| Integration Design | Integration, Data, Developer, Security |
| AI Workflow Design | Prompt Engineer, Developer, Architect, QA |
| Post-Incident Review | DevOps, Developer, SM, Security |

See `src/core/teams/party-mode.yaml` for full configuration.

### Handler Components

Reusable building blocks in `src/core/handlers/`:

| Handler | Purpose |
|---------|---------|
| `n8n-validate` | Workflow validation rules |
| `n8n-expression` | Expression syntax & validation |
| `n8n-error` | Error handling patterns |
| `n8n-credential` | Credential management |
| `ai-node-config` | AI/LLM node configuration |
| `webhook-config` | Webhook setup & security |

### Custom Agents

Create specialized agents from base personas:

```bash
n8n-bmad agent create
# Select base: developer, architect, integration, etc.
# Define specialization, nodes, domains
```

Template: `templates/project/custom-agent.template.yaml`

### LLM Context Builder

Generate consolidated context for AI assistants:

```bash
n8n-bmad context build
# Creates .n8n-bmad/llms-context.txt
```

Includes: CLAUDE.md, project context, triggers, agents, handlers.

### Project Brief (Context Management)

Prevents context loss and hallucination during long sessions or when resuming work.

**Project Brief File:** `./docs/project-brief.md`

#### Auto-Updates (Phase Completion)

The project brief **automatically updates** on phase completions:

| Action | Skill | What Gets Updated |
|--------|-------|-------------------|
| PRD saved | `*finalize-prd` | Adds PRD phase summary |
| Architecture saved | `*save-architecture` | Adds architecture phase summary |
| Epic created | `*create-epic` | Adds epic to completed phases |
| Story completed | After `*code-review` | Updates current task/progress |
| Deployed | `*deploy-workflow` | Logs deployment milestone |

**Not tracked:** Validation status (document itself has this - check with `*view-backlog` if needed)

#### Manual Commands

| Skill | Action | When to Use |
|-------|--------|-------------|
| `*resume-context` | Resume Context | **Starting new session** - loads brief for context |
| `*view-brief` | View Brief | See current project state |
| `*update-brief` | Update Brief | Add key decisions or custom notes |

#### What Claude Needs to Not Hallucinate

The brief provides Claude with:
1. **What phases are done** (with summaries)
2. **Current phase and task** (where to continue)
3. **Key decisions** (affects future work)
4. **Document locations** (where to find details)

**Example Project Brief:**
```markdown
# Project Brief

## Overview
Project: Invoice Sync | Goal: Real-time sync | Scale: 8 stories

## Completed Phases

### PRD ✓
- Problem: Manual sync takes 2hrs/day
- Requirements: Real-time, error handling, retry

### Architecture ✓
- Pattern: Webhook → Queue → Process
- Integrations: Xero, Quickbooks, Redis

## Current Phase: Implementation
Working on: STORY-003 (retry logic)

## Key Decisions
1. Redis over RabbitMQ - simpler ops
2. Exponential backoff for retries

## Documents
| Doc | Path |
|-----|------|
| PRD | ./docs/prd.md |
| Architecture | ./docs/architecture.md |
```

**Best Practices:**
1. Brief auto-updates on phase completion - no manual action needed
2. Use `*resume-context` when starting a new session to reload context
3. Add key decisions with `*update-brief` when making architectural choices
4. Brief tracks phases, documents track their own status

Template: `templates/project/project-brief.template.md`

### Quick Flow Persistence (Quick Brief)

For Quick Flow projects (1-5 stories, solo work), a lightweight **Quick Brief** system provides session persistence without the overhead of full project documentation.

**Quick Brief File:** `./docs/quick-brief.md`

#### Quick Flow Agent Roles

```
┌─────────────────────────────────────────────────────────────┐
│                    QUICK FLOW AGENTS                        │
├─────────────────────────────────────────────────────────────┤
│   Barry (⚡ Quick Flow) - ORCHESTRATOR                      │
│   ├── Owns: *dev-story workflow, persistence (quick-brief.md)│
│   ├── Does: Loads context, tracks progress, coordinates     │
│   └── Delegates: Implementation → Nate, Review → Quinn      │
│                                                             │
│   Nate (💻 Developer) - IMPLEMENTER                         │
│   └── Called by Barry during *dev-story subtasks            │
│                                                             │
│   Quinn (🧪 QA) - REVIEWER                                  │
│   └── Called by Barry after *dev-story complete (*code-review)│
└─────────────────────────────────────────────────────────────┘
```

#### Quick Brief Commands

| Agent + Skill | Description |
|---------------|-------------|
| `/n8n:quick-flow *save-brief` | Save Quick Flow state to quick-brief.md |
| `/n8n:quick-flow *load-brief` | Resume Quick Flow from quick-brief.md |
| `/n8n:quick-flow *dev-story` | Implement story (auto-saves after each subtask) |
| `/n8n:qa *code-review` | Code review (saves verdict to quick-brief.md) |

#### Auto-Save Behavior

Quick Brief **auto-saves** during `*dev-story` workflow:

| Event | What Gets Saved |
|-------|-----------------|
| Story started | Status → In Progress |
| Each subtask complete | Subtask checkbox, activity log |
| All subtasks done | Status → Review |
| `*code-review` completed | Review verdict, final status |

#### Quick Brief vs Project Brief

| Aspect | Quick Brief | Project Brief |
|--------|-------------|---------------|
| **File** | `./docs/quick-brief.md` | `./docs/project-brief.md` |
| **For** | Quick Flow (1-5 stories) | Full Process (6+ stories) |
| **Stories** | Inline in single file | Separate files in backlog |
| **Resume** | `*load-brief` | `*resume-context` |
| **Save** | `*save-brief` (auto-saves during `*dev-story`) | `*update-brief` (auto-saves on phase completion) |

#### Quick Brief Structure

```markdown
# Quick Brief

## Project
**Goal:** One-sentence description
**Context:** 2-3 sentences

## Stories
### Story 1: {title}
| **Status** | In Progress |
**Subtasks:**
- [x] Configure webhook ✓
- [ ] Add validation ← Current

## Activity Log
| Time | Agent | Action |
|------|-------|--------|
| 10:00 | Barry | Started DS |
| 10:15 | Nate | Configured webhook |
| 10:30 | Barry | Saved checkpoint |

## Review Status
| **Verdict** | Pending |

## Next Session
**Continue From:** Add validation
```

#### Resume Workflow

```
*resume-context checks:
├── ./docs/quick-brief.md exists? → Load Quick Flow, route to Barry
└── ./docs/project-brief.md exists? → Load Full Process
```

**Best Practices:**
1. `*dev-story` auto-saves - no manual save needed during implementation
2. Use `*save-brief` for explicit checkpoint before complex operations
3. Use `*load-brief` at session start to restore context
4. Activity log tracks who did what (useful when resuming)

Template: `templates/quick-flow/quick-brief.template.md`

## Module System (Planned)

Future modules in `src/modules/module-registry.yaml`:
- **ai-workflows**: AI/LLM patterns
- **enterprise-integration**: Saga, circuit breaker patterns
- **data-pipeline**: ETL patterns
- **testing**: Test automation patterns
