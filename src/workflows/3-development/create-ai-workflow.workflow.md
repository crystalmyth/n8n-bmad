# Create AI Workflow [AA]

> **Agent:** Petra (Prompt Engineer) 🧠 → Nate (Developer) 💻
> **Trigger:** `AA` or `ai-agent` or `create-ai-workflow`
> **Output:** AI-powered n8n workflow with optimized prompts

---

## Overview

Build an AI-powered workflow using n8n's AI nodes. This workflow guides you through prompt design, agent configuration, and integration with your workflow.

---

## Step 1: AI Use Case Definition

**Agent:** Petra (Prompt Engineer) 🧠

### What type of AI task?

- [ ] **Classification** - Categorize inputs into predefined categories
- [ ] **Extraction** - Pull structured data from unstructured text
- [ ] **Generation** - Create content (text, summaries, responses)
- [ ] **Conversation** - Multi-turn chat/dialogue
- [ ] **Agent** - Autonomous task execution with tools
- [ ] **RAG** - Answer questions from knowledge base

### Use Case Details

| Question | Answer |
|----------|--------|
| What should the AI do? | {task_description} |
| What input does it receive? | {input_type} |
| What output is expected? | {output_format} |
| What's the quality bar? | {accuracy_requirements} |

---

## Step 2: Model Selection

**Agent:** Petra (Prompt Engineer) 🧠

### Model Comparison

| Model | Best For | Cost | Speed |
|-------|----------|------|-------|
| GPT-4o | Complex reasoning, nuanced output | $$$ | Medium |
| GPT-4o-mini | Good balance, most tasks | $$ | Fast |
| GPT-3.5-turbo | Simple tasks, high volume | $ | Very Fast |
| Claude 3.5 Sonnet | Long context, analysis | $$ | Medium |
| Claude 3 Haiku | Fast, cheap, simple tasks | $ | Very Fast |

### Selection Criteria

| Factor | Requirement | Recommendation |
|--------|-------------|----------------|
| Accuracy needed | {High/Medium/Low} | {model} |
| Volume expected | {requests/day} | {model} |
| Budget constraint | {budget} | {model} |
| Latency requirement | {max_ms} | {model} |

**Selected Model:** {model_name}

---

## Step 3: Prompt Design

**Agent:** Petra (Prompt Engineer) 🧠

### System Prompt Structure

```markdown
## Role
You are {specific_role_with_expertise}.

## Task
Your job is to {primary_task_description}.

## Guidelines
- {guideline_1}
- {guideline_2}
- {guideline_3}

## Output Format
{format_instructions}

## Constraints
- {constraint_1}
- {constraint_2}

## Examples (if few-shot)
{examples}
```

### Design by Task Type

#### For Classification:
```
You are a classifier that categorizes {input_type} into these categories:
- {category_1}: {description}
- {category_2}: {description}

Respond with ONLY the category name, nothing else.
```

#### For Extraction:
```
Extract the following fields from the provided text:
- {field_1}: {description} (type: {type})
- {field_2}: {description} (type: {type})

Return as JSON. Use null for missing fields.
```

#### For AI Agent:
```
You are {persona} who helps with {domain}.

You have access to these tools:
{tool_descriptions}

When using tools, think step by step:
1. Understand what the user needs
2. Determine which tool(s) can help
3. Use tools to gather information
4. Provide a complete answer

Always be {tone_guidelines}.
```

---

## Step 4: Few-Shot Examples (if needed)

**Agent:** Petra (Prompt Engineer) 🧠

### When to Use Few-Shot

- [ ] Output format is specific
- [ ] Task requires particular style
- [ ] Edge cases need guidance
- [ ] Zero-shot accuracy is insufficient

### Example Template

```
Example 1:
Input: {example_input_1}
Output: {example_output_1}

Example 2:
Input: {example_input_2}
Output: {example_output_2}

Example 3 (edge case):
Input: {edge_case_input}
Output: {edge_case_output}
```

### Example Selection Criteria

- [ ] Representative of common cases
- [ ] Includes at least one edge case
- [ ] Shows exact output format
- [ ] Diverse inputs covered

---

## Step 5: n8n Node Configuration

**Agent:** Nate (Developer) 💻

### Node Selection

| Use Case | n8n Node | Configuration |
|----------|----------|---------------|
| Simple prompt→response | Basic LLM Chain | System + User message |
| With conversation memory | AI Agent | Memory enabled |
| Autonomous with tools | AI Agent | Tools connected |
| Structured extraction | Information Extractor | Schema defined |
| Classification | Text Classifier | Categories defined |
| Summarization | Summarization Chain | Type + length |

