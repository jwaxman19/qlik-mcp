/// <reference types="node" />
/// @deno-types="npm:@types/node"
import * as process from "node:process";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { auth, qix } from "@qlik/api";
import { z } from "zod";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Load environment variables with type safety
const env = {
  QLIK_API_KEY: Deno.env.get("QLIK_API_KEY") ?? "",
  QLIK_BASE_URL: Deno.env.get("QLIK_BASE_URL") ?? "",
  QLIK_APP_ID: Deno.env.get("QLIK_APP_ID") ?? "",
  MAX_ROWS_PER_REQUEST: Number(Deno.env.get("MAX_ROWS_PER_REQUEST") ?? "1000"),
  MAX_TOTAL_ROWS: Number(Deno.env.get("MAX_TOTAL_ROWS") ?? "10000"),
  REQUEST_DELAY_MS: Number(Deno.env.get("REQUEST_DELAY_MS") ?? "100"),
  MAX_RETRIES: Number(Deno.env.get("MAX_RETRIES") ?? "3"),
  RETRY_DELAY_MS: Number(Deno.env.get("RETRY_DELAY_MS") ?? "1000")
} as const;

// Constants for data retrieval safety
const MAX_ROWS_PER_REQUEST = env.MAX_ROWS_PER_REQUEST;
const MAX_TOTAL_ROWS = env.MAX_TOTAL_ROWS;
const REQUEST_DELAY_MS = env.REQUEST_DELAY_MS;
const MAX_RETRIES = env.MAX_RETRIES;
const RETRY_DELAY_MS = env.RETRY_DELAY_MS;

// Zod schemas for validation
const GetAppsSchema = z.object({
  limit: z.number().optional().default(100),
  offset: z.string().optional(),
});

const AppIdSchema = z.object({
  app_id: z.string().optional(),
});

const GetSheetSchema = z.object({
  app_id: z.string().optional(),
  sheet_id: z.string(),
});

const GetChartDataSchema = z.object({
  app_id: z.string().optional(),
  sheet_id: z.string(),
  chart_id: z.string(),
  max_rows: z.number().optional().default(MAX_TOTAL_ROWS),
  page_size: z.number().optional().default(MAX_ROWS_PER_REQUEST),
  include_metadata: z.boolean().optional().default(true),
});

// Tool definitions
const getQlikAppsTool: Tool = {
  name: "qlik_get_apps",
  description: "List all Qlik applications available in the workspace",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of apps to return (default 100)",
        default: 100,
      },
      offset: {
        type: "string",
        description: "Offset for pagination",
      },
    },
  },
};

const getQlikAppSheetsTool: Tool = {
  name: "qlik_get_app_sheets",
  description: "Get all sheets in a Qlik application",
  inputSchema: {
    type: "object",
    properties: {
      app_id: {
        type: "string",
        description: "The ID of the Qlik application (defaults to QLIK_APP_ID env variable if not provided)",
      },
    },
  },
};

const getQlikSheetChartsTool: Tool = {
  name: "qlik_get_sheet_charts",
  description: "Get all charts in a specific sheet",
  inputSchema: {
    type: "object",
    properties: {
      app_id: {
        type: "string",
        description: "The ID of the Qlik application (defaults to QLIK_APP_ID env variable if not provided)",
      },
      sheet_id: {
        type: "string",
        description: "The ID of the sheet to get charts from",
      },
    },
    required: ["sheet_id"],
  },
};

const getQlikChartDataTool: Tool = {
  name: "qlik_get_chart_data",
  description: "Get data from a specific chart",
  inputSchema: {
    type: "object",
    properties: {
      app_id: {
        type: "string",
        description: "The ID of the Qlik application (defaults to QLIK_APP_ID env variable if not provided)",
      },
      sheet_id: {
        type: "string",
        description: "The ID of the sheet containing the chart",
      },
      chart_id: {
        type: "string",
        description: "The ID of the chart to get data from",
      },
    },
    required: ["sheet_id", "chart_id"],
  },
};

