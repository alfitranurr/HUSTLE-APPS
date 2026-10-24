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

/** How the MCP server is started; the same for every account, only URL and token differ. */
export const MCP_PACKAGE = 'hustle-mcp';

export function claudeCodeCommand(baseUrl: string, token: string) {
  return [
    'claude mcp add --scope user hustle',
    `  -e HUSTLE_BASE_URL=${baseUrl}`,
    `  -e HUSTLE_API_TOKEN=${token}`,
    `  -- npx -y ${MCP_PACKAGE}`,
  ].join(' \\\n');
}

export function desktopConfig(baseUrl: string, token: string) {
  return JSON.stringify(
    {
      mcpServers: {
        hustle: {
          command: 'npx',
          args: ['-y', MCP_PACKAGE],
          env: { HUSTLE_BASE_URL: baseUrl, HUSTLE_API_TOKEN: token },
        },
      },
    },
    null,
    2
  );
}
