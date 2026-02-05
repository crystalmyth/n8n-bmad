# AI Node Configuration Handler

> **Purpose:** Configure AI/LLM nodes in n8n workflows
> **Used by:** Prompt Engineer, Developer agents
> **Nodes:** OpenAI, Anthropic, AI Agent, LangChain nodes

## AI Node Types in n8n

### Chat Models
```yaml
nodes:
  - OpenAI Chat Model
  - Anthropic Chat Model (Claude)
  - Azure OpenAI Chat Model
  - Google Gemini Chat Model
  - Ollama Chat Model (local)

common_settings:
  model: model identifier
  temperature: 0.0 - 2.0
  max_tokens: response length limit
  top_p: nucleus sampling
```

### AI Agents
```yaml
nodes:
  - AI Agent (conversational)
  - Tools Agent
  - ReAct Agent

components:
  - Chat model (required)
  - Memory (optional)
  - Tools (optional)
```

### Embeddings
```yaml
nodes:
  - OpenAI Embeddings
  - Cohere Embeddings
  - Hugging Face Embeddings

use_cases:
  - Semantic search
  - Document similarity
  - RAG systems
```

### Vector Stores
```yaml
nodes:
  - Pinecone
  - Qdrant
  - Supabase Vector Store
  - In-Memory Vector Store

components:
  - Embeddings model (required)
  - Vector store connection
```

## Configuration Patterns

### Basic Chat Completion
```yaml
node: OpenAI Chat Model
config:
  model: "gpt-4o"
  temperature: 0.7
  maxTokens: 1000

prompt_template: |
  You are a helpful assistant.

  User: {{ $json.userMessage }}

best_for:
  - Simple Q&A
  - Content generation
  - Text transformation
```

### Structured Output
```yaml
node: OpenAI Chat Model
config:
  model: "gpt-4o"
  temperature: 0.3  # Lower for consistency
  responseFormat: "json_object"

prompt_template: |
  Extract the following information and return as JSON:
  - name: string
  - email: string
  - intent: "question" | "complaint" | "feedback"

  Text: {{ $json.text }}

best_for:
  - Data extraction
  - Classification
  - Parsing unstructured data
```

### AI Agent with Tools
```yaml
node: AI Agent
config:
  agentType: "toolsAgent"
  maxIterations: 10

tools:
  - HTTP Request Tool
  - Code Tool
  - Wikipedia Tool
  - Custom n8n Workflow

system_message: |
  You are an assistant that can search for information and perform actions.
  Always explain your reasoning before using tools.

best_for:
  - Complex multi-step tasks
  - Information retrieval
  - Automated research
```

### RAG Pattern
```yaml
pattern: Retrieval Augmented Generation
components:
  1. Embeddings Node:
     - Convert query to vector

  2. Vector Store:
     - Retrieve relevant documents
     - Top K: 3-5 documents

  3. Chat Model:
     - Use retrieved context
     - Generate grounded response

prompt_template: |
  Use the following context to answer the question.
  If you don't know, say "I don't have that information."

  Context:
  {{ $json.retrievedDocs }}

  Question: {{ $json.question }}
```

## Prompt Engineering Guidelines

### System Messages
```yaml
structure:
  1. Role definition
  2. Capabilities and constraints
  3. Output format specification
  4. Examples if needed

example: |
  You are an n8n workflow expert.

  Capabilities:
  - Explain workflow concepts
  - Suggest node configurations
  - Debug expression errors

  Constraints:
  - Only answer n8n-related questions
  - Ask for clarification if unclear

  Output Format:
  - Use markdown for responses
  - Include code blocks for expressions
```

### Few-Shot Examples
```yaml
when_to_use:
  - Consistent output format needed
  - Complex classification
  - Domain-specific terminology

template: |
  Task: Classify customer feedback

  Example 1:
  Input: "The product arrived broken"
  Output: {"category": "complaint", "urgency": "high"}

  Example 2:
  Input: "Great service, thank you!"
  Output: {"category": "praise", "urgency": "low"}

  Now classify:
  Input: {{ $json.feedback }}
```

### Chain of Thought
```yaml
when_to_use:
  - Complex reasoning
  - Multi-step problems
  - When explanation is valuable

template: |
  Think through this step by step:

  1. First, identify the main issue
  2. Then, consider possible solutions
  3. Finally, recommend the best approach

  Problem: {{ $json.problem }}
```

## Token & Cost Management

### Token Estimation
```javascript
// Rough estimate: 1 token ≈ 4 characters
estimatedTokens = Math.ceil(text.length / 4);

// More accurate for English
estimatedTokens = text.split(/\s+/).length * 1.3;
```

### Cost Optimization
```yaml
strategies:
  - use_cheaper_models_for_simple_tasks:
      simple: "gpt-4o-mini"
      complex: "gpt-4o"

  - batch_similar_requests:
      combine: multiple items into single prompt
      parse: responses back to individual items

  - cache_common_responses:
      use: n8n caching or external cache
      key: hash of prompt

  - limit_output_tokens:
      set: maxTokens appropriate to task
      avoid: open-ended generation
```

### Rate Limit Handling
```yaml
pattern: exponential-backoff
implementation:
  - Catch 429 errors
  - Wait: 2^attempt seconds
  - Retry up to 3 times
  - Log and alert on persistent failure

headers_to_check:
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
  - Retry-After
```

## Error Handling for AI Nodes

### Common Errors
```yaml
errors:
  - code: "context_length_exceeded"
    cause: "Prompt too long for model"
    fix: "Truncate input or use summarization"

  - code: "rate_limit_exceeded"
    cause: "Too many requests"
    fix: "Implement backoff and retry"

  - code: "invalid_api_key"
    cause: "Credential issue"
    fix: "Verify credential in n8n"

  - code: "content_filter"
    cause: "Content policy violation"
    fix: "Review and adjust prompt content"
```

### Response Validation
```javascript
// Validate JSON response
try {
  const parsed = JSON.parse($json.response);
  if (!parsed.required_field) {
    throw new Error("Missing required field");
  }
  return parsed;
} catch (e) {
  // Retry or handle gracefully
  return { error: true, raw: $json.response };
}
```

## Handler Usage

When configuring AI nodes:
1. Determine the right node type for the task
2. Select appropriate model (cost vs capability)
3. Design prompt with clear structure
4. Set temperature based on task (creative vs deterministic)
5. Configure token limits
6. Add error handling
7. Consider caching for repeated prompts
