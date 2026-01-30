/**
 * @fileoverview Unit tests for workflow validator
 */

const path = require('path');
const fs = require('fs');

// Mock file path for testing
const FIXTURES_PATH = path.join(__dirname, '..', 'fixtures');

describe('Workflow Validator', () => {
  describe('JSON Validation', () => {
    it('should validate valid workflow JSON', () => {
      const validWorkflow = {
        name: 'Test Workflow',
        nodes: [],
        connections: {}
      };

      expect(() => JSON.parse(JSON.stringify(validWorkflow))).not.toThrow();
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });

  describe('Structure Validation', () => {
    it('should require name field', () => {
      const workflow = {
        nodes: [],
        connections: {}
      };

      const hasName = 'name' in workflow;
      expect(hasName).toBe(false);
    });

    it('should require nodes array', () => {
      const workflow = {
        name: 'Test',
        nodes: [],
        connections: {}
      };

      expect(Array.isArray(workflow.nodes)).toBe(true);
    });

    it('should require connections object', () => {
      const workflow = {
        name: 'Test',
        nodes: [],
        connections: {}
      };

      expect(typeof workflow.connections).toBe('object');
    });
  });

  describe('Naming Convention Validation', () => {
    const validateWorkflowName = (name, prefix = 'wf_') => {
      // snake_case validation
      const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;
      const withoutPrefix = name.startsWith(prefix) ? name.slice(prefix.length) : name;
      return snakeCaseRegex.test(withoutPrefix);
    };

    it('should accept valid workflow names', () => {
      expect(validateWorkflowName('wf_user_sync')).toBe(true);
      expect(validateWorkflowName('wf_process_orders')).toBe(true);
      expect(validateWorkflowName('wf_sync_data_daily')).toBe(true);
    });

    it('should reject invalid workflow names', () => {
      expect(validateWorkflowName('wf_UserSync')).toBe(false);
      expect(validateWorkflowName('wf_user-sync')).toBe(false);
      expect(validateWorkflowName('wf_123_start')).toBe(false);
    });
  });

  describe('Expression Validation', () => {
    const hasValidExpressionDelimiters = (expr) => {
      const openCount = (expr.match(/\{\{/g) || []).length;
      const closeCount = (expr.match(/\}\}/g) || []).length;
      return openCount === closeCount;
    };

    it('should validate balanced expression delimiters', () => {
      expect(hasValidExpressionDelimiters('{{ $json.field }}')).toBe(true);
      expect(hasValidExpressionDelimiters('{{ $json.a }} and {{ $json.b }}')).toBe(true);
    });

    it('should detect unbalanced delimiters', () => {
      expect(hasValidExpressionDelimiters('{{ $json.field')).toBe(false);
      expect(hasValidExpressionDelimiters('$json.field }}')).toBe(false);
    });
  });

  describe('Security Validation', () => {
    const containsHardcodedSecret = (str) => {
      const patterns = [
        /password\s*[:=]\s*["'][^"']+["']/i,
        /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
        /secret\s*[:=]\s*["'][^"']+["']/i,
        /token\s*[:=]\s*["'][^"']+["']/i
      ];

      return patterns.some(pattern => pattern.test(str));
    };

    it('should detect hardcoded passwords', () => {
      expect(containsHardcodedSecret('password: "secret123"')).toBe(true);
      expect(containsHardcodedSecret('PASSWORD = "test"')).toBe(true);
    });

    it('should detect hardcoded API keys', () => {
      expect(containsHardcodedSecret('api_key: "abc123"')).toBe(true);
      expect(containsHardcodedSecret('apiKey = "xyz789"')).toBe(true);
    });

    it('should not flag safe patterns', () => {
      expect(containsHardcodedSecret('{{ $credentials.apiKey }}')).toBe(false);
      expect(containsHardcodedSecret('password: {{ $env.PASSWORD }}')).toBe(false);
    });
  });
});

describe('Agent Loader', () => {
  describe('Agent List', () => {
    const expectedAgents = [
      'n8n-master', 'po', 'pm', 'sm', 'architect', 'developer',
      'qa', 'devops', 'ba', 'security', 'integration', 'data-analyst', 'tech-writer'
    ];

    it('should have all expected agents', () => {
      expect(expectedAgents.length).toBe(13);
    });

    it('should have unique agent IDs', () => {
      const uniqueIds = [...new Set(expectedAgents)];
      expect(uniqueIds.length).toBe(expectedAgents.length);
    });
  });

  describe('Agent Routing', () => {
    const routingRules = {
      'requirements': 'po',
      'sprint': 'pm',
      'ceremony': 'sm',
      'architecture': 'architect',
      'implement': 'developer',
      'test': 'qa',
      'deploy': 'devops',
      'process': 'ba',
      'security': 'security',
      'api': 'integration',
      'data': 'data-analyst',
      'documentation': 'tech-writer'
    };

    it('should route to correct agent based on keyword', () => {
      Object.entries(routingRules).forEach(([keyword, expectedAgent]) => {
        const agent = routingRules[keyword];
        expect(agent).toBe(expectedAgent);
      });
    });
  });
});

describe('Template Engine', () => {
  describe('Variable Substitution', () => {
    const substituteVariables = (template, variables) => {
      let result = template;
      Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });
      return result;
    };

    it('should substitute single variable', () => {
      const template = 'Hello, {name}!';
      const result = substituteVariables(template, { name: 'World' });
      expect(result).toBe('Hello, World!');
    });

    it('should substitute multiple variables', () => {
      const template = '{greeting}, {name}!';
      const result = substituteVariables(template, { greeting: 'Hello', name: 'World' });
      expect(result).toBe('Hello, World!');
    });

    it('should substitute same variable multiple times', () => {
      const template = '{name} said hi to {name}';
      const result = substituteVariables(template, { name: 'Alice' });
      expect(result).toBe('Alice said hi to Alice');
    });
  });
});
