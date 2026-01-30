# Naming Conventions for n8n Workflows

Consistent naming conventions improve workflow readability, maintainability, and collaboration. This guide establishes standards for naming workflows, nodes, credentials, and other n8n components.

## Table of Contents

- [General Principles](#general-principles)
- [Workflow Naming](#workflow-naming)
- [Node Naming](#node-naming)
- [Credential Naming](#credential-naming)
- [Variable Naming](#variable-naming)
- [Tag and Label Standards](#tag-and-label-standards)
- [Documentation Standards](#documentation-standards)
- [Versioning Conventions](#versioning-conventions)

---

## General Principles

### Core Guidelines

1. **Be Descriptive**: Names should clearly describe purpose
2. **Be Consistent**: Use the same patterns throughout
3. **Be Concise**: Avoid unnecessary words while maintaining clarity
4. **Use Standard Cases**: Follow established casing conventions
5. **Avoid Abbreviations**: Unless universally understood (API, HTTP, ID)

### Casing Standards

| Context | Convention | Example |
|---------|------------|---------|
| Workflows | Title Case with Hyphens | `Order-Processing-Main` |
| Nodes | Title Case with Spaces | `Process Customer Data` |
| Credentials | Title Case with Service | `Slack Production Bot` |
| Variables | camelCase | `customerEmail` |
| Tags | lowercase-with-hyphens | `finance-team` |

---

## Workflow Naming

### Workflow Name Structure

```
[Domain]-[Action]-[Qualifier]
```

**Components:**
- **Domain**: Business area or system (Customer, Order, Invoice)
- **Action**: What the workflow does (Sync, Process, Notify)
- **Qualifier**: Environment, version, or specificity (Main, v2, Daily)

### Examples by Category

**Data Synchronization:**
```
Customer-Sync-CRM-to-Database
Product-Import-Shopify-Daily
Contact-Sync-HubSpot-Bidirectional
```

**Processing Workflows:**
```
Order-Process-New-Orders
Invoice-Generate-Monthly
Lead-Score-Calculate
```

**Notification Workflows:**
```
Alert-Low-Inventory-Slack
Notify-Order-Shipped-Email
Report-Daily-Sales-Summary
```

**Integration Workflows:**
```
Integration-Stripe-Webhook-Handler
Integration-Salesforce-API-Gateway
Integration-Zendesk-Ticket-Sync
```

**Utility Workflows:**
```
Utility-Cleanup-Old-Records
Utility-Data-Migration-v2
Utility-Health-Check
```

### Workflow Naming Anti-Patterns

```
# AVOID
Test                        # Too vague
My Workflow                 # Not descriptive
Copy of Order Processing   # Remove copy artifacts
New Workflow 3             # Use descriptive names
Webhook Handler            # Missing domain context

# PREFER
Test-Order-Validation-Sandbox
Order-Process-Returns
Order-Webhook-Shopify
Invoice-Generate-Automated
```

### Environment Indicators

When workflows exist in multiple environments:

```
Order-Process-Main                    # Production
Order-Process-Main-[STAGING]          # Staging
Order-Process-Main-[DEV]              # Development

# Or use tags instead of name suffixes
# Tag: environment:production, environment:staging, environment:development
```

---

## Node Naming

### Node Name Structure

```
[Action] [Object] [Qualifier]
```

**Guidelines:**
- Start with a verb when possible
- Describe what the node does, not what it is
- Include relevant context (source/destination)
- Keep under 40 characters when possible

### Examples by Node Type

**Trigger Nodes:**
```
Receive Order Webhook
Schedule Daily at 9am
Manual Start
Listen for New Emails
```

**HTTP Request Nodes:**
```
Fetch Customer Details
Create Shopify Order
Update HubSpot Contact
Delete Expired Records
Get Product Inventory
Post to Slack Channel
```

**Data Transformation:**
```
Parse Order Items
Calculate Order Total
Format Customer Name
Convert Date Format
Normalize Email Addresses
Map API Response
```

**Conditional Nodes:**
```
Check Order Status
Is High Priority
Has Valid Email
Customer Exists
Amount Over Threshold
```

**Database Nodes:**
```
Save to Orders Table
Query Active Customers
Update Inventory Count
Delete Old Logs
Lookup Product by SKU
```

**Code Nodes:**
```
Calculate Discount Logic
Transform Complex Data
Generate Report Summary
Custom Validation Rules
```

**Merge/Split Nodes:**
```
Combine Customer Data
Split by Category
Merge API Responses
Separate Success/Failure
```

### Node Naming by Position

**Beginning of workflow:**
```
1. Receive/Listen/Start/Schedule...
2. Validate/Check...
3. Parse/Extract...
```

**Middle of workflow:**
```
Transform/Map/Convert...
Calculate/Process...
Fetch/Get/Query...
```

**End of workflow:**
```
Save/Store/Create/Update...
Send/Notify/Post...
Log/Record...
```

### Node Naming Anti-Patterns

```
# AVOID
HTTP Request               # Use the purpose
HTTP Request1              # Never use numbered copies
Set                        # Use the transformation purpose
Code                       # Describe what it does
IF                         # Use the condition being checked
Node 5                     # Not descriptive

# PREFER
Fetch User from API
Calculate Shipping Cost
Check Payment Status
Format Customer Record
```

---

## Credential Naming

### Credential Name Structure

```
[Service] [Environment/Account] [Purpose]
```

### Examples

**API Credentials:**
```
Stripe Production API
Stripe Sandbox API
Shopify Main Store API
Shopify EU Store API
```

**OAuth Credentials:**
```
Google Sheets Main
Slack Notifications Bot
HubSpot Marketing
Microsoft 365 Admin
```

**Database Credentials:**
```
PostgreSQL Production Orders
PostgreSQL Staging
MySQL Analytics Read-Only
MongoDB Production
```

**Email/SMTP:**
```
SendGrid Transactional
SMTP Marketing Server
Gmail Support Account
```

### Credential Naming Guidelines

1. **Always include service name** - Even if obvious
2. **Specify environment** - Production, Staging, Development, Sandbox
3. **Indicate scope** - Admin, Read-Only, Limited
4. **Add account identifier** - For multi-account setups

### Credential Anti-Patterns

```
# AVOID
My API Key                  # Not specific
Production                  # Missing service
test                        # Too vague
asdf123                     # Not descriptive

# PREFER
Stripe Production API
HubSpot Staging Integration
AWS S3 Read-Only Access
```

---

## Variable Naming

### Expression Variables

Use **camelCase** for variable names in expressions and Code nodes.

```javascript
// GOOD
const customerEmail = $json.email;
const orderTotal = $json.items.reduce((sum, item) => sum + item.price, 0);
const isHighPriority = $json.priority === 'high';

// AVOID
const CustomerEmail = $json.email;    // PascalCase
const customer_email = $json.email;   // snake_case
const e = $json.email;                // Too short
```

### Field Naming in Set Nodes

Use **camelCase** for field names created in Set nodes:

```javascript
// GOOD
fullName: {{ $json.firstName + ' ' + $json.lastName }}
processedAt: {{ DateTime.now().toISO() }}
isActive: {{ $json.status === 'active' }}

// AVOID
FullName                 // PascalCase
full_name                // snake_case
processed_at             // snake_case
```

### Boolean Variables

Prefix with `is`, `has`, `can`, `should`:

```javascript
isActive
isValid
hasPermission
hasItems
canEdit
canDelete
shouldProcess
shouldNotify
```

### Collection Variables

Use plural names for arrays:

```javascript
// GOOD
customers
orderItems
emailAddresses

// AVOID
customerList       // Redundant 'List'
customer           // Singular for array
```

---

## Tag and Label Standards

### Workflow Tags

Use tags to categorize and filter workflows.

**Tag Categories:**

| Category | Format | Examples |
|----------|--------|----------|
| Team/Owner | `team:{name}` | `team:finance`, `team:marketing` |
| Environment | `env:{env}` | `env:production`, `env:staging` |
| Status | `status:{status}` | `status:active`, `status:deprecated` |
| Integration | `integration:{service}` | `integration:shopify`, `integration:stripe` |
| Priority | `priority:{level}` | `priority:critical`, `priority:low` |
| Type | `type:{type}` | `type:sync`, `type:report`, `type:alert` |

**Example Tag Sets:**
```
Order Processing Workflow:
  - team:operations
  - env:production
  - integration:shopify
  - priority:critical
  - type:sync

Monthly Report Workflow:
  - team:finance
  - env:production
  - type:report
  - schedule:monthly
```

### Tag Naming Rules

1. **Use lowercase** with hyphens for multi-word tags
2. **Use prefixes** for category grouping
3. **Be consistent** across all workflows
4. **Keep tags focused** - Don't over-tag

---

## Documentation Standards

### Workflow Descriptions

Every workflow should have a description including:

```markdown
## Purpose
Brief explanation of what this workflow does and why.

## Trigger
What causes this workflow to run (schedule, webhook, manual).

## Dependencies
- External services (APIs, databases)
- Required credentials
- Related workflows

## Notes
- Special considerations
- Known limitations
- Contact for questions
```

### Node Descriptions

Add descriptions to complex nodes:

```markdown
## Logic
Explains the calculation or transformation logic.

## Input
Expected data format and required fields.

## Output
What this node produces.
```

### Sticky Notes Usage

Use sticky notes for:
- Section headers
- Important warnings
- Complex logic explanations
- TODO items

**Sticky Note Conventions:**
```
# SECTION: Order Processing
Mark major workflow sections

# WARNING: Rate Limited
API allows max 100 requests/minute

# TODO: Add error handling
Track improvement needs

# NOTE: Custom Logic
Explain non-obvious decisions
```

---

## Versioning Conventions

### Workflow Versioning

For workflows that need versioning:

```
Order-Process-v1           # Original
Order-Process-v2           # Major update
Order-Process-v2.1         # Minor update
```

### When to Version

**Create new version when:**
- Major logic changes
- Breaking changes to inputs/outputs
- Significant structural changes

**Update in place when:**
- Bug fixes
- Minor improvements
- Adding logging/monitoring

### Version Documentation

Document version changes:

```markdown
## v2.1 (2024-03-15)
- Added retry logic for API calls
- Fixed date timezone issue

## v2.0 (2024-02-01)
- Restructured for better error handling
- Added support for bulk processing
- BREAKING: Changed webhook payload format

## v1.0 (2024-01-15)
- Initial release
```

---

## Quick Reference Card

### Naming Checklist

- [ ] Workflow name follows `Domain-Action-Qualifier` pattern
- [ ] All nodes have descriptive names (no "HTTP Request1")
- [ ] Credentials include service and environment
- [ ] Variables use camelCase
- [ ] Tags follow `category:value` format
- [ ] Workflow has description
- [ ] Complex nodes have explanations
- [ ] Sticky notes mark sections and warnings

### Common Abbreviations (Acceptable)

| Abbreviation | Meaning |
|--------------|---------|
| API | Application Programming Interface |
| DB | Database |
| HTTP | Hypertext Transfer Protocol |
| ID | Identifier |
| JSON | JavaScript Object Notation |
| URL | Uniform Resource Locator |
| CRM | Customer Relationship Management |
| EU | European Union |
| US | United States |
| UK | United Kingdom |

### Avoid These Abbreviations

| Avoid | Use Instead |
|-------|-------------|
| Cust | Customer |
| Prod | Production (or Product - ambiguous) |
| Info | Information |
| Addr | Address |
| Calc | Calculate |
| Num | Number |
| Msg | Message |

---

## See Also

- [Core Nodes Reference](../nodes/core-nodes.md)
- [Common Expression Patterns](../expressions/common-patterns.md)
- [n8n Best Practices](../../docs/best-practices.md)
