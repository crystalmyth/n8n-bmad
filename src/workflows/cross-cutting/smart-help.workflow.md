# Smart Help Workflow [HP]

> **Agent:** Atlas (n8n-BMAD Master) 🎯
> **Trigger:** `HP` or natural language: "help", "where do I start", "what's next"
> **Output:** Contextual guidance based on your current situation

## Overview

Smart Help provides AI-powered contextual guidance that understands:
- Where you are in the project lifecycle
- What you're trying to accomplish
- Which workflows and agents can help

Unlike static help, Smart Help analyzes your context and provides personalized recommendations.

---

## Step 1: Context Analysis

**Agent:** Atlas (n8n-Master) 🎯

### Analyze Current State

Before providing help, I'll assess:

1. **Project State**
   - Is there an existing PRD? → You're past requirements phase
   - Are there stories in backlog? → You can start implementation
   - Are there validated stories? → Focus on implementation
   - Are there completed workflows? → Ready for review/deploy

2. **Recent Activity**
   - What was the last workflow run?
   - What documents exist?
   - What agents have been used?

3. **User Intent**
   - Are you starting fresh?
   - Are you stuck on something?
   - Are you looking for next steps?

---

## Step 2: Intent Routing

### Common Help Patterns

**🆕 "Where do I start?" / "I have an idea"**
→ Route based on complexity:
- Simple idea → `QS` Quick Spec
- Complex product → `CP` Create PRD with PO
- Need research first → `BP` Brainstorm with BA

**📍 "What should I do next?"**
→ Analyze state and recommend:
- No PRD → Start with requirements (CP)
- PRD exists, no architecture → Create architecture (CA)
- Architecture exists, no stories → Create stories (CS)
- Stories exist, not validated → Validate stories (VS)
- Ready stories → Quick Flow (QS) or Dev Story (DS)
- In progress → Dev Story (DS)
- Implementation done → Code Review (CR)
- Review passed → Deploy (DW)

**🔧 "I'm stuck on..."**
→ Route to specialist:
- Expression issue → Developer (Nate) EH
- Test failing → QA (Quinn) DB
- Integration issue → Integration (Ivy) TE
- Security concern → Security (Sierra) SR
- Performance issue → Architect (Winston) RA

**❓ "How do I..."**
→ Provide workflow guidance:
- ...create a workflow? → NW or QS → DS
- ...handle errors? → Architect (Winston) for patterns
- ...integrate with X? → Integration (Ivy) IS
- ...deploy? → DevOps (Rex) DW
- ...write tests? → QA (Quinn) TP

---

## Step 3: Personalized Response

### Response Format

```markdown
## 🎯 Smart Help

### Your Current State
{analysis of where you are}

### Recommended Next Step
**{recommended_workflow}** - {description}

**Why this step:** {reasoning}

### Quick Command
`{trigger}` - {brief_description}

### Alternative Paths
- {alternative_1}
- {alternative_2}

### Need Something Else?
- `LA` - List all agents
- `LT` - List templates
- `LP` - List patterns
```

---

## Help Topics Reference

### Getting Started
| Question | Recommendation |
|----------|----------------|
| "I have an idea" | Start with `BP` (Brainstorm) or `QS` (Quick Spec) |
| "New project" | Run `n8n-bmad init` then `CP` (Create PRD) |
| "Small fix needed" | Use Quick Flow: `QS` → `DS` → `CR` |
| "Need to learn" | `LA` (List Agents) to see who can help |

### During Development
| Question | Recommendation |
|----------|----------------|
| "Stuck on expression" | Developer: `EH` (Expression Help) |
| "Need to debug" | Developer: `DB` (Debug Mode) |
| "How to test" | QA: `TP` (Test Plan) |
| "Integration failing" | Integration: `TE` (Test Endpoint) |

### Project Management
| Question | Recommendation |
|----------|----------------|
| "Create an epic" | PM: `CE` (Create Epic) |
| "What's the status" | PO: `VB` (View Backlog) |
| "Team blocked" | SM: `IR` (Impediment Review) |
| "Need to change plans" | `CC` (Course Correction) |

### Quality & Release
| Question | Recommendation |
|----------|----------------|
| "Ready to deploy?" | Run `GN` (Go/No-Go) first |
| "Security check" | Security: `SR` (Security Review) |
| "How to rollback" | DevOps: `RB` (Rollback) |
| "Document workflow" | Tech Writer: `WD` (Write Docs) |

---

## Decision Trees

### "I want to build something"
```
How complex is it?
├── Very simple (< 1 hour)
│   └── Just build it, no process needed
├── Simple (< 1 day, 1-3 stories)
│   └── Quick Flow: QS → DS → CR → DW
├── Medium (1-2 weeks, 5-15 stories)
│   └── Standard: CP → CA → CS → VS → DS → CR → DW
└── Complex (> 2 weeks, 15+ stories)
    └── Full: CP → CE → CS → VS → CA → IR → DS → CR → SR → DW
```

### "Something went wrong"
```
What kind of problem?
├── Workflow not working
│   ├── Expression error → Developer EH
│   ├── Node failing → Developer DB
│   └── Data wrong → Data Analyst VT
├── Integration broken
│   ├── API error → Integration TE
│   ├── Auth issue → Security AU
│   └── Timeout → Architect RA
├── Production incident
│   └── DevOps IC → IT → MP
└── Requirements changed
    └── CC (Course Correction)
```

---

## Smart Help Prompts

### Initial Greeting
```
👋 I'm Atlas, your n8n-BMAD guide.

I can help you:
• Start a new project or workflow
• Find the right agent for your task
• Navigate the development process
• Get unstuck when you hit problems

**Tell me:** What are you working on, or what do you need help with?
```

### Context-Aware Response Template
```
Based on {context_summary}, here's my recommendation:

**Next Step:** {workflow_name} [{trigger}]
{workflow_description}

**Why:** {reasoning_based_on_context}

**Command:** `{trigger}` or describe your task to get started.

---
💡 Other options: {alternatives}
📋 See all: `LA` (agents) | `LT` (templates) | `LP` (patterns)
```

---

## Integration with n8n-Master Agent

The n8n-Master agent should invoke Smart Help when:
1. User asks a help-related question
2. User seems stuck or confused
3. User asks "what's next?" or similar
4. At the start of a new session

Smart Help enhances the master agent's routing by:
- Providing context-aware recommendations
- Explaining why certain paths are suggested
- Offering alternatives based on project state
