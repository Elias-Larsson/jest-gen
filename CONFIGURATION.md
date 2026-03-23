# jest-gen Configuration Guide

## Environment Setup

Create a `.env` file in the jest-gen directory for persistent configuration:

```bash
# .env file (optional, for persistent configuration)
DEEPWIKI_URL=http://localhost:3000
DEEPWIKI_API_KEY=your_api_key_here
DEEPWIKI_TIMEOUT=120000
LOG_LEVEL=INFO
```

Then load it before running:

```bash
set -a
source .env
set +a
npx tsx src/cli.ts AsyncFuncAI deepwiki-open
```

## Common Workflows

### Workflow 1: Generate tests for an entire project

```bash
cd jest-gen

# Start DeepWiki (in another terminal)
# cd ../deepwiki-open && docker compose up -d

# Generate tests for all TypeScript files
npx tsx src/cli.ts AsyncFuncAI deepwiki-open "src/**/*.ts"

# After generation, run the tests
cd ../deepwiki-open  # or your project
npx jest
```

### Workflow 2: Generate tests incrementally

```bash
# Test utilities first
jest-gen MyOrg my-project "src/utils/**/*.ts"

# Then test services
jest-gen MyOrg my-project "src/services/**/*.ts"

# Then test components
jest-gen MyOrg my-project "src/components/**/*.tsx"
```

### Workflow 3: Preview before generating (safe)

```bash
# Dry run - see what would be generated
npm run start -- MyOrg my-project "src/utils/**/*.ts" --dry-run

# If happy with the output, remove --dry-run to actually generate
npm run start -- MyOrg my-project "src/utils/**/*.ts"
```

### Workflow 4: Use with CI/CD

```yaml
# GitHub Actions example (.github/workflows/generate-tests.yml)
name: Generate Jest Tests
on: [push]

jobs:
  test-generation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Start DeepWiki
        run: |
          cd deepwiki-open
          docker compose up -d
          sleep 10
      
      - name: Generate tests
        run: |
          cd jest-gen
          npm install
          npx tsx src/cli.ts AsyncFuncAI deepwiki-open "src/**/*.ts"
      
      - name: Run generated tests
        run: npx jest
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: __tests__/
```

## Advanced Usage

### Custom Jest Configuration

If the generated tests need custom Jest setup, create a `jest.config.ts`:

```typescript
const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default config;
```

### Custom Prompt Engineering

To adjust how tests are generated, modify the prompt in `src/lib/deepwiki.ts`:

```typescript
const testGenerationPrompt = `
You are an expert JavaScript/TypeScript testing engineer...
  [customize this part]
...
`;
```

### Excluding Specific Files

jest-gen automatically excludes:
- `**/*.test.*`
- `**/*.spec.*`
- `**/__tests__/**`
- `**/node_modules/**`
- `**/dist/**`
- `**/build/**`
- `**/.next/**`

To exclude additional patterns in your glob:

```bash
npx tsx src/cli.ts MyOrg my-project "src/**/*.ts" "!src/**/*.config.ts"
```

## Troubleshooting Scenarios

### Scenario 1: Tests are too verbose

```bash
# Reduce verbosity
LOG_LEVEL=WARN npx tsx src/cli.ts MyOrg my-project
```

### Scenario 2: Tests are taking too long

```bash
# Increase timeout
DEEPWIKI_TIMEOUT=300000 npx tsx src/cli.ts MyOrg my-project

# Or split into smaller batches
npx tsx src/cli.ts MyOrg my-project "src/utils/*.ts"
npx tsx src/cli.ts MyOrg my-project "src/services/*.ts"
```

### Scenario 3: Generated tests won't run

```bash
# Use --skip-validation to bypass checks
npx tsx src/cli.ts MyOrg my-project --skip-validation

# Then run Jest with verbose output
npx jest --verbose
```

### Scenario 4: Want custom output location

```bash
# Write tests to a custom directory
npx tsx src/cli.ts MyOrg my-project --output ./tests/generated
```

## Best Practices

1. **Start small**: Test a few files first with `--dry-run`
2. **Review generated tests**: Don't blindly accept AI output
3. **Run tests**: Execute `npx jest` and fix any issues
4. **Iterate**: Adjust prompts or model as needed
5. **Commit**: Add generated tests to version control
6. **Update**: Regenerate when source files change significantly

## Performance Tips

- Sequential processing prevents rate limiting
- Use glob patterns to target specific directories
- Smaller files generate faster
- Google provider is usually faster than OpenAI
- Consider running at off-peak hours for large batches
