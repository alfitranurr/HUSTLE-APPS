import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { fail, withAuth } from '@/lib/server/http';
import { createHustleMcpServer } from '@/lib/server/mcp/server';

/**
 * Hustle as a remote MCP server (Streamable HTTP, stateless, JSON responses):
 * AI apps connect with the URL and an access key, nothing to install.
 * Access keys only, never the browser session.
 */
const handler = withAuth(
  async (req, _ctx, data) => {
    if (data.via !== 'token') return fail(401, 'Connect with an access key: Authorization: Bearer hst_…');
    const server = createHustleMcpServer(data, req.nextUrl.origin);
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    return transport.handleRequest(req);
  },
  { token: true }
);

export { handler as DELETE, handler as GET, handler as POST };
