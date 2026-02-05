/**
 * Workflow loader for n8n-BMAD CLI
 * Loads and parses workflow definitions from markdown and YAML files
 *
 * @module lib/workflow-loader
 * @description Handles workflow manifest parsing and workflow file loading
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

// Cache for loaded workflows
let manifestCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Get the workflows directory path
 * @returns {string} Path to workflows directory
 */
function getWorkflowsPath() {
  // Check for project-local workflows first
  const localPath = path.join(process.cwd(), '.n8n-bmad', 'src', 'workflows');
  const corePath = path.join(__dirname, '..', '..', '..', 'src', 'workflows');

  try {
    require('fs').accessSync(localPath);
    return localPath;
  } catch {
    return corePath;
  }
}

/**
 * Load the workflow manifest
 * @returns {Promise<Object>} Parsed manifest object
 */
async function loadManifest() {
  const now = Date.now();
  if (manifestCache && (now - cacheTimestamp) < CACHE_TTL) {
    return manifestCache;
  }

  const manifestPath = path.join(getWorkflowsPath(), 'workflow-manifest.yaml');

  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    manifestCache = yaml.load(content);
    cacheTimestamp = now;
    return manifestCache;
  } catch (error) {
    throw new Error(`Failed to load workflow manifest: ${error.message}`);
  }
}

/**
 * Build a trigger-to-workflow mapping from manifest
 * @returns {Promise<Map>} Map of trigger codes to workflow definitions
 */
async function buildTriggerMap() {
  const manifest = await loadManifest();
  const triggerMap = new Map();

  if (!manifest.workflows) {
    return triggerMap;
  }

  // Iterate through all workflow categories
  for (const [category, workflows] of Object.entries(manifest.workflows)) {
    if (!Array.isArray(workflows)) continue;

    for (const workflow of workflows) {
      if (workflow.trigger) {
        triggerMap.set(workflow.trigger.toUpperCase(), {
          ...workflow,
          category,
        });
      }
    }
  }

  return triggerMap;
}

/**
 * Find a workflow by trigger code
 * @param {string} trigger - Trigger code (e.g., 'QS', 'DS', 'CR')
 * @returns {Promise<Object|null>} Workflow definition or null
 */
async function findWorkflowByTrigger(trigger) {
  const triggerMap = await buildTriggerMap();
  return triggerMap.get(trigger.toUpperCase()) || null;
}

/**
 * Load a workflow markdown file
 * @param {string} filePath - Relative path to workflow file
 * @returns {Promise<Object>} Parsed workflow object
 */
async function loadWorkflowFile(filePath) {
  const fullPath = path.join(getWorkflowsPath(), filePath);

  try {
    const content = await fs.readFile(fullPath, 'utf8');
    return parseWorkflowMarkdown(content);
  } catch (error) {
    throw new Error(`Failed to load workflow file ${filePath}: ${error.message}`);
  }
}

/**
 * Parse workflow markdown into structured object
 * @param {string} content - Markdown content
 * @returns {Object} Parsed workflow structure
 */
