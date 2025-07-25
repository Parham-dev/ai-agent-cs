import {
  protectedResourceHandler,
  metadataCorsOptionsRequestHandler,
} from 'mcp-handler';

/**
 * OAuth Protected Resource Metadata endpoint
 * Required for MCP Authorization Specification compliance
 */

const handler = protectedResourceHandler({
  // TODO: Replace with actual authorization server URLs
  authServerUrls: [
    process.env.OAUTH_ISSUER_URL || 'https://your-auth-server.com'
  ],
});

export { handler as GET, metadataCorsOptionsRequestHandler as OPTIONS };