### AI Agent Node Setup

```yaml
Node: AI Agent
Configuration:
  System Message: |
    {system_prompt_from_step_3}

  Options:
    Max Iterations: {3-10}
    Return Intermediate Steps: {true for debugging}

  Connected Tools:
    - {tool_1_node}
    - {tool_2_node}

  Memory (optional):
    Type: {Buffer / Window / Summary}
    Session ID: {{ $json.sessionId }}
```

### Tool Configuration

**For each tool the agent can use:**

```yaml
Tool Node: {tool_name}
Description: |
  {what_tool_does}

  Use this tool when:
  - {condition_1}
  - {condition_2}

  Do NOT use when:
  - {anti_condition}
```

---

## Step 6: Error Handling for AI

**Agent:** Nate (Developer) 💻

### AI-Specific Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Rate limit (429) | Too many requests | Exponential backoff retry |
| Timeout | Long response | Increase timeout, simplify prompt |
| Invalid response | Model confusion | Add output validation, retry |
| Token limit | Input too long | Truncate or chunk input |
| Hallucination | Model makes up facts | Add grounding, validation |

### Error Handling Pattern

```
[AI Node] → [Validate Output] → [Success Path]
     ↓              ↓
[Error Trigger] [Retry/Fallback]
```

---

## Step 7: Testing & Evaluation

**Agent:** Petra (Prompt Engineer) 🧠

### Test Dataset

| # | Input | Expected Output | Category |
|---|-------|-----------------|----------|
| 1 | {input} | {expected} | Happy path |
| 2 | {input} | {expected} | Edge case |
| 3 | {input} | {expected} | Error case |

### Evaluation Criteria

| Criterion | Weight | Target |
|-----------|--------|--------|
| Accuracy | 40% | > {X}% |
| Format compliance | 20% | 100% |
| Latency | 15% | < {X}ms |
| Cost per request | 15% | < ${X} |
| Hallucination rate | 10% | < {X}% |

### Run Evaluation

**🔀 Continue with:** `EP` (Evaluate Prompt) for formal testing.

---

## Step 8: Optimization

**Agent:** Petra (Prompt Engineer) 🧠

### If accuracy is low:
- [ ] Add more few-shot examples
- [ ] Be more specific in instructions
- [ ] Upgrade to better model
- [ ] Add chain-of-thought reasoning

### If cost is high:
- [ ] Reduce prompt length
- [ ] Use smaller model for simple cases
- [ ] Cache common responses
- [ ] Batch similar requests

### If latency is high:
- [ ] Use faster model (Haiku, GPT-3.5)
- [ ] Reduce max tokens
- [ ] Stream response
- [ ] Parallelize independent calls

---

## Step 9: Documentation

**Agent:** Petra (Prompt Engineer) 🧠 → Tara (Tech Writer) 📝

### AI Component Documentation

```markdown
## AI Component: {name}

### Purpose
{what_it_does}

### Model
- **Provider:** {OpenAI / Anthropic / etc}
- **Model:** {model_name}
- **Temperature:** {value}
- **Max Tokens:** {value}

### System Prompt
```
{full_system_prompt}
```

### Input Schema
{input_description}

### Output Schema
{output_description}

### Cost Estimate
- Per request: ~${cost}
- Monthly (estimated volume): ~${monthly}

### Limitations
- {limitation_1}
- {limitation_2}

### Prompt Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | {date} | Initial prompt |
```

---

## Step 10: Integration

**Agent:** Nate (Developer) 💻

### Connect to Workflow

```
[Trigger] → [Prepare Input] → [AI Node] → [Validate Output] → [Use Result]
```

**🔀 Continue with:** Standard workflow development via `DS` or `NW`

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Complex tool design | Ivy (Integration) | `IS` |
| Data transformation for AI | Dana (Data) | `DT` |
| Security concerns (PII) | Sierra (Security) | `SR` |
| Architecture review | Winston (Architect) | `CA` |
| Testing strategy | Quinn (QA) | `TP` |

---

## Quick Reference

**Inputs:**
- AI use case description
- Input/output requirements

**Outputs:**
- Designed prompt
- Configured AI nodes
- Test cases

**Duration:** 30-60 minutes

**Key Commands:**
- `SP` - System prompt design
- `FS` - Few-shot examples
- `EP` - Evaluate prompt
- `OP` - Optimize prompt
