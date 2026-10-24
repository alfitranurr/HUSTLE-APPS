'use client';

import useSWR from 'swr';
import { apiFetch, fetcher, jsonRequest } from '@/lib/api';
import type { ApiTokenInfo } from '@/lib/types';

const NO_TOKENS: ApiTokenInfo[] = [];

export function useTokens() {
  const { data, isLoading, mutate } = useSWR<ApiTokenInfo[]>('/api/tokens', fetcher<ApiTokenInfo[]>, {
    revalidateOnFocus: false,
  });
  return { tokens: data ?? NO_TOKENS, isLoading, mutate };
}

export const createToken = (name: string) =>
  apiFetch<{ token: string; info: ApiTokenInfo }>('/api/tokens', jsonRequest('POST', { name }));

export const revokeToken = (id: string) => apiFetch<null>(`/api/tokens/${encodeURIComponent(id)}`, { method: 'DELETE' });

/** Hustle's built-in MCP server (Streamable HTTP): nothing to install, just the URL and a key. */
export const mcpUrl = (baseUrl: string) => `${baseUrl}/api/mcp`;

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

export function claudeCodeCommand(baseUrl: string, token: string) {
  return [
    'claude mcp add --scope user --transport http hustle',
    `  ${mcpUrl(baseUrl)}`,
    `  --header "Authorization: Bearer ${token}"`,
  ].join(' \\\n');
}

/** Cursor, VS Code, Windsurf and other apps that take a remote server URL with headers. */
export function urlConfig(baseUrl: string, token: string) {
  return pretty({ mcpServers: { hustle: { url: mcpUrl(baseUrl), headers: { Authorization: `Bearer ${token}` } } } });
}

/**
 * Claude Desktop's config file only starts local programs, so mcp-remote
 * bridges to the URL (needs Node.js). The header goes through an env var
 * because spaces in args break on Windows.
 */
export function desktopConfig(baseUrl: string, token: string) {
  return pretty({
    mcpServers: {
      hustle: {
        command: 'npx',
        args: ['-y', 'mcp-remote', mcpUrl(baseUrl), '--header', 'Authorization:${HUSTLE_AUTH}'],
        env: { HUSTLE_AUTH: `Bearer ${token}` },
      },
    },
  });
}

export const regenerateToken = (id: string) =>
  apiFetch<{ token: string; info: ApiTokenInfo }>(`/api/tokens/${encodeURIComponent(id)}/regenerate`, { method: 'POST' });

/** Shown in "View setup": the key itself is never shown again. */
export const KEY_PLACEHOLDER = 'hst_paste_your_access_key_here';
