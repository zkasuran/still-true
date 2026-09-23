# Context MCP endpoint handoff

This app reads the Sanity Context Knowledge Base two ways. The default is the
`@sanity/client` Context SDK. Set `SANITY_CONTEXT_MCP_URL` and the outline and
entry reads go through the hosted Context MCP endpoint over HTTP instead. Nothing
else changes: the agent, the response shape and the conflict check stay the same.

## Create the endpoint

1. Open the Sanity Dashboard and go to the **Context** app.
2. Open **MCP** and create a new MCP endpoint. The name is chosen here and cannot
   be changed later, so pick something stable like `still-true`.
3. Attach the source. Choose the Knowledge Base source and select this project's
   Knowledge Base, id `kbOSaaWFy5yI`. A Knowledge Base source runs the endpoint in
   Knowledge Base mode, which serves exactly two tools: `initial_context` and
   `knowledge_base_read`.
4. Save. The Context app then shows the endpoint URL. It has the form:

   ```
   https://api.sanity.io/v1/context/organizations/oul432e18/mcp/<endpoint-name>
   ```

5. Create an organization API token with the **Context Viewer** permission under
   Manage > API > Tokens. This is the same kind of token the SDK path uses.

## Point the app at it

Set two env vars (server side, never shipped to the client):

```
SANITY_CONTEXT_MCP_URL=https://api.sanity.io/v1/context/organizations/oul432e18/mcp/<endpoint-name>
SANITY_ORGANIZATION_TOKEN=<org token with Context Viewer>
```

Leave `SANITY_CONTEXT_MCP_URL` unset to keep the SDK path, which is the default.

## What the app does with it

- Transport is JSON-RPC 2.0 over streamable HTTP. The client sends
  `Accept: application/json, text/event-stream` and reads either a single JSON
  body or an SSE stream. It runs the MCP `initialize` handshake and threads the
  `Mcp-Session-Id` header when the server returns one. It re-initializes once if
  a session expires.
- Auth is `Authorization: Bearer <SANITY_ORGANIZATION_TOKEN>`.
- `list_knowledge` calls `initial_context` (no arguments) and hands the outline
  text to the model.
- `read_entries` calls `knowledge_base_read` with `{ knowledgeBase: "kbOSaaWFy5yI",
  paths: [...] }`, 1 to 20 paths taken verbatim from the outline.

## Conflicts

Knowledge Base mode MCP serves only the two read tools, so it has no conflicts
tool. Conflict detection stays on the Context issues API (`issues.list`) and needs
`SANITY_ORGANIZATION_TOKEN`. In MCP mode the conflict check is best effort and
returns an empty list when no token is available. The default SDK path surfaces
conflicts as before.
