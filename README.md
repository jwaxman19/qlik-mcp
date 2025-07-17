[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/jwaxman19-qlik-mcp-badge.png)](https://mseep.ai/app/jwaxman19-qlik-mcp)

# Qlik MCP Server

MCP Server for the Qlik Cloud API, enabling Claude to interact with Qlik applications and extract data from visualizations.

## Tools

### qlik_get_apps
List all Qlik applications available in the workspace
- Optional inputs:
  - `limit` (number, default: 100): Maximum number of apps to return
  - `offset` (string): Pagination offset for next page
- Returns: List of applications with their IDs and information

### qlik_get_app_sheets
Get all sheets in a Qlik application
- Optional inputs:
  - `app_id` (string): The ID of the Qlik application (defaults to QLIK_APP_ID env variable)
- Returns: List of sheets with their IDs, titles, and metadata

### qlik_get_sheet_charts
Get all charts in a specific sheet
- Required inputs:
  - `sheet_id` (string): The ID of the sheet to get charts from
- Optional inputs:
  - `app_id` (string): The ID of the Qlik application (defaults to QLIK_APP_ID env variable)
- Returns: List of charts with their IDs, types, and positions

### qlik_get_chart_data
Get data from a specific chart
- Required inputs:
  - `sheet_id` (string): The ID of the sheet containing the chart
  - `chart_id` (string): The ID of the chart to get data from
- Optional inputs:
  - `app_id` (string): The ID of the Qlik application (defaults to QLIK_APP_ID env variable)
  - `max_rows` (number, default: 10000): Maximum total rows to retrieve
  - `page_size` (number, default: 1000): Number of rows per request
  - `include_metadata` (boolean, default: true): Include chart metadata in response
- Returns: Chart data with headers, rows, and optional metadata

## Setup

### Create a Qlik Cloud API Key:
1. Log in to your Qlik Cloud tenant
2. Navigate to Settings > API keys
3. Create a new API key with appropriate access
4. Save the API key securely

### Configure Environment:
Create a `.env` file with your Qlik Cloud credentials (see `.env.example` for a template):
```env
QLIK_API_KEY=your_api_key_here
QLIK_BASE_URL=your_tenant_url
QLIK_APP_ID=your_default_app_id
MAX_ROWS_PER_REQUEST=1000
MAX_TOTAL_ROWS=10000
REQUEST_DELAY_MS=100
MAX_RETRIES=3
RETRY_DELAY_MS=1000
```

## Usage with Docker

You can also run this MCP server using Docker:

```bash
# Build the Docker image
docker build -t qlik-mcp .

# Run the container
# Make sure to create a .env file first (copy from .env.example)
docker run --env-file .env qlik-mcp
```

## Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

### Using Deno (Recommended)
```json
{
  "mcpServers": {
    "qlik": {
      "command": "/path/to/deno",
      "args": ["run", "--allow-all", "--env-file=.env", "src/index.ts"],
      "cwd": "/path/to/qlik-mcp"
    }
  }
}
```

### Using Node.js
```json
{
  "mcpServers": {
    "qlik": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "env": {
        "QLIK_API_KEY": "your_api_key_here",
        "QLIK_BASE_URL": "your_tenant_url",
        "QLIK_APP_ID": "your_default_app_id"
      },
      "cwd": "/path/to/qlik-mcp"
    }
  }
}
```

## Usage with Cursor

1. Open Cursor settings
2. Navigate to the Claude configuration section
3. Add a new MCP configuration:

```json
{
  "name": "Qlik Cloud",
  "command": "/path/to/deno",
  "args": ["run", "--allow-all", "--env-file=.env", "src/index.ts"],
  "cwd": "/path/to/qlik-mcp"
}
```

Replace `/path/to/deno` with your Deno installation path (usually `~/.deno/bin/deno` on Unix systems) and `/path/to/qlik-mcp` with the absolute path to your cloned repository.

## Troubleshooting

If you encounter errors, verify that:
- Your API key has the necessary permissions
- The tenant URL is correct and accessible
- The app ID exists and is accessible
- Environment variables are properly set
- Rate limiting settings are appropriate for your tenant

Common issues:
- `401 Unauthorized`: Check your API key
- `403 Forbidden`: Verify API key permissions
- `429 Too Many Requests`: Adjust rate limiting settings
- `404 Not Found`: Verify app and sheet IDs

## Development

### Prerequisites
- [Deno](https://deno.land/#installation)
- [Node.js](https://nodejs.org/) (optional, for IDE support)

### Local Setup
```bash
# Clone repository
git clone https://github.com/jwaxman19/qlik-mcp.git
cd qlik-mcp

# Install dependencies (for IDE support)
npm install

# Run server
deno task dev
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.

### 📊 <a name="data-platforms"></a>Data Platforms

Data Platforms for data integration, transformation and pipeline orchestration. 

- [JordiNei/mcp-databricks-server](https://github.com/JordiNeil/mcp-databricks-server) - Connect to Databricks API, allowing LLMs to run SQL queries, list jobs, and get job status.
- [jwaxman19/qlik-mcp](https://github.com/jwaxman19/qlik-mcp) 📇 ☁️ - MCP Server for Qlik Cloud API that enables querying applications, sheets, and extracting data from visualizations with comprehensive authentication and rate limiting support.
- [keboola/keboola-mcp-server](https://github.com/keboola/keboola-mcp-server) - interact with Keboola Connection Data Platform. This server provides tools for listing and accessing data from Keboola Storage API. 