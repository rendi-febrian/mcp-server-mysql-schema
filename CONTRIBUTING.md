# Contributing

Contributions are welcome! Here's how to get started:

## Development

```bash
git clone git@github.com:rendi-febrian/mcp-server-mysql-schema.git
cd mcp-server-mysql-schema
npm install
npm run build
```

Set MySQL env vars, then run:

```bash
MYSQL_HOST=127.0.0.1 MYSQL_USER=root MYSQL_PASS=secret node dist/index.js
```

Test via MCP Inspector or by piping JSON-RPC messages:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | MYSQL_HOST=127.0.0.1 MYSQL_USER=root MYSQL_PASS=secret node dist/index.js
```

## Code Style

- TypeScript with strict mode
- ES modules (`"type": "module"`)
- NodeNext module resolution
- 2-space indentation
- No comments in code — let the tool names and descriptions speak

## Pull Request Process

1. Ensure build passes (`npm run build`)
2. Update README if adding/changing tools
3. Bump version in `package.json` following semver

## Adding a New Tool

1. Create `src/tools/your-tool.ts` following the `ToolHandler` interface
2. Import and add to `ALL_TOOLS` in `src/index.ts`
3. Export a `ToolHandler` with `name`, `description`, `inputSchema`, and `handler`

## Adding a New Resource

1. Add to the `registerResources` function in `src/resources/index.ts`
2. Follow the existing `ResourceDefinition` pattern
