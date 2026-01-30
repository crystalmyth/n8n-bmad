#!/bin/bash
# Setup MCP (Model Context Protocol) configuration for n8n-BMAD

set -e

echo "==================================="
echo "  n8n-BMAD MCP Setup"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required environment variables
check_env() {
    if [ -z "$N8N_INSTANCE_URL" ]; then
        echo -e "${YELLOW}Warning: N8N_INSTANCE_URL not set${NC}"
        read -p "Enter your n8n instance URL (e.g., http://localhost:5678): " N8N_INSTANCE_URL
    fi

    if [ -z "$N8N_API_KEY" ]; then
        echo -e "${YELLOW}Warning: N8N_API_KEY not set${NC}"
        read -sp "Enter your n8n API key: " N8N_API_KEY
        echo ""
    fi
}

# Create .env file
create_env_file() {
    echo "Creating .env file..."

    cat > .env << EOF
# n8n Configuration
N8N_INSTANCE_URL=${N8N_INSTANCE_URL}
N8N_API_KEY=${N8N_API_KEY}

# MCP Configuration
MCP_LOG_LEVEL=info
MCP_TIMEOUT=30000

# Project Configuration
PROJECT_ROOT=$(pwd)
EOF

    echo -e "${GREEN}Created .env file${NC}"
}

# Create MCP configuration
create_mcp_config() {
    echo "Creating .mcp.json..."

    cat > .mcp.json << EOF
{
  "name": "n8n-bmad",
  "version": "1.0.0",
  "description": "MCP server configuration for n8n-BMAD framework",
  "servers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-n8n"],
      "env": {
        "N8N_API_URL": "\${N8N_INSTANCE_URL}",
        "N8N_API_KEY": "\${N8N_API_KEY}"
      }
    }
  },
  "settings": {
    "logLevel": "info",
    "timeout": 30000
  }
}
EOF

    echo -e "${GREEN}Created .mcp.json${NC}"
}

# Test n8n connection
test_connection() {
    echo "Testing n8n connection..."

    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        "$N8N_INSTANCE_URL/api/v1/workflows" 2>/dev/null)

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}Successfully connected to n8n instance${NC}"
        return 0
    else
        echo -e "${RED}Failed to connect to n8n (HTTP $response)${NC}"
        echo "Please check your URL and API key"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    check_env
    echo ""
    create_env_file
    echo ""
    create_mcp_config
    echo ""

    read -p "Test connection to n8n? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_connection
    fi

    echo ""
    echo "==================================="
    echo -e "${GREEN}MCP Setup Complete!${NC}"
    echo "==================================="
    echo ""
    echo "Next steps:"
    echo "1. Review .env and .mcp.json files"
    echo "2. Add .env to .gitignore (if not already)"
    echo "3. Configure your MCP client to use this configuration"
    echo ""
}

main "$@"