function parseWorkflowMarkdown(content) {
  const workflow = {
    title: '',
    trigger: '',
    agents: [],
    overview: '',
    steps: [],
    decisionPoints: [],
    quickReference: {},
    raw: content,
  };

  const lines = content.split('\n');
  let currentSection = null;
  let currentStep = null;
  let sectionContent = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentStep) {
        currentStep.content.push(line);
      }
      continue;
    }

    if (inCodeBlock) {
      if (currentStep) {
        currentStep.content.push(line);
      }
      continue;
    }

    // Parse title
    if (line.startsWith('# ') && !workflow.title) {
      const match = line.match(/# (.+?) \[(\w+)\]/);
      if (match) {
        workflow.title = match[1].trim();
        workflow.trigger = match[2];
      } else {
        workflow.title = line.substring(2).trim();
      }
      continue;
    }

    // Parse agent info from blockquote
    if (line.startsWith('> **Agent:**')) {
      const agentMatch = line.match(/\*\*Agent:\*\* (.+)/);
      if (agentMatch) {
        workflow.agents = parseAgentList(agentMatch[1]);
      }
      continue;
    }

    // Parse trigger from blockquote
    if (line.startsWith('> **Trigger:**')) {
      const triggerMatch = line.match(/`(\w+)`/);
      if (triggerMatch && !workflow.trigger) {
        workflow.trigger = triggerMatch[1];
      }
      continue;
    }

    // Parse step headers (## Step N:)
    const stepMatch = line.match(/^## Step (\d+): (.+)/);
    if (stepMatch) {
      if (currentStep) {
        currentStep.content = sectionContent.join('\n');
        workflow.steps.push(currentStep);
      }
      currentStep = {
        number: parseInt(stepMatch[1]),
        title: stepMatch[2].trim(),
        agent: null,
        content: [],
      };
      sectionContent = [];
      continue;
    }

    // Parse route headers (## Route X:)
    const routeMatch = line.match(/^## Route ([A-Z]): (.+)/);
    if (routeMatch) {
      if (currentStep) {
        currentStep.content = sectionContent.join('\n');
        workflow.steps.push(currentStep);
      }
      currentStep = {
        number: routeMatch[1],
        title: routeMatch[2].trim(),
        isRoute: true,
        agent: null,
        content: [],
      };
      sectionContent = [];
      continue;
    }

    // Parse section headers (## Title)
    const sectionMatch = line.match(/^## (.+)/);
    if (sectionMatch && !line.includes('Step') && !line.includes('Route')) {
      if (currentStep) {
        currentStep.content = sectionContent.join('\n');
        workflow.steps.push(currentStep);
        currentStep = null;
      }

      const sectionName = sectionMatch[1].trim().toLowerCase();
      if (sectionName === 'overview') {
        currentSection = 'overview';
      } else if (sectionName.includes('decision')) {
        currentSection = 'decisions';
      } else if (sectionName.includes('quick reference')) {
        currentSection = 'quickRef';
      } else {
        currentSection = sectionName;
      }
      sectionContent = [];
      continue;
    }

    // Parse agent assignment within step
    if (line.startsWith('**Agent:**') || line.startsWith('**🔀 Agent:**')) {
      const agentMatch = line.match(/(?:\*\*(?:🔀 )?Agent:\*\*) (.+)/);
      if (agentMatch && currentStep) {
        currentStep.agent = parseAgentList(agentMatch[1])[0];
      }
      continue;
    }

    // Collect content
    if (currentStep) {
      currentStep.content.push(line);
    } else if (currentSection === 'overview') {
      sectionContent.push(line);
    }
  }

  // Add last step
  if (currentStep) {
    currentStep.content = sectionContent.join('\n');
    workflow.steps.push(currentStep);
  }

  // Clean up step content
  workflow.steps = workflow.steps.map(step => ({
    ...step,
    content: Array.isArray(step.content) ? step.content.join('\n').trim() : step.content.trim(),
  }));

  return workflow;
}

/**
 * Parse agent list from string
 * @param {string} agentStr - Agent string (e.g., "Paula (PM) 📋 + Victor (PO) 📦")
 * @returns {Array<Object>} Array of agent objects
 */
function parseAgentList(agentStr) {
  const agents = [];
  const parts = agentStr.split(/\s*[+→]\s*/);

  for (const part of parts) {
    const match = part.match(/(\w+)\s*\((\w+(?:-\w+)?)\)\s*(.)?/);
    if (match) {
      agents.push({
        name: match[1].trim(),
        role: match[2].trim(),
        icon: match[3] || '',
      });
    }
  }

  return agents;
}

/**
 * List all available workflows
 * @returns {Promise<Array>} Array of workflow summaries
 */
async function listWorkflows() {
  const manifest = await loadManifest();
  const workflows = [];

  if (!manifest.workflows) {
    return workflows;
  }

  for (const [category, categoryWorkflows] of Object.entries(manifest.workflows)) {
    if (!Array.isArray(categoryWorkflows)) continue;

    for (const wf of categoryWorkflows) {
      workflows.push({
        id: wf.id,
        trigger: wf.trigger,
        category,
        description: wf.description,
        primaryAgent: wf.primary_agent,
        supportingAgents: wf.supporting_agents || [],
      });
    }
  }

  return workflows;
}

/**
 * Get workflow paths (common workflow sequences)
 * @returns {Promise<Object>} Workflow paths configuration
 */
async function getWorkflowPaths() {
  const manifest = await loadManifest();
  return manifest.paths || {};
}

/**
 * Get routing rules
 * @returns {Promise<Object>} Routing rules configuration
 */
async function getRoutingRules() {
  const manifest = await loadManifest();
  return manifest.routing || {};
}

/**
 * Find workflows by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of workflows in category
 */
async function findWorkflowsByCategory(category) {
  const manifest = await loadManifest();
  const normalizedCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '-');

  for (const [cat, workflows] of Object.entries(manifest.workflows || {})) {
    if (cat.toLowerCase().replace(/[^a-z0-9]/g, '-') === normalizedCategory) {
      return workflows;
    }
  }

  return [];
}

/**
 * Get next workflow suggestions based on current workflow
 * @param {string} trigger - Current workflow trigger
 * @returns {Promise<Array>} Array of suggested next workflows
 */
async function getNextWorkflows(trigger) {
  const workflow = await findWorkflowByTrigger(trigger);
  if (!workflow || !workflow.next) {
    return [];
  }

  const triggerMap = await buildTriggerMap();
  return workflow.next.map(nextId => {
    // Find by id
    for (const [, wf] of triggerMap) {
      if (wf.id === nextId) {
        return wf;
      }
    }
    return null;
  }).filter(Boolean);
}

/**
 * Format workflow for display
 * @param {Object} workflow - Workflow object
 * @param {Object} options - Display options
 * @returns {Object} Formatted workflow
 */
function formatWorkflowForDisplay(workflow, options = {}) {
  const { detailed = false } = options;

  const formatted = {
    trigger: workflow.trigger,
    title: workflow.title,
    agents: workflow.agents.map(a => `${a.name} (${a.role}) ${a.icon}`).join(' → '),
    stepCount: workflow.steps.length,
  };

  if (detailed) {
    formatted.steps = workflow.steps.map(step => ({
      number: step.number,
      title: step.title,
      agent: step.agent ? `${step.agent.name} (${step.agent.role})` : 'Unassigned',
      isRoute: step.isRoute || false,
    }));
  }

  return formatted;
}

/**
 * Clear workflow cache
 */
function clearCache() {
  manifestCache = null;
  cacheTimestamp = 0;
}

module.exports = {
  getWorkflowsPath,
  loadManifest,
  buildTriggerMap,
  findWorkflowByTrigger,
  loadWorkflowFile,
  parseWorkflowMarkdown,
  listWorkflows,
  getWorkflowPaths,
  getRoutingRules,
  findWorkflowsByCategory,
  getNextWorkflows,
  formatWorkflowForDisplay,
  clearCache,
};
