# Qlik MCP Integration

A Model Context Protocol (MCP) integration for Qlik, enabling seamless interaction between Claude and Qlik applications through Cursor IDE.

## Features

- Connect to Qlik Cloud applications
- List available apps and sheets
- Extract data from charts and visualizations
- Built-in rate limiting and error handling
- Configurable data retrieval settings
- Environment-based configuration

## Prerequisites

- [Deno](https://deno.land/#installation)
- [Cursor IDE](https://cursor.sh/)
- [Claude AI](https://claude.ai/)
- Qlik Cloud account with API access

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/qlik-mcp.git
cd qlik-mcp
```

2. Create a `.env` file in the project root:
```env
QLIK_API_KEY=your_api_key
QLIK_BASE_URL=your_qlik_cloud_url
QLIK_APP_ID=your_default_app_id
MAX_ROWS_PER_REQUEST=1000
MAX_TOTAL_ROWS=10000
REQUEST_DELAY_MS=100
MAX_RETRIES=3
RETRY_DELAY_MS=1000
```

## Cursor IDE Setup

1. Open Cursor IDE settings
2. Navigate to the Claude Desktop Configuration
3. Add the following configuration:

```json
{
  "name": "Qlik Cloud",
  "command": "/path/to/deno",
  "args": ["run", "--allow-all", "--env-file=.env", "src/index.ts"],
  "cwd": "/path/to/qlik-mcp"
}
```

Replace `/path/to/deno` with your Deno installation path (usually `~/.deno/bin/deno` on Unix systems) and `/path/to/qlik-mcp` with the absolute path to your cloned repository.

## Available Tools

The integration provides the following tools for Claude:

1. `qlik_get_apps` - List all available Qlik applications
2. `qlik_get_app_sheets` - Get all sheets in a specific app
3. `qlik_get_sheet_charts` - Get all charts in a specific sheet
4. `qlik_get_chart_data` - Extract data from a specific chart

## Development

The project uses Deno for TypeScript execution and includes:

- TypeScript configuration for IDE support (`tsconfig.json`)
- Deno configuration for runtime (`deno.json`)
- Import maps for dependency management
- Built-in task definitions

To run the server in development mode:
```bash
deno task dev
```

## Configuration Options

All configuration is done through environment variables:

- `QLIK_API_KEY`: Your Qlik Cloud API key
- `QLIK_BASE_URL`: Your Qlik Cloud tenant URL
- `QLIK_APP_ID`: Default Qlik app ID
- `MAX_ROWS_PER_REQUEST`: Maximum rows per data request (default: 1000)
- `MAX_TOTAL_ROWS`: Maximum total rows to retrieve (default: 10000)
- `REQUEST_DELAY_MS`: Delay between requests in milliseconds (default: 100)
- `MAX_RETRIES`: Maximum retry attempts for failed requests (default: 3)
- `RETRY_DELAY_MS`: Initial delay between retries in milliseconds (default: 1000)

## Security

- Never commit your `.env` file
- Keep your API keys secure
- Use appropriate rate limiting settings
- Monitor your API usage

## License

MIT License - see LICENSE file for details 