interface QlikSheet {
  qInfo: {
    qId: string;
  };
  qMeta: {
    title: string;
  };
  qData?: {
    cells?: Array<{
      name: string;
      type: string;
      bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
  };
}

interface QlikVisualizationMetadata {
  type: string;
  title?: string;
  subtitle?: string;
  footnote?: string;
  dimensions: Array<{
    title: string;
    label?: string;
    fieldDefinitions: string[];
  }>;
  measures: Array<{
    title: string;
    label?: string;
    format: {
      type: string;
      format: string;
    };
  }>;
  totalRows: number;
  totalColumns: number;
}

// Helper functions
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delayMs = RETRY_DELAY_MS
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.error(`Operation failed, retrying in ${delayMs}ms... (${retries} retries left)`);
      await delay(delayMs);
      return withRetry(operation, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

class QlikClient {
  private session: any;
  private app: any;
  private defaultAppId: string;

  constructor(host: string, apiKey: string, defaultAppId: string) {
    this.defaultAppId = defaultAppId;
    
    // Configure Qlik API
    auth.setDefaultHostConfig({
      authType: "apikey",
      host: host,
      apiKey: apiKey,
    });
  }

  async connect(appId?: string) {
    const targetAppId = appId || this.defaultAppId;
    this.session = await withRetry(async () => {
      const session = await qix.openAppSession({ appId: targetAppId });
      this.app = await session.getDoc();
      return session;
    });
    return this.app;
  }

  async disconnect() {
    if (this.session) {
      await this.session.close();
    }
  }

  async getApps(limit: number = 100, offset?: string): Promise<any> {
    // Note: This is a placeholder - need to implement actual app listing
    return {
      data: [
        { id: this.defaultAppId, name: "Default App" },
      ],
      pagination: {
        next: null,
      },
    };
  }

  async getSheets(): Promise<{ sheets: QlikSheet[] }> {
    const sheetList = await withRetry(async () => this.app.getSheetList());
    return { 
      sheets: sheetList.map((sheet: QlikSheet) => ({
        qInfo: sheet.qInfo,
        qMeta: sheet.qMeta,
      }))
    };
  }

  async getSheetCharts(sheetId: string): Promise<any> {
    const sheet = await withRetry(async () => this.app.getObject(sheetId));
    const layout = await withRetry(async () => sheet.getLayout());
    
    // Extract only the visualization objects
    const visualizations = layout.cells?.filter((cell: any) => {
      const type = cell.type.toLowerCase();
      return type.includes('chart') || 
             type.includes('table') || 
             type.includes('kpi') || 
             type.includes('pivot');
    }) || [];

    return {
      charts: visualizations.map((viz: any) => ({
        id: viz.name,
        type: viz.type,
        bounds: viz.bounds,
      })),
    };
  }

  private async getVisualizationMetadata(vizObject: any): Promise<QlikVisualizationMetadata> {
    const layout = await withRetry(async () => vizObject.getLayout());
    
    const metadata: QlikVisualizationMetadata = {
      type: layout.visualization || layout.qInfo?.qType || 'unknown',
      title: layout.title || layout.qMetaDef?.title,
      subtitle: layout.subtitle,
      footnote: layout.footnote,
      dimensions: [],
      measures: [],
      totalRows: 0,
      totalColumns: 0
    };

    if (layout.qHyperCube) {
      metadata.dimensions = layout.qHyperCube.qDimensionInfo.map((dim: any) => ({
        title: dim.qFallbackTitle,
        label: dim.qLabel,
        fieldDefinitions: dim.qFieldDefs
      }));

      metadata.measures = layout.qHyperCube.qMeasureInfo.map((measure: any) => ({
        title: measure.qFallbackTitle,
        label: measure.qLabel,
        format: {
          type: measure.qNumFormat?.qType,
          format: measure.qNumFormat?.qFmt
        }
      }));

      metadata.totalRows = layout.qHyperCube.qSize.qcy;
      metadata.totalColumns = layout.qHyperCube.qSize.qcx;
    }

    return metadata;
  }

  async getChartData(
    sheetId: string, 
    chartId: string, 
    maxRows: number = MAX_TOTAL_ROWS,
    pageSize: number = MAX_ROWS_PER_REQUEST,
    includeMetadata: boolean = true
  ): Promise<any> {
    const chartObject = await withRetry(async () => this.app.getObject(chartId));
    const metadata = await this.getVisualizationMetadata(chartObject);

    // Warn if data exceeds limits
    if (metadata.totalRows > maxRows) {
      console.warn(`Warning: Chart has ${metadata.totalRows} rows but only retrieving ${maxRows} due to limit`);
    }

    const result: any = {
      type: metadata.type
    };

    if (includeMetadata) {
      result.metadata = metadata;
    }

    try {
      // Get data in chunks
      const rowsToFetch = Math.min(metadata.totalRows, maxRows);
      let allData: any[] = [];
      
      for (let startRow = 0; startRow < rowsToFetch; startRow += pageSize) {
        const rowCount = Math.min(pageSize, rowsToFetch - startRow);
        
        const data = await withRetry(async () => chartObject.getHyperCubeData('/qHyperCubeDef', [{
          qTop: startRow,
          qLeft: 0,
          qWidth: metadata.totalColumns,
          qHeight: rowCount
        }]));

        if (data?.[0]?.qMatrix) {
          allData.push(...data[0].qMatrix);
        }

        // Add delay between chunks to avoid rate limiting
        if (startRow + pageSize < rowsToFetch) {
          await delay(REQUEST_DELAY_MS);
        }
      }

      result.data = {
        headers: [
          ...metadata.dimensions.map(d => d.title),
          ...metadata.measures.map(m => m.title)
        ],
        rows: allData.map(row => row.map((cell: any) => ({
          text: cell.qText,
          value: cell.qNum,
          state: cell.qState
        }))),
        rowCount: allData.length,
        totalRowCount: metadata.totalRows,
        truncated: metadata.totalRows > maxRows
      };

    } catch (error) {
      console.error("Failed to get hypercube data:", error);
      // Return layout data as fallback
      result.data = {
        error: "Could not retrieve hypercube data",
        layout: await withRetry(async () => chartObject.getLayout())
      };
    }

    return result;
  }
}

async function main() {
  const apiKey = env.QLIK_API_KEY;
  const host = env.QLIK_BASE_URL;
  const defaultAppId = env.QLIK_APP_ID;

  if (!apiKey || !host || !defaultAppId) {
    console.error(
      "Please set QLIK_API_KEY, QLIK_BASE_URL, and QLIK_APP_ID environment variables",
    );
    process.exit(1);
  }

  console.error("Starting Qlik MCP Server...");
  const server = new Server(
    {
      name: "Qlik MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const qlikClient = new QlikClient(host, apiKey, defaultAppId);

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        switch (request.params.name) {
          case "qlik_get_apps": {
            const args = GetAppsSchema.parse(request.params.arguments);
            const response = await qlikClient.getApps(
              args.limit,
              args.offset,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "qlik_get_app_sheets": {
            const args = AppIdSchema.parse(request.params.arguments);
            await qlikClient.connect(args.app_id);
            const response = await qlikClient.getSheets();
            await qlikClient.disconnect();
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "qlik_get_sheet_charts": {
            const args = GetSheetSchema.parse(request.params.arguments);
            await qlikClient.connect(args.app_id);
            const response = await qlikClient.getSheetCharts(args.sheet_id);
            await qlikClient.disconnect();
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "qlik_get_chart_data": {
            const args = GetChartDataSchema.parse(request.params.arguments);
            await qlikClient.connect(args.app_id);
            const response = await qlikClient.getChartData(
              args.sheet_id, 
              args.chart_id,
              args.max_rows,
              args.page_size,
              args.include_metadata
            );
            await qlikClient.disconnect();
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        await qlikClient.disconnect();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: [
        getQlikAppsTool,
        getQlikAppSheetsTool,
        getQlikSheetChartsTool,
        getQlikChartDataTool,
      ],
    };
  });

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("Qlik MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 