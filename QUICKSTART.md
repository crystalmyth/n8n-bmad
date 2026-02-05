# n8n-BMAD Quick Start

Get your first workflow designed in 5 minutes.

## Step 1: Install & Initialize

```bash
npm install -g n8n-bmad
n8n-bmad init
```

## Step 2: Start Your Project

```bash
/n8n:pm *create-prd
```

That's it. The PRD command auto-scales based on your project:
- **Simple projects** (1-5 stories) → Lean PRD format
- **Complex projects** (6+ stories) → Comprehensive PRD format

You don't choose - the framework adapts.

## Step 3: Follow the Prompts

The workflow guides you step-by-step. Answer the questions, and you'll have a PRD.

---

## Agent + Skill Pattern (Primary Interface)

**Format:** `/n8n:agent *skill`

| Agent + Skill | What It Does |
|---------------|--------------|
| `/n8n:pm *create-prd` | Create PRD (start here) |
| `/n8n:po *validate-prd` | Validate PRD |
| `/n8n:arch *create-architecture` | Design architecture |
| `/n8n:sm *story-draft` | Draft story with context |
| `/n8n:po *validate-story` | Validate story |
| `/n8n:dev *dev-story` | Implement a story |
| `/n8n:qa *code-review` | Quality review |

**The Flow (PM creates → PO validates):**
```
/n8n:pm *create-prd → /n8n:po *validate-prd → /n8n:arch *create-architecture
/n8n:sm *story-draft → /n8n:po *validate-story → /n8n:dev *dev-story
```

---

## Discover Agent Skills

Run the agent without a skill to see all available skills:

```bash
/n8n:pm     # Show all PM skills (create PRD, epic)
/n8n:po     # Show all PO skills (validate everything)
/n8n:sm     # Show all SM skills (draft stories, ceremonies)
/n8n:dev    # Show all Developer skills
/n8n:arch   # Show all Architect skills
```

---

## CLI Commands

```bash
# See all triggers and their agent+skill equivalents
n8n-bmad workflow triggers

# Find the right agent for a task
n8n-bmad agent route "build webhook for Stripe"

# List all agents
n8n-bmad agent list

# Get help
n8n-bmad --help
```

---

## Need More?

- **Full documentation:** See [CLAUDE.md](./CLAUDE.md)
- **All triggers:** Run `n8n-bmad workflow triggers`
- **Create custom agents:** Run `n8n-bmad agent create`
