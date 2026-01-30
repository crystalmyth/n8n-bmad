# Contributing to n8n-BMAD

Thank you for your interest in contributing to n8n-BMAD! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Issues

1. **Search existing issues** to avoid duplicates
2. **Use issue templates** when available
3. **Provide detailed information**:
   - n8n version
   - Node.js version
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior

### Suggesting Enhancements

1. Open an issue with the `enhancement` label
2. Describe the use case and expected benefit
3. Include examples if possible

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding style** established in the project
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Ensure CI passes** before requesting review

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/n8n-bmad.git
cd n8n-bmad

# Install dependencies
npm install

# Run tests
npm test

# Run CLI locally
node tools/cli/n8n-bmad-cli.js --help
```

## Project Structure

```
n8n-bmad/
├── src/core/           # Core framework (agents, workflows, tasks)
├── templates/          # Document templates
├── patterns/           # n8n workflow patterns (JSON)
├── reference/          # Reference documentation
├── docs/               # User documentation
├── tools/cli/          # CLI implementation
└── test/               # Test files
```

## Contribution Areas

### Agent Personas
- Location: `src/core/agents/`
- Format: YAML
- Add new agent personas or enhance existing ones

### Workflow Patterns
- Location: `patterns/`
- Format: JSON (n8n workflow format)
- Include README.md explaining the pattern

### Templates
- Location: `templates/`
- Format: Markdown with YAML frontmatter
- Follow existing template structure

### Documentation
- Location: `docs/`
- Follow [Diataxis](https://diataxis.fr/) framework
- Tutorials, How-to, Explanation, Reference

### CLI Commands
- Location: `tools/cli/commands/`
- Use Commander.js patterns
- Include help text and examples

## Style Guidelines

### YAML Files
```yaml
# Use 2-space indentation
# Include descriptive comments
# Use snake_case for keys
agent:
  name: example
  description: "Description here"
```

### JavaScript
```javascript
// Use ES6+ features
// JSDoc comments for functions
// Consistent error handling
```

### Markdown
- Use ATX-style headers (`#`)
- Include table of contents for long docs
- Use fenced code blocks with language identifiers

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- test/unit/validator.test.js
```

## Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(agent): add data-engineer persona`
- `fix(cli): resolve validation error handling`
- `docs(patterns): add retry pattern documentation`

## Release Process

1. Update `CHANGELOG.md`
2. Bump version in `package.json`
3. Create release tag
4. CI publishes to npm

## Getting Help

- Open a [Discussion](https://github.com/your-org/n8n-bmad/discussions)
- Review existing documentation
- Check closed issues for solutions

## Recognition

Contributors are recognized in:
- Release notes
- README.md acknowledgments
- Project documentation

Thank you for contributing to n8n-BMAD!
