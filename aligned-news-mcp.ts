#!/usr/bin/env bun
/**
 * Aligned News MCP Server
 * Connects AI tools (Claude, Cursor, Windsurf, etc.) to the Aligned News API.
 *
 * Setup:
 *   1. Save this file: curl -o aligned-news-mcp.ts https://alignednews.com/mcp-server.ts
 *   2. Install deps: bun add @modelcontextprotocol/sdk zod
 *   3. Run: ALIGNED_API_KEY=alnw_your_key bun aligned-news-mcp.ts
 *
 * Or add to your MCP config (Claude Code, Claude Desktop, Cursor, etc.)
 * See: https://alignednews.com/developers
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_URL = process.env.ALIGNED_API_URL || 'https://alignednews.com'
const API_KEY = process.env.ALIGNED_API_KEY || ''

if (!API_KEY) {
  console.error('ALIGNED_API_KEY environment variable is required')
  console.error('Get your API key at https://alignednews.com/account')
  process.exit(1)
}

async function apiCall(path: string): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `API error: ${res.status}`)
  }
  return res.json()
}

function formatResults(data: any): string {
  return JSON.stringify(data, null, 2)
}

const server = new McpServer({
  name: 'aligned-news',
  version: '1.0.0',
})

// --- Tools ---

server.tool(
  'search_news',
  'Search across all AI news stories, signals, and reports',
  { query: z.string().describe('Search query'), limit: z.number().optional().describe('Max results per type (default 10)') },
  async ({ query, limit }) => {
    const params = new URLSearchParams({ q: query })
    if (limit) params.set('limit', String(limit))
    const result = await apiCall(`/v1/search?${params}`)
    return { content: [{ type: 'text' as const, text: formatResults(result.data) }] }
  }
)

server.tool(
  'get_stories',
  'Get latest AI news stories, optionally filtered by section or tag',
  {
    section: z.string().optional().describe('Filter by section slug'),
    tag: z.string().optional().describe('Filter by tag'),
    limit: z.number().optional().describe('Max results (default 20, max 100)'),
  },
  async ({ section, tag, limit }) => {
    const params = new URLSearchParams()
    if (section) params.set('section', section)
    if (tag) params.set('tag', tag)
    if (limit) params.set('limit', String(limit))
    const result = await apiCall(`/v1/stories?${params}`)
    return { content: [{ type: 'text' as const, text: formatResults(result.data) }] }
  }
)

server.tool(
  'get_story',
  'Get a single AI news story by ID with full body content',
  { id: z.string().describe('Story UUID') },
  async ({ id }) => {
    const result = await apiCall(`/v1/stories/${id}`)
    return { content: [{ type: 'text' as const, text: formatResults(result.data) }] }
  }
)

server.tool(
  'get_signals',
  'Get AI signals — early pattern detection from monitored accounts',
  {
    badge: z.string().optional().describe('Filter by badge type: bullish, caution, critical, signal, interview, vc, action'),
    limit: z.number().optional().describe('Max results (default 50, max 200)'),
  },
  async ({ badge, limit }) => {
    const params = new URLSearchParams()
    if (badge) params.set('badge', badge)
    if (limit) params.set('limit', String(limit))
    const result = await apiCall(`/v1/signals?${params}`)
    return { content: [{ type: 'text' as const, text: formatResults(result.data) }] }
  }
)

server.tool(
  'get_signal',
  'Get a single AI signal by ID with full analysis and related stories',
  { id: z.string().describe('Signal UUID') },
  async ({ id }) => {
    const result = await apiCall(`/v1/signals/${id}`)
    return { content: [{ type: 'text' as const, text: formatResults(result.data) }] }
  }
)

server.tool(
  'get_reports',
  'Get AI trend reports and deep dives',
  { limit: z.number().optional().describe('Max results (default 20, max 100)') },
  async ({ limit }) => {
    const params = new URLSearchParams()
    if (limit) params.set('limit', String(limit))
    const result = await apiCall(`/v1/reports?${params}`)
    return { content: [{ type: 'text' as const, text: formatResults(result.data) }] }
  }
)

server.tool(
  'get_report',
  'Get a single AI report by ID with full content',
  { id: z.string().describe('Report UUID') },
  async ({ id }) => {
    const result = await apiCall(`/v1/reports/${id}`)
    return { content: [{ type: 'text' as const, text: formatResults(result.data) }] }
  }
)

server.tool(
  'get_sections',
  'List all available AI news sections (e.g., breaking, models, robotics, etc.)',
  {},
  async () => {
    const result = await apiCall('/v1/sections')
    return { content: [{ type: 'text' as const, text: formatResults(result.data) }] }
  }
)

// --- Resources ---

server.resource(
  'news-feed',
  'aligned://news-feed',
  { description: 'Complete AI news feed grouped by section', mimeType: 'application/json' },
  async () => {
    const result = await apiCall('/v1/news-feed')
    return { contents: [{ uri: 'aligned://news-feed', text: formatResults(result.data), mimeType: 'application/json' }] }
  }
)

// --- Start ---

const transport = new StdioServerTransport()
await server.connect(transport)
