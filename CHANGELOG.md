# Changelog

All notable changes to n8n-BMAD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-beta.1] - 2026-02-06

### Added
- **15 AI Agent Personas**: PM (Paula), PO (Victor), SM (Sam), Architect (Winston), Developer (Nate), QA (Quinn), DevOps (Rex), BA (Mary), Security (Sierra), Integration (Ivy), Data Analyst (Dana), Tech Writer (Tara), n8n Master (Atlas), Prompt Engineer (Petra), Quick Flow (Barry)
- **Scale-Adaptive Intelligence**: Auto-detects project complexity and adjusts ceremony (Quick Flow / Standard / Enterprise)
- **Agent + Skill Invocation**: `/n8n:agent *skill-name` syntax for self-documenting, discoverable commands
- **25+ Workflow Definitions**: Multi-agent orchestration across requirements, planning, development, quality, and release phases
- **7 Handler Components**: Reusable patterns for validation, expressions, errors, credentials, AI nodes, webhooks
- **37 Document Templates**: PRD, epic, story, architecture, ADR, runbook, test plan, security assessment, and more
- **Party Mode**: Multi-agent collaboration sessions (architecture review, story refinement, security audit, integration design, AI workflow design, post-incident review)
- **Quick Flow**: Lightweight solo-developer workflow with session persistence via quick-brief
- **Project Brief System**: Context management to prevent hallucination across sessions, with auto-updates on phase completion
- **CLI Tooling**: 8 command groups (agent, workflow, party, context, nodes, template, validate, init) with Commander.js
- **MCP Integration**: Connect AI assistants directly to n8n instances via stdio-mode MCP server
- **Node Discovery**: Discover and categorize custom/community/core nodes installed on n8n instance (24hr cache)
- **Command Generator**: Auto-generates Claude Code slash commands from agent YAML definitions
- **LLM Context Builder**: Consolidates project context for AI assistants
- **Custom Agent Creation**: Create specialized agents from base personas with interactive CLI
- **Document Sharding**: Auto-shard large documents (PRD, architecture) into indexed folders
- **Four-Eyes Principle**: PM creates, PO validates throughout the workflow
- **Workflow Patterns Library**: Error handling (retry, DLQ, circuit breaker), integration (API, webhook, database), data transformation (batch, pagination), scheduling
- **Reference Documentation**: Expressions, nodes, naming conventions
- **GitHub Community Files**: Issue/PR templates, code of conduct, security policy, contributing guide
- **Jest Testing Infrastructure**: Unit tests with coverage reporting

---

## Release Notes Template

### [X.Y.Z] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes in existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security-related changes
